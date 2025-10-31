#!/bin/bash

# Vercel Ignore Build Script
# Only build if there are changes in assets/, website/, scripts/, package.json, or vercel.json
# 
# Build Triggers (exit 1 = build, exit 0 = skip):
# ✅ Main/trunk branches (always build)
# ✅ Commit message contains "trigger build" (case insensitive)
# ✅ Changes in: assets/, website/, scripts/, package.json, vercel.json
# ⏭️ Skip: extension/, *.md files, other unrelated changes

echo "🔍 Checking if build should be skipped..."

# Always build on main/trunk branches
if [[ "$VERCEL_GIT_COMMIT_REF" == "main" ]] || [[ "$VERCEL_GIT_COMMIT_REF" == "trunk" ]]; then
  echo "✅ Building: Main branch deployment"
  exit 1
fi

# Check if commit message contains "trigger build" (case insensitive)
COMMIT_MESSAGE=$(git log -1 --pretty=%B)
echo "💬 Commit message: $COMMIT_MESSAGE"

if echo "$COMMIT_MESSAGE" | grep -iq "trigger build"; then
  echo "✅ Building: Commit message contains 'trigger build'"
  exit 1
fi

# Check if we have the previous commit to compare
if ! git rev-parse HEAD^ >/dev/null 2>&1; then
  echo "✅ Building: No previous commit found (initial commit)"
  exit 1
fi

# Check for changes in relevant directories and files
CHANGED_FILES=$(git diff --name-only HEAD^ HEAD)

echo "📄 Changed files:"
echo "$CHANGED_FILES"

# Check if any changed files are in our watch directories/files
RELEVANT_CHANGES=$(echo "$CHANGED_FILES" | grep -E '^(assets/|website/|scripts/|package\.json|vercel\.json)')

if [[ -n "$RELEVANT_CHANGES" ]]; then
  echo "✅ Building: Found relevant changes in:"
  echo "$RELEVANT_CHANGES"
  exit 1
else
  echo "⏭️  Skipping: No changes in assets/, website/, scripts/, package.json, or vercel.json"
  exit 0
fi