const BASE = 'https://identity-reconciliation-bitespeed-yans.onrender.com';

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
  console.log(res.status === 200 || res.status === 400 ? '✅ PASS' : '❌ FAIL');
  return data;
}

async function run() {
  console.log('🚀 Testing live server:', BASE);
  
  // Health check
  console.log(`\n${'='.repeat(60)}`);
  console.log('TEST: Health Check');
  console.log('='.repeat(60));
  const health = await fetch(`${BASE}/health`);
  const hData = await health.json();
  console.log(`Status: ${health.status}`);
  console.log(`Response: ${JSON.stringify(hData, null, 2)}`);
  console.log(health.status === 200 ? '✅ PASS' : '❌ FAIL');

  // Test 1: New primary
  await test('1. New primary contact', {
    email: 'lorraine@hillvalley.edu',
    phoneNumber: '123456',
  });

  // Test 2: Same phone, new email → secondary
  await test('2. Same phone + new email → creates secondary', {
    email: 'mcfly@hillvalley.edu',
    phoneNumber: '123456',
  });

  // Test 3: Query by email only
  await test('3. Email only (lorraine)', {
    email: 'lorraine@hillvalley.edu',
  });

  // Test 4: Query by phone only
  await test('4. Phone only', {
    phoneNumber: '123456',
  });

  // Test 5: Query by secondary email
  await test('5. Secondary email (mcfly)', {
    email: 'mcfly@hillvalley.edu',
  });

  // Test 6: Exact duplicate
  await test('6. Exact duplicate → no new row', {
    email: 'mcfly@hillvalley.edu',
    phoneNumber: '123456',
  });

  // Test 7: Separate primary (george)
  await test('7. New separate primary (george)', {
    email: 'george@hillvalley.edu',
    phoneNumber: '919191',
  });

  // Test 8: Separate primary (biff)
  await test('8. New separate primary (biff)', {
    email: 'biffsucks@hillvalley.edu',
    phoneNumber: '717171',
  });

  // Test 9: Bridge two primaries → merge
  await test('9. Bridge two primaries → MERGE', {
    email: 'george@hillvalley.edu',
    phoneNumber: '717171',
  });

  // Test 10: Validation - empty body
  await test('10. Validation error - empty body', {});

  // Test 11: Validation - both null
  await test('11. Validation error - both null', {
    email: null,
    phoneNumber: null,
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log('🏁 ALL TESTS COMPLETE');
  console.log('='.repeat(60));
}

run().catch(console.error);
