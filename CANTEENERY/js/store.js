/**
 * Canteenery - Single Source of Truth Store (Client Store & Server Synchronization)
 * 
 * Features:
 * - Shared real-time state with Node.js REST API backend (/api/menu, /api/orders)
 * - Automatic background polling (every 3s) for multi-device & cross-browser sync
 * - Zero-latency synchronous reads for all UI components & Smart Queue Engine
 * - Dynamic student ID generation per session
 * - Complete CRUD for Menu Management & Inventory
 */

const STORAGE_KEYS = {
  MENU: 'canteenery_menu_v1',
  CART: 'canteenery_cart_v1',
  ORDERS: 'canteenery_orders_v1',
  ACTIVE_ORDER_ID: 'canteenery_active_order_id_v1',
  ORDER_SEQ: 'canteenery_order_seq_v1',
  STUDENT_NAME: 'canteenery_student_name_v1',
  STUDENT_ID: 'canteenery_student_id_v1'
};

const DEFAULT_MENU_ITEMS = [
  {
    id: 'masala-dosa',
    name: 'MASALA DOSA',
    displayName: 'Masala Dosa',
    category: 'South Indian',
    description: 'Crispy rice crepe filled with spiced potato curry, served with sambar and chutney.',
    price: 50,
    preparationTime: 8,
    inventory: 0, // SOLD OUT demo requirement
    isVeg: true,
    isAvailable: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0nvnANRBszws7PCoSw2iCPYVwC4bcHTsX5z185mSLAGKQBLHYp58jd1hZV-XpVDhPeq8gx3kG_ziZzLDpTuwXBdshs1n_bGVCc_gyQAUNAt0nKMZxfTzzMZ-M6EYiu5-5TX-yEwicqKMPE93m7rQBjg0o4J2NSBdFczbxVt-fNBcBp9DWBeuKW7P9PVEVJL2YKe_WRB3MnUXJEl8UaZ39zoOgKt0hotY9NWOOxnCvaYICx5DJwdJ7'
  },
  {
    id: 'veg-sandwich',
    name: 'VEG SANDWICH',
    displayName: 'Veg Sandwich',
    category: 'Breakfast',
    description: 'Grilled sandwich loaded with fresh veggies and mint mayo.',
    price: 40,
    preparationTime: 5,
    inventory: 23, // AVAILABLE demo requirement
    isVeg: true,
    isAvailable: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYtEJqel6iiL6biS9Prz37ayyWxCR7tMiMyvO95431vVEhs5rMnOAAgFvgiNVifkoqE-dleJ0UBi-llosc6p3rRkWybD16HpzlzDhe5tqmAF2s-XqlKYsfuVd1cx7o-y4hBRvAZaSFZLAVDUY7yYK4rIfH1Pd6LQlpPcRqH8H58MYvmXBImGFuiM6RwsO7EsOVRqCzSHp8_GOm5riAuzkp-XMGNuMu3dd8nrpnmA_ZekY3fZDsQ_bv'
  },
  {
    id: 'veg-fried-rice',
    name: 'VEG FRIED RICE',
    displayName: 'Veg Fried Rice',
    category: 'Chinese',
    description: 'Wok-tossed rice with seasonal vegetables and mild soy.',
    price: 70,
    preparationTime: 10,
    inventory: 15,
    isVeg: true,
    isAvailable: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZNQzdrxR_S2mORAyoxhCewnUMZ_y2ij5GoQPsmR184BrHAessFdylZ--m5Z9dbtnCy9DA58QzOqq8p-cANDHkiXSATayoKDL4TDOOYDXKkIIoCLit83Rr7bLkNAks8qQLpGvikcIL1v7d1owApKuBNdjSINgS6LinQyzGRI0JQNUIxxjXkVnG_E5XjRf6ruWJrOLKh-OXB-TKBtHxELnyMsSYv26E4V8Cz09pUOpYbrczCM3TtaQ_'
  },
  {
    id: 'chicken-biryani',
    name: 'CHICKEN BIRYANI',
    displayName: 'Chicken Biryani',
    category: 'Non-Veg',
    description: 'Aromatic basmati rice cooked with tender chicken and secret spices.',
    price: 120,
    preparationTime: 12,
    inventory: 8, // AVAILABLE demo requirement
    isVeg: false,
    isAvailable: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDCwpuKPBlmdBzBz56vBujp-iJp3rKmObixllnnTZqWO-TwORH-DbUa80FdB-IbKULPpjXKuEsLePpaBU2Mne92kDjs1WVYOwIa56SgCHlLAJeUkMEFAULfNcIJwD3NHeKtOIJk-VaNa6MSWj5XyoOKXXwamaqYmrLPMqlASZ9kbJRjK1ZMMPxhWqQmdpGsGbGYM3ZaJKxTel1oKD2DpB4pWG-8EM1NEuyo6XBxw7LnmRbmrxoK-zl'
  },
  {
    id: 'samosa',
    name: 'SAMOSA',
    displayName: 'Samosa',
    category: 'Snacks',
    description: 'Crispy pastry filled with spiced potatoes and peas.',
    price: 20,
    preparationTime: 4,
    inventory: 12, // AVAILABLE demo requirement
    isVeg: true,
    isAvailable: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlrHk32H2Jld_NVaj9X87vA-zrg2fzrK2lnbY8AgQj9Osyx2uB80u_4MoOWjhIHl2_NbxMWBJBMLlWr34S7jRcmtkq7a3ipLQOt6RdFPYzAnwD4_dl-Q3mtDs-daZ28FL8V8WPL3_Hbv5f2TiMm8G2xUpJjdyUNwwMi8OjmXG1sPEz8W7F5BKJ7CRSz5x4s7TMNGQZHhyDFWcMq_X2bIV6scnNpQao6vm8iYIv5X_4-49230Y7z5lL'
  },
  {
    id: 'cold-coffee',
    name: 'COLD COFFEE',
    displayName: 'Cold Coffee',
    category: 'Beverages',
    description: 'Chilled milk blended with classic robusta coffee and ice.',
    price: 50,
    preparationTime: 3,
    inventory: 4, // LOW STOCK demo requirement
    isVeg: true,
    isAvailable: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFvDCAMtIvaOex5LlzP9K5NejU1viGj07G5_dG8RUnFzW-e4AEyZGtyR2-spq3iPIO7BpLVN6MaW68QGTxpruzDKnlXS9WEM_rRjZ7SEBqVjTnCWb2tZPer2KSxyuOZyqCzWd0wVUPhGh179fr2ps-wuZsu95TuOoZks_UnJFZ-kzKBGjDvJ7HsPWgtQ7i_mEAlmb4IjOGsSrpdHulZlM8e8QIvUZgxjVc9EuzHB2vheSWo5zWuhY1'
  },
  {
    id: 'grilled-chicken-wrap',
    name: 'GRILLED CHICKEN WRAP',
    displayName: 'Grilled Chicken Wrap',
    category: 'Non-Veg',
    description: 'Fresh grilled chicken breast with mixed greens, tomatoes, and low-fat mayo in a whole wheat tortilla.',
    price: 80,
    preparationTime: 10,
    inventory: 10,
    isVeg: false,
    isAvailable: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdutIeJmV4Uj0qTTdt4pJDSiXZ-TvQxw8UqozxjdaEYUbeTuS4ONVslQ2ec58ItuyXFoniPRWmXMmFXRbsWsvmV-inswm1B1txV4efa4G8vSBM2uatxvu2s3PG-4LD_xe2C28ia0Xq6xSL0ORKObWzy3-s7X00CgFofxOLPZJBljLs2A9roOYplaAVl0HpyBcF0ztu9VMRtORwnL8rV_GA5BFH4DcHmSg6B4wiMTzUMYAgfACgY6xg'
  },
  {
    id: 'roasted-veggie-bowl',
    name: 'ROASTED VEGGIE BOWL',
    displayName: 'Roasted Veggie Bowl',
    category: 'North Indian',
    description: 'Quinoa base topped with seasonal roasted vegetables, chickpeas, and a light tahini dressing. Vegan friendly.',
    price: 90,
    preparationTime: 12,
    inventory: 14,
    isVeg: true,
    isAvailable: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCG0ccp5rucFRVkcqqh0x_ARvI3FLfvEt_WReTW_3MXqUmSArDep2Xcv0ZcolgHkDGkg-HpG_rtXZTOcrPUCozp2ZpCq19wBPHPaYyvIyUK6S2Ce1oCFMjYx8zjpXBslc-EW4GOM5KeEz-eE_CqwfgwJdwJyT0qSFc5KsyzFKWxkn-eVATdv9I8WDUMGFEGOSMu-uhbnXmH-VVDn7adS-t4IT4PEqZNrN_3m5TzZ5yyh-5QbIUEt7up'
  },
  {
    id: 'morning-combos',
    name: 'MORNING COMBOS',
    displayName: 'Morning Combos',
    category: 'Breakfast',
    description: 'Your choice of any barista-made medium coffee paired with a freshly baked daily pastry.',
    price: 50,
    preparationTime: 5,
    inventory: 7,
    isVeg: true,
    isAvailable: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNEwJPDb0lqobR4u_awXOiiDqFufpVljS7dTvP__HVav5iJrPFrOVtn26Ej-XTteKkUAIUOxk8BOogzQjni6a2NIcIjCJikzYNWj0oTxVc5RbtqnGmJ74YzD7lCNP9n6YKpotupKJwktoSJariGZxLMlsn8e2hpUB8cv9yCQty35c2YvsolpPj0RFlkxA3MSWeBxUaLnm_ANXfC2X2ukvombXGK9qBT2ouF4cfafN4aDhvRwA4Gm7o'
  }
];

