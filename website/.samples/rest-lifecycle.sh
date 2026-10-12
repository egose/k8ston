# Krypton REST lifecycle against the sandbox (make up + app/.env from app.env.sandbox).
# Mint session JWTs directly — must match the app's SESSION_SECRET.
ALICE=$(node sandbox/scripts/mint-jwt.mjs --email alice@company.com --groups dev-team)
BOB=$(node sandbox/scripts/mint-jwt.mjs --email bob@company.com --groups other-team)

BASE=localhost:3000
NS=krypton-test

# 1. List namespaces and secrets (alice sees dev-team + open secrets)
curl --cookie "krypton_session=$ALICE" $BASE/api/namespaces
curl --cookie "krypton_session=$ALICE" $BASE/api/namespaces/$NS/secrets

# 2. Negative case: bob is not in dev-team
curl --cookie "krypton_session=$BOB" \
  $BASE/api/namespaces/$NS/secrets/database-credentials # 403

# 3. Create a secret (201; stamps krypton.io/managed-by + version=1)
curl --cookie "krypton_session=$ALICE" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"name":"demo-secret","data":{"API_KEY":"s3cr3t"},"description":"Demo"}' \ # pragma: allowlist secret
  $BASE/api/namespaces/$NS/secrets

# 4. Read it back (detail includes decoded data + resourceVersion)
curl --cookie "krypton_session=$ALICE" \
  $BASE/api/namespaces/$NS/secrets/demo-secret

# 5. Update with optimistic concurrency (409 on resourceVersion mismatch)
RV=$(curl -s --cookie "krypton_session=$ALICE" \
  $BASE/api/namespaces/$NS/secrets/demo-secret | jq -r .secret.resourceVersion)
curl --cookie "krypton_session=$ALICE" -X PUT \
  -H 'Content-Type: application/json' \
  -d "{\"data\":{\"API_KEY\":\"r0tated\"},\"resourceVersion\":\"$RV\"}" \
  $BASE/api/namespaces/$NS/secrets/demo-secret

# 6. History + reversible restore (snapshots current state first)
curl --cookie "krypton_session=$ALICE" \
  $BASE/api/namespaces/$NS/secrets/demo-secret/versions
curl --cookie "krypton_session=$ALICE" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"version":1}' \
  $BASE/api/namespaces/$NS/secrets/demo-secret/restore

# 7. Restart env-var consumers (needs KRYPTON_RESTART_ENABLED=true)
curl --cookie "krypton_session=$ALICE" -X POST \
  $BASE/api/namespaces/$NS/secrets/demo-secret/restart-consumers

# 8. Delete (snapshots go too, unless ?keepHistory=true)
curl --cookie "krypton_session=$ALICE" -X DELETE \
  $BASE/api/namespaces/$NS/secrets/demo-secret
