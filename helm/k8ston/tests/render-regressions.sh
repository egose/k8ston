#!/usr/bin/env bash
# Rendered-object regression assertions for the k8ston chart (KRY-11).
#
# Verifies that the single effective configuration in
# helm/k8ston/templates/_helpers.tpl ("k8ston.effectiveConfig") keeps the
# rendered Deployment env, Role/ClusterRole scope, subjects, and apps
# permissions in agreement for every supported scenario, and that
# contradictory explicit settings fail with actionable guidance.
#
# Dependency-free (helm + grep only). Renders to a private mktemp directory
# that is removed on exit; no stray files are left behind.
set -euo pipefail

CHART_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

PASS=0
FAIL=0
FAILED_CASES=()

pass() { PASS=$((PASS + 1)); printf 'ok   %s\n' "$1"; }
fail() {
  FAIL=$((FAIL + 1))
  FAILED_CASES+=("$1")
  printf 'FAIL %s\n  %s\n' "$1" "$2"
}

# render <label> <out-file> [helm template args...]
render() {
  local label="$1" out="$2"
  shift 2
  if ! helm template test "$CHART_DIR" -n app-ns "$@" >"$out" 2>"$out.err"; then
    fail "$label" "helm template unexpectedly failed: $(head -n 1 "$out.err")"
    return 1
  fi
  return 0
}

# render_fail <label> <expected-guidance-substring> [helm template args...]
render_fail() {
  local label="$1" expected="$2"
  shift 2
  local out="$WORK/fail.out"
  if helm template test "$CHART_DIR" -n app-ns "$@" >"$out" 2>"$out.err"; then
    fail "$label" "helm template unexpectedly succeeded"
    return 0
  fi
  if grep -qF "$expected" "$out.err"; then
    pass "$label"
  else
    fail "$label" "stderr missed guidance [$expected]: $(head -n 1 "$out.err")"
  fi
}

# env_has <label> <deploy-file> <NAME> <expected-value>
env_has() {
  local label="$1" file="$2" name="$3" value="$4"
  if grep -A1 -e "- name: $name$" "$file" | grep -q -e "value: \"$value\"$"; then
    pass "$label"
  else
    fail "$label" "expected env $name=\"$value\""
  fi
}

# env_missing <label> <deploy-file> <NAME-pattern>
env_missing() {
  local label="$1" file="$2" name="$3"
  if grep -q -e "- name: \"$name\"$" -e "- name: $name$" "$file"; then
    fail "$label" "unexpected env entry $name"
  else
    pass "$label"
  fi
}

# env_count <label> <deploy-file> <NAME> <expected-count>
env_count() {
  local label="$1" file="$2" name="$3" expected="$4"
  local count
  count=$(grep -c -e "- name: \"$name\"$" -e "- name: $name$" "$file" || true)
  if [ "$count" = "$expected" ]; then
    pass "$label"
  else
    fail "$label" "expected $expected env entry(ies) $name, got $count"
  fi
}

# kind_count <label> <file> <Kind> <expected-count>
kind_count() {
  local label="$1" file="$2" kind="$3" expected="$4"
  local count
  count=$(grep -cE "^kind: $kind$" "$file" || true)
  if [ "$count" = "$expected" ]; then
    pass "$label"
  else
    fail "$label" "expected $expected object(s) of kind $kind, got $count"
  fi
}

# count_matches <label> <file> <pattern> <expected-count>
count_matches() {
  local label="$1" file="$2" pattern="$3" expected="$4"
  local count
  count=$(grep -cE "$pattern" "$file" || true)
  if [ "$count" = "$expected" ]; then
    pass "$label"
  else
    fail "$label" "expected $expected match(es) of [$pattern], got $count"
  fi
}

# ---------------------------------------------------------------------------
# S1: defaults — namespace scope, restart off, no access ConfigMap.
# ---------------------------------------------------------------------------
if render "S1 render defaults" "$WORK/s1-deploy.yaml" --show-only templates/deployment.yaml; then
  env_has "S1 scope defaults to namespace" "$WORK/s1-deploy.yaml" "K8STON_SCOPE" "namespace"
  env_has "S1 restart defaults to false" "$WORK/s1-deploy.yaml" "K8STON_RESTART_ENABLED" "false"
  env_missing "S1 no namespaces allowlist by default" "$WORK/s1-deploy.yaml" "K8STON_NAMESPACES"
  env_missing "S1 no access configmap by default" "$WORK/s1-deploy.yaml" "K8STON_ACCESS_CONFIGMAP"
  env_count "S1 scope rendered exactly once" "$WORK/s1-deploy.yaml" "K8STON_SCOPE" "1"
