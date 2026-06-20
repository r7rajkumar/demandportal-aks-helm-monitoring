{{/*
Full image name for backend
*/}}
{{- define "demandportal.backendImage" -}}
{{- if .Values.image.registry -}}
{{ .Values.image.registry }}/{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}
{{- else -}}
{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}
{{- end -}}
{{- end }}

{{/*
Full image name for frontend
*/}}
{{- define "demandportal.frontendImage" -}}
{{- if .Values.image.registry -}}
{{ .Values.image.registry }}/{{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}
{{- else -}}
{{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}
{{- end -}}
{{- end }}

{{/*
Database URL
*/}}
{{- define "demandportal.databaseUrl" -}}
postgresql://{{ .Values.postgres.user }}:{{ .Values.secrets.postgresPassword }}@{{ .Values.postgres.name }}-svc:{{ .Values.postgres.port }}/{{ .Values.postgres.database }}
{{- end }}
