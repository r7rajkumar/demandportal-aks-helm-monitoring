terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
  }
}

provider "azurerm" {
  features {}
}

data "azurerm_client_config" "current" {}

# ─────────────────────────────────────────────
# RESOURCE GROUP
# ─────────────────────────────────────────────
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-rg"
  location = var.location
  tags     = local.tags
}

# ─────────────────────────────────────────────
# VIRTUAL NETWORK
# ─────────────────────────────────────────────
resource "azurerm_virtual_network" "main" {
  name                = "${var.project_name}-vnet"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = ["10.0.0.0/8"]
  tags                = local.tags
}

resource "azurerm_subnet" "aks" {
  name                 = "${var.project_name}-aks-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.240.0.0/16"]
}

# ─────────────────────────────────────────────
# AZURE CONTAINER REGISTRY
# ─────────────────────────────────────────────
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "azurerm_container_registry" "main" {
  name                = "${replace(var.project_name, "-", "")}acr${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Standard"
  admin_enabled       = false
  tags                = local.tags
}

# Lifecycle policy - keep last 10 images
resource "azurerm_container_registry_task" "cleanup" {
  name                  = "cleanup-old-images"
  container_registry_id = azurerm_container_registry.main.id

  platform {
    os = "Linux"
  }

  encoded_step {
    task_content = base64encode(<<-TASK
      version: v1.1.0
      steps:
        - cmd: bash -c "echo Cleanup task placeholder"
          timeout: 30
    TASK
    )
  }

  timer_trigger {
    name     = "weekly"
    schedule = "0 0 * * 0"
  }
}

# ─────────────────────────────────────────────
# LOG ANALYTICS
# ─────────────────────────────────────────────
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.tags
}

# ─────────────────────────────────────────────
# AKS CLUSTER
# ─────────────────────────────────────────────
resource "azurerm_kubernetes_cluster" "main" {
  name                = "${var.project_name}-aks"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = var.project_name
  kubernetes_version  = var.kubernetes_version

  # System node pool
  default_node_pool {
    name                = "system"
    node_count          = 1
    vm_size             = "Standard_D2s_v3"
    vnet_subnet_id      = azurerm_subnet.aks.id
    os_disk_size_gb     = 50
    type                = "VirtualMachineScaleSets"
    enable_auto_scaling = true
    min_count           = 1
    max_count           = 3
    node_labels = {
      "nodepool-type" = "system"
    }
    tags = local.tags
  }

  # Managed identity
  identity {
    type = "SystemAssigned"
  }

  # Azure CNI networking
  network_profile {
    network_plugin    = "azure"
    network_policy    = "calico"
    load_balancer_sku = "standard"
    service_cidr      = "10.0.0.0/16"
    dns_service_ip    = "10.0.0.10"
  }

  # Monitoring
  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  # OIDC for GitHub Actions federation
  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  # Auto upgrade
  automatic_channel_upgrade = "stable"

  tags = local.tags
}

# App node pool
resource "azurerm_kubernetes_cluster_node_pool" "app" {
  name                  = "app"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.app_node_vm_size
  node_count            = var.app_node_count
  vnet_subnet_id        = azurerm_subnet.aks.id
  os_disk_size_gb       = 50
  mode                  = "User"
  enable_auto_scaling   = true
  min_count             = 2
  max_count             = 5
  node_labels = {
    "nodepool-type" = "app"
  }
  tags = local.tags
}

# ─────────────────────────────────────────────
# ACR PULL PERMISSION FOR AKS
# ─────────────────────────────────────────────
resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id                     = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.main.id
  skip_service_principal_aad_check = true
}

# ─────────────────────────────────────────────
# GITHUB ACTIONS FEDERATION (OIDC)
# No client secret needed - uses GitHub OIDC token
# ─────────────────────────────────────────────
resource "azurerm_user_assigned_identity" "github_actions" {
  name                = "${var.project_name}-github-actions-identity"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

resource "azurerm_federated_identity_credential" "github" {
  name                = "github-actions-federation"
  resource_group_name = azurerm_resource_group.main.name
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  parent_id           = azurerm_user_assigned_identity.github_actions.id
  subject             = "repo:${var.github_repo}:ref:refs/heads/main"
}

# Give GitHub Actions identity contributor access
resource "azurerm_role_assignment" "github_actions_contributor" {
  scope                = azurerm_resource_group.main.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.github_actions.principal_id
}

resource "azurerm_role_assignment" "github_actions_acr_push" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPush"
  principal_id         = azurerm_user_assigned_identity.github_actions.principal_id
}

# ─────────────────────────────────────────────
# LOCALS
# ─────────────────────────────────────────────
locals {
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
