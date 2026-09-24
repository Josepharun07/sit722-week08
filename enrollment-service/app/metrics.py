from prometheus_client import Counter, Gauge, Histogram

ENROLLMENTS_CREATED_TOTAL      = Counter("koalatech_enrollments_created_total","Total enrollments created")
ENROLLMENTS_DELETED_TOTAL      = Counter("koalatech_enrollments_deleted_total","Total enrollments deleted")
ENROLLMENT_STATUS_CHANGES_TOTAL= Counter("koalatech_enrollment_status_changes_total","Enrollment status updates",["new_status"])
TOTAL_ENROLLMENTS_GAUGE        = Gauge("koalatech_enrollments_total","Current total enrollments")
DB_QUERY_DURATION              = Histogram("koalatech_db_query_duration_seconds","DB query latency",["service","operation"],
    buckets=[0.005,0.01,0.025,0.05,0.1,0.25,0.5,1.0,2.5])