const DEFAULT_DEMO_ORDERS = [
  {
    orderId: '#SC-1048',
    studentName: 'Aqil',
    studentId: 'ST-202488',
    items: [
      { id: 'veg-sandwich', name: 'Veg Sandwich', price: 40, quantity: 2, preparationTime: 5 },
      { id: 'cold-coffee', name: 'Cold Coffee', price: 50, quantity: 1, preparationTime: 3 }
    ],
    subtotal: 130,
    taxes: 6.50,
    total: 136.50,
    status: 'PREPARING',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    preparationTime: 8,
    pickupSlot: '12:45 PM – 1:00 PM',
    estReadyTime: '12:52 PM',
    pickupLocation: 'Main Canteen - Block A',
    isBulk: false,
    payment: {
      method: 'ONLINE',
      subMethod: 'UPI',
      provider: 'MOCK_PAYMENT',
      status: 'PAID',
      transactionId: 'TXN-8492018401',
      amount: 136.50,
      paidAt: new Date(Date.now() - 10 * 60000).toISOString()
    }
  },
  {
    orderId: '#SC-1049',
    studentName: 'Rahul Sharma',
    studentId: 'ST-202419',
    items: [
      { id: 'chicken-biryani', name: 'Chicken Biryani', price: 120, quantity: 1, preparationTime: 12 },
      { id: 'samosa', name: 'Samosa', price: 20, quantity: 2, preparationTime: 4 }
    ],
    subtotal: 160,
    taxes: 8.00,
    total: 168.00,
    status: 'ACCEPTED',
    createdAt: new Date(Date.now() - 6 * 60000).toISOString(),
    preparationTime: 8,
    pickupSlot: '12:50 PM – 1:05 PM',
    estReadyTime: '1:02 PM',
    pickupLocation: 'Main Canteen - Block A',
    isBulk: false,
    payment: {
      method: 'CASH',
      subMethod: 'CASH',
      provider: 'CANTEEN',
      status: 'PENDING',
      transactionId: null,
      amount: 168.00,
      paidAt: null
    }
  },
  {
    orderId: '#SC-1050',
    studentName: 'Priya Patel',
    studentId: 'ST-202352',
    items: [
      { id: 'roasted-veggie-bowl', name: 'Roasted Veggie Bowl', price: 90, quantity: 1, preparationTime: 12 },
      { id: 'morning-combos', name: 'Morning Combos', price: 50, quantity: 1, preparationTime: 5 }
    ],
    subtotal: 140,
    taxes: 7.00,
    total: 147.00,
    status: 'PLACED',
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    preparationTime: 8,
    pickupSlot: '1:00 PM – 1:15 PM',
    estReadyTime: '1:12 PM',
    pickupLocation: 'Main Canteen - Block A',
    isBulk: false,
    payment: {
      method: 'ONLINE',
      subMethod: 'CARD',
      provider: 'MOCK_PAYMENT',
      status: 'PAID',
      transactionId: 'TXN-7391028472',
      amount: 147.00,
      paidAt: new Date(Date.now() - 2 * 60000).toISOString()
    }
  },
  {
    orderId: '#SC-1051',
    studentName: 'Sneha Rao',
    studentId: 'ST-202294',
    items: [
      { id: 'veg-fried-rice', name: 'Veg Fried Rice', price: 70, quantity: 1, preparationTime: 10 },
      { id: 'cold-coffee', name: 'Cold Coffee', price: 50, quantity: 1, preparationTime: 3 }
    ],
    subtotal: 120,
    taxes: 6.00,
    total: 126.00,
    status: 'READY',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    preparationTime: 10,
    pickupSlot: '12:30 PM – 12:45 PM',
    estReadyTime: '12:40 PM',
    readySince: '12:40 PM',
    pickupLocation: 'Main Canteen - Block A',
    isBulk: false,
    payment: {
      method: 'ONLINE',
      subMethod: 'UPI',
      provider: 'MOCK_PAYMENT',
      status: 'PAID',
      transactionId: 'TXN-6284910284',
      amount: 126.00,
      paidAt: new Date(Date.now() - 25 * 60000).toISOString()
    }
  },
  {
    orderId: '#SC-1052',
    studentName: 'Vikram (Tech Club)',
    studentId: 'ORG-TECH-01',
    items: [
      { id: 'veg-sandwich', name: 'Veg Sandwich', price: 40, quantity: 10, preparationTime: 5 },
      { id: 'cold-coffee', name: 'Cold Coffee', price: 50, quantity: 6, preparationTime: 3 }
    ],
    subtotal: 700,
    taxes: 35.00,
    total: 735.00,
    status: 'ACCEPTED',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    preparationTime: 12,
    pickupSlot: '1:15 PM – 1:30 PM',
    estReadyTime: '1:25 PM',
    pickupLocation: 'Main Canteen - Block A (Bulk Counter)',
    isBulk: true,
    payment: {
      method: 'ONLINE',
      subMethod: 'WALLET',
      provider: 'MOCK_PAYMENT',
      status: 'PAID',
      transactionId: 'TXN-9182740192',
      amount: 735.00,
      paidAt: new Date(Date.now() - 15 * 60000).toISOString()
    }
  },
  {
    orderId: '#SC-1045',
    studentName: 'Jane Smith',
    studentId: '20214567',
    items: [
      { id: 'veg-sandwich', name: 'Veg Sandwich', price: 40, quantity: 2, preparationTime: 5 }
    ],
    subtotal: 80,
    taxes: 4.00,
    total: 84.00,
    status: 'HOLDING',
    createdAt: new Date(Date.now() - 55 * 60000).toISOString(),
    preparationTime: 5,
    pickupSlot: '11:45 AM – 12:00 PM',
    estReadyTime: '11:50 AM',
    readySince: '11:45 AM',
    pickupLocation: 'Main Canteen - Holding Counter',
    isBulk: false,
    payment: {
      method: 'CASH',
      subMethod: 'CASH',
      provider: 'CANTEEN',
      status: 'PENDING',
      transactionId: null,
      amount: 84.00,
      paidAt: null
    }
  },
  {
    orderId: '#SC-1032',
    studentName: 'David Lee',
    studentId: '20229876',
    items: [
      { id: 'chicken-biryani', name: 'Chicken Biryani', price: 120, quantity: 1, preparationTime: 12 }
    ],
    subtotal: 120,
    taxes: 6.00,
    total: 126.00,
    status: 'NOT_COLLECTED',
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
    preparationTime: 12,
    pickupSlot: '11:15 AM – 11:30 AM',
    estReadyTime: '11:27 AM',
    pickupLocation: 'Main Canteen - Holding Counter',
    isBulk: false,
    payment: {
      method: 'ONLINE',
      subMethod: 'UPI',
      provider: 'MOCK_PAYMENT',
      status: 'PAID',
      transactionId: 'TXN-5182940192',
      amount: 126.00,
      paidAt: new Date(Date.now() - 90 * 60000).toISOString()
    }
  }
];

