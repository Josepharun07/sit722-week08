from prometheus_client import Counter, Gauge, Histogram

USERS_CREATED_TOTAL = Counter("koalatech_users_created_total","Total user accounts created",["role"])
USERS_DELETED_TOTAL = Counter("koalatech_users_deleted_total","Total user accounts deleted")
AUTH_LOGIN_TOTAL    = Counter("koalatech_auth_login_total","Total login attempts",["result"])
ACTIVE_USERS_GAUGE  = Gauge("koalatech_active_users","Number of active user accounts")
DB_QUERY_DURATION   = Histogram("koalatech_db_query_duration_seconds","DB query latency",["service","operation"],
    buckets=[0.005,0.01,0.025,0.05,0.1,0.25,0.5,1.0,2.5])
