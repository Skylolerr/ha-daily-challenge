"""Tests for groups: flow, entities, events, actions and WebSocket."""

from __future__ import annotations

from typing import Any

import pytest
from freezegun.api import FrozenDateTimeFactory
from homeassistant.components.device_automation import DeviceAutomationType
from homeassistant.config_entries import SOURCE_USER
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import intent
from homeassistant.setup import async_setup_component

from custom_components.daily_challenge.const import DOMAIN
from custom_components.daily_challenge.diagnostics import (
    async_get_config_entry_diagnostics,
)

from .common import (
    MockConfigEntry,
    WebSocketGenerator,
    async_capture_events,
    async_fire_time_changed,
    async_get_device_automations,
)
from .conftest import make_options
from .test_milestone_blueprint import automation_config

GROUP = "family"


async def add_challenge(
    hass: HomeAssistant, entry_id: str, title: str, **overrides: Any
) -> MockConfigEntry:
    """Set up a challenge."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title=title,
        unique_id=entry_id,
        entry_id=entry_id,
        data={},
        options=make_options(**overrides),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def add_group(hass: HomeAssistant, **overrides: Any) -> MockConfigEntry:
    """Set up a group of Anna's and Tom's push-ups."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Family",
        unique_id=GROUP,
        entry_id=GROUP,
        data={"kind": "group"},
        options={
            "icon": "mdi:podium",
            "members": ["anna", "tom"],
            "ranking": "percent",
            "group_goal": None,
            "group_goal_period": "week",
            "created": "2026-10-19",
            **overrides,
        },
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def set_value(
    hass: HomeAssistant, entry_id: str, value: int, day: str | None = None
) -> None:
    """Set a day of a challenge."""
    data: dict[str, Any] = {"config_entry_id": entry_id, "value": value}
    if day:
        data["date"] = day
    await hass.services.async_call(DOMAIN, "set", data, blocking=True)
    await hass.async_block_till_done()


@pytest.fixture
async def family(hass: HomeAssistant) -> MockConfigEntry:
    """Anna (target 10) and Tom (target 30) in a family group."""
    hass.states.async_set(
        "person.anna", "home", {"friendly_name": "Anna", "entity_picture": "/a.jpg"}
    )
    await add_challenge(
        hass, "anna", "Push-ups Anna", daily_target=10, person="person.anna"
    )
    await add_challenge(hass, "tom", "Push-ups Tom", daily_target=30)
    return await add_group(hass)


# --- Config flow -------------------------------------------------------------


