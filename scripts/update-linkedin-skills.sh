#!/usr/bin/env bash
# Update & Verification Script for linkedin-skills Integration
set -e

REPO_DIR="services/linkedin-skills"
PINNED_COMMIT="baa9c909916f98764828e15e7cfc9dffa1aaadb1"

echo "=== LinkedIn Skills Upgrade & Health Check ==="
echo "Target Directory: $REPO_DIR"

if [ ! -d "$REPO_DIR" ]; then
  echo "Error: $REPO_DIR does not exist. Please clone the repository first."
  exit 1
fi

cd "$REPO_DIR"

CURRENT_COMMIT=$(git rev-parse HEAD)
echo "Current Commit: $CURRENT_COMMIT"
echo "Pinned Commit:  $PINNED_COMMIT"

if [ "$CURRENT_COMMIT" != "$PINNED_COMMIT" ]; then
  echo "Warning: Current commit does not match pinned commit."
fi

echo "Running Upstream Offline Tests..."
python3 scripts/selftest.py --offline || true

echo "Checking Frontmatter..."
python3 scripts/check_frontmatter.py

echo "Checking Markdown References..."
python3 scripts/check_markdown_references.py

echo "Checking No Secrets..."
python3 scripts/check_no_secrets.py

echo "=== Update & Verification Complete ==="
