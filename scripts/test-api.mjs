const BASE = 'http://localhost:3000';

async function test(name, body) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${name}`);
  console.log(`Request: ${JSON.stringify(body)}`);
  console.log('='.repeat(60));
  
  const res = await fetch(`${BASE}/identify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const data = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${JSON.stringify(data, null, 2)}`);
  return data;
}

async function run() {
  // Test 1: Create new primary
  await test('New primary contact', {
    email: 'lorraine@hillvalley.edu',
    phoneNumber: '123456',
  });

  // Test 2: Same phone, new email → creates secondary
  await test('Link with same phone, new email → secondary created', {
    email: 'mcfly@hillvalley.edu',
    phoneNumber: '123456',
  });

  // Test 3: Query by email only
  await test('Query by email only (lorraine)', {
    email: 'lorraine@hillvalley.edu',
  });

  // Test 4: Query by phone only
  await test('Query by phone only', {
    phoneNumber: '123456',
  });

  // Test 5: Query by secondary email
  await test('Query by secondary email (mcfly)', {
    email: 'mcfly@hillvalley.edu',
  });

  // Test 6: Exact duplicate → no new row
  await test('Exact duplicate request → no new row', {
    email: 'mcfly@hillvalley.edu',
    phoneNumber: '123456',
  });

  // Test 7: Create another separate primary
  await test('Create separate primary (george)', {
    email: 'george@hillvalley.edu',
    phoneNumber: '919191',
  });

  // Test 8: Create yet another primary
  await test('Create separate primary (biff)', {
    email: 'biffsucks@hillvalley.edu',
    phoneNumber: '717171',
  });

  // Test 9: Bridge two primaries → merge
  await test('Bridge two primaries → merge (george email + biff phone)', {
    email: 'george@hillvalley.edu',
    phoneNumber: '717171',
  });

  // Test 10: Validation error - empty body
  await test('Validation error - empty body', {});

  // Test 11: Validation error - both null
  await test('Validation error - both null', {
    email: null,
    phoneNumber: null,
  });

  // Health check
  console.log(`\n${'='.repeat(60)}`);
  console.log('TEST: Health check');
  console.log('='.repeat(60));
  const health = await fetch(`${BASE}/health`);
  console.log(`Status: ${health.status}`);
  console.log(`Response: ${JSON.stringify(await health.json(), null, 2)}`);
}

run().catch(console.error);
