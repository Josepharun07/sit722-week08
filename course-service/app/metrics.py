from prometheus_client import Counter, Gauge, Histogram

COURSES_CREATED_TOTAL = Counter("koalatech_courses_created_total","Total course records created")
COURSES_DELETED_TOTAL = Counter("koalatech_courses_deleted_total","Total course records deleted")
TOTAL_COURSES_GAUGE   = Gauge("koalatech_courses_total","Current total course records")
DB_QUERY_DURATION     = Histogram("koalatech_db_query_duration_seconds","DB query latency",["service","operation"],
    buckets=[0.005,0.01,0.025,0.05,0.1,0.25,0.5,1.0,2.5])
