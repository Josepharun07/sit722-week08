apiVersion: apps/v1
kind: Deployment
metadata:
  name: lecturer-service
  namespace: default
spec:
  replicas: 1

  selector:
    matchLabels:
      app: lecturer-service

  template:
    metadata:
      labels:
        app: lecturer-service

    spec:
      initContainers:
        - name: wait-for-lecturer-db
          image: postgres:16-alpine
          command:
            - sh
            - -c
            - |
              until pg_isready \
                -h lecturer-db \
                -p 5432 \
                -U postgres \
                -d lecturers;
              do
                echo "Waiting for lecturer database..."
                sleep 3
              done

      containers:
        - name: lecturer-service
          image: ${acr_server}/lecturer-service:latest
          imagePullPolicy: Always

          ports:
            - containerPort: 8000

          env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: koalatech-application-secret
                  key: POSTGRES_USER

            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: koalatech-application-secret
                  key: POSTGRES_PASSWORD

            - name: POSTGRES_DB
              value: lecturers

            - name: POSTGRES_HOST
              value: lecturer-db

            - name: POSTGRES_PORT
              value: "5432"

            - name: JWT_SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: koalatech-application-secret
                  key: JWT_SECRET_KEY

            - name: JWT_ALGORITHM
              value: HS256

            - name: AZURE_STORAGE_CONNECTION_STRING
              valueFrom:
                secretKeyRef:
                  name: koalatech-application-secret
                  key: AZURE_STORAGE_CONNECTION_STRING

            - name: AZURE_STORAGE_CONTAINER_NAME
              value: lecturer-profile-photos

          readinessProbe:
            tcpSocket:
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 5

          livenessProbe:
            tcpSocket:
              port: 8000
            initialDelaySeconds: 20
            periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: lecturer-service
  namespace: default
spec:
  type: ClusterIP

  selector:
    app: lecturer-service

  ports:
    - name: http
      port: 8000
      targetPort: 8000