fi
if render "S1 render default RBAC" "$WORK/s1-rbac.yaml" --show-only templates/rbac.yaml; then
  kind_count "S1 exactly one Role" "$WORK/s1-rbac.yaml" "Role" "1"
  kind_count "S1 exactly one RoleBinding" "$WORK/s1-rbac.yaml" "RoleBinding" "1"
  kind_count "S1 no ClusterRole" "$WORK/s1-rbac.yaml" "ClusterRole" "0"
  kind_count "S1 no ClusterRoleBinding" "$WORK/s1-rbac.yaml" "ClusterRoleBinding" "0"
  count_matches "S1 no apps rule when restart is off" "$WORK/s1-rbac.yaml" 'apiGroups: \[apps\]' "0"
  count_matches "S1 binding targets the release namespace" "$WORK/s1-rbac.yaml" '^  namespace: app-ns$' "1"
fi
if render "S1 render full defaults" "$WORK/s1-full.yaml"; then
  kind_count "S1 no access ConfigMap by default" "$WORK/s1-full.yaml" "ConfigMap" "0"
fi

# ---------------------------------------------------------------------------
# S2: cluster scope with restart — ClusterRole + apps rule agree with env.
# ---------------------------------------------------------------------------
if render "S2 render cluster" "$WORK/s2-deploy.yaml" --show-only templates/deployment.yaml \
  --set rbac.scope=cluster --set restartEnabled=true; then
  env_has "S2 scope is cluster" "$WORK/s2-deploy.yaml" "K8STON_SCOPE" "cluster"
  env_has "S2 restart is true" "$WORK/s2-deploy.yaml" "K8STON_RESTART_ENABLED" "true"
  env_missing "S2 no namespaces without an explicit allowlist" "$WORK/s2-deploy.yaml" "K8STON_NAMESPACES"
fi
if render "S2 render cluster RBAC" "$WORK/s2-rbac.yaml" --show-only templates/rbac.yaml \
  --set rbac.scope=cluster --set restartEnabled=true; then
  kind_count "S2 exactly one ClusterRole" "$WORK/s2-rbac.yaml" "ClusterRole" "1"
  kind_count "S2 exactly one ClusterRoleBinding" "$WORK/s2-rbac.yaml" "ClusterRoleBinding" "1"
  kind_count "S2 no namespaced Role" "$WORK/s2-rbac.yaml" "Role" "0"
  kind_count "S2 no namespaced RoleBinding" "$WORK/s2-rbac.yaml" "RoleBinding" "0"
  count_matches "S2 apps rule rendered" "$WORK/s2-rbac.yaml" 'apiGroups: \[apps\]' "1"
  count_matches "S2 namespaces rule rendered" "$WORK/s2-rbac.yaml" 'resources: \[namespaces\]' "1"
fi

# ---------------------------------------------------------------------------
# S3: cluster scope with an explicit K8STON_NAMESPACES allowlist.
# ---------------------------------------------------------------------------
if render "S3 render cluster allowlist" "$WORK/s3-deploy.yaml" --show-only templates/deployment.yaml \
  --set rbac.scope=cluster --set-string 'env.K8STON_NAMESPACES=team-a\,team-b'; then
  env_has "S3 scope is cluster" "$WORK/s3-deploy.yaml" "K8STON_SCOPE" "cluster"
  env_has "S3 explicit allowlist passes through" "$WORK/s3-deploy.yaml" "K8STON_NAMESPACES" "team-a,team-b"
fi
if render "S3 render cluster allowlist RBAC" "$WORK/s3-rbac.yaml" --show-only templates/rbac.yaml \
  --set rbac.scope=cluster --set-string 'env.K8STON_NAMESPACES=team-a\,team-b'; then
  kind_count "S3 ClusterRole still rendered (runtime narrows)" "$WORK/s3-rbac.yaml" "ClusterRole" "1"
fi

# ---------------------------------------------------------------------------
# S4: curated namespaces — bounded allowlist with namespaced Roles only.
# ---------------------------------------------------------------------------
if render "S4 render curated" "$WORK/s4-deploy.yaml" --show-only templates/deployment.yaml \
  --set 'rbac.extraNamespaces={team-a,team-b}'; then
  env_has "S4 curated scope is cluster" "$WORK/s4-deploy.yaml" "K8STON_SCOPE" "cluster"
  env_has "S4 allowlist is release plus extras" "$WORK/s4-deploy.yaml" "K8STON_NAMESPACES" "app-ns,team-a,team-b"
  env_has "S4 restart stays off" "$WORK/s4-deploy.yaml" "K8STON_RESTART_ENABLED" "false"