class CanteeneryStore {
  constructor() {
    this.listeners = new Map();
    this.menu = JSON.parse(JSON.stringify(DEFAULT_MENU_ITEMS));
    this.orders = JSON.parse(JSON.stringify(DEFAULT_DEMO_ORDERS));
    this.isOnline = true;
    this.pollInterval = null;
    this.apiBase = '';
    this.init();
  }

  getApiBase() {
    if (this.apiBase) return this.apiBase;
    if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http')) {
      return window.location.origin;
    }
    return 'http://localhost:3000';
  }

  init() {
    // 1. Load initial cache from localStorage if available
    try {
      const storedMenu = localStorage.getItem(STORAGE_KEYS.MENU);
      if (storedMenu) this.menu = JSON.parse(storedMenu);
      else localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(DEFAULT_MENU_ITEMS));

      const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (storedOrders) this.orders = JSON.parse(storedOrders);
      else localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_DEMO_ORDERS));

      if (!localStorage.getItem(STORAGE_KEYS.CART)) {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ORDER_SEQ)) {
        localStorage.setItem(STORAGE_KEYS.ORDER_SEQ, '1053');
      }
      if (!localStorage.getItem(STORAGE_KEYS.STUDENT_NAME)) {
        localStorage.setItem(STORAGE_KEYS.STUDENT_NAME, 'Aqil');
      }
    } catch (e) {
      console.warn('Storage initial read error:', e);
    }

    // 2. Fetch authoritative state from Server REST API
    this.syncFromServer();

    // 3. Start background polling (every 3000ms in browser)
    if (typeof window !== 'undefined' && typeof window.setInterval === 'function') {
      if (this.pollInterval) clearInterval(this.pollInterval);
      this.pollInterval = setInterval(() => {
        this.pollServerUpdates();
      }, 3000);
    }

    // 4. Same-browser storage event listener
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEYS.ORDERS) {
          try { this.orders = JSON.parse(e.newValue || '[]'); } catch(err) {}
          this.emit('orders-changed', this.orders);
          const activeId = this.getActiveOrderId();
          if (activeId) {
            const order = this.getOrder(activeId);
            if (order) this.emit('order-updated', order);
          }
        } else if (e.key === STORAGE_KEYS.MENU) {
          try { this.menu = JSON.parse(e.newValue || '[]'); } catch(err) {}
          this.emit('menu-change', this.menu);
        } else if (e.key === STORAGE_KEYS.CART) {
          this.emit('cart-change', this.getCart());
        }
      });
    }
  }

  async syncFromServer() {
    if (typeof fetch === 'undefined') return;
    try {
      const [menuRes, ordersRes] = await Promise.all([
        fetch(`${this.getApiBase()}/api/menu`, { cache: 'no-store' }),
        fetch(`${this.getApiBase()}/api/orders`, { cache: 'no-store' })
      ]);

      if (menuRes.ok) {
        const menuData = await menuRes.json();
        if (Array.isArray(menuData)) {
          this.menu = menuData;
          localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuData));
          this.emit('menu-change', this.menu);
        }
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (Array.isArray(ordersData)) {
          this.orders = ordersData;
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(ordersData));
          this.emit('orders-changed', this.orders);
          const activeId = this.getActiveOrderId();
          if (activeId) {
            const order = this.getOrder(activeId);
            if (order) this.emit('order-updated', order);
          }
        }
      }
      this.isOnline = true;
    } catch (err) {
      console.warn('Server sync error (server may be offline):', err);
      this.isOnline = false;
      this.emit('connection-status', { online: false, error: err.message });
    }
  }

  async pollServerUpdates() {
    if (typeof fetch === 'undefined') return;
    try {
      const [ordersRes, menuRes] = await Promise.all([
        fetch(`${this.getApiBase()}/api/orders`, { cache: 'no-store' }),
        fetch(`${this.getApiBase()}/api/menu`, { cache: 'no-store' })
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (Array.isArray(ordersData)) {
          const oldJson = JSON.stringify(this.orders);
          const newJson = JSON.stringify(ordersData);
          if (oldJson !== newJson) {
            this.orders = ordersData;
            localStorage.setItem(STORAGE_KEYS.ORDERS, newJson);
            this.emit('orders-changed', this.orders);
            const activeId = this.getActiveOrderId();
            if (activeId) {
              const order = this.getOrder(activeId);
              if (order) this.emit('order-updated', order);
            }
          }
        }
      }

      if (menuRes.ok) {
        const menuData = await menuRes.json();
        if (Array.isArray(menuData)) {
          const oldJson = JSON.stringify(this.menu);
          const newJson = JSON.stringify(menuData);
          if (oldJson !== newJson) {
            this.menu = menuData;
            localStorage.setItem(STORAGE_KEYS.MENU, newJson);
            this.emit('menu-change', this.menu);
          }
        }
      }

      if (!this.isOnline) {
        this.isOnline = true;
        this.emit('connection-status', { online: true });
      }
    } catch (err) {
      if (this.isOnline) {
        this.isOnline = false;
        this.emit('connection-status', { online: false, error: err.message });
      }
    }
  }

  // --- Event Emitter ---
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error('Store listener error:', err);
        }
      });
    }
  }

  // --- Student Session & Dynamic ID ---
  getStudentName() {
    return localStorage.getItem(STORAGE_KEYS.STUDENT_NAME) || 'Aqil';
  }

  setStudentName(name) {
    localStorage.setItem(STORAGE_KEYS.STUDENT_NAME, name);
    this.emit('student-change', name);
  }

  getStudentId() {
    let id = localStorage.getItem(STORAGE_KEYS.STUDENT_ID);
    if (!id) {
      id = 'ST-' + Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem(STORAGE_KEYS.STUDENT_ID, id);
    }
    return id;
  }

  // --- Menu & Inventory ---
  getMenu() {
    return this.menu || DEFAULT_MENU_ITEMS;
  }

  getMenuItem(id) {
    return this.getMenu().find((item) => item.id === id) || null;
  }

  getInventoryStatus(item) {
    if (!item) {
      return { status: 'UNAVAILABLE', label: 'Unavailable', canAdd: false, badgeClass: 'bg-gray-100 text-gray-600' };
    }

    if (item.isAvailable === false || item.available === false) {
      return {
        status: 'UNAVAILABLE',
        label: 'Unavailable',
        canAdd: false,
        badgeClass: 'bg-gray-200 text-gray-700 border border-gray-300',
        overlayText: 'UNAVAILABLE'
      };
    }

    const inv = Number(item.inventory) || 0;
    if (inv <= 0) {
      return {
        status: 'SOLD_OUT',
        label: 'Sold Out',
        canAdd: false,
        badgeClass: 'bg-error/10 text-error',
        overlayText: 'SOLD OUT'
      };
    }
    if (inv <= 5) {
      return {
        status: 'LOW_STOCK',
        label: `Only ${inv} left`,
        canAdd: true,
        badgeClass: 'bg-[#fef08a] text-[#854d0e]',
        warningIcon: true
      };
    }
    return {
      status: 'AVAILABLE',
      label: 'Available',
      canAdd: true,
      badgeClass: 'bg-[#dcfce7] text-[#166534]'
    };
  }

  updateInventory(itemId, delta) {
    const item = this.getMenuItem(itemId);
    if (!item) return false;
    const newInventory = Math.max(0, (Number(item.inventory) || 0) + delta);
    return this.setInventory(itemId, newInventory);
  }

  setInventory(itemId, quantity) {
    const item = this.getMenuItem(itemId);
    if (!item) return false;

    item.inventory = Math.max(0, parseInt(quantity, 10) || 0);
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(this.menu));
    this.emit('menu-change', this.menu);

    if (typeof fetch !== 'undefined') {
      fetch(`${this.getApiBase()}/api/menu/${encodeURIComponent(itemId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory: item.inventory })
      }).catch(err => console.warn('Failed to sync inventory to server:', err));
    }

    return true;
  }

  // --- Admin Menu Management Methods ---
  addMenuItem(itemData) {
    if (!itemData || !itemData.name || itemData.name.trim() === '') {
      return { success: false, message: 'Dish name is required.' };
    }

    const rawName = itemData.name.trim();
    let baseId = itemData.id || rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!baseId) baseId = `dish-${Date.now()}`;

    let finalId = baseId;
    let counter = 1;
    while (this.menu.some((i) => i.id === finalId)) {
      finalId = `${baseId}-${counter++}`;
    }

    const defaultImages = [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80'
    ];
    const fallbackImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];
    const image = itemData.image && itemData.image.trim().length > 0 ? itemData.image.trim() : fallbackImage;

    const newItem = {
      id: finalId,
      name: rawName.toUpperCase(),
      displayName: rawName,
      category: itemData.category || 'Snacks',
      description: itemData.description && itemData.description.trim().length > 0
        ? itemData.description.trim()
        : 'Freshly prepared daily in the canteen.',
      price: Math.max(0, parseFloat(itemData.price) || 0),
      preparationTime: Math.max(1, parseInt(itemData.preparationTime, 10) || 5),
      inventory: Math.max(0, parseInt(itemData.inventory, 10) || 0),
      isVeg: itemData.isVeg !== undefined ? Boolean(itemData.isVeg) : (itemData.category !== 'Non-Veg'),
      isAvailable: itemData.isAvailable !== undefined ? Boolean(itemData.isAvailable) : true,
      image
    };

    this.menu.push(newItem);
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(this.menu));
    this.emit('menu-change', this.menu);

    if (typeof fetch !== 'undefined') {
      fetch(`${this.getApiBase()}/api/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      }).catch(err => console.warn('Failed to add menu item to server:', err));
    }

    return { success: true, message: `Dish "${newItem.displayName}" added to menu!`, item: newItem };
  }

  updateMenuItem(itemId, updatedData) {
    const item = this.getMenuItem(itemId);
    if (!item) return { success: false, message: 'Item not found' };

    if (updatedData.name && updatedData.name.trim() !== '') {
      item.displayName = updatedData.name.trim();
      item.name = item.displayName.toUpperCase();
    }
    if (updatedData.category !== undefined) item.category = updatedData.category;
    if (updatedData.description !== undefined) item.description = updatedData.description;
    if (updatedData.price !== undefined) item.price = Math.max(0, parseFloat(updatedData.price) || 0);
    if (updatedData.preparationTime !== undefined) item.preparationTime = Math.max(1, parseInt(updatedData.preparationTime, 10) || 5);
    if (updatedData.inventory !== undefined) item.inventory = Math.max(0, parseInt(updatedData.inventory, 10) || 0);
    if (updatedData.isVeg !== undefined) item.isVeg = Boolean(updatedData.isVeg);
    if (updatedData.isAvailable !== undefined) item.isAvailable = Boolean(updatedData.isAvailable);
    if (updatedData.image && updatedData.image.trim().length > 0) item.image = updatedData.image.trim();

    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(this.menu));
    this.emit('menu-change', this.menu);

    if (typeof fetch !== 'undefined') {
      fetch(`${this.getApiBase()}/api/menu/${encodeURIComponent(itemId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      }).catch(err => console.warn('Failed to update menu item on server:', err));
    }

    return { success: true, message: `Updated "${item.displayName}" successfully!`, item };
  }

  removeMenuItem(itemId) {
    const item = this.getMenuItem(itemId);
    if (!item) return { success: false, message: 'Item not found' };

    this.menu = this.menu.filter((i) => i.id !== itemId);
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(this.menu));
    this.emit('menu-change', this.menu);

    if (typeof fetch !== 'undefined') {
      fetch(`${this.getApiBase()}/api/menu/${encodeURIComponent(itemId)}`, {
        method: 'DELETE'
      }).catch(err => console.warn('Failed to delete menu item on server:', err));
    }

    return { success: true, message: `Removed "${item.displayName || item.name}" from menu.` };
  }

  toggleMenuItemAvailability(itemId) {
    const item = this.getMenuItem(itemId);
    if (!item) return { success: false, message: 'Item not found' };

    item.isAvailable = item.isAvailable === false ? true : false;
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(this.menu));
    this.emit('menu-change', this.menu);

    if (typeof fetch !== 'undefined') {
      fetch(`${this.getApiBase()}/api/menu/${encodeURIComponent(itemId)}/toggle`, {
        method: 'POST'
      }).catch(err => console.warn('Failed to toggle item availability on server:', err));
    }

    return {
      success: true,
      isAvailable: item.isAvailable,
      message: `"${item.displayName || item.name}" marked as ${item.isAvailable ? 'Available' : 'Unavailable'}.`
    };
  }

  // --- Cart Management (Device-Local Session) ---
  getCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CART);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse cart from storage:', e);
      return [];
    }
  }

  saveCart(cart) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    this.emit('cart-change', cart);
  }

  addToCart(itemId, qty = 1) {
    const item = this.getMenuItem(itemId);
    if (!item) return { success: false, message: 'Item not found' };

    if (item.isAvailable === false || item.available === false) {
      return { success: false, message: `${item.displayName || item.name} is currently marked unavailable by kitchen.` };
    }

    const inv = Number(item.inventory) || 0;
    if (inv <= 0) {
      return { success: false, message: `${item.displayName || item.name} is sold out.` };
    }

    const cart = this.getCart();
    const existingIndex = cart.findIndex((i) => i.id === itemId);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + qty > inv) {
        return {
          success: false,
          message: `Only ${inv} available in stock for ${item.displayName || item.name}.`
        };
      }
      cart[existingIndex].quantity += qty;
    } else {
      if (qty > inv) {
        return {
          success: false,
          message: `Only ${inv} available in stock for ${item.displayName || item.name}.`
        };
      }
      cart.push({
        id: item.id,
        name: item.displayName || item.name,
        rawName: item.name,
        price: item.price,
        quantity: qty,
        preparationTime: item.preparationTime || 5,
        isVeg: item.isVeg,
        image: item.image
      });
    }

    this.saveCart(cart);
    return { success: true, message: `Added ${item.displayName || item.name} to cart.` };
  }

  updateCartQuantity(itemId, quantity) {
    const cart = this.getCart();
    const item = this.getMenuItem(itemId);
    if (!item) return { success: false, message: 'Item not found' };

    const inv = Number(item.inventory) || 0;
    const index = cart.findIndex((i) => i.id === itemId);

    if (index === -1) return { success: false, message: 'Item not in cart' };

    if (quantity <= 0) {
      cart.splice(index, 1);
      this.saveCart(cart);
      return { success: true, message: 'Item removed from cart' };
    }

    if (quantity > inv) {
      return {
        success: false,
        message: `Only ${inv} available for ${item.displayName || item.name}.`
      };
    }

    cart[index].quantity = quantity;
    this.saveCart(cart);
    return { success: true, message: 'Cart updated' };
  }

  removeFromCart(itemId) {
    const cart = this.getCart().filter((i) => i.id !== itemId);
    this.saveCart(cart);
    return { success: true, message: 'Item removed' };
  }

  clearCart() {
    this.saveCart([]);
  }

  getCartTotals() {
    const cart = this.getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    // 5% taxes & fees
    const taxes = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + taxes) * 100) / 100;
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    const maxPrepTime = cart.length > 0
      ? Math.max(...cart.map((item) => item.preparationTime || 5))
      : 0;

    return {
      subtotal,
      taxes,
      total,
      totalQty,
      itemCount: cart.length,
      maxPrepTime
    };
  }

  // --- Pre-Checkout Inventory Validation ---
  validateCart() {
    const cart = this.getCart();
    if (cart.length === 0) {
      return {
        valid: false,
        message: 'Your cart is empty. Please add items before checking out.',
        outOfStockItems: []
      };
    }

    const menu = this.getMenu();
    const outOfStockItems = [];

    for (const cartItem of cart) {
      const menuItem = menu.find((m) => m.id === cartItem.id);
      if (!menuItem) {
        outOfStockItems.push({
          id: cartItem.id,
          name: cartItem.name,
          requested: cartItem.quantity,
          available: 0,
          reason: 'Item no longer on menu'
        });
      } else if (menuItem.isAvailable === false || menuItem.available === false) {
        outOfStockItems.push({
          id: cartItem.id,
          name: menuItem.displayName || cartItem.name,
          requested: cartItem.quantity,
          available: 0,
          reason: 'Marked unavailable by kitchen'
        });
      } else if (menuItem.inventory < cartItem.quantity) {
        outOfStockItems.push({
          id: cartItem.id,
          name: menuItem.displayName || cartItem.name,
          requested: cartItem.quantity,
          available: menuItem.inventory,
          reason: menuItem.inventory === 0 ? 'Sold out' : `Only ${menuItem.inventory} remaining`
        });
      }
    }

    if (outOfStockItems.length > 0) {
      const itemNames = outOfStockItems.map((i) => i.name).join(', ');
      return {
        valid: false,
        message: `Sorry, this item is unavailable or sold out: ${itemNames}. Please remove it from your order to continue.`,
        outOfStockItems
      };
    }

    return {
      valid: true,
      message: 'All items available in kitchen inventory',
      outOfStockItems: []
    };
  }

  // =========================================================================
  // SMART QUEUE ENGINE & INTELLIGENT PICKUP SLOT CALCULATION (PHASE 3)
  // =========================================================================

  isBulkOrder(orderOrCart) {
    const items = Array.isArray(orderOrCart) ? orderOrCart : (orderOrCart && orderOrCart.items ? orderOrCart.items : []);
    const totalQuantity = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    const hasSingleLargeBatch = items.some((i) => (Number(i.quantity) || 0) >= 10);
    return totalQuantity > 15 || hasSingleLargeBatch;
  }

  getNextStatusAction(currentStatus) {
    switch (currentStatus) {
      case 'PLACED':
        return { nextStatus: 'ACCEPTED', label: 'Accept Order', icon: 'thumb_up', btnClass: 'bg-primary text-white hover:bg-primary-container' };
      case 'ACCEPTED':
        return { nextStatus: 'PREPARING', label: 'Start Preparing', icon: 'soup_kitchen', btnClass: 'bg-secondary-container text-white hover:bg-secondary' };
      case 'PREPARING':
        return { nextStatus: 'READY', label: 'Mark Ready', icon: 'check_circle', btnClass: 'bg-[#166534] text-white hover:bg-green-800' };
      case 'READY':
        return { nextStatus: 'COLLECTED', label: 'Mark Collected', icon: 'done_all', btnClass: 'bg-surface-tint text-white hover:bg-primary' };
      case 'NOT_COLLECTED':
        return { nextStatus: 'HOLDING', label: 'Move to Holding Counter', icon: 'inventory', btnClass: 'bg-[#854d0e] text-white hover:bg-amber-800' };
      case 'HOLDING':
        return { nextStatus: 'COLLECTED', label: 'Mark Collected', icon: 'done_all', btnClass: 'bg-[#166534] text-white hover:bg-green-800' };
      default:
        return null;
    }
  }

  calculateBasePreparationTime(cartItems = null) {
    const cart = cartItems || this.getCart();
    if (!cart || cart.length === 0) return 5;

    const maxIndividualPrep = Math.max(...cart.map((i) => i.preparationTime || 5));
    const extraSameItemsCount = cart.reduce((sum, i) => sum + (i.quantity - 1), 0);
    const batchOverhead = extraSameItemsCount * 1.5;
    const diversityOverhead = (cart.length - 1) * 1.0;

    return Math.round(maxIndividualPrep + batchOverhead + diversityOverhead);
  }

  calculateQueueDelay(activeOrders = null) {
    const orders = activeOrders || this.getOrders().filter((o) => ['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status));
    if (!orders || orders.length === 0) return 0;
    const totalQueuedPrepTime = orders.reduce((sum, o) => sum + (o.preparationTime || 8), 0);
    return Math.round(totalQueuedPrepTime / 2.5);
  }

  calculateKitchenWorkload() {
    const orders = this.getOrders();
    const activeOrders = orders.filter((o) => ['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status));

    const totalActivePrepMinutes = activeOrders.reduce((sum, order) => {
      const time = order.preparationTime || (order.items ? order.items.reduce((s, i) => s + (i.preparationTime || 5) * i.quantity, 0) : 10);
      return sum + time;
    }, 0);

    const kitchenCapacity = 60;
    const loadPercentage = Math.min(100, Math.round((totalActivePrepMinutes / kitchenCapacity) * 100));

    let level = 'LOW';
    if (loadPercentage >= 90) level = 'CRITICAL';
    else if (loadPercentage >= 70) level = 'HIGH';
    else if (loadPercentage >= 40) level = 'MODERATE';

    return {
      percentage: loadPercentage,
      level,
      activeOrderCount: activeOrders.length,
      activeQueuedMinutes: totalActivePrepMinutes,
      capacityMinutes: kitchenCapacity
    };
  }

  calculateWorkloadAdjustment(workloadPercentage = null) {
    const load = workloadPercentage !== null ? workloadPercentage : this.calculateKitchenWorkload().percentage;
    if (load < 40) return 0;
    if (load < 70) return 2;
    if (load < 90) return 5;
    return 8;
  }

  calculateOrderSizeAndBulkAdjustment(cartItems = null) {
    const cart = cartItems || this.getCart();
    const totalQuantity = cart.reduce((sum, i) => sum + i.quantity, 0);
    const hasSingleLargeBatch = cart.some((i) => i.quantity >= 10);
    const isBulk = totalQuantity > 15 || hasSingleLargeBatch;

    let buffer = 0;
    if (isBulk) buffer = 10;
    else if (totalQuantity > 6) buffer = 4;
    else if (totalQuantity > 3) buffer = 2;

    return { isBulk, buffer, totalQuantity };
  }

  calculateSmartPickup(cartItems = null, customKitchenState = null) {
    const items = cartItems || this.getCart();
    const orders = this.getOrders();
    const activeOrders = orders.filter((o) => ['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status));

    const workloadInfo = customKitchenState && customKitchenState.workload !== undefined
      ? customKitchenState.workload
      : this.calculateKitchenWorkload();

    const ordersAheadCount = customKitchenState && customKitchenState.ordersAhead !== undefined
      ? customKitchenState.ordersAhead
      : activeOrders.length;

    // Component 1: Base Prep
    const basePrepTime = this.calculateBasePreparationTime(items);

    // Component 2: Queue Delay
    const queueDelay = customKitchenState && customKitchenState.queueDelay !== undefined
      ? customKitchenState.queueDelay
      : this.calculateQueueDelay(activeOrders);

    // Component 3: Workload Adjustment
    const workloadAdjustment = this.calculateWorkloadAdjustment(workloadInfo.percentage);

    // Component 4: Bulk & Size Adjustment
    const bulkInfo = this.calculateOrderSizeAndBulkAdjustment(items);
    const bulkOrderAdjustment = bulkInfo.buffer;
    const isBulk = bulkInfo.isBulk;

    // Total Estimated Preparation Time
    const estimatedPrepTime = Math.max(3, basePrepTime + queueDelay + workloadAdjustment + bulkOrderAdjustment);

    // Time formatting helper
    const formatTime = (date) => {
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const strMinutes = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${strMinutes} ${ampm}`;
    };

    const now = new Date();
    const estReadyDate = new Date(now.getTime() + estimatedPrepTime * 60000);

    const slotStartMinutes = Math.ceil(estReadyDate.getMinutes() / 15) * 15;
    const baseSlotDate = new Date(estReadyDate);
    baseSlotDate.setMinutes(slotStartMinutes, 0, 0);

    const slots = [];

    // Slot 1: Rushed (15 min earlier)
    const slot1Start = new Date(baseSlotDate.getTime() - 15 * 60000);
    const slot1End = new Date(baseSlotDate.getTime());
    slots.push({
      id: 'slot-rushed',
      label: `${formatTime(slot1Start).replace(' AM','').replace(' PM','')} - ${formatTime(slot1End).replace(' AM','').replace(' PM','')}`,
      fullLabel: `${formatTime(slot1Start)} – ${formatTime(slot1End)}`,
      tag: 'Rushed',
      isRecommended: false,
      value: `${formatTime(slot1Start)} – ${formatTime(slot1End)}`
    });

    // Slot 2: Recommended (Optimal target slot)
    const slot2Start = new Date(baseSlotDate.getTime());
    const slot2End = new Date(baseSlotDate.getTime() + 15 * 60000);
    slots.push({
      id: 'slot-recommended',
      label: `${formatTime(slot2Start).replace(' AM','').replace(' PM','')} - ${formatTime(slot2End).replace(' AM','').replace(' PM','')}`,
      fullLabel: `${formatTime(slot2Start)} – ${formatTime(slot2End)}`,
      tag: 'Recommended',
      isRecommended: true,
      value: `${formatTime(slot2Start)} – ${formatTime(slot2End)}`
    });

    // Slot 3: Standard 1 (+15 min)
    const slot3Start = new Date(baseSlotDate.getTime() + 15 * 60000);
    const slot3End = new Date(baseSlotDate.getTime() + 30 * 60000);
    slots.push({
      id: 'slot-std-1',
      label: `${formatTime(slot3Start).replace(' AM','').replace(' PM','')} - ${formatTime(slot3End).replace(' AM','').replace(' PM','')}`,
      fullLabel: `${formatTime(slot3Start)} – ${formatTime(slot3End)}`,
      tag: 'Standard',
      isRecommended: false,
      value: `${formatTime(slot3Start)} – ${formatTime(slot3End)}`
    });

    // Slot 4: Standard 2 (+30 min)
    const slot4Start = new Date(baseSlotDate.getTime() + 30 * 60000);
    const slot4End = new Date(baseSlotDate.getTime() + 45 * 60000);
    slots.push({
      id: 'slot-std-2',
      label: `${formatTime(slot4Start).replace(' AM','').replace(' PM','')} - ${formatTime(slot4End).replace(' AM','').replace(' PM','')}`,
      fullLabel: `${formatTime(slot4Start)} – ${formatTime(slot4End)}`,
      tag: 'Standard',
      isRecommended: false,
      value: `${formatTime(slot4Start)} – ${formatTime(slot4End)}`
    });

    // Dynamic Explainability List
    const explanation = [
      `${ordersAheadCount} active ${ordersAheadCount === 1 ? 'order' : 'orders'} currently ahead in kitchen queue`,
      `Kitchen workload running at ${workloadInfo.percentage}% (${workloadInfo.level})`,
      `Estimated preparation time: ${estimatedPrepTime} min (Base ${basePrepTime}m + Queue ${queueDelay}m + Load ${workloadAdjustment}m${bulkOrderAdjustment ? ` + Size/Bulk ${bulkOrderAdjustment}m` : ''})`,
      isBulk ? 'Bulk batch preparation buffer (+10 min) applied' : 'All items verified in stock'
    ];

    return {
      basePreparationTime: basePrepTime,
      queueDelay,
      workloadAdjustment,
      bulkOrderAdjustment,
      orderSizeAdjustment: bulkOrderAdjustment,
      estimatedPreparationTime: estimatedPrepTime,
      queuePosition: ordersAheadCount + 1,
      estimatedCompletionTime: formatTime(estReadyDate),
      recommendedPickupSlot: slots[1].fullLabel,
      explanation,
      workload: workloadInfo,
      ordersAhead: ordersAheadCount,
      isBulkOrder: isBulk,
      slots
    };
  }

  calculatePickupSlots(kitchenLoad = null, ordersAhead = null) {
    let customState = null;
    if (kitchenLoad !== null || ordersAhead !== null) {
      const load = kitchenLoad !== null ? kitchenLoad : this.calculateKitchenWorkload().percentage;
      let level = 'LOW';
      if (load >= 90) level = 'CRITICAL';
      else if (load >= 70) level = 'HIGH';
      else if (load >= 40) level = 'MODERATE';

      customState = {
        workload: { percentage: load, level, activeQueuedMinutes: Math.round(load * 0.6) },
        ordersAhead: ordersAhead !== null ? ordersAhead : 0
      };
    }
    const result = this.calculateSmartPickup(this.getCart(), customState);
    return {
      recommendedSlot: result.recommendedPickupSlot,
      estReadyTime: result.estimatedCompletionTime,
      prepMinutes: result.estimatedPreparationTime,
      kitchenLoad: result.workload.percentage,
      ordersAhead: result.ordersAhead,
      explanation: result.explanation,
      slots: result.slots
    };
  }

  calculateQueuePosition(orderId) {
    if (!orderId) return null;
    const orders = this.getOrders();
    const active = orders.filter((o) => ['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status));

    const priority = { PREPARING: 1, ACCEPTED: 2, PLACED: 3 };
    active.sort((a, b) => {
      if (priority[a.status] !== priority[b.status]) {
        return priority[a.status] - priority[b.status];
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const index = active.findIndex((o) => o.orderId === orderId);
    return index !== -1 ? index + 1 : null;
  }

  // --- Order Creation & Tracking ---
  async createOrder(chosenSlot = null, paymentInfo = null) {
    const validation = this.validateCart();
    if (!validation.valid) {
      return { success: false, message: validation.message, errors: validation.outOfStockItems };
    }

    const cart = this.getCart();
    const totals = this.getCartTotals();
    const smartPickup = this.calculateSmartPickup(cart);
    const pickupSlot = chosenSlot || smartPickup.recommendedPickupSlot;
    const studentName = this.getStudentName();
    const studentId = this.getStudentId();

    const payment = paymentInfo || {
      method: 'CASH',
      subMethod: 'CASH',
      provider: 'CANTEEN',
      status: 'PENDING',
      transactionId: null,
      amount: totals.total,
      paidAt: null
    };

    const orderPayload = {
      studentName,
      studentId,
      items: [...cart],
      subtotal: totals.subtotal,
      taxes: totals.taxes,
      total: totals.total,
      preparationTime: smartPickup.estimatedPreparationTime,
      basePreparationTime: smartPickup.basePreparationTime,
      queueDelay: smartPickup.queueDelay,
      workloadAdjustment: smartPickup.workloadAdjustment,
      bulkOrderAdjustment: smartPickup.bulkOrderAdjustment,
      pickupSlot,
      estReadyTime: smartPickup.estimatedCompletionTime,
      explanation: smartPickup.explanation,
      isBulk: smartPickup.isBulkOrder,
      payment
    };

    // If fetch is available, perform authoritative POST /api/orders
    if (typeof fetch !== 'undefined') {
      try {
        const res = await fetch(`${this.getApiBase()}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });
        const data = await res.json();
        if (data.success && data.order) {
          const canonicalOrder = data.order;
          const existingIdx = this.orders.findIndex((o) => o.orderId === canonicalOrder.orderId);
          if (existingIdx === -1) {
            this.orders.unshift(canonicalOrder);
          } else {
            this.orders[existingIdx] = canonicalOrder;
          }
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
          localStorage.setItem(STORAGE_KEYS.ACTIVE_ORDER_ID, canonicalOrder.orderId);

          // Decrement local inventory cache
          for (const item of cart) {
            const menuItem = this.menu.find((m) => m.id === item.id);
            if (menuItem) {
              menuItem.inventory = Math.max(0, (menuItem.inventory || 0) - item.quantity);
            }
          }
          localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(this.menu));

          this.clearCart();
          this.emit('order-created', canonicalOrder);
          this.emit('orders-changed', this.orders);
          this.emit('menu-change', this.menu);

          return { success: true, orderId: canonicalOrder.orderId, order: canonicalOrder };
        } else {
          return { success: false, message: data.message || 'Failed to place order' };
        }
      } catch (err) {
        console.error('Failed to post order to server:', err);
        this.emit('connection-status', { online: false });
      }
    }

    // Offline / Direct Unit Test Execution Fallback
    let currentSeq = parseInt(localStorage.getItem(STORAGE_KEYS.ORDER_SEQ) || '1053', 10);
    const orderId = `#SC-${currentSeq}`;
    localStorage.setItem(STORAGE_KEYS.ORDER_SEQ, String(currentSeq + 1));

    const localOrder = {
      orderId,
      ...orderPayload,
      status: 'PLACED',
      createdAt: new Date().toISOString(),
      pickupLocation: smartPickup.isBulkOrder ? 'Main Canteen - Block A (Bulk Counter)' : 'Main Canteen - Block A'
    };

    for (const item of cart) {
      const menuItem = this.menu.find((m) => m.id === item.id);
      if (menuItem) {
        menuItem.inventory = Math.max(0, (menuItem.inventory || 0) - item.quantity);
      }
    }
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(this.menu));

    this.orders.unshift(localOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ORDER_ID, orderId);

    this.clearCart();
    this.emit('order-created', localOrder);
    this.emit('orders-changed', this.orders);
    this.emit('menu-change', this.menu);

    return { success: true, orderId, order: localOrder };
  }

  getOrders() {
    return this.orders || DEFAULT_DEMO_ORDERS;
  }

  getOrder(orderId) {
    if (!orderId) {
      orderId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ORDER_ID);
    }
    if (!orderId) return null;
    return this.getOrders().find((o) => o.orderId === orderId) || null;
  }

  getActiveOrderId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ORDER_ID) || null;
  }

  setActiveOrderId(orderId) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ORDER_ID, orderId);
  }

  updateOrderStatus(orderId, nextStatus) {
    const order = this.orders.find((o) => o.orderId === orderId);
    if (!order) return false;

    order.status = nextStatus;
    if (nextStatus === 'READY') {
      const now = new Date();
      const hrs = now.getHours() % 12 || 12;
      const mins = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      order.readySince = `${hrs}:${mins} ${ampm}`;
    } else if (nextStatus === 'COLLECTED') {
      order.collectedAt = new Date().toISOString();
    }

    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
    this.emit('order-updated', order);
    this.emit('orders-changed', this.orders);

    if (typeof fetch !== 'undefined') {
      fetch(`${this.getApiBase()}/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.order) {
          const idx = this.orders.findIndex(o => o.orderId === orderId);
          if (idx !== -1) {
            this.orders[idx] = data.order;
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
          }
        }
      })
      .catch(err => {
        console.error('Failed to update order status on server:', err);
      });
    }

    return true;
  }

  simulateMissedPickup(orderId) {
    const order = this.getOrder(orderId);
    if (!order) return false;

    order.status = 'NOT_COLLECTED';
    order.pickupLocation = 'Main Canteen - Holding Counter';
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));

    this.emit('order-updated', order);
    this.emit('orders-changed', this.orders);

    if (typeof fetch !== 'undefined') {
      fetch(`${this.getApiBase()}/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'NOT_COLLECTED', pickupLocation: 'Main Canteen - Holding Counter' })
      }).catch(err => console.warn('Failed to update status on server:', err));
    }

    return true;
  }

  resetDemoData() {
    this.menu = JSON.parse(JSON.stringify(DEFAULT_MENU_ITEMS));
    this.orders = JSON.parse(JSON.stringify(DEFAULT_DEMO_ORDERS));

    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(DEFAULT_MENU_ITEMS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_DEMO_ORDERS));
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ORDER_SEQ, '1053');
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ORDER_ID, '#SC-1050');

    if (typeof fetch !== 'undefined') {
      fetch(`${this.getApiBase()}/api/reset`, { method: 'POST' })
        .catch(err => console.warn('Failed to reset server state:', err));
    }

    this.emit('state-reset');
    this.emit('orders-changed', this.orders);
    this.emit('menu-change', this.menu);
    this.emit('cart-change', []);

    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast('Demo data reset to initial clean state.', 'info');
    }
  }
}

// Global Singleton Instance
if (typeof window !== 'undefined') {
  window.canteeneryStore = new CanteeneryStore();
}
