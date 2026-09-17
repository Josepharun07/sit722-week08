apiVersion: v1
kind: Secret
metadata:
  name: koalatech-application-secret
  namespace: default
type: Opaque
stringData:
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres

  JWT_SECRET_KEY: koalatech-local-development-secret

  DEFAULT_ADMIN_USERNAME: admin
  DEFAULT_ADMIN_EMAIL: admin@koalatech.edu.au
  DEFAULT_ADMIN_PASSWORD: AdminPassword123!

  # Replace these with your real Azure connection strings.
  AZURE_STORAGE_CONNECTION_STRING: "${storage_connection_string}"