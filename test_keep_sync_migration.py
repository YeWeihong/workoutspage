import json
import sys
from pathlib import Path
from types import SimpleNamespace

RUN_PAGE_DIR = Path(__file__).parent / "run_page"
sys.path.insert(0, str(RUN_PAGE_DIR))

import keep_sync  # noqa: E402
import polyline_processor  # noqa: E402


def activity(start, distance=10_000, activity_type="Run"):
    return SimpleNamespace(
        start_date_local=start,
        distance=distance,
        type=activity_type,
    )


def test_detects_same_activity_after_source_id_changes():
    keep_track = activity("2026-07-01 06:30:05", distance=10_050)
    garmin_activity = activity("2026-07-01 06:30:00", distance=10_000)

    assert keep_sync.is_existing_activity(keep_track, [garmin_activity])


def test_normalizes_hiking_type_for_duplicate_detection():
    keep_track = activity("2026-07-01 06:30:00", activity_type="Hiking")
    garmin_activity = activity("2026-07-01 06:30:00", activity_type="Hike")

    assert keep_sync.is_existing_activity(keep_track, [garmin_activity])


def test_does_not_merge_different_workouts():
    keep_track = activity("2026-07-01 06:35:00", distance=15_000)
    garmin_activity = activity("2026-07-01 06:30:00", distance=10_000)

    assert not keep_sync.is_existing_activity(keep_track, [garmin_activity])


def test_keep_sync_state_round_trip(tmp_path, monkeypatch):
    state_path = tmp_path / "keep_sync_state.json"
    monkeypatch.setattr(keep_sync, "KEEP_SYNC_STATE_FILE", str(state_path))

    keep_sync.save_keep_sync_state({"200", "100"})

    assert keep_sync.load_keep_sync_state() == {"100", "200"}
    assert json.loads(state_path.read_text(encoding="utf-8")) == {
        "processed_ids": ["100", "200"]
    }


def test_disabled_privacy_filters_do_not_change_route(monkeypatch):
    route = "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
    monkeypatch.setattr(polyline_processor, "IGNORE_START_END_RANGE", 0)
    monkeypatch.setattr(polyline_processor, "IGNORE_RANGE", 0)
    monkeypatch.setattr(polyline_processor, "IGNORE_POLYLINE", [])

    assert polyline_processor.filter_out(route) == route
    assert polyline_processor.filter_out("") == ""
