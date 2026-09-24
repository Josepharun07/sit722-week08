/**
 * KoalaTech Blue/Green Validation — k6 Load Test
 * SLA gates: P95 < 500ms, error rate < 1%
 *
 * Local:     k6 run -e SERVICE_URL=http://<ip>:8000 load-test.js
 * In-cluster: k6 run --out experimental-prometheus-rw
 *               -e K6_PROMETHEUS_RW_SERVER_URL=http://pushgateway:9091/metrics/job/k6
 *               -e SERVICE_URL=http://user-service.production-green.svc.cluster.local:8000
 *               load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const healthCheckErrors = new Rate('k6_health_check_errors');
const serviceLatency    = new Trend('k6_service_latency_ms', true);

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '60s', target: 20 },
    { duration: '30s', target: 0  },
  ],
  thresholds: {
    http_req_duration:    ['p(95)<500'],
    http_req_failed:      ['rate<0.01'],
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

  group('api endpoints', () => {
    const res = http.get(`${base}/students`, {
      headers: { 'Accept': 'application/json' },
      timeout: '10s',
    });
    check(res, {
      'students endpoint responds': (r) => r.status === 200 || r.status === 401,
      'response time < 500ms':      (r) => r.timings.duration < 500,
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