fi
if render "S4 render curated RBAC" "$WORK/s4-rbac.yaml" --show-only templates/rbac.yaml \
  --set 'rbac.extraNamespaces={team-a,team-b}'; then
  kind_count "S4 no ClusterRole for curated namespaces" "$WORK/s4-rbac.yaml" "ClusterRole" "0"
  kind_count "S4 no ClusterRoleBinding for curated namespaces" "$WORK/s4-rbac.yaml" "ClusterRoleBinding" "0"
  kind_count "S4 release plus one Role per extra" "$WORK/s4-rbac.yaml" "Role" "3"
  kind_count "S4 release plus one RoleBinding per extra" "$WORK/s4-rbac.yaml" "RoleBinding" "3"
  count_matches "S4 extra Role in team-a" "$WORK/s4-rbac.yaml" '^  namespace: team-a$' "2"
  count_matches "S4 extra Role in team-b" "$WORK/s4-rbac.yaml" '^  namespace: team-b$' "2"
  count_matches "S4 all subjects stay in the release namespace" "$WORK/s4-rbac.yaml" '^  namespace: app-ns$' "3"
  count_matches "S4 no apps rule when restart is off" "$WORK/s4-rbac.yaml" 'apiGroups: \[apps\]' "0"
fi

# ---------------------------------------------------------------------------
# S5: curated namespaces with restart — apps rule in every Role.
# ---------------------------------------------------------------------------
if render "S5 render curated restart RBAC" "$WORK/s5-rbac.yaml" --show-only templates/rbac.yaml \
  --set 'rbac.extraNamespaces={team-a,team-b}' --set restartEnabled=true; then
  count_matches "S5 apps rule in all three Roles" "$WORK/s5-rbac.yaml" 'apiGroups: \[apps\]' "3"
fi
if render "S5 render curated restart env" "$WORK/s5-deploy.yaml" --show-only templates/deployment.yaml \
  --set 'rbac.extraNamespaces={team-a,team-b}' --set restartEnabled=true; then
  env_has "S5 runtime flag agrees with RBAC" "$WORK/s5-deploy.yaml" "K8STON_RESTART_ENABLED" "true"
fi

# ---------------------------------------------------------------------------
# S6: local env wins over global env per key (value and validation).
# ---------------------------------------------------------------------------
if render "S6 render local-over-global" "$WORK/s6-deploy.yaml" --show-only templates/deployment.yaml \
  --set-json 'global.env={"K8STON_SCOPE":"cluster","FOO":"global"}' \
  --set-json 'env={"K8STON_SCOPE":"namespace","FOO":"local"}'; then
  env_has "S6 local scope wins (and validates)" "$WORK/s6-deploy.yaml" "K8STON_SCOPE" "namespace"
  env_has "S6 local value wins for custom keys" "$WORK/s6-deploy.yaml" '"FOO"' "local"
  count_matches "S6 global value fully shadowed" "$WORK/s6-deploy.yaml" 'value: "global"' "0"
fi

# ---------------------------------------------------------------------------
# S7: explicit restart values that agree render canonically.
# ---------------------------------------------------------------------------
if render "S7 render explicit false" "$WORK/s7-deploy.yaml" --show-only templates/deployment.yaml \
  --set restartEnabled=false --set-string 'env.K8STON_RESTART_ENABLED=false'; then
  env_has "S7 explicit false renders false" "$WORK/s7-deploy.yaml" "K8STON_RESTART_ENABLED" "false"
fi
if render "S7 render explicit false RBAC" "$WORK/s7-rbac.yaml" --show-only templates/rbac.yaml \
  --set restartEnabled=false --set-string 'env.K8STON_RESTART_ENABLED=false'; then
  count_matches "S7 no apps rule for explicit false" "$WORK/s7-rbac.yaml" 'apiGroups: \[apps\]' "0"
fi
if render "S7 render truthy alias" "$WORK/s7b-deploy.yaml" --show-only templates/deployment.yaml \
  --set restartEnabled=true --set-string 'env.K8STON_RESTART_ENABLED=yes'; then
  env_has "S7 truthy alias renders canonical true" "$WORK/s7b-deploy.yaml" "K8STON_RESTART_ENABLED" "true"
