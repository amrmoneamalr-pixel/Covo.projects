#!/bin/bash
# ============================================================
# COVO Projects — One-command GitHub upload
# Run this from INSIDE the covo-projects folder:
#   bash upload-to-github.sh
# ============================================================

set -e

REPO="https://github.com/amrmoneamalr-pixel/Covo.projects.git"

echo "📦 Initializing git..."
git init
git add .
git commit -m "COVO Projects - full app"
git branch -M main

echo "🔗 Connecting to GitHub..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO"

echo "🚀 Pushing... (you may be asked for your GitHub username + token)"
git push -u origin main --force

echo ""
echo "✅ Done! Check: https://github.com/amrmoneamalr-pixel/Covo.projects"
