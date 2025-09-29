#!/usr/bin/env bash
set -euo pipefail

# --- helpers ---
die(){ echo "❌ $*" >&2; exit 1; }
step(){ echo -e "\n▶ $*"; }

VERSION="${1:-}"
RUN_CI="${RUN_CI:-1}"           # set RUN_CI=0 to skip lint/type/build
PUBLISH_BR="${PUBLISH_BR:-1}"   # set PUBLISH_BR=0 to skip 'git flow release publish'
DRY_RUN="${DRY_RUN:-0}"         # set DRY_RUN=1 to only print commands

[[ -n "$VERSION" ]] || die "Usage: scripts/release.sh <semver>  (e.g. 0.2.0)"

# sanity: tools
command -v git >/dev/null || die "git not found"
command -v git-flow >/dev/null || command -v gitflow >/dev/null || die "git-flow (AVH) not found"
command -v npm >/dev/null || die "npm not found"

# sanity: root
[[ -f package.json ]] || die "Run from repo root (package.json not found)"

# sanity: working tree clean
git update-index -q --refresh
git diff --quiet || die "Working tree has changes. Commit or stash first."
git diff --cached --quiet || die "Staged changes present. Commit or unstage first."

# warn if origin uses https
ORIGIN_URL="$(git remote get-url origin || true)"
if [[ "$ORIGIN_URL" =~ ^https:// ]]; then
  echo "⚠ origin is HTTPS ($ORIGIN_URL). You previously had auth issues pushing tags."
  echo "   Consider: git remote set-url origin git@github.com:evrfinance-vayya/vayya-saas.git"
fi

# ensure gitflow main/develop
MAIN=$(git config --get gitflow.branch.master || echo "main")
DEV=$(git config --get gitflow.branch.develop || echo "develop")
[[ "$MAIN" == "main" && "$DEV" == "develop" ]] || die "git-flow not set to main/develop. Got master=$MAIN develop=$DEV"

run(){ if [[ "$DRY_RUN" == "1" ]]; then echo "DRY 👉 $*"; else eval "$@"; fi }

step "Fetch & sync develop"
run "git fetch --all --tags"
run "git checkout $DEV"
run "git pull --ff-only origin $DEV"

# start release
step "Start release $VERSION"
run "git flow release start $VERSION"

# bump versions (root only), update lockfile
step "Bump root version to $VERSION"
run "npm version $VERSION --no-git-tag-version"
# refresh lock deterministically without installing binaries
step "Refresh lockfile"
run "npm install --package-lock-only"

# commit the bump
run "git add package.json package-lock.json"
run "git commit -m 'chore(release): bump to $VERSION'"

# optional: quick CI locally
if [[ "$RUN_CI" == "1" ]]; then
  step "Local checks: install + lint/type/build"
  run "npm ci --workspaces --include-workspace-root"
  run "npm run -ws --if-present lint"
  run "npm run -ws --if-present typecheck"
  run "npm run -ws --if-present build"
fi

# publish release branch (so CI runs on GH)
if [[ "$PUBLISH_BR" == "1" ]]; then
  step "Publish release branch to origin"
  run "git flow release publish $VERSION"
fi

# finish (merge into main+develop, create tag)
step "Finish release $VERSION (creates annotated tag)"
# '-m' sets tag/merge message to version; AVH git-flow accepts: git flow release finish -m "<msg>" <version>
run "git flow release finish -m '$VERSION' $VERSION"

# push branches + tags
step "Push main, develop, and tags"
run "git push origin $MAIN $DEV --tags"

echo -e "\n✅ Release $VERSION complete."
echo "   - Tag pushed: $VERSION"
echo "   - Netlify should deploy main automatically."
echo "   - If you make a GitHub Release, base it on tag $VERSION."
