"""Tests for serving and registering the card."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
from homeassistant.components.frontend import DATA_EXTRA_MODULE_URL, UrlManager
from homeassistant.components.lovelace import LovelaceData
from homeassistant.components.lovelace.const import LOVELACE_DATA, MODE_YAML
from homeassistant.components.lovelace.resources import ResourceYAMLCollection
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.typing import ClientSessionGenerator

from custom_components.daily_challenge.const import DOMAIN
from custom_components.daily_challenge.frontend import card_hash

from .conftest import make_options

CARD_URL = "/daily_challenge/daily-challenge-card.js"
VERSION = json.loads(
    (
        Path(__file__).parent.parent
        / "custom_components"
        / "daily_challenge"
        / "manifest.json"
    ).read_text(encoding="utf-8")
)["version"]
# Version from the manifest plus a hash of the bundle content.
VERSIONED_URL = f"{CARD_URL}?v={VERSION}-{card_hash()}"
OTHER_RESOURCE = {"id": "other", "type": "module", "url": "/local/other-card.js"}


def resources(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Return the Lovelace resources."""
    return list(hass.data[LOVELACE_DATA].resources.async_items())


def card_resources(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Return the Lovelace resources pointing to the card."""
    return [item for item in resources(hass) if item["url"].startswith(CARD_URL)]


async def add_challenge(hass: HomeAssistant, entry_id: str) -> MockConfigEntry:
    """Add and set up another challenge."""
    entry = MockConfigEntry(
        domain=DOMAIN, title=entry_id, entry_id=entry_id, options=make_options()
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


@pytest.mark.usefixtures("loaded_entry")
async def test_card_is_served(
    hass: HomeAssistant, hass_client: ClientSessionGenerator
) -> None:
    """The bundle is available under a static path."""
    client = await hass_client()
    response = await client.get(VERSIONED_URL)
    assert response.status == 200
    assert "daily-challenge-card" in await response.text()


@pytest.mark.usefixtures("loaded_entry")
async def test_resource_registered(hass: HomeAssistant) -> None:
    """In storage mode the card becomes one module resource with a version."""
    assert card_resources(hass) == [
        {"id": card_resources(hass)[0]["id"], "type": "module", "url": VERSIONED_URL}
    ]


async def test_existing_resource_is_updated(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    hass_storage: dict[str, Any],
) -> None:
    """An outdated resource is updated, duplicates are removed."""
    hass_storage["lovelace_resources"] = {
        "version": 1,
        "minor_version": 1,
        "key": "lovelace_resources",
        "data": {
            "items": [
                OTHER_RESOURCE,
                {"id": "old", "type": "module", "url": f"{CARD_URL}?v=0.0.9"},
                {"id": "dupe", "type": "module", "url": CARD_URL},
            ]
        },
    }
    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()

    assert resources(hass) == [
        OTHER_RESOURCE,
        {"id": "old", "type": "module", "url": VERSIONED_URL},
    ]


async def test_same_version_with_other_content_is_updated(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    hass_storage: dict[str, Any],
) -> None:
    """A changed bundle gets a new URL even without a new version."""
    hass_storage["lovelace_resources"] = {
        "version": 1,
        "minor_version": 1,
        "key": "lovelace_resources",
        "data": {
            "items": [
                {"id": "card", "type": "module", "url": f"{CARD_URL}?v={VERSION}"}
            ]
        },
    }
    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()

    assert resources(hass) == [{"id": "card", "type": "module", "url": VERSIONED_URL}]
    assert VERSIONED_URL.startswith(f"{CARD_URL}?v={VERSION}-")
    assert len(VERSIONED_URL.rsplit("-", 1)[1]) == 8


async def test_one_resource_for_several_challenges(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """More challenges never add more resources."""
    await add_challenge(hass, "squats")
    assert len(card_resources(hass)) == 1


async def test_resource_removed_with_last_challenge(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """The resource stays while challenges exist and comes back on re-add."""
    squats = await add_challenge(hass, "squats")

    assert await hass.config_entries.async_remove(loaded_entry.entry_id)
    await hass.async_block_till_done()
    assert len(card_resources(hass)) == 1

    assert await hass.config_entries.async_remove(squats.entry_id)
    await hass.async_block_till_done()
    assert card_resources(hass) == []

    await add_challenge(hass, "plank")
    assert [item["url"] for item in card_resources(hass)] == [VERSIONED_URL]


@pytest.mark.parametrize("lovelace", ["yaml", "missing"])
async def test_yaml_mode_uses_extra_module_url(
    hass: HomeAssistant, config_entry: MockConfigEntry, lovelace: str
) -> None:
    """Without storage-mode resources the card is added as extra module."""
    if lovelace == "yaml":
        hass.data[LOVELACE_DATA] = LovelaceData(
            resource_mode=MODE_YAML,
            dashboards={},
            resources=ResourceYAMLCollection([]),
            yaml_dashboards={},
        )
    else:
        del hass.data[LOVELACE_DATA]
    urls = UrlManager(lambda *_: None, [])
    hass.data[DATA_EXTRA_MODULE_URL] = urls

    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    assert urls.urls == {VERSIONED_URL}

    assert await hass.config_entries.async_remove(config_entry.entry_id)
    await hass.async_block_till_done()
    assert urls.urls == set()


async def test_yaml_mode_replaces_an_older_card_url(
    hass: HomeAssistant, config_entry: MockConfigEntry
) -> None:
    """Re-registering in YAML mode leaves exactly one card URL."""
    hass.data[LOVELACE_DATA] = LovelaceData(
        resource_mode=MODE_YAML,
        dashboards={},
        resources=ResourceYAMLCollection([]),
        yaml_dashboards={},
    )
    urls = UrlManager(lambda *_: None, [f"{CARD_URL}?v=0.0.9-deadbeef", "/local/x.js"])
    hass.data[DATA_EXTRA_MODULE_URL] = urls

    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    assert urls.urls == {VERSIONED_URL, "/local/x.js"}
