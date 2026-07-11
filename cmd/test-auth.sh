#!/bin/bash
# Integration test: login, session validation, session verification, logout, session deletion.
# Usage: PORT=3000 bash cmd/test-auth.sh

PORT=${PORT:-3000}
BASE="http://localhost:${PORT}"
PASS_COUNT=0
FAIL_COUNT=0

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

pass() { echo -e "${GREEN}PASS${NC}: $1"; ((PASS_COUNT++)); }
fail() { echo -e "${RED}FAIL${NC}: $1"; ((FAIL_COUNT++)); }

check_code() {
    local label=$1
    local expected=$2
    local actual=$3
    if [[ "$actual" == "$expected" ]]; then
        pass "$label (HTTP $actual)"
    else
        fail "$label — expected $expected, got $actual"
    fi
}

# --- setup: start server if not running ---
code=$(curl -o /dev/null -s -w "%{http_code}" "${BASE}/api/map/probe" 2>/dev/null)
SERVER=none
if [[ "$code" == "000" ]]; then
    echo "Starting development server..."
    npm run dev &
    SERVER=$!
    sleep 8
fi

COOKIE_JAR=$(mktemp)
trap 'rm -f "$COOKIE_JAR"' EXIT

# Create a temporary user for auth testing
TEST_USER="test_auth_$$"
TEST_PASS="testpass123"
create_resp=$(curl -Ss -X POST "${BASE}/api/user" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"${TEST_USER}\",\"password\":\"${TEST_PASS}\"}")
USER_ID=$(node -p "($create_resp).id" 2>/dev/null)
if [[ -z "$USER_ID" || "$USER_ID" == "undefined" ]]; then
    echo "ERROR: Could not create test user. Response: $create_resp"
    exit 1
fi
echo "Created test user: $USER_ID"

# --- login ---
login_resp=$(curl -Ss -w "\n%{http_code}" -c "$COOKIE_JAR" \
    -X POST "${BASE}/api/auth" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"${TEST_USER}\",\"password\":\"${TEST_PASS}\"}")
login_code=$(echo "$login_resp" | tail -1)
check_code "POST /api/auth login" "200" "$login_code"

# --- session validation: session exists after login ---
code=$(curl -Ss -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" \
    -X GET "${BASE}/api/auth")
check_code "GET /api/auth session valid after login" "200" "$code"

# --- session verification: response contains correct user id ---
verify_resp=$(curl -Ss -b "$COOKIE_JAR" -X GET "${BASE}/api/auth")
got_id=$(node -p "($verify_resp).id" 2>/dev/null)
if [[ "$got_id" == "$USER_ID" ]]; then
    pass "GET /api/auth response contains correct user id"
else
    fail "GET /api/auth user id mismatch — expected $USER_ID, got $got_id"
fi

# --- logout ---
code=$(curl -Ss -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -X DELETE "${BASE}/api/auth")
check_code "DELETE /api/auth logout" "200" "$code"

# --- session deletion: session no longer valid after logout ---
code=$(curl -Ss -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" \
    -X GET "${BASE}/api/auth")
check_code "GET /api/auth after logout → 401" "401" "$code"

# --- cleanup ---
curl -Ss -o /dev/null -X DELETE "${BASE}/api/user/${USER_ID}" \
    -H "Authorization: Bearer unused"

# --- summary ---
echo ""
echo "Results: ${PASS_COUNT} passed, ${FAIL_COUNT} failed"

if [[ $SERVER != "none" ]]; then
    echo "Stopping script-started development server"
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        taskkill.exe //F //PID $SERVER //T
        taskkill.exe //F //IM node.exe
    else
        kill $SERVER
    fi
fi

[[ $FAIL_COUNT -eq 0 ]]
