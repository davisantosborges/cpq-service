import autocannon from 'autocannon';
import { buildApp } from '../app.js';

interface EndpointConfig {
  name: string;
  method: 'GET' | 'POST';
  path: string;
  body?: object;
}

interface TestResult {
  endpoint: string;
  mode: string;
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  rps: number;
}

const endpoints: EndpointConfig[] = [
  { name: 'GET /api/health', method: 'GET', path: '/api/health' },
  { name: 'GET /api/products', method: 'GET', path: '/api/products' },
  { name: 'GET /api/products/:id', method: 'GET', path: '/api/products/cloud-server-basic' },
  {
    name: 'POST /api/configure/validate',
    method: 'POST',
    path: '/api/configure/validate',
    body: {
      productId: 'cloud-server-basic',
      selectedOptions: ['ram-16gb', 'storage-ssd-500gb'],
    },
  },
  {
    name: 'POST /api/quote',
    method: 'POST',
    path: '/api/quote',
    body: {
      configurations: [
        {
          productId: 'cloud-server-basic',
          selectedOptions: ['ram-16gb', 'backup-daily'],
          quantity: 2,
        },
      ],
      customerTier: 'enterprise',
    },
  },
];

async function runTest(
  url: string,
  endpoint: EndpointConfig,
  connections: number,
  amount?: number,
  duration?: number
): Promise<autocannon.Result> {
  const opts: autocannon.Options = {
    url: `${url}${endpoint.path}`,
    connections,
    ...(amount ? { amount } : {}),
    ...(duration ? { duration } : {}),
    method: endpoint.method,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(endpoint.body ? { body: JSON.stringify(endpoint.body) } : {}),
  };

  return new Promise((resolve, reject) => {
    const instance = autocannon(opts, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });

    // Suppress default output
    autocannon.track(instance, { renderProgressBar: false });
  });
}

function formatMs(microseconds: number): string {
  return (microseconds / 1000).toFixed(2) + 'ms';
}

function printResult(endpoint: string, mode: string, result: autocannon.Result): TestResult {
  const latency = result.latency;
  const testResult: TestResult = {
    endpoint,
    mode,
    p50: latency.p50,
    p95: latency.p95,
    p99: latency.p99,
    avg: latency.average,
    rps: result.requests.average,
  };

  console.log(`\nEndpoint: ${endpoint}`);
  console.log(`Mode: ${mode}`);
  console.log(`  p50:    ${formatMs(latency.p50)}`);
  console.log(`  p95:    ${formatMs(latency.p95)}`);
  console.log(`  p99:    ${formatMs(latency.p99)}`);
  console.log(`  Avg:    ${formatMs(latency.average)}`);
  console.log(`  RPS:    ${Math.round(result.requests.average)}`);

  return testResult;
}

function printSummaryTable(results: TestResult[]) {
  console.log('\n' + '='.repeat(100));
  console.log('SUMMARY TABLE');
  console.log('='.repeat(100));

  // Group by endpoint
  const byEndpoint = new Map<string, { baseline?: TestResult; concurrent?: TestResult }>();

  for (const r of results) {
    if (!byEndpoint.has(r.endpoint)) {
      byEndpoint.set(r.endpoint, {});
    }
    const entry = byEndpoint.get(r.endpoint)!;
    if (r.mode.includes('Baseline')) {
      entry.baseline = r;
    } else {
      entry.concurrent = r;
    }
  }

  // Print header
  console.log(
    '| ' +
      'Endpoint'.padEnd(30) +
      ' | ' +
      'Base p50'.padEnd(10) +
      ' | ' +
      'Base p99'.padEnd(10) +
      ' | ' +
      'Conc p50'.padEnd(10) +
      ' | ' +
      'Conc p99'.padEnd(10) +
      ' | ' +
      'Base RPS'.padEnd(10) +
      ' | ' +
      'Conc RPS'.padEnd(10) +
      ' |'
  );
  console.log('|' + '-'.repeat(32) + '|' + ('-'.repeat(12) + '|').repeat(6));

  for (const [endpoint, data] of byEndpoint) {
    const b = data.baseline;
    const c = data.concurrent;
    console.log(
      '| ' +
        endpoint.padEnd(30) +
        ' | ' +
        (b ? formatMs(b.p50).padEnd(10) : 'N/A'.padEnd(10)) +
        ' | ' +
        (b ? formatMs(b.p99).padEnd(10) : 'N/A'.padEnd(10)) +
        ' | ' +
        (c ? formatMs(c.p50).padEnd(10) : 'N/A'.padEnd(10)) +
        ' | ' +
        (c ? formatMs(c.p99).padEnd(10) : 'N/A'.padEnd(10)) +
        ' | ' +
        (b ? String(Math.round(b.rps)).padEnd(10) : 'N/A'.padEnd(10)) +
        ' | ' +
        (c ? String(Math.round(c.rps)).padEnd(10) : 'N/A'.padEnd(10)) +
        ' |'
    );
  }

  console.log('='.repeat(100));
}

async function main() {
  console.log('='.repeat(60));
  console.log('CPQ Service Performance Test');
  console.log('='.repeat(60));

  // Start the app with logging disabled
  console.log('\nStarting server...');
  const app = await buildApp();
  app.log.level = 'silent';
  await app.listen({ port: 0, host: '127.0.0.1' });

  const address = app.server.address();
  const port = typeof address === 'object' && address ? address.port : 3000;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`Server running on ${baseUrl}`);

  const allResults: TestResult[] = [];

  try {
    // Baseline tests (1 connection, 100 requests)
    console.log('\n' + '-'.repeat(60));
    console.log('BASELINE TESTS (1 connection, 100 requests each)');
    console.log('-'.repeat(60));

    for (const endpoint of endpoints) {
      const result = await runTest(baseUrl, endpoint, 1, 100);
      const testResult = printResult(endpoint.name, 'Baseline (1 conn, 100 req)', result);
      allResults.push(testResult);
    }

    // Concurrent tests (10 connections, 10 seconds)
    console.log('\n' + '-'.repeat(60));
    console.log('CONCURRENT TESTS (10 connections, 10 seconds each)');
    console.log('-'.repeat(60));

    for (const endpoint of endpoints) {
      const result = await runTest(baseUrl, endpoint, 10, undefined, 10);
      const testResult = printResult(endpoint.name, 'Concurrent (10 conn, 10s)', result);
      allResults.push(testResult);
    }

    // Print summary
    printSummaryTable(allResults);
  } finally {
    await app.close();
    console.log('\nServer stopped.');
  }
}

main().catch((err) => {
  console.error('Performance test failed:', err);
  process.exit(1);
});