async def start_group_flow(hass: HomeAssistant) -> dict[str, Any]:
    """Open the group form through the menu."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    return await hass.config_entries.flow.async_configure(
        result["flow_id"], {"next_step_id": "group"}
    )


async def test_group_needs_two_challenges(hass: HomeAssistant) -> None:
    """Without two challenges there is nothing to group."""
    await add_challenge(hass, "anna", "Push-ups Anna")
    result = await start_group_flow(hass)
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "not_enough_challenges"


async def test_create_group(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """A group is created with its members and the creation day."""
    await add_challenge(hass, "anna", "Push-ups Anna")
    await add_challenge(hass, "tom", "Push-ups Tom")
    result = await start_group_flow(hass)
    assert result["step_id"] == "group"
    members = next(k for k in result["data_schema"].schema if str(k) == "members")
    options = result["data_schema"].schema[members].config["options"]
    assert [o["value"] for o in options] == ["anna", "tom"]

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            "name": "Family",
            "icon": "mdi:podium",
            "members": ["anna", "tom"],
            "ranking": "amount",
            "goal_settings": {"group_goal": 500, "group_goal_period": "month"},
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"] == {"kind": "group"}
    assert result["options"] == {
        "icon": "mdi:podium",
        "members": ["anna", "tom"],
        "ranking": "amount",
        "group_goal": 500,
        "group_goal_period": "month",
        "created": "2026-11-04",
    }
    await hass.async_block_till_done()
    assert hass.states.get("sensor.family_group_total").state == "0"


@pytest.mark.parametrize(
    ("user_input", "errors"),
    [
        (
            {"name": "Push-ups Anna", "members": ["anna", "tom"]},
            {"name": "name_exists"},
        ),
        ({"name": " ", "members": ["anna", "tom"]}, {"name": "name_required"}),
        ({"name": "Family", "members": ["anna"]}, {"members": "too_few_members"}),
        (
            {
                "name": "Family",
                "members": ["anna", "squats"],
                "goal_settings": {"group_goal": 100},
            },
            {"base": "units_differ"},
        ),
        (
            {
                "name": "Family",
                "members": ["anna", "tom"],
                "goal_settings": {"group_goal": 2.5},
            },
            {"group_goal": "invalid_group_goal"},
        ),
    ],
)
async def test_group_validation(
    hass: HomeAssistant, user_input: dict[str, Any], errors: dict[str, str]
) -> None:
    """Names, members and the shared goal are checked."""
    await add_challenge(hass, "anna", "Push-ups Anna")
    await add_challenge(hass, "tom", "Push-ups Tom")
    await add_challenge(hass, "squats", "Squats", unit="squats")
    result = await start_group_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"icon": "mdi:podium", "ranking": "percent", **user_input}
    )
    assert result["errors"] == errors


async def test_group_options(hass: HomeAssistant, family: MockConfigEntry) -> None:
    """The options of a group are changed in their own form."""
    result = await hass.config_entries.options.async_init(family.entry_id)
    assert result["step_id"] == "group"
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "name": "The family",
            "icon": "mdi:account-group",
            "members": ["anna", "tom"],
            "ranking": "streak",
            "goal_settings": {"group_goal_period": "year"},
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert family.title == "The family"
    assert family.options["ranking"] == "streak"
    assert family.options["created"] == "2026-10-19"
    assert family.options["group_goal"] is None


# --- Entities ----------------------------------------------------------------


async def test_group_entities(hass: HomeAssistant, family: MockConfigEntry) -> None:
    """Leader, streaks and winners follow the members."""
    assert hass.states.get("sensor.family_leader").state == "unknown"
    assert hass.states.get("sensor.family_group_total") is None
    await set_value(hass, "anna", 10, "2026-11-02")
    await set_value(hass, "tom", 30, "2026-11-02")
    await set_value(hass, "anna", 5)
    await set_value(hass, "tom", 30)
    # Anna 15 of 30 (50 %), Tom 60 of 90 (67 %).
    leader = hass.states.get("sensor.family_leader")
    assert leader.state == "Push-ups Tom"
    assert leader.attributes["ranking"] == [
        {
            "rank": 1,
            "name": "Push-ups Tom",
            "amount": 60,
            "target": 90,
            "percent": 66.7,
            "streak": 1,
        },
        {
            "rank": 2,
            "name": "Anna",
            "amount": 15,
            "target": 30,
            "percent": 50.0,
            "streak": 0,
        },
    ]
    assert (
        hass.states.get("binary_sensor.family_everyone_reached_today_s_goal").state
        == "off"
    )
    await set_value(hass, "anna", 10)
    assert (
        hass.states.get("binary_sensor.family_everyone_reached_today_s_goal").state
        == "on"
    )
    streak = hass.states.get("sensor.family_group_streak")
    assert (streak.state, streak.attributes["best"]) == ("1", 1)
    winner = hass.states.get("sensor.family_last_week_s_winner")
    assert winner.state == "unknown"
    assert winner.attributes == {
        **winner.attributes,
        "week": "2026-10-26",
        "wins": {"Anna": 0, "Push-ups Tom": 0},
    }


async def test_group_with_shared_goal(hass: HomeAssistant) -> None:
    """A shared goal adds the goal sensors and fires once it is reached."""
    await add_challenge(hass, "anna", "Push-ups Anna")
    await add_challenge(hass, "tom", "Push-ups Tom")
    await add_group(hass, group_goal=50)
    events = async_capture_events(hass, "state_changed")
    await set_value(hass, "anna", 20)
    assert hass.states.get("sensor.family_group_total").state == "20"
    assert (
        hass.states.get("sensor.family_group_total").attributes["unit_of_measurement"]
        == "repetitions"
    )
    assert hass.states.get("sensor.family_shared_goal_progress").state == "40.0"
    assert hass.states.get("sensor.family_shared_goal_remaining").state == "30"
    await set_value(hass, "tom", 30)
    event = hass.states.get("event.family_group")
    assert event.attributes["event_type"] == "goal_reached"
    assert (event.attributes["total"], event.attributes["goal"]) == (50, 50)
    assert events


async def test_goal_sensors_removed_without_goal(hass: HomeAssistant) -> None:
    """Switching the shared goal off drops its sensors."""
    await add_challenge(hass, "anna", "Push-ups Anna")
    await add_challenge(hass, "tom", "Push-ups Tom")
    group = await add_group(hass, group_goal=50)
    assert hass.states.get("sensor.family_group_total") is not None
    hass.config_entries.async_update_entry(
        group, options={**group.options, "group_goal": None}
    )
    await hass.async_block_till_done()
    assert er.async_get(hass).async_get("sensor.family_group_total") is None
    assert hass.states.get("event.family_group").attributes["event_types"] == [
        "lead_change",
        "week_winner",
    ]


async def test_lead_change_event(hass: HomeAssistant, family: MockConfigEntry) -> None:
    """A new sole leader fires an event; ties and reloads do not."""
    await set_value(hass, "anna", 5)
    event = hass.states.get("event.family_group")
    assert event.attributes["event_type"] == "lead_change"
    assert (event.attributes["leader"], event.attributes["previous"]) == ("Anna", None)
    first = event.state
    # Tom ties (both 16.7 % of the week): no new leader.
    await set_value(hass, "tom", 15)
    assert hass.states.get("event.family_group").state == first
    await set_value(hass, "tom", 30)
    event = hass.states.get("event.family_group")
    assert (event.attributes["leader"], event.attributes["previous"]) == (
        "Push-ups Tom",
        "Anna",
    )
    second = event.state
    # A member reload is no change of the lead.
    await hass.config_entries.async_reload("anna")
    await hass.async_block_till_done()
    assert hass.states.get("event.family_group").state == second


async def test_week_winner_on_monday(
    hass: HomeAssistant, family: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    """At the start of a week the winner of the last one is announced."""
    await set_value(hass, "anna", 10)
    await set_value(hass, "tom", 5)
    for day in ("2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"):
        freezer.move_to(f"{day} 00:00:01+01:00")
        async_fire_time_changed(hass)
        await hass.async_block_till_done()
    assert (
        hass.states.get("event.family_group").attributes["event_type"] == "lead_change"
    )
    freezer.move_to("2026-11-09 00:00:01+01:00")
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    event = hass.states.get("event.family_group")
    assert event.attributes["event_type"] == "week_winner"
    assert event.attributes["winners"] == ["Anna"]
    assert event.attributes["week"] == "2026-11-02"
    winner = hass.states.get("sensor.family_last_week_s_winner")
    assert winner.state == "Anna"
    assert winner.attributes["wins"] == {"Anna": 1, "Push-ups Tom": 0}


async def test_removed_challenge_leaves_the_group(
    hass: HomeAssistant, family: MockConfigEntry
) -> None:
    """Deleting a challenge takes it out of its groups."""
    await hass.config_entries.async_remove("tom")
    await hass.async_block_till_done()
    assert family.options["members"] == ["anna"]
    assert [
        row["name"]
        for row in hass.states.get("sensor.family_leader").attributes["ranking"]
    ] == ["Anna"]


async def test_unloaded_member_is_left_out(
    hass: HomeAssistant, family: MockConfigEntry
) -> None:
    """A member that is not loaded is missing from the ranking."""
    await hass.config_entries.async_unload("tom")
    await hass.async_block_till_done()
    ranking = hass.states.get("sensor.family_leader").attributes["ranking"]
    assert [row["name"] for row in ranking] == ["Anna"]


# --- Actions, WebSocket, Assist, triggers, diagnostics ------------------------


async def test_actions_refuse_a_group(
    hass: HomeAssistant, family: MockConfigEntry
) -> None:
    """add, set and get_history need a challenge."""
    for service, data in (
        ("add", {"amount": 1}),
        ("set", {"value": 1}),
    ):
        with pytest.raises(ServiceValidationError) as err:
            await hass.services.async_call(
                DOMAIN, service, {"config_entry_id": GROUP, **data}, blocking=True
            )
        assert err.value.translation_key == "is_group"
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            DOMAIN,
            "get_history",
            {"config_entry_id": GROUP},
            blocking=True,
            return_response=True,
        )


async def test_get_status_of_a_group(
    hass: HomeAssistant, family: MockConfigEntry
) -> None:
    """get_status of a group returns its ranking."""
    await set_value(hass, "anna", 10)
    result = await hass.services.async_call(
        DOMAIN,
        "get_status",
        {"config_entry_id": GROUP},
        blocking=True,
        return_response=True,
    )
    assert result["kind"] == "group"
    assert result["leaders"] == ["Anna"]
    assert result["unit"] == "repetitions"
    assert [row["name"] for row in result["ranking"]] == ["Anna", "Push-ups Tom"]
    assert result["ranking"][0]["picture"] == "/a.jpg"
    assert result["goal"] is None
    assert result["wins"] == {"Anna": 0, "Push-ups Tom": 0}

    await hass.config_entries.async_unload(GROUP)
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            DOMAIN,
            "get_status",
            {"config_entry_id": GROUP},
            blocking=True,
            return_response=True,
        )


async def test_websocket_list_and_ranking(
    hass: HomeAssistant,
    family: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
) -> None:
    """Groups are listed apart; their ranking can be read per period."""
    await set_value(hass, "anna", 5)
    await set_value(hass, "tom", 30)
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "daily_challenge/list"})
    response = await client.receive_json()
    result = response["result"]
    assert [c["entry_id"] for c in result["challenges"]] == ["anna", "tom"]
    assert result["groups"] == [
        {
            "entry_id": GROUP,
            "name": "Family",
            "icon": "mdi:podium",
            "members": ["anna", "tom"],
            "ranking": "percent",
        }
    ]

    await client.send_json(
        {
            "id": 2,
            "type": "daily_challenge/ranking",
            "entry_id": GROUP,
            "period": "today",
            "metric": "amount",
        }
    )
    response = await client.receive_json()
    result = response["result"]
    assert (result["metric"], result["period"], result["unit"]) == (
        "amount",
        "today",
        "repetitions",
    )
    assert [(r["name"], r["rank"], r["amount"]) for r in result["rows"]] == [
        ("Push-ups Tom", 1, 30),
        ("Anna", 2, 5),
    ]
    assert result["goal"] is None

    await client.send_json(
        {"id": 3, "type": "daily_challenge/ranking", "entry_id": "anna"}
    )
    assert (await client.receive_json())["error"]["code"] == "not_found"
    await hass.config_entries.async_unload(GROUP)
    await client.send_json(
        {"id": 4, "type": "daily_challenge/ranking", "entry_id": GROUP}
    )
    assert (await client.receive_json())["error"]["code"] == "not_loaded"


async def test_websocket_ranking_with_goal(
    hass: HomeAssistant, hass_ws_client: WebSocketGenerator
) -> None:
    """The ranking includes the shared goal."""
    await add_challenge(hass, "anna", "Push-ups Anna")
    await add_challenge(hass, "tom", "Push-ups Tom")
    await add_group(hass, group_goal=100, group_goal_period="month")
    await set_value(hass, "anna", 25)
    client = await hass_ws_client(hass)
    await client.send_json(
        {"id": 1, "type": "daily_challenge/ranking", "entry_id": GROUP}
    )
    result = (await client.receive_json())["result"]
    assert result["metric"] == "percent"
    assert result["goal"] == {
        "total": 25,
        "goal": 100,
        "progress": 25.0,
        "remaining": 75,
        "period": "month",
    }


async def test_assist_ignores_groups(
    hass: HomeAssistant, family: MockConfigEntry
) -> None:
    """Only challenges are offered to Assist."""
    assert await async_setup_component(hass, "homeassistant", {})
    assert await async_setup_component(hass, "intent", {})
    with pytest.raises(intent.IntentHandleError, match="Push-ups Anna, Push-ups Tom"):
        await intent.async_handle(hass, "test", "DailyChallengeStatus", {})


async def test_group_device_triggers(
    hass: HomeAssistant, family: MockConfigEntry
) -> None:
    """A group offers its own triggers, and they fire."""
    device_id = er.async_get(hass).async_get("sensor.family_leader").device_id
    triggers = await async_get_device_automations(
        hass, DeviceAutomationType.TRIGGER, device_id
    )
    assert sorted(t["type"] for t in triggers if t["domain"] == DOMAIN) == [
        "all_reached",
        "lead_change",
        "week_winner",
    ]
    assert await async_setup_component(
        hass,
        "automation",
        {
            "automation": [
                {
                    "triggers": [
                        {
                            "platform": "device",
                            "domain": DOMAIN,
                            "device_id": device_id,
                            "type": kind,
                        }
                    ],
                    "actions": [
                        {
                            "event": "group_trigger",
                            "event_data": {
                                "type": kind,
                                "leader": "{{ trigger.data.leader | default('') }}",
                            },
                        }
                    ],
                }
                for kind in ("all_reached", "lead_change")
            ]
        },
    )
    events = async_capture_events(hass, "group_trigger")
    await set_value(hass, "anna", 10)
    await set_value(hass, "tom", 30)
    await hass.async_block_till_done()
    assert [e.data for e in events] == [
        {"type": "lead_change", "leader": "Anna"},
        {"type": "all_reached", "leader": ""},
    ]


async def test_group_diagnostics(hass: HomeAssistant, family: MockConfigEntry) -> None:
    """Diagnostics of a group show its options and figures."""
    result = await async_get_config_entry_diagnostics(hass, family)
    assert result["options"]["members"] == ["anna", "tom"]
    assert result["group"]["kind"] == "group"


async def test_lead_change_blueprint(
    hass: HomeAssistant, family: MockConfigEntry
) -> None:
    """The group news blueprint tells who overtook whom."""
    config = automation_config(
        "lead_change.yaml",
        {
            "group_entity": "event.family_group",
            "kinds": ["lead_change"],
            "notify_action": [
                {
                    "event": "group_news",
                    "event_data": {"group": "{{ group }}", "message": "{{ message }}"},
                }
            ],
        },
    )
    assert await async_setup_component(hass, "automation", {"automation": [config]})
    await hass.async_block_till_done()
    events = async_capture_events(hass, "group_news")
    await set_value(hass, "anna", 5)
    await set_value(hass, "tom", 30)
    await hass.async_block_till_done()
    assert [e.data for e in events] == [
        {"group": "Family", "message": "Anna takes the lead!"},
        {"group": "Family", "message": "Push-ups Tom has overtaken Anna!"},
    ]


async def test_lead_change_blueprint_other_news(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """Week winners and the shared goal get their own sentence."""
    await add_challenge(hass, "anna", "Push-ups Anna")
    await add_challenge(hass, "tom", "Push-ups Tom")
    await add_group(hass, group_goal=30)
    config = automation_config(
        "lead_change.yaml",
        {
            "group_entity": "event.family_group",
            "kinds": ["week_winner", "goal_reached"],
            "notify_action": [
                {"event": "group_news", "event_data": {"message": "{{ message }}"}}
            ],
        },
    )
    assert await async_setup_component(hass, "automation", {"automation": [config]})
    await hass.async_block_till_done()
    events = async_capture_events(hass, "group_news")
    await set_value(hass, "anna", 20)
    await set_value(hass, "tom", 20)
    freezer.move_to("2026-11-09 00:00:01+01:00")
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert [e.data["message"] for e in events] == [
        "Shared goal reached: 40 of 30!",
        "Push-ups Anna and Push-ups Tom won last week!",
    ]


async def test_group_options_show_errors(
    hass: HomeAssistant, family: MockConfigEntry
) -> None:
    """Errors keep the group form open with the entered values."""
    result = await hass.config_entries.options.async_init(family.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "name": "Family",
            "icon": "mdi:podium",
            "members": ["anna"],
            "ranking": "percent",
        },
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"members": "too_few_members"}