fi
if render "S7 render truthy alias RBAC" "$WORK/s7b-rbac.yaml" --show-only templates/rbac.yaml \
  --set restartEnabled=true --set-string 'env.K8STON_RESTART_ENABLED=yes'; then
  count_matches "S7 apps rule for truthy alias" "$WORK/s7b-rbac.yaml" 'apiGroups: \[apps\]' "1"
fi

# ---------------------------------------------------------------------------
# S8: externally managed RBAC — no Roles rendered, env passes through.
# ---------------------------------------------------------------------------
if render "S8 render external RBAC" "$WORK/s8-full.yaml" \
  --set rbac.create=false \
  --set-json 'env={"K8STON_SCOPE":"cluster","K8STON_NAMESPACES":"team-a,team-b"}'; then
  kind_count "S8 no Role" "$WORK/s8-full.yaml" "Role" "0"
  kind_count "S8 no RoleBinding" "$WORK/s8-full.yaml" "RoleBinding" "0"
  kind_count "S8 no ClusterRole" "$WORK/s8-full.yaml" "ClusterRole" "0"
  kind_count "S8 no ClusterRoleBinding" "$WORK/s8-full.yaml" "ClusterRoleBinding" "0"
  kind_count "S8 ServiceAccount still rendered" "$WORK/s8-full.yaml" "ServiceAccount" "1"
  env_has "S8 explicit scope passes through" "$WORK/s8-full.yaml" "K8STON_SCOPE" "cluster"
  env_has "S8 explicit allowlist passes through" "$WORK/s8-full.yaml" "K8STON_NAMESPACES" "team-a,team-b"
  env_has "S8 restart default still injected" "$WORK/s8-full.yaml" "K8STON_RESTART_ENABLED" "false"
fi
if render "S8 stale scope ignored when external" "$WORK/s8b-deploy.yaml" --show-only templates/deployment.yaml \
  --set rbac.create=false --set rbac.scope=namespace --set-string 'env.K8STON_SCOPE=cluster'; then
  env_has "S8 unrendered scope does not constrain env" "$WORK/s8b-deploy.yaml" "K8STON_SCOPE" "cluster"
fi

# ---------------------------------------------------------------------------
# S9: access ConfigMap name/key aligned with the runtime policy reader.
# ---------------------------------------------------------------------------
if render "S9 render custom access" "$WORK/s9-deploy.yaml" --show-only templates/deployment.yaml \
  --set accessConfig.enabled=true --set accessConfig.name=custom-access; then
  env_has "S9 access name derived into env" "$WORK/s9-deploy.yaml" "K8STON_ACCESS_CONFIGMAP" "custom-access"
fi
if render "S9 render custom access object" "$WORK/s9-cm.yaml" --show-only templates/access-configmap.yaml \
  --set accessConfig.enabled=true --set accessConfig.name=custom-access \
  --set-json 'accessConfig.data={"production":{"groups":["dev-team"]}}'; then
  count_matches "S9 ConfigMap uses the derived name" "$WORK/s9-cm.yaml" '^  name: custom-access$' "1"
  count_matches "S9 ConfigMap uses the runtime key" "$WORK/s9-cm.yaml" '^  access.json:' "1"
fi
if render "S9 render external access passthrough" "$WORK/s9b-deploy.yaml" --show-only templates/deployment.yaml \
  --set accessConfig.enabled=false --set-string 'env.K8STON_ACCESS_CONFIGMAP=external-access'; then
  env_has "S9 external access name passes through" "$WORK/s9b-deploy.yaml" "K8STON_ACCESS_CONFIGMAP" "external-access"
fi

# ---------------------------------------------------------------------------
# S10: explicit values matching the effective config render once, canonically.
# ---------------------------------------------------------------------------
if render "S10 render explicit matches" "$WORK/s10-deploy.yaml" --show-only templates/deployment.yaml \
  --set rbac.scope=cluster --set restartEnabled=true \
  --set-string 'env.K8STON_SCOPE=cluster' --set-string 'env.K8STON_RESTART_ENABLED=true'; then
  env_count "S10 scope rendered exactly once" "$WORK/s10-deploy.yaml" "K8STON_SCOPE" "1"
  env_count "S10 restart rendered exactly once" "$WORK/s10-deploy.yaml" "K8STON_RESTART_ENABLED" "1"
  env_has "S10 scope value agrees" "$WORK/s10-deploy.yaml" "K8STON_SCOPE" "cluster"
  env_has "S10 restart value agrees" "$WORK/s10-deploy.yaml" "K8STON_RESTART_ENABLED" "true"
