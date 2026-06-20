variable "project_name" {
  description = "Project name for all resources"
  type        = string
  default     = "demandportal"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "australiaeast"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "kubernetes_version" {
  description = "AKS Kubernetes version"
  type        = string
  default     = "1.29"
}

variable "app_node_vm_size" {
  description = "VM size for app node pool"
  type        = string
  default     = "Standard_D4s_v3"
}

variable "app_node_count" {
  description = "Initial app node count"
  type        = number
  default     = 2
}

variable "github_repo" {
  description = "GitHub repo in format owner/repo-name for OIDC federation"
  type        = string
  # Example: "rajkumar/demandportal-aks"
}
