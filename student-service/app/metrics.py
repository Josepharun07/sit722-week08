from prometheus_client import Counter, Gauge, Histogram

STUDENTS_CREATED_TOTAL      = Counter("koalatech_students_created_total","Total student records created")
STUDENTS_DELETED_TOTAL      = Counter("koalatech_students_deleted_total","Total student records deleted")
PROFILE_PHOTO_UPLOADS_TOTAL = Counter("koalatech_student_photo_uploads_total","Student photo uploads",["result"])
TOTAL_STUDENTS_GAUGE        = Gauge("koalatech_students_total","Current total student records")
DB_QUERY_DURATION           = Histogram("koalatech_db_query_duration_seconds","DB query latency",["service","operation"],
    buckets=[0.005,0.01,0.025,0.05,0.1,0.25,0.5,1.0,2.5])
