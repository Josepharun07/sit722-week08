from prometheus_client import Counter, Gauge, Histogram

LECTURERS_CREATED_TOTAL     = Counter("koalatech_lecturers_created_total","Total lecturer records created")
LECTURERS_DELETED_TOTAL     = Counter("koalatech_lecturers_deleted_total","Total lecturer records deleted")
PROFILE_PHOTO_UPLOADS_TOTAL = Counter("koalatech_lecturer_photo_uploads_total","Lecturer photo uploads",["result"])
TOTAL_LECTURERS_GAUGE       = Gauge("koalatech_lecturers_total","Current total lecturer records")
DB_QUERY_DURATION           = Histogram("koalatech_db_query_duration_seconds","DB query latency",["service","operation"],
    buckets=[0.005,0.01,0.025,0.05,0.1,0.25,0.5,1.0,2.5])
