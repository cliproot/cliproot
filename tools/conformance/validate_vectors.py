#!/usr/bin/env python3
"""Validate spx-prov conformance vector structure and cross-file consistency."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ALLOWED_OPS = {
    "parseEnvelope",
    "validateEnvelope",
    "evaluatePolicy",
    "processTransferClaim",
    "verifyIdempotency",
}

REQUIRED_EXPECTED_KEYS = {
    "policyOutcome",
    "receiptStatus",
    "reasonCodes",
    "persistedArtifacts",
    "auditEvents",
}


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise ValueError(f"Missing JSON file: {path}")
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in {path}: {exc}")


def validate_manifest(manifest: dict, manifest_path: Path, errors: list[str]) -> None:
    required = {
        "protocol",
        "vectorSetVersion",
        "manifestVersion",
        "runnerContractVersion",
        "vectorSemverPolicy",
        "vectors",
    }
    missing = required - set(manifest.keys())
    if missing:
        errors.append(f"Manifest missing keys: {sorted(missing)}")

    if manifest.get("protocol") != "spx-prov":
        errors.append("Manifest protocol must be 'spx-prov'")

    vectors = manifest.get("vectors")
    if not isinstance(vectors, list) or not vectors:
        errors.append("Manifest vectors must be a non-empty array")
        return

    seen_ids: set[str] = set()
    seen_paths: set[str] = set()

    for idx, entry in enumerate(vectors):
        prefix = f"manifest.vectors[{idx}]"
        for key in (
            "vectorId",
            "path",
            "level",
            "category",
            "requires",
            "tags",
            "status",
            "introducedIn",
            "updatedIn",
        ):
            if key not in entry:
                errors.append(f"{prefix} missing '{key}'")

        vector_id = entry.get("vectorId")
        vector_path = entry.get("path")

        if vector_id in seen_ids:
            errors.append(f"Duplicate vectorId in manifest: {vector_id}")
        else:
            seen_ids.add(vector_id)

        if vector_path in seen_paths:
            errors.append(f"Duplicate path in manifest: {vector_path}")
        else:
            seen_paths.add(vector_path)

        requires = entry.get("requires", [])
        if not isinstance(requires, list) or not requires:
            errors.append(f"{prefix}.requires must be non-empty array")
        else:
            unknown = sorted(set(requires) - ALLOWED_OPS)
            if unknown:
                errors.append(f"{prefix}.requires has unsupported operations: {unknown}")


def validate_case(base_dir: Path, manifest_entry: dict, errors: list[str]) -> None:
    case_dir = base_dir / manifest_entry["path"]
    case_file = case_dir / "case.json"
    notes_file = case_dir / "notes.md"

    if not case_dir.is_dir():
        errors.append(f"Missing case directory: {case_dir}")
        return

    if not notes_file.is_file():
        errors.append(f"Missing notes.md for {manifest_entry['vectorId']}: {notes_file}")

    try:
        case = load_json(case_file)
    except ValueError as exc:
        errors.append(str(exc))
        return

    for key in (
        "vectorId",
        "title",
        "level",
        "category",
        "description",
        "requires",
        "tags",
        "status",
        "introducedIn",
        "updatedIn",
        "runner",
    ):
        if key not in case:
            errors.append(f"{case_file} missing '{key}'")

    if case.get("vectorId") != manifest_entry.get("vectorId"):
        errors.append(
            f"vectorId mismatch: manifest {manifest_entry.get('vectorId')} != case {case.get('vectorId')}"
        )

    if case.get("level") != manifest_entry.get("level"):
        errors.append(
            f"level mismatch for {manifest_entry.get('vectorId')}: manifest {manifest_entry.get('level')} != case {case.get('level')}"
        )

    if case.get("category") != manifest_entry.get("category"):
        errors.append(
            f"category mismatch for {manifest_entry.get('vectorId')}: manifest {manifest_entry.get('category')} != case {case.get('category')}"
        )

    case_requires = case.get("requires", [])
    if case_requires != manifest_entry.get("requires", []):
        errors.append(
            f"requires mismatch for {manifest_entry.get('vectorId')}: manifest {manifest_entry.get('requires')} != case {case_requires}"
        )

    runner = case.get("runner", {})
    if not isinstance(runner, dict):
        errors.append(f"runner must be object: {case_file}")
        return

    for key in ("clock", "operations", "inputFiles", "expectedFile"):
        if key not in runner:
            errors.append(f"{case_file} runner missing '{key}'")

    operations = runner.get("operations", [])
    unknown = sorted(set(operations) - ALLOWED_OPS)
    if unknown:
        errors.append(f"{case_file} runner.operations has unsupported operations: {unknown}")

    if operations != case_requires:
        errors.append(
            f"operations mismatch for {manifest_entry.get('vectorId')}: case.requires {case_requires} != runner.operations {operations}"
        )

    input_files = runner.get("inputFiles", {})
    if not isinstance(input_files, dict) or not input_files:
        errors.append(f"{case_file} runner.inputFiles must be non-empty object")
    else:
        for name, rel in input_files.items():
            input_path = case_dir / rel
            if not input_path.is_file():
                errors.append(f"{case_file} input file '{name}' missing: {input_path}")
            else:
                try:
                    load_json(input_path)
                except ValueError as exc:
                    errors.append(str(exc))

    expected_rel = runner.get("expectedFile")
    expected_path = case_dir / expected_rel if isinstance(expected_rel, str) else None
    if not expected_path or not expected_path.is_file():
        errors.append(f"{case_file} expected file missing: {expected_path}")
    else:
        try:
            expected = load_json(expected_path)
        except ValueError as exc:
            errors.append(str(exc))
            return

        missing = REQUIRED_EXPECTED_KEYS - set(expected.keys())
        if missing:
            errors.append(f"{expected_path} missing keys: {sorted(missing)}")

        reason_codes = expected.get("reasonCodes", [])
        if not isinstance(reason_codes, list) or not reason_codes:
            errors.append(f"{expected_path} reasonCodes must be non-empty array")
        else:
            for idx, rc in enumerate(reason_codes):
                for key in ("code", "scope", "mustExist"):
                    if key not in rc:
                        errors.append(f"{expected_path} reasonCodes[{idx}] missing '{key}'")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate conformance vectors")
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("vectors/v0.3/manifest.json"),
        help="Path to vector manifest",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest_path = args.manifest
    errors: list[str] = []

    try:
        manifest = load_json(manifest_path)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    validate_manifest(manifest, manifest_path, errors)

    base_dir = manifest_path.parent
    for entry in manifest.get("vectors", []):
        if not isinstance(entry, dict):
            errors.append(f"Invalid manifest entry type: {entry!r}")
            continue
        if "path" not in entry or "vectorId" not in entry:
            continue
        validate_case(base_dir, entry, errors)

    if errors:
        print("Conformance vector validation failed:")
        for err in errors:
            print(f"- {err}")
        return 1

    print(
        f"Conformance vector validation passed: {len(manifest.get('vectors', []))} vectors in {manifest_path}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
