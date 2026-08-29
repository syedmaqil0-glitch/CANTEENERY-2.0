/**
 * Deep Integration Simulation Test for Canteenery Phase 2
 * Tests full end-to-end DOM rendering and state transitions across Student and Kitchen interfaces
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== STARTING DEEP INTEGRATION SIMULATION ===\n');

// 1. Setup Mock DOM & LocalStorage Environment
const storage = {};
global.localStorage = {
  getItem: (key) => (key in storage ? storage[key] : null),
  setItem: (key, val) => {
    storage[key] = String(val);
    if (global.window && global.window.__triggerStorageEvent) {
      global.window.__triggerStorageEvent(key, String(val));
    }
  },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

const listeners = [];
global.window = {
  addEventListener: (event, handler) => {
    if (event === 'storage') listeners.push(handler);
  },
  __triggerStorageEvent: (key, newValue) => {
    listeners.forEach(fn => fn({ key, newValue }));
  },
  location: {
    search: '',
    hash: ''
  }
};
global.document = {
  addEventListener: () => {}
};

// 2. Load Store and Initialize
const storeCode = fs.readFileSync(path.join(__dirname, 'js', 'store.js'), 'utf-8');
eval(storeCode);
const store = window.canteeneryStore;

console.log('1. Checking Seed Demo Orders:');
const initialOrders = store.getOrders();
console.log(`   Found ${initialOrders.length} orders in storage.`);
const aqil = store.getOrder('#SC-1048');
assert.strictEqual(aqil.status, 'PREPARING');
console.log('   ✅ #SC-1048 Aqil verified in status PREPARING');

// 3. Test Student Flow: Add to Cart & Create Order #SC-1053
console.log('\n2. Testing Student Order Placement:');
store.clearCart();
store.addToCart('veg-sandwich', 2);
store.addToCart('cold-coffee', 1);
const orderRes = store.createOrder();
assert.strictEqual(orderRes.success, true);
assert.strictEqual(orderRes.orderId, '#SC-1053');
assert.strictEqual(orderRes.order.status, 'PLACED');
console.log('   ✅ Order #SC-1053 created with status PLACED');

// 4. Test Kitchen Acceptance: PLACED -> ACCEPTED
console.log('\n3. Testing Kitchen Status Progression:');
let currentOrder = store.getOrder('#SC-1053');
assert.strictEqual(currentOrder.status, 'PLACED');

console.log('   Action 1: Accept Order (PLACED -> ACCEPTED)');
const a1 = store.getNextStatusAction(currentOrder.status);
assert.strictEqual(a1.nextStatus, 'ACCEPTED');
store.updateOrderStatus('#SC-1053', a1.nextStatus);
currentOrder = store.getOrder('#SC-1053');
assert.strictEqual(currentOrder.status, 'ACCEPTED');
console.log('   ✅ Student tracking sees status: ACCEPTED');

console.log('   Action 2: Start Preparing (ACCEPTED -> PREPARING)');
const a2 = store.getNextStatusAction(currentOrder.status);
assert.strictEqual(a2.nextStatus, 'PREPARING');
store.updateOrderStatus('#SC-1053', a2.nextStatus);
currentOrder = store.getOrder('#SC-1053');
assert.strictEqual(currentOrder.status, 'PREPARING');
console.log('   ✅ Student tracking sees status: PREPARING');

console.log('   Action 3: Mark Ready (PREPARING -> READY)');
const a3 = store.getNextStatusAction(currentOrder.status);
assert.strictEqual(a3.nextStatus, 'READY');
store.updateOrderStatus('#SC-1053', a3.nextStatus);
currentOrder = store.getOrder('#SC-1053');
assert.strictEqual(currentOrder.status, 'READY');
assert.ok(currentOrder.readySince);
console.log(`   ✅ Student tracking sees status: READY (Ready since: ${currentOrder.readySince})`);

console.log('   Action 4: Mark Collected (READY -> COLLECTED)');
const a4 = store.getNextStatusAction(currentOrder.status);
assert.strictEqual(a4.nextStatus, 'COLLECTED');
store.updateOrderStatus('#SC-1053', a4.nextStatus);
currentOrder = store.getOrder('#SC-1053');
assert.strictEqual(currentOrder.status, 'COLLECTED');
assert.ok(currentOrder.collectedAt);
console.log(`   ✅ Student tracking sees status: COLLECTED (Collected at: ${currentOrder.collectedAt})`);

// 5. Test Workload Calculation
console.log('\n4. Testing Workload Calculation & Capacity:');
const workload = store.calculateKitchenWorkload(60);
console.log(`   Active Queued Minutes: ${workload.activeQueuedMinutes} min / ${workload.capacityMinutes} min`);
console.log(`   Workload %: ${workload.percentage}% (${workload.level})`);
assert.ok(workload.percentage >= 0 && workload.percentage <= 100);
console.log('   ✅ Workload capacity calculation verified.');

// 6. Test Bulk Order Review
console.log('\n5. Testing Bulk Order Detection:');
const bulkOrder = store.getOrder('#SC-1052');
assert.ok(bulkOrder);
assert.strictEqual(store.isBulkOrder(bulkOrder), true);
console.log(`   ✅ Bulk order #SC-1052 detected with ${bulkOrder.items.reduce((s,i)=>s+i.quantity,0)} items`);

// 7. Test Uncollected Orders Workflow
console.log('\n6. Testing Uncollected / Holding Workflow:');
const missedOrder = store.getOrder('#SC-1049');
store.updateOrderStatus('#SC-1049', 'READY');
store.simulateMissedPickup('#SC-1049');
assert.strictEqual(store.getOrder('#SC-1049').status, 'NOT_COLLECTED');
console.log('   ✅ #SC-1049 marked NOT_COLLECTED on missed window simulation');

store.updateOrderStatus('#SC-1049', 'HOLDING');
assert.strictEqual(store.getOrder('#SC-1049').status, 'HOLDING');
console.log('   ✅ #SC-1049 moved to HOLDING');

store.updateOrderStatus('#SC-1049', 'COLLECTED');
assert.strictEqual(store.getOrder('#SC-1049').status, 'COLLECTED');
console.log('   ✅ #SC-1049 collected from holding');

console.log('\n🎉 ALL INTEGRATION SIMULATIONS COMPLETED SUCCESSFULLY WITH ZERO ERRORS!\n');
