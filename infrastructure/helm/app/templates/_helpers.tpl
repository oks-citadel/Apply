{{/*
Expand the name of the chart.
*/}}
{{- define "applyforus.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "applyforus.fullname" -}}
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
{{- define "applyforus.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "applyforus.labels" -}}
helm.sh/chart: {{ include "applyforus.chart" . }}
{{ include "applyforus.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: applyforus
{{- end }}

{{/*
Selector labels
*/}}
{{- define "applyforus.selectorLabels" -}}
app.kubernetes.io/name: {{ include "applyforus.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "applyforus.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "applyforus.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Common pod security context
*/}}
{{- define "applyforus.podSecurityContext" -}}
runAsNonRoot: {{ .Values.global.podSecurityContext.runAsNonRoot }}
runAsUser: {{ .Values.global.podSecurityContext.runAsUser }}
runAsGroup: {{ .Values.global.podSecurityContext.runAsGroup }}
fsGroup: {{ .Values.global.podSecurityContext.fsGroup }}
seccompProfile:
  type: {{ .Values.global.podSecurityContext.seccompProfile.type }}
{{- end }}

{{/*
Common container security context
*/}}
{{- define "applyforus.containerSecurityContext" -}}
allowPrivilegeEscalation: {{ .Values.global.containerSecurityContext.allowPrivilegeEscalation }}
readOnlyRootFilesystem: {{ .Values.global.containerSecurityContext.readOnlyRootFilesystem }}
runAsNonRoot: {{ .Values.global.containerSecurityContext.runAsNonRoot }}
runAsUser: {{ .Values.global.containerSecurityContext.runAsUser }}
capabilities:
  drop:
    {{- range .Values.global.containerSecurityContext.capabilities.drop }}
    - {{ . }}
    {{- end }}
{{- end }}

{{/*
Create image name
*/}}
{{- define "applyforus.image" -}}
{{- $registry := .Values.global.imageRegistry -}}
{{- $repository := .image.repository -}}
{{- $tag := .image.tag | default "latest" -}}
{{- printf "%s/%s:%s" $registry $repository $tag -}}
{{- end }}

{{/*
Service labels for a specific service
*/}}
{{- define "applyforus.serviceLabels" -}}
app.kubernetes.io/name: {{ .serviceName }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: {{ .serviceName }}
app.kubernetes.io/part-of: applyforus
{{- end }}
