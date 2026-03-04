#!/usr/bin/env python3
"""Generate a markdown conformance matrix from result envelope reports."""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def load_levels(manifest_path: Path) -> dict[str, int]:
    manifest = load_json(manifest_path)
    return {entry["vectorId"]: entry["level"] for entry in manifest.get("vectors", [])}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate conformance matrix markdown")
    parser.add_argument(
        "--reports-root",
        type=Path,
        default=Path("conformance_reports/v0.3"),
        help="Directory containing implementation subfolders and report files",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("vectors/v0.3/manifest.json"),
        help="Vector manifest used for level mapping",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("docs/conformance_matrix.md"),
        help="Output markdown file path",
    )
    return parser.parse_args()


def latest_report_files(reports_root: Path) -> list[Path]:
    files = []
    if not reports_root.exists():
        return files

    for impl_dir in sorted(p for p in reports_root.iterdir() if p.is_dir()):
        json_files = sorted(impl_dir.glob("*.json"))
        if json_files:
            files.append(json_files[-1])
    return files


def main() -> int:
    args = parse_args()
    levels = load_levels(args.manifest)

    rows = []
    for report_file in latest_report_files(args.reports_root):
        report = load_json(report_file)
        impl = report.get("implementation", {})
        impl_id = impl.get("id", report_file.parent.name)
        impl_ver = impl.get("version", "unknown")
        generated = report.get("generatedAt", "unknown")

        per_level = defaultdict(lambda: {"pass": 0, "fail": 0, "skip": 0, "total": 0})
        for result in report.get("results", []):
            vector_id = result.get("vectorId")
            level = levels.get(vector_id)
            if level is None:
                continue
            status = result.get("status", "skip")
            if status not in ("pass", "fail", "skip"):
                status = "skip"
            per_level[level][status] += 1
            per_level[level]["total"] += 1

        summary = report.get("summary", {})
        rows.append(
            {
                "impl": impl_id,
                "version": impl_ver,
                "generated": generated,
                "total": summary.get("total", 0),
                "pass": summary.get("pass", 0),
                "fail": summary.get("fail", 0),
                "skip": summary.get("skip", 0),
                "levels": per_level,
            }
        )

    lines = []
    lines.append("# Conformance Matrix (`spx-prov` v0.3)")
    lines.append("")
    lines.append(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}")
    lines.append("")

    if not rows:
        lines.append("No conformance reports were found under `conformance_reports/v0.3`.")
    else:
        lines.append("| Implementation | Version | Pass | Fail | Skip | Total | Generated At |")
        lines.append("|---|---|---:|---:|---:|---:|---|")
        for row in rows:
            lines.append(
                f"| {row['impl']} | {row['version']} | {row['pass']} | {row['fail']} | {row['skip']} | {row['total']} | {row['generated']} |"
            )

        lines.append("")
        lines.append("## Level Coverage")
        lines.append("")
        lines.append("| Implementation | L1 | L2 | L3 | L4 | L5 |")
        lines.append("|---|---|---|---|---|---|")
        for row in rows:
            def fmt(level: int) -> str:
                data = row["levels"].get(level)
                if not data:
                    return "-"
                return f"{data['pass']}/{data['total']} pass"

            lines.append(
                f"| {row['impl']} | {fmt(1)} | {fmt(2)} | {fmt(3)} | {fmt(4)} | {fmt(5)} |"
            )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
