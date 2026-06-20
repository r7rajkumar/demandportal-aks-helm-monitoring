output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "aks_cluster_name" {
  value = azurerm_kubernetes_cluster.main.name
}

output "acr_login_server" {
  value = azurerm_container_registry.main.login_server
}

output "acr_name" {
  value = azurerm_container_registry.main.name
}

output "github_actions_client_id" {
  description = "Use this as AZURE_CLIENT_ID in GitHub secrets"
  value       = azurerm_user_assigned_identity.github_actions.client_id
}

output "azure_tenant_id" {
  description = "Use this as AZURE_TENANT_ID in GitHub secrets"
  value       = data.azurerm_client_config.current.tenant_id
}

output "azure_subscription_id" {
  description = "Use this as AZURE_SUBSCRIPTION_ID in GitHub secrets"
  value       = data.azurerm_client_config.current.subscription_id
}

output "get_credentials_command" {
  value = "az aks get-credentials --resource-group ${azurerm_resource_group.main.name} --name ${azurerm_kubernetes_cluster.main.name}"
}

output "github_secrets_to_set" {
  description = "Copy these values into GitHub Actions secrets"
  value = <<-EOT
    AZURE_CLIENT_ID       = ${azurerm_user_assigned_identity.github_actions.client_id}
    AZURE_TENANT_ID       = ${data.azurerm_client_config.current.tenant_id}
    AZURE_SUBSCRIPTION_ID = ${data.azurerm_client_config.current.subscription_id}
    ACR_LOGIN_SERVER      = ${azurerm_container_registry.main.login_server}
    ACR_NAME              = ${azurerm_container_registry.main.name}
    AKS_CLUSTER_NAME      = ${azurerm_kubernetes_cluster.main.name}
    RESOURCE_GROUP        = ${azurerm_resource_group.main.name}
  EOT
}
