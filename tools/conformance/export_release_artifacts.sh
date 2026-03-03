#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

copy_if_exists() {
  local target_dir="$1"
  local label="$2"

  if [[ -d "$target_dir" ]]; then
    mkdir -p "$target_dir/vectors" "$target_dir/schemas"
    rsync -a --delete "$ROOT_DIR/vectors/v0.3" "$target_dir/vectors/"
    rsync -a --delete "$ROOT_DIR/schemas/" "$target_dir/schemas/"
    echo "Exported vectors/schemas -> $label"
  else
    echo "Skipping $label (directory missing): $target_dir"
  fi
}

copy_if_exists "$ROOT_DIR/packages/spx-prov-spec" "@provenance/spx-prov-spec"
copy_if_exists "$ROOT_DIR/packages/spx-prov-conformance" "@provenance/spx-prov-conformance"
