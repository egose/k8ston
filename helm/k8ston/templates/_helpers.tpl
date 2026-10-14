{{/*
Expand the name of the chart.
*/}}
{{- define "k8ston.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "k8ston.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "k8ston.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "k8ston.labels" -}}
helm.sh/chart: {{ include "k8ston.chart" . }}
{{ include "k8ston.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "k8ston.selectorLabels" -}}
app.kubernetes.io/name: {{ include "k8ston.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "k8ston.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "k8ston.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Runtime env keys managed by "k8ston.effectiveConfig". Renders a YAML array;
callers parse it with fromYamlArray.
*/}}
{{- define "k8ston.managedEnvKeys" -}}
- K8STON_SCOPE
- K8STON_NAMESPACES
- K8STON_RESTART_ENABLED
- K8STON_ACCESS_CONFIGMAP
{{- end }}

{{/*
Parse a flag exactly like the runtime bool() in app/lib/config.ts: an empty or
absent value renders the fallback, "1"/"true"/"yes"/"on" (any case) render
true, and everything else renders false. Expects a dict with .value and an
optional .fallback (default false). Renders "true" or "false".
*/}}
{{- define "k8ston.parseBool" -}}
{{- $raw := .value | toString -}}
{{- $fallback := false -}}
{{- if hasKey . "fallback" -}}
{{- $fallback = .fallback -}}
{{- end -}}
{{- if eq $raw "" -}}
{{- $fallback | toString -}}
{{- else if has ($raw | lower) (list "1" "true" "yes" "on") -}}
true
{{- else -}}
false
{{- end -}}
{{- end }}

{{/*
Single effective configuration shared by the Deployment and RBAC templates so
rendered env, Role/ClusterRole scope, subjects, and apps permissions always
agree. Local .Values.env wins over .Values.global.env per key.

Derives chart-managed defaults (K8STON_SCOPE from rbac.scope, a curated
K8STON_NAMESPACES allowlist from rbac.extraNamespaces, K8STON_RESTART_ENABLED
from restartEnabled, K8STON_ACCESS_CONFIGMAP from accessConfig.name) and fails
rendering with actionable guidance when an explicitly set value contradicts the
effective chart configuration, instead of silently rendering disagreeing
runtime/RBAC behavior.

Renders YAML (callers parse it with fromYaml):
  env:             merged env map (local over global); explicitly set managed
                   keys are guaranteed to match the derived effective value
  scope:           effective K8STON_SCOPE, "" = do not render (externally
                   managed RBAC without an explicit value)
  namespaces:      effective K8STON_NAMESPACES, "" = do not render
  restartEnabled:  effective boolean driving BOTH the runtime env flag and the
                   apps RBAC rule
  accessConfigMap: effective K8STON_ACCESS_CONFIGMAP, "" = do not render
  rbacCreate:      effective boolean driving RBAC rendering
  rbacScope:       validated rbac.scope ("namespace" or "cluster")
*/}}
{{- define "k8ston.effectiveConfig" -}}
{{- $global := .Values.global | default dict -}}
{{- $env := merge (deepCopy (.Values.env | default dict)) ($global.env | default dict) -}}
{{- $managed := include "k8ston.managedEnvKeys" . | fromYamlArray -}}
{{- /* Effective booleans (tolerate --set-string "true"/"false"). */ -}}
{{- $rbac := .Values.rbac | default dict -}}
{{- $rbacCreate := true -}}
{{- if hasKey $rbac "create" -}}
{{- $rbacCreate = eq (include "k8ston.parseBool" (dict "value" (get $rbac "create") "fallback" true)) "true" -}}
{{- end -}}
{{- $restartFlag := false -}}
{{- if hasKey .Values "restartEnabled" -}}
{{- $restartFlag = eq (include "k8ston.parseBool" (dict "value" .Values.restartEnabled "fallback" false)) "true" -}}
{{- end -}}
{{- $access := .Values.accessConfig | default dict -}}
{{- $accessEnabled := false -}}
{{- if hasKey $access "enabled" -}}
{{- $accessEnabled = eq (include "k8ston.parseBool" (dict "value" (get $access "enabled") "fallback" false)) "true" -}}
{{- end -}}
{{- /* extraEnv entries render after env and would shadow the derived values. */ -}}
{{- range $i, $entry := (.Values.extraEnv | default list) -}}
{{- $entryName := "" -}}
{{- if kindIs "map" $entry -}}
{{- $entryName = get $entry "name" | toString -}}
{{- end -}}
{{- if has $entryName $managed -}}
{{- fail (printf "k8ston: extraEnv[%d].name %q is managed by the chart (derived from rbac.scope/rbac.extraNamespaces, restartEnabled, and accessConfig); remove it from extraEnv and either drop the override to use the derived default or set the same effective value in env (local env wins over global.env)" $i $entryName) -}}
{{- end -}}
{{- end -}}
{{- /* Explicit managed values from the merged env (local wins over global). */ -}}
{{- $expScope := "" -}}
{{- if hasKey $env "K8STON_SCOPE" -}}
{{- $expScope = get $env "K8STON_SCOPE" | toString | lower -}}
{{- end -}}
{{- $expNamespaces := "" -}}
{{- if hasKey $env "K8STON_NAMESPACES" -}}
{{- $expNamespaces = get $env "K8STON_NAMESPACES" | toString -}}
{{- end -}}
{{- $hasRestart := false -}}
{{- $expRestart := "" -}}
{{- if hasKey $env "K8STON_RESTART_ENABLED" -}}
{{- $hasRestart = true -}}
{{- $expRestart = get $env "K8STON_RESTART_ENABLED" | toString -}}
{{- end -}}
{{- $expAccess := "" -}}
{{- if hasKey $env "K8STON_ACCESS_CONFIGMAP" -}}
{{- $expAccess = get $env "K8STON_ACCESS_CONFIGMAP" | toString -}}
{{- end -}}
{{- $scope := "namespace" -}}
{{- if hasKey $rbac "scope" -}}
{{- $scope = get $rbac "scope" | toString | lower -}}
{{- end -}}
{{- $extras := list -}}
{{- if hasKey $rbac "extraNamespaces" -}}
{{- $extras = get $rbac "extraNamespaces" | default list -}}
{{- end -}}
{{- $effScope := "" -}}
{{- $effNamespaces := "" -}}
{{- if $rbacCreate -}}
{{- if and (ne $scope "namespace") (ne $scope "cluster") -}}
{{- fail (printf "k8ston: rbac.scope must be \"namespace\" or \"cluster\" (got %q)" (get $rbac "scope" | toString)) -}}
{{- end -}}
{{- if not (kindIs "slice" $extras) -}}
{{- fail "k8ston: rbac.extraNamespaces must be a list of namespace names (e.g. extraNamespaces: [team-a, team-b])" -}}
{{- end -}}
{{- range $e := $extras -}}
{{- $es := $e | toString -}}
{{- if eq ($es | trim) "" -}}
{{- fail "k8ston: rbac.extraNamespaces entries must be non-empty namespace names; remove the blank entry" -}}
{{- end -}}
{{- if ne $es ($es | trim) -}}
{{- fail (printf "k8ston: rbac.extraNamespaces entry %q has leading/trailing whitespace; namespace names cannot contain spaces" $es) -}}
{{- end -}}
{{- if contains "," $es -}}
{{- fail (printf "k8ston: rbac.extraNamespaces entry %q contains a comma, which would corrupt the derived K8STON_NAMESPACES allowlist; use separate list entries" $es) -}}
{{- end -}}
{{- end -}}
{{- $hasExtras := gt (len $extras) 0 -}}
{{- if eq $scope "cluster" -}}
{{- if $hasExtras -}}
{{- fail "k8ston: rbac.extraNamespaces is only used with rbac.scope=namespace; for rbac.scope=cluster, remove extraNamespaces and optionally narrow the dashboard with K8STON_NAMESPACES in env" -}}
{{- end -}}
{{- $effScope = "cluster" -}}
{{- if hasKey $env "K8STON_SCOPE" -}}
{{- if ne $expScope "cluster" -}}
{{- fail (printf "k8ston: env K8STON_SCOPE=%q contradicts rbac.scope=cluster; remove the env override to use the derived default or set it to \"cluster\"" (get $env "K8STON_SCOPE" | toString)) -}}
{{- end -}}
{{- end -}}
{{- if ne ($expNamespaces | trim) "" -}}
{{- $effNamespaces = $expNamespaces -}}
{{- end -}}
{{- else if $hasExtras -}}
{{- /* Curated multi-namespace access: runtime cluster scope with a bounded allowlist, served by namespaced Roles only (no ClusterRole). */ -}}
{{- $effScope = "cluster" -}}
{{- if hasKey $env "K8STON_SCOPE" -}}
{{- if ne $expScope "cluster" -}}
{{- fail "k8ston: rbac.extraNamespaces renders curated multi-namespace access: the effective runtime scope is K8STON_SCOPE=cluster with a chart-derived K8STON_NAMESPACES allowlist (release namespace plus rbac.extraNamespaces), served by namespaced Roles only (no ClusterRole). Remove the K8STON_SCOPE env override to use the derived default, set it to \"cluster\", or remove rbac.extraNamespaces to stay single-namespace" -}}
{{- end -}}
{{- end -}}
{{- if ne ($expNamespaces | trim) "" -}}
{{- fail "k8ston: K8STON_NAMESPACES in env contradicts rbac.extraNamespaces; the chart derives the allowlist from the release namespace plus rbac.extraNamespaces. Remove K8STON_NAMESPACES from env, or remove rbac.extraNamespaces and use rbac.scope=cluster with an explicit K8STON_NAMESPACES allowlist" -}}
{{- end -}}
{{- $nsList := list .Release.Namespace -}}
{{- range $e := $extras -}}
{{- $es := $e | toString -}}
{{- if not (has $es $nsList) -}}
{{- $nsList = append $nsList $es -}}
{{- end -}}
{{- end -}}
{{- $effNamespaces = join "," $nsList -}}
{{- else -}}
{{- $effScope = "namespace" -}}
{{- if hasKey $env "K8STON_SCOPE" -}}
{{- if ne $expScope "namespace" -}}
{{- fail (printf "k8ston: env K8STON_SCOPE=%q contradicts rbac.scope=namespace; remove the env override to use the derived default or set it to \"namespace\" (use rbac.extraNamespaces for curated namespaces or rbac.scope=cluster for a centralized dashboard)" (get $env "K8STON_SCOPE" | toString)) -}}
{{- end -}}
{{- end -}}
{{- if ne ($expNamespaces | trim) "" -}}
{{- fail "k8ston: K8STON_NAMESPACES in env is ignored by the namespace runtime scope; remove it, move the namespaces to rbac.extraNamespaces (curated access with namespaced Roles only), or switch to rbac.scope=cluster with an explicit K8STON_NAMESPACES allowlist" -}}
{{- end -}}
{{- end -}}
{{- else -}}
{{- /* Externally managed RBAC: rbac.scope/extraNamespaces render nothing, so they must not constrain env; pass env through. */ -}}
{{- if hasKey $env "K8STON_SCOPE" -}}
{{- if and (ne $expScope "namespace") (ne $expScope "cluster") -}}
{{- fail (printf "k8ston: env K8STON_SCOPE=%q is not a valid scope (the runtime treats any value other than \"cluster\" as \"namespace\"); set it to \"namespace\" or \"cluster\" to match your externally managed RBAC" (get $env "K8STON_SCOPE" | toString)) -}}
{{- end -}}
{{- $effScope = $expScope -}}
{{- end -}}
{{- if ne ($expNamespaces | trim) "" -}}
{{- $effNamespaces = $expNamespaces -}}
{{- end -}}
{{- end -}}
{{- /* One effective restart value drives BOTH the runtime flag and the apps RBAC rule. */ -}}
{{- if $hasRestart -}}
{{- $expRestartBool := eq (include "k8ston.parseBool" (dict "value" $expRestart "fallback" false)) "true" -}}
{{- if ne $expRestartBool $restartFlag -}}
{{- fail (printf "k8ston: env K8STON_RESTART_ENABLED=%q contradicts restartEnabled=%s; the runtime flag and the apps RBAC rule are derived from the same effective value. Set both to the same value (with rbac.create=false, grant the apps permissions out-of-band to match)" $expRestart ($restartFlag | toString)) -}}
{{- end -}}
{{- end -}}
{{- /* Enabled access ConfigMap name must match the runtime policy reader. */ -}}
{{- $effAccess := "" -}}
{{- if $accessEnabled -}}
{{- $accessName := "k8ston-access" -}}
{{- if hasKey $access "name" -}}
{{- $accessName = get $access "name" | toString -}}
{{- end -}}
{{- if eq ($accessName | trim) "" -}}
{{- fail "k8ston: accessConfig.name must be a non-empty ConfigMap name when accessConfig.enabled=true" -}}
{{- end -}}
{{- $accessKey := "access.json" -}}
{{- if hasKey $access "key" -}}
{{- $accessKey = get $access "key" | toString -}}
{{- end -}}
{{- if ne $accessKey "access.json" -}}
{{- fail (printf "k8ston: accessConfig.key must be \"access.json\" (got %q); the runtime policy reader hardcodes that key (see app/lib/authz.ts)" $accessKey) -}}
{{- end -}}
{{- $effAccess = $accessName -}}
{{- if hasKey $env "K8STON_ACCESS_CONFIGMAP" -}}
{{- if ne $expAccess $accessName -}}
{{- fail (printf "k8ston: env K8STON_ACCESS_CONFIGMAP=%q contradicts accessConfig.name=%q; remove the env override to use the derived default or set it to the same name" $expAccess $accessName) -}}
{{- end -}}
{{- end -}}
{{- else -}}
{{- if ne ($expAccess | trim) "" -}}
{{- $effAccess = $expAccess -}}
{{- end -}}
{{- end -}}
{{- $out := dict "env" $env "scope" $effScope "namespaces" $effNamespaces "restartEnabled" $restartFlag "accessConfigMap" $effAccess "rbacCreate" $rbacCreate "rbacScope" $scope -}}
{{- $out | toYaml -}}
{{- end }}
