# DemandPortal — Azure AKS with Helm

Self-Service Infrastructure Demand Portal deployed on Azure Kubernetes Service using Helm charts.

## Architecture

```
GitHub Push → GitHub Actions CI/CD (OIDC — no secrets needed)
    → Test → Security Scan → Helm Lint
    → Build Docker Images → Push to ACR
    → Helm upgrade --install → AKS
        ├── System Node Pool (Standard_D2s_v3)
        └── App Node Pool (Standard_D4s_v3 x2)
            ├── React Frontend (2 replicas, HPA 2-6)
            ├── FastAPI Backend (2 replicas, HPA 2-10)
            ├── PostgreSQL (1 replica + PVC managed-csi)
            ├── NGINX Ingress + TLS (cert-manager)
            ├── Network Policies
            └── RBAC
```

## Helm Chart Structure

```
helm/demandportal/
├── Chart.yaml
├── values.yaml          # Default values
├── values-prod.yaml     # Production overrides
└── templates/
    ├── _helpers.tpl     # Template helpers
    ├── namespace.yaml   # Namespace + ResourceQuota + LimitRange
    ├── configmap.yaml   # ConfigMap
    ├── secret.yaml      # Secrets
    ├── rbac.yaml        # ServiceAccount + Role + RoleBinding
    ├── ingress.yaml     # Ingress + ClusterIssuer (cert-manager)
    ├── network-policy.yaml
    ├── postgres/
    │   └── postgres.yaml  # Deployment + Service + PVC
    ├── backend/
    │   └── backend.yaml   # Deployment + Service + HPA
    └── frontend/
        └── frontend.yaml  # Deployment + Service + HPA
```

---

## Step-by-Step Deployment

### Prerequisites
- Azure CLI installed and logged in (`az login`)
- Terraform >= 1.5.0
- GitHub repo created

---

### Step 1 — Terraform: Provision AKS + ACR

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars:
# - Set github_repo = "YOUR_USERNAME/demandportal-aks"
nano terraform.tfvars

terraform init
terraform plan
terraform apply
```

Note the outputs — you need these for GitHub secrets:
```
github_actions_client_id  → AZURE_CLIENT_ID
azure_tenant_id           → AZURE_TENANT_ID
azure_subscription_id     → AZURE_SUBSCRIPTION_ID
acr_login_server          → ACR_LOGIN_SERVER
acr_name                  → ACR_NAME
aks_cluster_name          → AKS_CLUSTER_NAME
resource_group_name       → RESOURCE_GROUP
```

---

### Step 2 — Configure GitHub Secrets

```
GitHub repo → Settings → Secrets and variables → Actions
```

Add these secrets:

| Secret | Value |
|---|---|
| `AZURE_CLIENT_ID` | From terraform output |
| `AZURE_TENANT_ID` | From terraform output |
| `AZURE_SUBSCRIPTION_ID` | From terraform output |
| `ACR_LOGIN_SERVER` | From terraform output |
| `ACR_NAME` | From terraform output |
| `AKS_CLUSTER_NAME` | From terraform output |
| `RESOURCE_GROUP` | From terraform output |
| `POSTGRES_PASSWORD` | Strong password e.g. `MyPass123!` |
| `APP_SECRET_KEY` | Random string e.g. `openssl rand -hex 32` |
| `CERT_EMAIL` | Your email for Let's Encrypt |
| `TEST_DB_USER` | `test_user` |
| `TEST_DB_PASSWORD` | `test_pass` |

---

### Step 3 — Push to Deploy

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

Pipeline runs automatically:
```
Test → Security Scan → Helm Lint → Build → Push ACR → Deploy AKS
```

---

### Step 4 — Access the Application

```bash
# Get AKS credentials
az aks get-credentials --resource-group demandportal-rg --name demandportal-aks

# Get Load Balancer IP
kubectl get svc -n ingress-nginx ingress-nginx-controller

# Access app
http://<EXTERNAL-IP>
```

---

## Helm Commands

```bash
# Install
helm upgrade --install demandportal ./helm/demandportal \
  --namespace demandportal --create-namespace \
  --set secrets.postgresPassword=yourpass \
  --set secrets.appSecretKey=yoursecret

# Check status
helm status demandportal -n demandportal
helm list -n demandportal

# Upgrade
helm upgrade demandportal ./helm/demandportal -n demandportal

# Rollback
helm rollback demandportal -n demandportal
helm rollback demandportal 1 -n demandportal  # rollback to revision 1

# Uninstall
helm uninstall demandportal -n demandportal

# Dry run (test without applying)
helm upgrade --install demandportal ./helm/demandportal \
  --dry-run --debug \
  --set secrets.postgresPassword=test \
  --set secrets.appSecretKey=test

# Lint
helm lint ./helm/demandportal \
  --set secrets.postgresPassword=test \
  --set secrets.appSecretKey=test

# Template (render and view)
helm template demandportal ./helm/demandportal \
  --set secrets.postgresPassword=test \
  --set secrets.appSecretKey=test
```

---

## kubectl Commands

```bash
# Cluster
kubectl get nodes
kubectl top nodes

# Pods
kubectl get pods -n demandportal
kubectl logs -f deployment/demandportal-backend -n demandportal
kubectl exec -it <pod-name> -n demandportal -- /bin/sh

# Scaling
kubectl get hpa -n demandportal
kubectl top pods -n demandportal

# Services
kubectl get svc -n demandportal
kubectl get ingress -n demandportal

# Network policies
kubectl get networkpolicy -n demandportal

# RBAC
kubectl get serviceaccounts -n demandportal
kubectl get rolebindings -n demandportal
```

---

## GitHub Secrets Required

| Secret | Description |
|---|---|
| `AZURE_CLIENT_ID` | Managed identity client ID (from Terraform) |
| `AZURE_TENANT_ID` | Azure tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `ACR_LOGIN_SERVER` | ACR login server URL |
| `ACR_NAME` | ACR name |
| `AKS_CLUSTER_NAME` | AKS cluster name |
| `RESOURCE_GROUP` | Resource group name |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `APP_SECRET_KEY` | Application secret key |
| `CERT_EMAIL` | Email for Let's Encrypt |
| `TEST_DB_USER` | Test database user |
| `TEST_DB_PASSWORD` | Test database password |

---

## Local Development

```bash
docker-compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API docs: http://localhost:8000/docs
```
