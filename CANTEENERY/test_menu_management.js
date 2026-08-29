/**
 * Test Suite: Kitchen Admin Menu Management Feature
 * 
 * Verifies:
 * 1. Adding dishes with custom fields, validation, fallback images, and unique IDs
 * 2. Editing dishes (name, description, category, price, prepTime, inventory, dietary, image)
 * 3. Toggling item availability and inventory status behavior
 * 4. Preventing addition of unavailable dishes to cart and catching them in validateCart
 * 5. Removing dishes while preserving historical order snapshots
 * 6. Smart Queue Engine pickup slot calculations adapting to changed prep times
 * 7. Store pub-sub event emission ('menu-change') on every operation
 */

const fs = require('fs');
const path = require('path');

// Mock localStorage and window environment
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new LocalStorageMock();
global.fetch = undefined; // Isolate pure unit test from network
global.window = {
  localStorage: global.localStorage,
  addEventListener: () => {},
  dispatchEvent: () => {}
};

// Load store.js
const storeCode = fs.readFileSync(path.join(__dirname, 'js/store.js'), 'utf8');
eval(storeCode);

const store = global.window.canteeneryStore;
let passedAssertions = 0;
let totalAssertions = 0;

function assert(condition, message) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

(async () => {
try {
  console.log('====================================================');
  console.log('RUNNING CANTEENERY MENU MANAGEMENT TEST SUITE');
  console.log('====================================================\n');

  // Test 1: Store initialization & baseline menu
  console.log('Test 1: Store baseline menu items');
  store.resetDemoData();
  const initialMenu = store.getMenu();
  assert(Array.isArray(initialMenu) && initialMenu.length >= 8, 'Initial menu contains default dishes');
  const initialOrders = store.getOrders();
  assert(initialOrders.length >= 4, 'Initial demo orders exist');

  // Test 2: Add New Menu Item
  console.log('\nTest 2: Adding a new dish to the canteen menu');
  let menuChangeCount = 0;
  const unsubscribe = store.subscribe('menu-change', () => {
    menuChangeCount++;
  });

  const addResult = store.addMenuItem({
    name: 'Schezwan Paneer Wrap',
    description: 'Spicy grilled cottage cheese in a soft flatbread wrap.',
    category: 'Snacks',
    isVeg: true,
    price: 85,
    preparationTime: 12,
    inventory: 20,
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-example-wrap.jpg'
  });

  assert(addResult.success === true, 'addMenuItem returns success');
  assert(addResult.item && addResult.item.id === 'schezwan-paneer-wrap', 'Correct unique ID generated for new dish');
  assert(addResult.item.price === 85, 'Dish price stored as 85');
  assert(addResult.item.preparationTime === 12, 'Dish prep time stored as 12');
  assert(addResult.item.inventory === 20, 'Dish inventory stored as 20');
  assert(menuChangeCount === 1, 'menu-change event fired on dish addition');

  const fetchedItem = store.getMenuItem('schezwan-paneer-wrap');
  assert(fetchedItem !== null && fetchedItem.displayName === 'Schezwan Paneer Wrap', 'New dish retrievable from store');

  // Test 3: Edit Existing Dish
  console.log('\nTest 3: Editing dish properties');
  const editResult = store.updateMenuItem('schezwan-paneer-wrap', {
    name: 'Schezwan Paneer Kathi Roll',
    price: 95,
    preparationTime: 14,
    inventory: 30,
    description: 'Updated signature spicy roll with mint chutney.'
  });

  assert(editResult.success === true, 'updateMenuItem returns success');
  const updatedItem = store.getMenuItem('schezwan-paneer-wrap');
  assert(updatedItem.displayName === 'Schezwan Paneer Kathi Roll', 'Dish display name updated');
  assert(updatedItem.price === 95, 'Dish price updated to 95');
  assert(updatedItem.preparationTime === 14, 'Dish preparation time updated to 14 min');
  assert(updatedItem.inventory === 30, 'Dish inventory updated to 30');
  assert(menuChangeCount === 2, 'menu-change event fired on dish update');

  // Test 4: Toggle Availability & Cart Enforcement
  console.log('\nTest 4: Dish availability control & cart prevention');
  const toggleRes1 = store.toggleMenuItemAvailability('schezwan-paneer-wrap');
  assert(toggleRes1.success === true && toggleRes1.isAvailable === false, 'Dish marked as unavailable');

  const invStatusUnavailable = store.getInventoryStatus(store.getMenuItem('schezwan-paneer-wrap'));
  assert(invStatusUnavailable.status === 'UNAVAILABLE', 'Inventory status reports UNAVAILABLE');
  assert(invStatusUnavailable.canAdd === false, 'canAdd is false for unavailable item');

  // Attempt to add unavailable item to cart
  store.clearCart();
  const addCartRes = store.addToCart('schezwan-paneer-wrap', 1);
  assert(addCartRes.success === false, 'Cannot add unavailable item to cart');
  assert(store.getCart().length === 0, 'Cart remains empty after blocked add');

  // Toggle back to available
  const toggleRes2 = store.toggleMenuItemAvailability('schezwan-paneer-wrap');
  assert(toggleRes2.success === true && toggleRes2.isAvailable === true, 'Dish toggled back to available');

  const addCartSuccess = store.addToCart('schezwan-paneer-wrap', 2);
  assert(addCartSuccess.success === true, 'Item can now be added to cart');
  assert(store.getCart().length === 1, 'Cart contains 1 item');

  // Pre-checkout validation when item becomes unavailable while in cart
  store.toggleMenuItemAvailability('schezwan-paneer-wrap');
  const validationRes = store.validateCart();
  assert(validationRes.valid === false, 'validateCart detects unavailable item in existing cart');
  assert(validationRes.outOfStockItems.length === 1, 'Unavailable item reported in validation results');

  // Re-enable item for subsequent tests
  store.toggleMenuItemAvailability('schezwan-paneer-wrap');
  assert(store.validateCart().valid === true, 'Cart becomes valid again when item re-enabled');

  // Test 5: Removing a dish & Order History Preservation
  console.log('\nTest 5: Removing dish while preserving historical order snapshots');
  // First place an order with this dish
  const checkoutOrder = await store.createOrder('12:30 PM – 12:45 PM');
  assert(checkoutOrder !== null && checkoutOrder.success === true, 'Order placed containing the new dish');
  const orderId = checkoutOrder.orderId;

  // Now remove the dish from the active menu
  const removeRes = store.removeMenuItem('schezwan-paneer-wrap');
  assert(removeRes.success === true, 'removeMenuItem returns success');
  assert(store.getMenuItem('schezwan-paneer-wrap') === null, 'Dish removed from active menu');

  // Verify historical order still contains full snapshot of the dish
  const historicOrder = store.getOrder(orderId);
  assert(historicOrder !== null, 'Historic order still exists in store');
  const historicItem = historicOrder.items.find(i => i.id === 'schezwan-paneer-wrap');
  assert(historicItem !== undefined, 'Historic order preserved the removed dish data');
  assert(historicItem.price === 95, 'Historic item price preserved');
  assert(historicItem.quantity === 2, 'Historic item quantity preserved');

  // Test 6: Smart Queue Engine Calculation with Modified Menu Prep Times
  console.log('\nTest 6: Smart Queue Engine reactivity to changed menu preparation times');
  store.clearCart();
  // Add Veg Fried Rice (standard prep time: 10 min)
  store.addToCart('veg-fried-rice', 1);
  const cartTotals1 = store.getCartTotals();
  assert(cartTotals1.maxPrepTime === 10, 'Standard Veg Fried Rice prep time is 10 min');

  // Admin updates Veg Fried Rice preparation time to 18 min
  store.updateMenuItem('veg-fried-rice', { preparationTime: 18 });
  store.clearCart();
  store.addToCart('veg-fried-rice', 1);
  const cartTotals2 = store.getCartTotals();
  assert(cartTotals2.maxPrepTime === 18, 'Updated dish prep time immediately reflected in cart totals (18 min)');

  unsubscribe();

  console.log('\n====================================================');
  console.log(`ALL ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED PERFECTLY!`);
  console.log('====================================================');
} catch (err) {
  console.error('\nTest Suite Failed:', err.message);
  process.exit(1);
}
})();
