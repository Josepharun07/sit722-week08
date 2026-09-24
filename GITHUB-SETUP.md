# HD Project — GitHub Configuration Guide

Complete this checklist **before** pushing and running any workflow.

---

## 1. Repository Secrets

**Settings → Secrets and variables → Actions → Secrets**

| Secret name | Value |
|---|---|
| `AZURE_CREDENTIALS` | Service Principal JSON (from `az ad sp create-for-rbac`) |
| `GMAIL_USERNAME` | Your Gmail address e.g. `you@gmail.com` |
| `GMAIL_APP_PASSWORD` | Gmail App Password (see instructions below) |
| `NOTIFICATION_EMAIL` | Email address to receive all pipeline notifications |
| `GRAFANA_ADMIN_PASSWORD` | Password for Grafana dashboard e.g. `KoalaTechGrafana2025!` |

### Gmail App Password

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification → turn ON (required first)
3. Security → App passwords
4. App: **Mail**, Device: **Other** → type `KoalaTech CI` → Generate
5. Copy the 16-character password → paste as `GMAIL_APP_PASSWORD`

---

## 2. Repository Variables

**Settings → Secrets and variables → Actions → Variables**

| Variable | Value |
|---|---|
| `ACR_NAME` | `ajacrweek10` |
| `ACR_LOGIN_SERVER` | `ajacrweek10.azurecr.io` |
| `AKS_RESOURCE_GROUP` | `koalatech-Week10-rg` |
| `AKS_CLUSTER_NAME` | `ajaksweek10` |

---

## 3. GitHub Environments

**Settings → Environments → New environment**

### staging

Add Environment Secrets:

| Name | Value |
|---|---|
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `postgres` |
| `JWT_SECRET_KEY` | `koalatech-local-development-secret` |
| `DEFAULT_ADMIN_USERNAME` | `admin` |
| `DEFAULT_ADMIN_EMAIL` | `admin@koalatech.edu.au` |
| `DEFAULT_ADMIN_PASSWORD` | `AdminPassword123!` |
| `AZURE_STORAGE_CONNECTION_STRING` | from `terraform output -raw storage_connection_string` |

### production

Same secrets as staging, **plus** these additional ones:

| Name | Value |
|---|---|
| `GMAIL_USERNAME` | Same as repo secret |
| `GMAIL_APP_PASSWORD` | Same as repo secret |
| `NOTIFICATION_EMAIL` | Same as repo secret |
| `GRAFANA_ADMIN_PASSWORD` | Same as repo secret |

**Protection rules** (recommended):
- Required reviewers: add yourself
- Deployment branches: `main` only

---

## 4. Workflow Execution Order

```
Push to main
  └─► 01 - CI                       auto: test + build + push to ACR
        └─► 02 - Deploy Staging      auto: deploy to staging namespace
              └─► 03 - Test Staging  auto: smoke test
                    └─► 04 - Deploy Production  auto: deploy to production-blue
                          └─► 05 - Deploy Monitoring  auto: Prometheus + Grafana

For upgrades (Blue/Green):
  Manual: 06 - Deploy to Green      provide image_tag SHA
  Manual: 07 - Validate + Flip      provide same SHA → k6 → traffic flip
  Manual: 08 - Rollback to Blue     if needed
```

---

## 5. Post-deploy verification commands

```bash
# Confirm 3 nodes ready
kubectl get nodes

# Get Grafana external IP (after workflow 05)
kubectl get svc grafana -n monitoring

# Get production frontend IP (after workflow 04)
kubectl get svc koalatech-frontend -n production-blue

# Check Prometheus targets
kubectl port-forward svc/prometheus 9090:9090 -n monitoring
# Open http://localhost:9090/targets

# Check all pods
kubectl get pods -A
```

---

## 6. After terraform apply

```bash
cd terraform

# Get storage connection string for GitHub secrets
terraform output -raw storage_connection_string

# Get AKS credentials command
terraform output aks_get_credentials_command
```

Run the output command to connect kubectl to AKS:

```bash
az aks get-credentials --resource-group koalatech-Week10-rg --name ajaksweek10 --overwrite-existing
```
