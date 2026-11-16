"""Persons assigned to challenges: names, pictures, users and phones."""

from __future__ import annotations

from typing import Any

from homeassistant.const import ATTR_ENTITY_PICTURE, ATTR_FRIENDLY_NAME
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.util import slugify

ATTR_DEVICE_TRACKERS = "device_trackers"
ATTR_USER_ID = "user_id"
NOTIFY = "notify"
MOBILE_APP = "mobile_app"


@callback
def person_info(hass: HomeAssistant, entity_id: str | None) -> dict[str, Any] | None:
    """Return name, picture and user of a person, or None without one."""
    if not entity_id:
        return None
    state = hass.states.get(entity_id)
    if state is None:
        return {"entity_id": entity_id, "name": None, "picture": None, "user_id": None}
    return {
        "entity_id": entity_id,
        "name": state.attributes.get(ATTR_FRIENDLY_NAME) or state.name,
        "picture": state.attributes.get(ATTR_ENTITY_PICTURE),
        "user_id": state.attributes.get(ATTR_USER_ID),
    }


@callback
def persons_of_user(hass: HomeAssistant, user_id: str | None) -> set[str]:
    """Return the person entities that belong to a Home Assistant user."""
    if not user_id:
        return set()
    return {
        state.entity_id
        for state in hass.states.async_all("person")
        if state.attributes.get(ATTR_USER_ID) == user_id
    }


@callback
def notify_services(hass: HomeAssistant, entity_id: str | None) -> list[str]:
    """Return the mobile app notify services of a person's phones.

    The phones are the devices of the person's device trackers. The mobile
    app names its service after the device; only existing services count.
    """
    if not entity_id or (state := hass.states.get(entity_id)) is None:
        return []
    entities = er.async_get(hass)
    devices = dr.async_get(hass)
    services: list[str] = []
    for tracker in state.attributes.get(ATTR_DEVICE_TRACKERS) or []:
        candidates = [f"{MOBILE_APP}_{tracker.split('.', 1)[-1]}"]
        entry = entities.async_get(tracker)
        if entry is not None and entry.device_id is not None:
            device = devices.async_get(entry.device_id)
            if device is not None:
                candidates[:0] = [
                    f"{MOBILE_APP}_{slugify(name)}"
                    for name in (device.name, device.name_by_user)
                    if name
                ]
        service = next(
            (name for name in candidates if hass.services.has_service(NOTIFY, name)),
            None,
        )
        if service is not None and service not in services:
            services.append(service)
    return services
