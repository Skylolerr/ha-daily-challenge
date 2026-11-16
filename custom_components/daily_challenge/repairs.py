"""Fix flows for the repair issues of Daily Challenge."""

from __future__ import annotations

from typing import Any

import probatio as vol
from homeassistant.components.repairs import RepairsFlow, RepairsFlowResult
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.selector import EntitySelector, EntitySelectorConfig

from .const import CONF_SOURCE_ENTITY, DOMAIN, SOURCE_DOMAINS


class SourceRepairFlow(RepairsFlow):
    """Pick another source or switch automatic counting off."""

    def __init__(self, issue_id: str, entry_id: str) -> None:
        """Initialize the flow."""
        self._issue_id = issue_id
        self._entry_id = entry_id

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> RepairsFlowResult:
        """Start the flow; its input is the issue, not the form."""
        return await self.async_step_source()

    async def async_step_source(
        self, user_input: dict[str, Any] | None = None
    ) -> RepairsFlowResult:
        """Show the form."""
        entry = self.hass.config_entries.async_get_entry(self._entry_id)
        if entry is None:
            ir.async_delete_issue(self.hass, DOMAIN, self._issue_id)
            return self.async_abort(reason="entry_removed")
        errors: dict[str, str] = {}
        if user_input is not None:
            source = user_input.get(CONF_SOURCE_ENTITY) or None
            registry_entry = (
                er.async_get(self.hass).async_get(source) if source else None
            )
            if registry_entry is not None and registry_entry.platform == DOMAIN:
                errors["base"] = "source_is_challenge"
            else:
                ir.async_delete_issue(self.hass, DOMAIN, self._issue_id)
                # The changed options reload the challenge.
                self.hass.config_entries.async_update_entry(
                    entry, options={**entry.options, CONF_SOURCE_ENTITY: source}
                )
                return self.async_create_entry(data={})
        schema = vol.Schema(
            {
                vol.Optional(CONF_SOURCE_ENTITY): EntitySelector(
                    EntitySelectorConfig(domain=SOURCE_DOMAINS)
                )
            }
        )
        return self.async_show_form(
            step_id="source",
            data_schema=schema,
            errors=errors,
            description_placeholders={
                "name": entry.title,
                "entity_id": entry.options.get(CONF_SOURCE_ENTITY) or "",
            },
        )


async def async_create_fix_flow(
    hass: HomeAssistant, issue_id: str, data: dict[str, Any] | None
) -> RepairsFlow:
    """Create the fix flow of an issue."""
    return SourceRepairFlow(issue_id, str((data or {}).get("entry_id", "")))