fi

# ---------------------------------------------------------------------------
# S11: release namespace listed in extras is not duplicated in the allowlist.
# ---------------------------------------------------------------------------
if render "S11 render deduped extras" "$WORK/s11-deploy.yaml" --show-only templates/deployment.yaml \
  --set 'rbac.extraNamespaces={app-ns,team-a}'; then
  env_has "S11 allowlist deduplicates the release namespace" "$WORK/s11-deploy.yaml" "K8STON_NAMESPACES" "app-ns,team-a"
fi

# ---------------------------------------------------------------------------
# F: contradictory explicit settings fail with actionable guidance.
# ---------------------------------------------------------------------------
render_fail "F1 scope cluster vs namespace RBAC" \
  'env K8STON_SCOPE="cluster" contradicts rbac.scope=namespace' \
  --set-string 'env.K8STON_SCOPE=cluster'
render_fail "F2 scope namespace vs cluster RBAC" \
  'env K8STON_SCOPE="namespace" contradicts rbac.scope=cluster' \
  --set rbac.scope=cluster --set-string 'env.K8STON_SCOPE=namespace'
render_fail "F3 allowlist ignored in namespace scope" \
  'K8STON_NAMESPACES in env is ignored by the namespace runtime scope' \
  --set-string 'env.K8STON_NAMESPACES=team-a'
render_fail "F4 extras with cluster scope" \
  'rbac.extraNamespaces is only used with rbac.scope=namespace' \
  --set rbac.scope=cluster --set 'rbac.extraNamespaces={team-a}'
render_fail "F5 allowlist contradicts extras" \
  'K8STON_NAMESPACES in env contradicts rbac.extraNamespaces' \
  --set 'rbac.extraNamespaces={team-a}' --set-string 'env.K8STON_NAMESPACES=team-a'
render_fail "F6 namespace scope contradicts extras" \
  'rbac.extraNamespaces renders curated multi-namespace access' \
  --set 'rbac.extraNamespaces={team-a}' --set-string 'env.K8STON_SCOPE=namespace'
render_fail "F7 env false contradicts restartEnabled=true" \
  'env K8STON_RESTART_ENABLED="false" contradicts restartEnabled=true' \
  --set restartEnabled=true --set-string 'env.K8STON_RESTART_ENABLED=false'
render_fail "F8 env true contradicts restartEnabled=false" \
  'env K8STON_RESTART_ENABLED="true" contradicts restartEnabled=false' \
  --set restartEnabled=false --set-string 'env.K8STON_RESTART_ENABLED=true'
render_fail "F9 access key must be access.json" \
  'accessConfig.key must be "access.json"' \
  --set accessConfig.enabled=true --set accessConfig.key=other.json
render_fail "F10 access env contradicts accessConfig.name" \
  'env K8STON_ACCESS_CONFIGMAP="other" contradicts accessConfig.name="custom-access"' \
  --set accessConfig.enabled=true --set accessConfig.name=custom-access \
  --set-string 'env.K8STON_ACCESS_CONFIGMAP=other'
render_fail "F11 extraEnv must not set managed keys" \
  'extraEnv[0].name "K8STON_SCOPE" is managed by the chart' \
  --set 'extraEnv[0].name=K8STON_SCOPE' --set 'extraEnv[0].value=cluster'
render_fail "F12 invalid rbac.scope" \
  'rbac.scope must be "namespace" or "cluster"' \
  --set rbac.scope=bogus
render_fail "F13 blank extraNamespaces entry" \
  'rbac.extraNamespaces entries must be non-empty namespace names' \
  --set-json 'rbac.extraNamespaces=[""]'
render_fail "F14 local value drives scope validation" \
  'env K8STON_SCOPE="cluster" contradicts rbac.scope=namespace' \
  --set-json 'global.env={"K8STON_SCOPE":"namespace"}' \
  --set-json 'env={"K8STON_SCOPE":"cluster"}'
render_fail "F15 comma in extraNamespaces entry" \
  'contains a comma, which would corrupt the derived K8STON_NAMESPACES allowlist' \
  --set-json 'rbac.extraNamespaces=["a,b"]'
render_fail "F16 invalid scope with external RBAC" \
  'is not a valid scope' \
  --set rbac.create=false --set-string 'env.K8STON_SCOPE=bogus'

printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  printf 'failed cases:\n'
  printf '  - %s\n' "${FAILED_CASES[@]}"
  exit 1
fi
