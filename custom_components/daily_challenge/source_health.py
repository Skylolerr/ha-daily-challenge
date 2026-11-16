"""Repair issues for a source sensor that is gone or unavailable for long."""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime, timedelta
from typing import TYPE_CHECKING

from homeassistant.const import (
    EVENT_HOMEASSISTANT_STARTED,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import CoreState, Event, HomeAssistant, State, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.event import async_call_later
from homeassistant.util import dt as dt_util

from .const import DOMAIN

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry

# A source that shows no value for this long gets a repair issue.
UNAVAILABLE_FOR = timedelta(hours=12)

ISSUE_MISSING = "source_missing"
ISSUE_UNAVAILABLE = "source_unavailable"


def issue_id(kind: str, entry_id: str) -> str:
    """Return the ID of a repair issue of a challenge."""
    return f"{kind}_{entry_id}"


@callback
def async_delete_issues(hass: HomeAssistant, entry_id: str) -> None:
    """Remove all repair issues of a challenge."""
    for kind in (ISSUE_MISSING, ISSUE_UNAVAILABLE):
        ir.async_delete_issue(hass, DOMAIN, issue_id(kind, entry_id))


class SourceHealth:
    """Watches whether the source of a challenge still delivers values."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, entity_id: str) -> None:
        """Initialize the watcher."""
        self.hass = hass
        self.entry = entry
        self.entity_id = entity_id
        self._unsub_timer: Callable[[], None] | None = None
        self._unsub_started: Callable[[], None] | None = None

    @callback
    def async_start(self) -> None:
        """Check the source now, or once Home Assistant has started."""
        if self.hass.state is CoreState.running:
            self.async_update(self.hass.states.get(self.entity_id))
            return

        @callback
        def _started(_event: Event) -> None:
            self._unsub_started = None
            self.async_update(self.hass.states.get(self.entity_id))

        self._unsub_started = self.hass.bus.async_listen_once(
            EVENT_HOMEASSISTANT_STARTED, _started
        )

    @callback
    def async_stop(self) -> None:
        """Stop watching (the issues stay until the source is fixed)."""
        self._cancel_timer()
        if self._unsub_started is not None:
            self._unsub_started()
            self._unsub_started = None

    @callback
    def async_update(self, state: State | None) -> None:
        """Update the issues for a new state of the source."""
        if self._unsub_started is not None:
            # Entities still come up while Home Assistant starts.
            return
        if state is None:
            self._cancel_timer()
            ir.async_delete_issue(
                self.hass, DOMAIN, issue_id(ISSUE_UNAVAILABLE, self.entry.entry_id)
            )
            if er.async_get(self.hass).async_get(self.entity_id) is None:
                self._create(ISSUE_MISSING)
            return
        ir.async_delete_issue(
            self.hass, DOMAIN, issue_id(ISSUE_MISSING, self.entry.entry_id)
        )
        if state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            self._cancel_timer()
            ir.async_delete_issue(
                self.hass, DOMAIN, issue_id(ISSUE_UNAVAILABLE, self.entry.entry_id)
            )
            return
        if self._unsub_timer is not None:
            return
        left = UNAVAILABLE_FOR - (dt_util.utcnow() - state.last_changed)
        self._unsub_timer = async_call_later(
            self.hass, max(left.total_seconds(), 0), self._async_still_unavailable
        )

    @callback
    def _async_still_unavailable(self, _now: datetime) -> None:
        self._unsub_timer = None
        state = self.hass.states.get(self.entity_id)
        if state is not None and state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            self._create(ISSUE_UNAVAILABLE)

    @callback
    def _cancel_timer(self) -> None:
        if self._unsub_timer is not None:
            self._unsub_timer()
            self._unsub_timer = None

    @callback
    def _create(self, kind: str) -> None:
        ir.async_create_issue(
            self.hass,
            DOMAIN,
            issue_id(kind, self.entry.entry_id),
            is_fixable=True,
            is_persistent=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key=kind,
            translation_placeholders={
                "name": self.entry.title,
                "entity_id": self.entity_id,
            },
            data={"entry_id": self.entry.entry_id},
        )
