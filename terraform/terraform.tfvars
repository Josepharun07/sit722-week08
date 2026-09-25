location            = "Australia East"
resource_group_name = "koalatech-Week10-rg"

# Globally unique names — keep these if resources already exist in Azure
acr_name             = "ajacrweek10"
storage_account_name = "ajstorageweek10"

aks_cluster_name = "ajaksweek10"
aks_dns_prefix   = "koalatech"

aks_node_count   = 3
aks_node_vm_size = "Standard_D2s_v3"

environment = "development"

tags = {
    Project     = "KoalaTech Course Platform"
    ManagedBy   = "Terraform"
    Practical   = "Week10"
    Environment = "development"
}
