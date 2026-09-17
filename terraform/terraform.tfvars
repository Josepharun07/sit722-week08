location            = "Australia East"
resource_group_name = "koalatech-week08-rg"

# Replace with a unique name for your Azure Container Registry 
acr_name             = "ajacrweek8"

# Replace with a unique name for your Azure Storage Account
storage_account_name = "ajstorageweek8"

# Replace with a unique name for your Azure Kubernetes Service cluster
aks_cluster_name = "ajaksweek8"
aks_dns_prefix   = "koalatech"

aks_node_count   = 3
aks_node_vm_size = "Standard_D2s_v3"

environment = "development"

tags = {
    Project    = "KoalaTech Course Platform"
    ManagedBy  = "Terraform"
    Practical  = "week08"
    Environment = "Development"
}