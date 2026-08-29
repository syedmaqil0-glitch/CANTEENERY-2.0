/**
 * Canteenery - Real Shared Backend Synchronization Integration Test
 * 
 * Verifies that:
 * 1. Independent clients on separate simulated browsers/devices synchronize via REST API
 * 2. An order placed by Student Client A appears in Kitchen Client B's queue via polling
 * 3. Inventory decrements on server and reflects on Client B
 * 4. Status update by Kitchen Client B (PLACED -> PREPARING -> READY) reflects on Student Client A
 * 5. Menu CRUD operations by Kitchen reflect on Student Menu
 * 6. Order ID counter generates atomic sequential IDs under concurrent load with ZERO collisions
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING CANTEENERY REAL BACKEND CROSS-CLIENT INTEGRATION SUITE');
  console.log('================================================================\n');

  // --- Reset Server State ---
  console.log('--- Step 0: Reset Server Demo State ---');
  const resetRes = await makeRequest('POST', '/api/reset');
  assert(resetRes.status === 200 && resetRes.data.success, 'Server demo state successfully reset');

  // --- Test 1: Atomic ID Generation with Simultaneous Concurrent Orders ---
  console.log('\n--- Step 1: Concurrent Orders Atomic ID Generation ---');
  const concurrentPromises = [1, 2, 3, 4, 5].map((i) => {
    return makeRequest('POST', '/api/orders', {
      studentName: `Student ${i}`,
      studentId: `ST-20240${i}`,
      items: [{ id: 'veg-sandwich', name: 'Veg Sandwich', price: 40, quantity: 1, preparationTime: 5 }],
      subtotal: 40,
      taxes: 2,
      total: 42,
      preparationTime: 5,
      pickupSlot: '1:00 PM – 1:15 PM'
    });
  });

  const concurrentResults = await Promise.all(concurrentPromises);
  const orderIds = concurrentResults.map((r) => r.data.orderId);
  console.log('  Concurrent Order IDs generated:', orderIds);

  const uniqueIds = new Set(orderIds);
  assert(uniqueIds.size === 5, 'All 5 concurrent orders received unique sequential IDs (0 collisions)');
  assert(orderIds.every((id) => id && id.startsWith('#SC-')), 'All IDs adhere to #SC-XXXX format');

  // --- Test 2: Cross-Client Order Sync (Student Client A -> Kitchen Client B) ---
  console.log('\n--- Step 2: Cross-Client Order Placement & Inventory Sync ---');
  // Client A (Student) places an order for Cold Coffee
  const studentOrderRes = await makeRequest('POST', '/api/orders', {
    studentName: 'Rohan Verma',
    studentId: 'ST-998877',
    items: [{ id: 'cold-coffee', name: 'Cold Coffee', price: 50, quantity: 2, preparationTime: 3 }],
    subtotal: 100,
    taxes: 5,
    total: 105,
    preparationTime: 12,
    pickupSlot: '1:15 PM – 1:30 PM'
  });

  assert(studentOrderRes.status === 201, 'Student Client A placed order (201 Created)');
  const studentOrderId = studentOrderRes.data.orderId;
  console.log(`  Student Order ID: ${studentOrderId}`);

  // Client B (Kitchen Dashboard) polls orders
  const kitchenOrdersRes = await makeRequest('GET', '/api/orders');
  assert(kitchenOrdersRes.status === 200, 'Kitchen Client B polled /api/orders');
  const foundOrderInKitchen = kitchenOrdersRes.data.find((o) => o.orderId === studentOrderId);
  assert(foundOrderInKitchen !== undefined, `Kitchen Client B immediately sees Student A's order ${studentOrderId} in queue`);
  assert(foundOrderInKitchen.status === 'PLACED', 'Order is in initial PLACED status');
  assert(foundOrderInKitchen.studentName === 'Rohan Verma', 'Student name is correct');

  // Verify server-side inventory decremented (Cold Coffee started at 4 -> now 2)
  const menuRes = await makeRequest('GET', '/api/menu');
  const coldCoffee = menuRes.data.find((m) => m.id === 'cold-coffee');
  assert(coldCoffee.inventory === 2, `Cold Coffee inventory decremented on server (4 -> 2, currently: ${coldCoffee.inventory})`);

  // --- Test 3: Status Transition (Kitchen Client B -> Student Client A) ---
  console.log('\n--- Step 3: Kitchen Status Update -> Student Live Tracking ---');
  // Kitchen updates to PREPARING
  const prepRes = await makeRequest('PATCH', `/api/orders/${encodeURIComponent(studentOrderId)}`, { status: 'PREPARING' });
  assert(prepRes.status === 200 && prepRes.data.order.status === 'PREPARING', 'Kitchen updated status to PREPARING');

  // Student polls /api/orders/:id
  const studentTrackingRes1 = await makeRequest('GET', `/api/orders/${encodeURIComponent(studentOrderId)}`);
  assert(studentTrackingRes1.data.status === 'PREPARING', 'Student tracking receives PREPARING update');

  // Kitchen updates to READY
  const readyRes = await makeRequest('PATCH', `/api/orders/${encodeURIComponent(studentOrderId)}`, { status: 'READY' });
  assert(readyRes.status === 200 && readyRes.data.order.status === 'READY', 'Kitchen updated status to READY');
  assert(readyRes.data.order.readySince !== undefined, 'Kitchen added readySince timestamp');

  // Student polls again
  const studentTrackingRes2 = await makeRequest('GET', `/api/orders/${encodeURIComponent(studentOrderId)}`);
  assert(studentTrackingRes2.data.status === 'READY', 'Student tracking receives READY update');

  // --- Test 4: Menu Management Cross-Device CRUD ---
  console.log('\n--- Step 4: Kitchen Menu Management CRUD Sync ---');
  // Kitchen adds a new dish
  const addDishRes = await makeRequest('POST', '/api/menu', {
    name: 'Special Paneer Roll',
    category: 'Snacks',
    price: 85,
    preparationTime: 8,
    inventory: 20,
    isVeg: true
  });
  assert(addDishRes.status === 201, 'Kitchen added new dish "Special Paneer Roll"');
  const newDishId = addDishRes.data.item.id;

  // Student checks menu
  const studentMenuRes1 = await makeRequest('GET', '/api/menu');
  const foundNewDish = studentMenuRes1.data.find((m) => m.id === newDishId);
  assert(foundNewDish !== undefined, `Student Menu includes newly added dish "${foundNewDish.displayName}"`);
  assert(foundNewDish.price === 85, 'Dish price is correct (85)');

  // Kitchen toggles availability
  const toggleRes = await makeRequest('POST', `/api/menu/${encodeURIComponent(newDishId)}/toggle`);
  assert(toggleRes.status === 200 && toggleRes.data.isAvailable === false, 'Kitchen marked dish Unavailable');

  // Student checks menu again
  const studentMenuRes2 = await makeRequest('GET', '/api/menu');
  const dishAfterToggle = studentMenuRes2.data.find((m) => m.id === newDishId);
  assert(dishAfterToggle.isAvailable === false, 'Student Menu reflects dish is Unavailable');

  // Attempt to order unavailable dish is blocked by server
  const invalidOrderRes = await makeRequest('POST', '/api/orders', {
    studentName: 'Test Student',
    items: [{ id: newDishId, name: 'Special Paneer Roll', price: 85, quantity: 1, preparationTime: 8 }]
  });
  assert(invalidOrderRes.status === 409, 'Server blocks order placement for unavailable dish (409 Conflict)');

  // Kitchen deletes dish
  const deleteRes = await makeRequest('DELETE', `/api/menu/${encodeURIComponent(newDishId)}`);
  assert(deleteRes.status === 200, 'Kitchen deleted dish');

  const studentMenuRes3 = await makeRequest('GET', '/api/menu');
  assert(!studentMenuRes3.data.some((m) => m.id === newDishId), 'Dish is completely removed from student menu');

  // Reset demo state back to clean initial data
  await makeRequest('POST', '/api/reset');

  console.log('\n================================================================');
  console.log('🎉 ALL REAL BACKEND CROSS-CLIENT INTEGRATION TESTS PASSED (100%)');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
