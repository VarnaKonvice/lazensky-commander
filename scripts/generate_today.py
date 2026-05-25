from pathlib import Path
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "lazensky-import-28dni.json"
OUT = ROOT / "today.json"

TZ = ZoneInfo("Europe/Prague")
target_date = sys.argv[1] if len(sys.argv) > 1 else datetime.now(TZ).date().isoformat()

src = json.loads(SRC.read_text(encoding="utf-8"))
stay = src.get("stay", {})
leave_buffer = int(stay.get("leaveBufferMinutes", 15))
alarm_before_leave = int(stay.get("alarmBeforeLeaveMinutes", 5)) if stay.get("alarmBeforeLeaveMinutes") is not None else 5

day_items = [
    item for item in src.get("items", [])
    if item.get("date") == target_date
]
day_items.sort(key=lambda x: (x.get("start", ""), x.get("title", "")))

items = []
for idx, item in enumerate(day_items):
    start = item.get("start")
    if not start:
        continue

    h, m = map(int, start.split(":"))
    start_dt = datetime.fromisoformat(f"{target_date}T{h:02d}:{m:02d}:00")
    leave_dt = start_dt - timedelta(minutes=leave_buffer)
    alarm_dt = leave_dt - timedelta(minutes=alarm_before_leave)

    title = item.get("title", "")
    place = item.get("place", "")

    items.append({
        "id": f"lk-{target_date}-{idx:02d}",
        "date": target_date,
        "type": item.get("type"),
        "title": title,
        "place": place,
        "start": item.get("start"),
        "end": item.get("end"),
        "leaveTime": leave_dt.strftime("%H:%M"),
        "alarmTime": alarm_dt.strftime("%H:%M"),
        "alarmDateTime": alarm_dt.strftime("%Y-%m-%dT%H:%M:%S"),
        "label": f"LKA: {title} – {place}"
    })

out = {
    "schemaVersion": 3,
    "source": "lazensky-commander-generated-from-28dni",
    "generatedAt": datetime.now(TZ).isoformat(timespec="seconds"),
    "date": target_date,
    "timezone": "Europe/Prague",
    "prefix": "LKA:",
    "items": items,
    "note": "Generated from lazensky-import-28dni.json for iPhone Shortcuts alarms."
}

OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print("today.json:", target_date, "polozek:", len(items))
for item in items:
    print(item["type"], item["alarmTime"], "|", item["label"])
