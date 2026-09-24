/**
 * KoalaTech Blue/Green Validation — k6 Load Test
 * SLA gates: P95 < 500ms, error rate < 1%
 *
 * Targets the Green user-service /health endpoint (set via SERVICE_URL).
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const healthCheckErrors = new Rate('k6_health_check_errors');
const serviceLatency    = new Trend('k6_service_latency_ms', true);

export const options = {
  stages: [
    { duration: '20s', target: 5 },
    { duration: '40s', target: 15 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration:      ['p(95)<500'],
    http_req_failed:        ['rate<0.01'],
    k6_health_check_errors: ['rate<0.01'],
  },
};

export default function () {
  const base = __ENV.SERVICE_URL || 'http://localhost:8000';

  group('health checks', () => {
    const res = http.get(`${base}/health`, { timeout: '10s' });
    const ok = check(res, {
      'status is 200':         (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'body has healthy':      (r) => r.body && r.body.includes('healthy'),
    });
    healthCheckErrors.add(!ok);
    serviceLatency.add(res.timings.duration);
  });

  group('root endpoint', () => {
    const res = http.get(`${base}/`, { timeout: '10s' });
    check(res, {
      'root responds 200':     (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
    serviceLatency.add(res.timings.duration);
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    '/tmp/k6-summary.json': JSON.stringify({
      p95_duration_ms:   data.metrics.http_req_duration?.values?.['p(95)'] ?? null,
      error_rate:        data.metrics.http_req_failed?.values?.rate         ?? null,
      total_requests:    data.metrics.http_reqs?.values?.count              ?? null,
      checks_pass_rate:  data.metrics.checks?.values?.rate                  ?? null,
      thresholds_passed: !Object.values(data.thresholds ?? {}).some(t => t.ok === false),
    }, null, 2),
  };
}
