#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: npm run link:local -- <consumer-path> [consumer-path-2 ...]"
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
invocation_dir="$PWD"

echo "Linking @wintermuted/ui-theme from $repo_root/packages/ui-theme"
cd "$repo_root"
npm link --workspace=@wintermuted/ui-theme

for target in "$@"; do
  consumer_dir="$(cd "$invocation_dir" && cd "$target" && pwd)"
  echo "Linking into $consumer_dir"
  cd "$consumer_dir"
  npm link @wintermuted/ui-theme

done

echo "Done. Local consumers now symlink to your working copy of @wintermuted/ui-theme."
