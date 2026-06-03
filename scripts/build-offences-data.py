#!/usr/bin/env python3
"""Build app/data/offences.json from app/assets/doc/Offences MOJ.csv"""

import csv
import json
import re
from pathlib import Path
from typing import Optional, Tuple

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


OASYS_OFFENCE_CATEGORIES = [
    "Violence against the person",
    "Acquisitive violence",
    "Public order and harassment",
    "Sexual (not against child)",
    "Sexual (against child)",
    "Drunkenness",
    "Burglary (domestic)",
    "Burglary (other)",
    "Theft (non-motor)",
    "Handling stolen goods",
    "Fraud and forgery",
    "Absconding/bail",
    "Vehicle-related theft",
    "Welfare fraud",
    "Motoring offences",
    "Drink driving",
    "Criminal damage",
    "Drug import/export/production",
    "Drug possession/supply",
    "Other offences",
]

CATEGORY_TO_TAB_ID = {
    "Violence against the person": "violence",
    "Acquisitive violence": "robbery",
    "Public order and harassment": "public-order",
    "Drunkenness": "public-order",
    "Burglary (domestic)": "burglary",
    "Burglary (other)": "burglary",
    "Theft (non-motor)": "theft",
    "Handling stolen goods": "theft",
    "Vehicle-related theft": "theft",
    "Motoring offences": "motoring",
    "Drink driving": "motoring",
    "Drug import/export/production": "drugs",
    "Drug possession/supply": "drugs",
}

SEXUAL_PARENT_CODES = set(range(16, 28)) | {70, 71, 72, 73, 74, 86, 88, 175, 503, 504}

CHILD_SEXUAL_HINTS = (
    "child under 13",
    "child under 16",
    "under 13",
    "under 16",
    "male child",
    "female child",
    "against a child",
    "against child",
    "children through",
    "child family member",
    "gross indecency with children",
    "indecent photographs of children",
    "indecent photo",
    "child porn",
    "infant",
)

DRINK_DRIVE_HINTS = (
    "alcohol",
    "drink",
    "drunk",
    "unfit through drink",
    "unfit through drugs",
    "prescribed limit",
    "breath",
    "blood alcohol",
)

DRUG_SUPPLY_HINTS = (
    "import",
    "export",
    "production",
    "produce",
    "supply",
    "suppl",
    "traffick",
    "cultivat",
    "manufactur",
    "production",
)


def offence_text(code: str, label: str, description: str = "") -> Tuple[Optional[int], str]:
    return parse_numeric_code(code), f"{label} {description}".lower()


def is_sexual_against_child(numeric: Optional[int], text: str) -> bool:
    if any(hint in text for hint in CHILD_SEXUAL_HINTS):
        return True
    if numeric in {11, 13, 71, 72, 74}:
        return True
    return False


def is_sexual_offence(numeric: Optional[int], text: str) -> bool:
    if numeric in SEXUAL_PARENT_CODES:
        return True
    return any(
        word in text
        for word in (
            "sexual",
            "rape",
            "indecent",
            "buggery",
            "gross indecency",
            "sopo",
            "sex offender",
            "sexual harm",
        )
    )


