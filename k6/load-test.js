/**
 * KoalaTech Blue/Green Validation — k6 Load Test
 * SLA gates: P95 < 500ms, error rate < 1%
 * k6 0.50 compatible (no ?. / ??).
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const healthCheckErrors = new Rate('k6_health_check_errors');
const serviceLatency = new Trend('k6_service_latency_ms', true);

export const options = {
  stages: [
    { duration: '15s', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '15s', target: 0 },
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

  // Delimiters on their own lines — easy to extract from kubectl logs
  // (do NOT use console.log; k6 wraps it and escapes quotes)
  return {
    stdout:
      '@@@K6_SUMMARY_START@@@\n' +
      JSON.stringify(summary) +
      '\n@@@K6_SUMMARY_END@@@\n',
  };
}
