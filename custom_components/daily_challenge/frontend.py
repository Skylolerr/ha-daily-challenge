"""Serve the card and register it as a Lovelace resource."""

from __future__ import annotations

import hashlib
from pathlib import Path

from homeassistant.components.frontend import (
    DATA_EXTRA_MODULE_URL,
    add_extra_js_url,
    remove_extra_js_url,
)
from homeassistant.components.http.server import StaticPathConfig
from homeassistant.components.lovelace.const import LOVELACE_DATA
from homeassistant.components.lovelace.resources import ResourceStorageCollection
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration

from .const import DOMAIN, LOGGER

CARD_FILENAME = "daily-challenge-card.js"
CARD_URL = f"/{DOMAIN}/{CARD_FILENAME}"
CARD_PATH = Path(__file__).parent / "frontend" / CARD_FILENAME


def _is_card_url(url: str) -> bool:
    return url.split("?", 1)[0] == CARD_URL


def card_hash() -> str:
    """Return a short hash of the bundle (blocking: run in the executor)."""
    return hashlib.sha256(CARD_PATH.read_bytes()).hexdigest()[:8]


async def _versioned_url(hass: HomeAssistant) -> str:
    """Return the card URL with version and content hash.

    The bundle is cached by browsers for a long time; the hash gives every
    changed bundle a new URL, also between releases.
    """
    integration = await async_get_integration(hass, DOMAIN)
    content = await hass.async_add_executor_job(card_hash)
    return f"{CARD_URL}?v={integration.version}-{content}"


def _remove_extra_card_urls(hass: HomeAssistant) -> None:
    """Remove every card URL added in YAML mode, whatever its version."""
    urls = hass.data.get(DATA_EXTRA_MODULE_URL)
    for url in list(urls.urls) if urls else []:
        if _is_card_url(url):
            remove_extra_js_url(hass, url)


def _storage_resources(hass: HomeAssistant) -> ResourceStorageCollection | None:
    """Return the Lovelace resources if they are managed in storage mode."""
    lovelace = hass.data.get(LOVELACE_DATA)
    if lovelace is not None and isinstance(
        lovelace.resources, ResourceStorageCollection
    ):
        return lovelace.resources
    return None


async def async_register_static_path(hass: HomeAssistant) -> None:
    """Serve the card bundle; called once per Home Assistant start."""
    await hass.http.async_register_static_paths(
        [StaticPathConfig(CARD_URL, str(CARD_PATH), cache_headers=True)]
    )


async def async_register_card(hass: HomeAssistant) -> None:
    """Make sure the card is loaded by the frontend exactly once.

    In storage mode the card is a Lovelace module resource whose `?v=` follows
    the integration version; an existing resource is updated instead of adding
    a second one. In YAML mode the card is added as an extra module URL.
    """
    url = await _versioned_url(hass)
    resources = _storage_resources(hass)
    if resources is None:
        _remove_extra_card_urls(hass)
        add_extra_js_url(hass, url)
        return

    await resources.async_get_info()  # loads the collection if needed
    existing = [item for item in resources.async_items() if _is_card_url(item["url"])]
    if not existing:
        LOGGER.debug("Registering Lovelace resource %s", url)
        await resources.async_create_item({"res_type": "module", "url": url})
        return
    first, *duplicates = existing
    if first["url"] != url:
        LOGGER.debug("Updating Lovelace resource %s to %s", first["url"], url)
        await resources.async_update_item(first["id"], {"url": url})
    for item in duplicates:
        await resources.async_delete_item(item["id"])


async def async_unregister_card(hass: HomeAssistant) -> None:
    """Remove the card resource after the last challenge was removed."""
    resources = _storage_resources(hass)
    if resources is None:
        _remove_extra_card_urls(hass)
        return

    await resources.async_get_info()
    for item in list(resources.async_items()):
        if _is_card_url(item["url"]):
            await resources.async_delete_item(item["id"])