def infer_oasys_category(code: str, label: str, description: str = "") -> str:
    numeric, text = offence_text(code, label, description)

    if numeric is not None and 802 <= numeric <= 825:
        if numeric == 803 or any(hint in text for hint in DRINK_DRIVE_HINTS):
            return "Drink driving"
        return "Motoring offences"

    if re.match(r"^8\d{2}$", code):
        if code == "803" or any(hint in text for hint in DRINK_DRIVE_HINTS):
            return "Drink driving"
        return "Motoring offences"

    if numeric in {77, 92, 193} or (
        numeric is not None and "misuse of drugs" in text
    ) or (
        "controlled drug" in text
        and "forgery" not in text
        and (numeric is None or numeric < 500)
    ):
        if any(hint in text for hint in DRUG_SUPPLY_HINTS):
            return "Drug import/export/production"
        if numeric == 193:
            return "Drug import/export/production"
        return "Drug possession/supply"

    if is_sexual_offence(numeric, text):
        if is_sexual_against_child(numeric, text):
            return "Sexual (against child)"
        return "Sexual (not against child)"

    if numeric in {151, 152} or "social security" in text:
        return "Welfare fraud"

    if numeric in {80, 83} or "abscond" in text or (
        "bail" in text and numeric is not None and numeric < 200
    ):
        return "Absconding/bail"

    if numeric in {28, 29} or ("burglary" in text and "dwelling" in text):
        return "Burglary (domestic)"

    if numeric in {30, 31, 32} or "burglary" in text:
        return "Burglary (other)"

    if numeric == 54 or "handling stolen" in text:
        return "Handling stolen goods"

    if numeric in {37, 48, 126, 130, 131} or (
        ("motor vehicle" in text or "vehicle" in text)
        and ("steal" in text or "taking" in text or "theft" in text)
    ):
        return "Vehicle-related theft"

    if numeric in {34, 35, 36} or "robbery" in text or "blackmail" in text or "kidnap" in text:
        return "Acquisitive violence"

    if numeric in {56, 57, 58, 59, 149} or "criminal damage" in text or "arson" in text:
        return "Criminal damage"

    if numeric in {50, 51, 52, 53, 55, 60, 61, 114, 814} or (
        "fraud" in text or "forgery" in text or "false accounting" in text
    ):
        return "Fraud and forgery"

    if numeric in {140, 141, 142, 143} or (
        "drunkenness" in text and "driving" not in text
    ):
        return "Drunkenness"

    if numeric in {64, 65, 66, 103, 104, 105, 125, 145, 162} or (
        "public order" in text
        or "riot" in text
        or "violent disorder" in text
        or "harassment" in text
        or "intimidation" in text
        or "disorderly behaviour" in text
    ):
        return "Public order and harassment"

    if (numeric is not None and 39 <= numeric <= 47) or numeric == 33 or (
        "steal" in text or "theft" in text or "shoplifting" in text
    ):
        return "Theft (non-motor)"

    if (numeric is not None and 1 <= numeric <= 15) or numeric in {109, 111}:
        return "Violence against the person"

    if numeric in {103, 104, 105} or any(
        word in text for word in ("murder", "manslaughter", "assault", "wound", "cruelty")
    ):
        return "Violence against the person"

    return "Other offences"


def infer_tab_id(code: str, label: str, description: str = "") -> str:
    category = infer_oasys_category(code, label, description)
    return CATEGORY_TO_TAB_ID.get(category, "other-offences")


def infer_group_category(
    code: str, parent_label: str, parent_description: str, sub_records: list
) -> str:
    combined_description = parent_description
    for item in sub_records:
        combined_description += f" {item['description']} {item['label']}"
    return infer_oasys_category(code, parent_label, combined_description)


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

        violent_key = headers.get("violent offence")

        for row in reader:
            full_code = normalise_full_code(row.get(code_key))
            description = str(row.get(description_key) or "").strip()
            is_violent = False
            if violent_key:
                value = str(row.get(violent_key) or "").strip().lower()
                is_violent = value in ("yes", "y", "true", "1")
            yield full_code, description, is_violent


def main():
    if not CSV_PATH.is_file():
        raise SystemExit(f"Missing source file: {CSV_PATH}")

    records = []

    for full_code, description, is_violent in read_offences_csv(CSV_PATH):
        if not re.match(r"^[0-9A-Z]{5}$", full_code):
            continue

        code = full_code[:3]
        subcode = full_code[3:]
        label = clean_label(description)
        if not label:
            continue

        record = {
            "fullCode": full_code,
            "code": code,
            "subcode": subcode,
            "label": label,
            "description": description,
        }
        if is_violent:
            record["isViolentOffence"] = True
        records.append(record)

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
        parent_description = (
            parent_record["description"] if parent_record else sub_records[0]["description"]
        )
        category = infer_group_category(code, parent_label, parent_description, sub_records)
        tab_id = CATEGORY_TO_TAB_ID.get(category, "other-offences")

        def offence_entry(item):
            entry = {
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
            if item.get("isViolentOffence"):
                entry["isViolentOffence"] = True
            return entry

        sub_offences = [offence_entry(item) for item in sub_records]

        selectable = []
        if parent_record:
            selectable.append(offence_entry(parent_record))
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
    category_counts = {}
    for offence in offences:
        tab_counts[offence["tabId"]] = tab_counts.get(offence["tabId"], 0) + 1
        category_counts[offence["category"]] = category_counts.get(offence["category"], 0) + 1

    print(f"Wrote {len(offences)} offence groups to {OUTPUT_PATH}")
    print("Tab counts:", tab_counts)
    print("Category counts:", dict(sorted(category_counts.items())))


if __name__ == "__main__":
    main()
