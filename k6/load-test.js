/**
 * KoalaTech Blue/Green Validation — k6 Load Test
 * SLA gates: P95 < 500ms, error rate < 1%
 *
 * Targets the Green user-service /health endpoint (set via SERVICE_URL).
 * Written for k6 0.50 (no optional chaining / nullish coalescing).
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const healthCheckErrors = new Rate('k6_health_check_errors');
const serviceLatency = new Trend('k6_service_latency_ms', true);

export const options = {
  stages: [
    { duration: '20s', target: 5 },
    { duration: '40s', target: 15 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    k6_health_check_errors: ['rate<0.01'],
  },
};

export default function () {
  const base = __ENV.SERVICE_URL || 'http://localhost:8000';

  group('health checks', function () {
    const res = http.get(base + '/health', { timeout: '10s' });
    const ok = check(res, {
      'status is 200': function (r) { return r.status === 200; },
      'response time < 500ms': function (r) { return r.timings.duration < 500; },
      'body has healthy': function (r) { return r.body && r.body.indexOf('healthy') !== -1; },
    });
    healthCheckErrors.add(!ok);
    serviceLatency.add(res.timings.duration);
  });

  group('root endpoint', function () {
    const res = http.get(base + '/', { timeout: '10s' });
    check(res, {
      'root responds 200': function (r) { return r.status === 200; },
      'response time < 500ms': function (r) { return r.timings.duration < 500; },
    });
    serviceLatency.add(res.timings.duration);
  });

  sleep(1);
}

function metricValue(metrics, name, key) {
  if (!metrics || !metrics[name] || !metrics[name].values) {
    return null;
  }
  var values = metrics[name].values;
  if (values[key] === undefined || values[key] === null) {
    return null;
  }
  return values[key];
}

function allThresholdsPassed(thresholds) {
  if (!thresholds) {
    return true;
  }
  var keys = Object.keys(thresholds);
  for (var i = 0; i < keys.length; i++) {
    if (thresholds[keys[i]].ok === false) {
      return false;
    }
  }
  return true;
}

export function handleSummary(data) {
  var summary = {
    p95_duration_ms: metricValue(data.metrics, 'http_req_duration', 'p(95)'),
    error_rate: metricValue(data.metrics, 'http_req_failed', 'rate'),
    total_requests: metricValue(data.metrics, 'http_reqs', 'count'),
    checks_pass_rate: metricValue(data.metrics, 'checks', 'rate'),
    thresholds_passed: allThresholdsPassed(data.thresholds),
  };

  return {
    '/tmp/k6-summary.json': JSON.stringify(summary, null, 2),
  };
}
