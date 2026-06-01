#!/usr/bin/env python3
"""Build app/data/offences.json from app/assets/doc/Offences MOJ.csv"""

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "app/assets/doc/Offences MOJ.csv"
OUTPUT_PATH = ROOT / "app/data/offences.json"

PRIMARY_OFFENCE_TABS = [
    {"id": "theft", "label": "Theft", "categories": ["Theft (non-motor)", "Handling stolen goods"]},
    {"id": "burglary", "label": "Burglary", "categories": ["Burglary (domestic)", "Burglary (other)"]},
    {"id": "robbery", "label": "Robbery", "categories": ["Acquisitive violence"]},
    {"id": "violence", "label": "Violence", "categories": ["Violence against the person"]},
    {"id": "drugs", "label": "Drugs", "categories": ["Drug import/export/production", "Drug possession/supply"]},
    {"id": "public-order", "label": "Public order", "categories": ["Public order and harassment", "Drunkenness"]},
    {"id": "motoring", "label": "Motoring", "categories": ["Motoring offences", "Drink driving"]},
    {"id": "other-offences", "label": "Other offences", "categories": ["Other offences"]},
]


def slugify(value: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value.lower()))


def clean_label(description: str) -> str:
    return re.sub(r"\s+", " ", description.split(".")[0].split("[")[0]).strip()


def parse_numeric_code(code: str):
    try:
        return int(code, 10)
    except ValueError:
        return None


def infer_tab_id(code: str, label: str) -> str:
    numeric = parse_numeric_code(code)
    lower = label.lower()

    if numeric is not None:
        if 28 <= numeric <= 32:
            return "burglary"
        if numeric == 34:
            return "robbery"
        if (39 <= numeric <= 49) or numeric in {54, 130, 131}:
            return "theft"
        if numeric in {77, 92, 193}:
            return "drugs"
        if 802 <= numeric <= 825:
            return "motoring"
        if 1 <= numeric <= 15:
            return "violence"
        if 103 <= numeric <= 105:
            return "violence"
        if 64 <= numeric <= 66:
            return "public-order"
        if 140 <= numeric <= 142:
            return "public-order"
        if numeric in {125, 145, 162}:
            return "public-order"

    if re.match(r"^8\d{2}$", code):
        return "motoring"
    if "burglary" in lower:
        return "burglary"
    if "robbery" in lower or "blackmail" in lower:
        return "robbery"
    if "steal" in lower or "theft" in lower or "handling stolen" in lower:
        return "theft"
    if "drug" in lower:
        return "drugs"
    if "motor" in lower or "driving" in lower or "vehicle" in lower:
        return "motoring"
    if any(word in lower for word in ("assault", "murder", "manslaughter", "wound")):
        return "violence"
    if "drunk" in lower or "disorder" in lower or "public order" in lower:
        return "public-order"

    return "other-offences"


def infer_category(tab_id: str) -> str:
    for tab in PRIMARY_OFFENCE_TABS:
        if tab["id"] == tab_id:
            return tab["categories"][0]
    return "Other offences"


def build_search_terms(label, code, subcode, full_code, description=""):
    terms = set()
    for value in (label, code, subcode, full_code, description):
        for part in re.split(r"[^a-z0-9]+", str(value or "").lower()):
            if len(part) > 1:
                terms.add(part)
    if code and subcode:
        terms.add(f"{code}{subcode}")
        terms.add(f"{code} {subcode}")
    return sorted(terms)


def normalise_full_code(raw: str) -> str:
    code = str(raw or "").strip().upper()
    if not code:
        return ""
    if re.match(r"^[0-9A-Z]+$", code):
        return code.zfill(5)
    return code


def read_offences_csv(path: Path):
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError(f"No header row found in {path}")

        headers = {name.strip().lower(): name for name in reader.fieldnames if name}

        code_key = headers.get("code")
        description_key = headers.get("offence description") or headers.get("description")

        if not code_key or not description_key:
            raise ValueError(
                f"{path} must include 'Code' and 'Offence description' columns "
                f"(found: {', '.join(reader.fieldnames)})"
            )

        for row in reader:
            yield normalise_full_code(row.get(code_key)), str(row.get(description_key) or "").strip()


def main():
    if not CSV_PATH.is_file():
        raise SystemExit(f"Missing source file: {CSV_PATH}")

    records = []

    for full_code, description in read_offences_csv(CSV_PATH):
        if not re.match(r"^[0-9A-Z]{5}$", full_code):
            continue

        code = full_code[:3]
        subcode = full_code[3:]
        label = clean_label(description)
        if not label:
            continue

        records.append(
            {
                "fullCode": full_code,
                "code": code,
                "subcode": subcode,
                "label": label,
                "description": description,
            }
        )

    by_code = {}
    for record in records:
        by_code.setdefault(record["code"], []).append(record)

    offences = []
    for code, items in sorted(by_code.items()):
        parent_record = next((item for item in items if item["subcode"] == "00"), None)
        sub_records = sorted(
            [item for item in items if item["subcode"] != "00"],
            key=lambda item: item["subcode"],
        )

        parent_label = parent_record["label"] if parent_record else sub_records[0]["label"]
        tab_id = infer_tab_id(code, parent_label)
        category = infer_category(tab_id)

        sub_offences = []
        for item in sub_records:
            sub_offences.append(
                {
                    "id": item["fullCode"].lower(),
                    "label": item["label"],
                    "code": item["code"],
                    "subcode": item["subcode"],
                    "fullCode": item["fullCode"],
                    "description": item["description"],
                    "searchTerms": build_search_terms(
                        item["label"], item["code"], item["subcode"], item["fullCode"], item["description"]
                    ),
                }
            )

        selectable = []
        if parent_record:
            selectable.append(
                {
                    "id": parent_record["fullCode"].lower(),
                    "label": parent_record["label"],
                    "code": parent_record["code"],
                    "subcode": parent_record["subcode"],
                    "fullCode": parent_record["fullCode"],
                    "description": parent_record["description"],
                    "searchTerms": build_search_terms(
                        parent_record["label"],
                        parent_record["code"],
                        parent_record["subcode"],
                        parent_record["fullCode"],
                        parent_record["description"],
                    ),
                }
            )
        selectable.extend(sub_offences)

        if not selectable:
            continue

        offences.append(
            {
                "id": f"category-{slugify(code)}",
                "label": parent_label,
                "code": code,
                "category": category,
                "tabId": tab_id,
                "subOffenceCount": len(selectable),
                "searchTerms": build_search_terms(
                    parent_label,
                    code,
                    "00",
                    f"{code}00",
                    parent_record["description"] if parent_record else parent_label,
                ),
                "subOffences": selectable,
            }
        )

    OUTPUT_PATH.write_text(json.dumps(offences, indent=2) + "\n", encoding="utf-8")

    tab_counts = {}
    for offence in offences:
        tab_counts[offence["tabId"]] = tab_counts.get(offence["tabId"], 0) + 1

    print(f"Wrote {len(offences)} offence groups to {OUTPUT_PATH}")
    print("Tab counts:", tab_counts)


if __name__ == "__main__":
    main()
