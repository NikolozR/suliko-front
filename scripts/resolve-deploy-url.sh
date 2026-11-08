#!/usr/bin/env bash
# Prints the address the E2E tests should run against.
#
#   push to main  -> the production deployment
#   pull request  -> the Vercel preview built from the PR's head commit, so the
#                    tests exercise the code under review, not what is live.
#
# Needs: GH_TOKEN (deployments: read), GITHUB_REPOSITORY, and for a pull request
# HEAD_SHA. Waits up to TIMEOUT_SECONDS (default 900) for the preview to be ready.
set -euo pipefail

PRODUCTION_URL="${PRODUCTION_URL:-https://suliko-front-five.vercel.app}"

if [ "${GITHUB_EVENT_NAME:-}" != "pull_request" ]; then
  echo "$PRODUCTION_URL"
  exit 0
fi

: "${HEAD_SHA:?HEAD_SHA is required for a pull request}"
deadline=$(( $(date +%s) + ${TIMEOUT_SECONDS:-900} ))

while [ "$(date +%s)" -lt "$deadline" ]; do
  # Newest deployment first; take the first one whose latest status is success.
  for id in $(gh api "repos/$GITHUB_REPOSITORY/deployments?sha=$HEAD_SHA" --jq '.[].id'); do
    url=$(gh api "repos/$GITHUB_REPOSITORY/deployments/$id/statuses" \
      --jq 'first(.[] | select(.state=="success") | .environment_url) // empty')
    if [ -n "$url" ]; then
      echo "$url"
      exit 0
    fi
  done
  echo "Waiting for the Vercel preview of $HEAD_SHA..." >&2
  sleep 15
done

echo "No successful Vercel preview for $HEAD_SHA within the time limit." >&2
exit 1
