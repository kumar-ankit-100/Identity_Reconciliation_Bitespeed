const BASE = 'http://127.0.0.1:3000';

async function test() {
  console.log('--- Testing GET /identity ---');
  try {
    const r1 = await fetch(`${BASE}/identity`);
    const d1 = await r1.json();
    console.log(`Status: ${r1.status}`);
    console.log(`Contacts count: ${d1.contacts.length}`);
    console.log(JSON.stringify(d1, null, 2).substring(0, 1500));
  } catch (e) {
    console.error('GET /identity failed:', e.message);
  }

  console.log('\n--- Testing POST /identify ---');
  try {
    const r2 = await fetch(`${BASE}/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'lorraine@hillvalley.edu', phoneNumber: '123456' }),
    });
    const d2 = await r2.json();
    console.log(`Status: ${r2.status}`);
    console.log(JSON.stringify(d2, null, 2));
  } catch (e) {
    console.error('POST /identify failed:', e.message);
  }

  console.log('\n--- Testing GET /health ---');
  try {
    const r3 = await fetch(`${BASE}/health`);
    const d3 = await r3.json();
    console.log(`Status: ${r3.status}`);
    console.log(JSON.stringify(d3, null, 2));
  } catch (e) {
    console.error('GET /health failed:', e.message);
  }
}

test();
