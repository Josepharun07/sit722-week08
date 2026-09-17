# 1. Automate the Connection String into the local .env files
resource "local_file" "student_env" {
  content  = "AZURE_STORAGE_CONNECTION_STRING=\"${azurerm_storage_account.storage_account.primary_connection_string}\""
  filename = "${path.module}/../student-service/.env"
}

resource "local_file" "lecturer_env" {
  content  = "AZURE_STORAGE_CONNECTION_STRING=\"${azurerm_storage_account.storage_account.primary_connection_string}\""
  filename = "${path.module}/../lecturer-service/.env"
}

# 2. Automate the Connection String into the Kubernetes Secret
resource "local_file" "k8s_secret" {
  content = templatefile("${path.module}/../templates/07-application-secret.yaml.tpl", {
    storage_connection_string = azurerm_storage_account.storage_account.primary_connection_string
  })
  filename = "${path.module}/../kubernetes/07-application-secret.yaml"
}

# 3. Automate the ACR URLs into the Kubernetes Deployments
resource "local_file" "k8s_deployments" {
  for_each = toset([
    "08-user-service.yaml",
    "09-student-service.yaml",
    "10-lecturer-service.yaml",
    "11-course-service.yaml",
    "12-enrollment-service.yaml",
    "13-frontend.yaml"
  ])
  
  content = templatefile("${path.module}/../templates/${each.key}.tpl", {
    acr_server = azurerm_container_registry.acr.login_server
  })
  filename = "${path.module}/../kubernetes/${each.key}"
}

# 4. Automate the Docker Build & Kubernetes Deployment
resource "null_resource" "deploy_application" {
  # Wait for everything else to finish first
  depends_on = [
    azurerm_kubernetes_cluster.aks,
    azurerm_container_registry.acr,
    azurerm_role_assignment.acr_pull,
    local_file.k8s_secret,
    local_file.k8s_deployments
  ]

  # Run the Docker and Kubectl commands automatically
  provisioner "local-exec" {
    interpreter = ["PowerShell", "-Command"]
    working_dir = "${path.module}/../"
    command = <<-EOT
      Write-Host ">>> Logging into ACR..."
      az acr login --name ${azurerm_container_registry.acr.name}

      Write-Host ">>> Building and Pushing Docker Images..."
      $acr_url = "${azurerm_container_registry.acr.login_server}"
      
      $services = @("user-service", "student-service", "lecturer-service", "course-service", "enrollment-service", "frontend")
      foreach ($service in $services) {
          Write-Host "Processing $service..."
          docker build -t "$acr_url/$($service):latest" "./$service"
          docker push "$acr_url/$($service):latest"
      }

      Write-Host ">>> Connecting to Kubernetes..."
      az aks get-credentials --resource-group ${azurerm_resource_group.rg.name} --name ${azurerm_kubernetes_cluster.aks.name} --overwrite-existing

      Write-Host ">>> Applying Configurations..."
      kubectl apply -f ./kubernetes
    EOT
  }
}