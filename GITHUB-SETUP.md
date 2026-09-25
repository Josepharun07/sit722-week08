# HD Project — From Scratch Setup Guide

Complete these steps in order after wiping Azure / starting fresh.

---

## Architecture (Continuous Delivery)

```
Push to main
  └─ 01 CI                  build + test + push images to ACR
      └─ 02 Staging         deploy staging
          └─ 03 Staging Test
              └─ 04 Production (Blue)     live baseline
                  └─ 05 Monitoring        Prometheus + Grafana
                      └─ 06 Deploy Green  new version (NOT live yet)
                          └─ 07 k6 + Flip  quality gate → release to Green
                              └─ 08 Rollback  auto if 07 fails / manual anytime
```

| Workflow | Does | Does NOT |
|---|---|---|
| **06** | Deploy Green pods with new images | Flip traffic, run k6 |
| **07** | k6 gate + flip to Green + auto-rollback on fail | Deploy Green pods |
| **08** | Force traffic back to Blue, scale Green to 0 | Deploy anything new |

---

## 0. What you have now

- AKS `ajaksweek10` in `koalatech-Week10-rg` is **Stopped**
- ACR was deleted — must be recreated
- Repo code + workflows are ready

---

## 1. Fix Terraform names (match Week 10)

Edit `terraform/terraform.tfvars`:

```hcl
location            = "Australia East"
resource_group_name = "koalatech-Week10-rg"
acr_name            = "ajacrweek10"
storage_account_name = "ajstorageweek10"
aks_cluster_name    = "ajaksweek10"
aks_dns_prefix      = "koalatech"
aks_node_count      = 3
aks_node_vm_size    = "Standard_D2s_v3"
environment         = "development"
```

Then from `terraform/`:

```powershell
terraform init
terraform plan
terraform apply
```

Type `yes`. Expect ~10–15 minutes for AKS if it needs recreate.

**Or** if AKS already exists but is stopped:

```powershell
az aks start --resource-group koalatech-Week10-rg --name ajaksweek10
az aks get-credentials --resource-group koalatech-Week10-rg --name ajaksweek10 --overwrite-existing
az aks update --resource-group koalatech-Week10-rg --name ajaksweek10 --attach-acr ajacrweek10
```

---

## 2. After terraform apply — capture outputs

```powershell
cd terraform
terraform output
terraform output -raw storage_connection_string
```

Save the storage connection string for GitHub secrets.

---

## 3. GitHub repository secrets

**Settings → Secrets and variables → Actions → Secrets**

| Secret | Value |
|---|---|
| `AZURE_CREDENTIALS` | Service principal JSON |
| `GMAIL_USERNAME` | your Gmail |
| `GMAIL_APP_PASSWORD` | 16-char Google App Password |
| `NOTIFICATION_EMAIL` | where emails go |
| `GRAFANA_ADMIN_PASSWORD` | e.g. `KoalaAdmin123!` |

### Create / refresh Azure credentials if needed

```powershell
az ad sp create-for-rbac `
  --name "koalatech-github-actions" `
  --role contributor `
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/koalatech-Week10-rg `
  --sdk-auth
```

Paste the JSON as `AZURE_CREDENTIALS`.

---

## 4. GitHub repository variables

**Settings → Secrets and variables → Actions → Variables**

| Variable | Value |
|---|---|
| `ACR_NAME` | `ajacrweek10` |
| `ACR_LOGIN_SERVER` | `ajacrweek10.azurecr.io` |
| `AKS_RESOURCE_GROUP` | `koalatech-Week10-rg` |
| `AKS_CLUSTER_NAME` | `ajaksweek10` |

---

## 5. GitHub Environments

Create **staging** and **production**.

### Both environments — secrets

| Name | Example |
|---|---|
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `postgres` |
| `JWT_SECRET_KEY` | `koalatech-local-development-secret` |
| `DEFAULT_ADMIN_USERNAME` | `admin` |
| `DEFAULT_ADMIN_EMAIL` | `admin@koalatech.edu.au` |
| `DEFAULT_ADMIN_PASSWORD` | `AdminPassword123!` |
| `AZURE_STORAGE_CONNECTION_STRING` | from terraform output |

### production — also add

| Name | Value |
|---|---|
| `GMAIL_USERNAME` | same as repo |
| `GMAIL_APP_PASSWORD` | same as repo |
| `NOTIFICATION_EMAIL` | same as repo |
| `GRAFANA_ADMIN_PASSWORD` | same as repo |

**For fully automatic CD:** do **NOT** enable “Required reviewers” on staging/production (or every job waits for you).

---

## 6. First run

```powershell
# Confirm cluster
az aks get-credentials -g koalatech-Week10-rg -n ajaksweek10 --overwrite-existing
kubectl get nodes

# Push code (triggers full chain)
git add -A
git commit -m "HD: from-scratch CD pipeline with split 06/07/08"
git push origin main
```

Watch **Actions**: `01 → 02 → 03 → 04 → 05 → 06 → 07` (08 only if 07 fails).

---

## 7. Verify

```powershell
kubectl get pods -n staging
kubectl get pods -n production
kubectl get pods -n monitoring
kubectl get svc frontend -n staging
kubectl get svc frontend -n production
kubectl get svc grafana -n monitoring
```

Grafana login: `admin` / your `GRAFANA_ADMIN_PASSWORD`.

---

## 8. Demo tips

1. Show Actions green chain after push
2. Open Grafana Blue/Green dashboard during 07 flip
3. Optionally break Green (bad image) and show **auto-rollback** email + Blue still live
4. Show manual **08** as emergency rollback
