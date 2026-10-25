"""Base entity for Daily Challenge."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .calculations import ChallengeStatus
from .const import CONF_UNIT, DOMAIN
from .coordinator import ChallengeCoordinator


class DailyChallengeEntity(CoordinatorEntity[ChallengeCoordinator]):
    """An entity belonging to one challenge device."""

    _attr_has_entity_name = True
    # Entities that change today's value only work while the challenge runs.
    _only_while_active = False

    def __init__(self, coordinator: ChallengeCoordinator, key: str) -> None:
        """Initialize the entity."""
        super().__init__(coordinator)
        entry = coordinator.config_entry
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=entry.title,
            entry_type=DeviceEntryType.SERVICE,
        )

    @property
    def available(self) -> bool:
        """Return whether the entity can be used right now."""
        return super().available and (
            not self._only_while_active
            or self.coordinator.data.status is ChallengeStatus.ACTIVE
        )

    @property
    def challenge_unit(self) -> str:
        """Return the configured unit of the challenge."""
        return str(self.coordinator.config_entry.options[CONF_UNIT])
