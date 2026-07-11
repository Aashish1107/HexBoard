#!/bin/bash
# Integration test: full user lifecycle — create, login, update, delete.
# Usage: PORT=3000 bash cmd/test-user.sh

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

TEST_USER="test_user_$$"
TEST_PASS="testpass123"
TEST_AVATAR="https://example.com/avatar.png"
UPDATED_USER="${TEST_USER}_updated"

# --- create ---
create_resp=$(curl -Ss -X POST "${BASE}/api/user" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"${TEST_USER}\",\"password\":\"${TEST_PASS}\",\"avatar\":\"${TEST_AVATAR}\"}")
USER_ID=$(node -p "($create_resp).id" 2>/dev/null)
if [[ -z "$USER_ID" || "$USER_ID" == "undefined" ]]; then
    fail "POST /api/user — no id returned. Response: $create_resp"
    echo "Cannot continue without a user id."
    exit 1
else
    pass "POST /api/user — created user (id: $USER_ID)"
fi

# --- login ---
login_resp=$(curl -Ss -w "\n%{http_code}" -c "$COOKIE_JAR" \
    -X POST "${BASE}/api/auth" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"${TEST_USER}\",\"password\":\"${TEST_PASS}\"}")
login_code=$(echo "$login_resp" | tail -1)
check_code "POST /api/auth login" "200" "$login_code"

# --- update ---
code=$(curl -Ss -o /dev/null -w "%{http_code}" \
    -X PUT "${BASE}/api/user/${USER_ID}" \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${TEST_PASS}" \
    -d "{\"name\":\"${UPDATED_USER}\",\"password\":\"${TEST_PASS}\"}")
check_code "PUT /api/user/[id] update" "200" "$code"

get_resp=$(curl -Ss "${BASE}/api/user/${USER_ID}")
got_name=$(node -p "($get_resp).name" 2>/dev/null)
if [[ "$got_name" == "$UPDATED_USER" ]]; then
    pass "GET /api/user/[id] name reflects update"
else
    fail "GET /api/user/[id] name not updated — expected $UPDATED_USER, got $got_name"
fi

# --- delete ---
code=$(curl -Ss -o /dev/null -w "%{http_code}" \
    -X DELETE "${BASE}/api/user/${USER_ID}" \
    -H "Authorization: Bearer ${TEST_PASS}")
check_code "DELETE /api/user/[id]" "200" "$code"

code=$(curl -Ss -o /dev/null -w "%{http_code}" "${BASE}/api/user/${USER_ID}")
check_code "GET /api/user/[id] after delete → 404" "404" "$code"

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
