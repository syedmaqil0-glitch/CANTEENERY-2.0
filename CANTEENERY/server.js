/**
 * Canteenery - Node.js Static Server & Real Shared Backend REST API
 * 
 * Provides:
 * 1. Static file serving (HTML, JS, CSS, images) with clean routes (/kitchen, /engine)
 * 2. Shared in-memory state for real-time cross-browser and cross-device operations:
 *    - GET /api/menu, POST /api/menu, PATCH /api/menu/:id, DELETE /api/menu/:id, POST /api/menu/:id/toggle
 *    - GET /api/orders, POST /api/orders (atomic sequential ID generation on server), PATCH /api/orders/:id
 *    - POST /api/reset (reset demo data)
 *    - GET /api/health
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// --- Canonical Seed Data ---
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

// --- In-Memory Server State Store ---
let serverMenu = JSON.parse(JSON.stringify(DEFAULT_MENU_ITEMS));
let serverOrders = JSON.parse(JSON.stringify(DEFAULT_DEMO_ORDERS));
let serverOrderSeq = 1053;

// Helper to parse JSON request body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Body payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(JSON.stringify(data));
}

// --- HTTP Request Router ---
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // ==========================================
  // REST API ROUTING
  // ==========================================
  if (pathname.startsWith('/api/')) {
    try {
      // 1. Health check
      if (pathname === '/api/health' && method === 'GET') {
        sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString(), serverOrderSeq });
        return;
      }

      // 2. Reset demo state
      if (pathname === '/api/reset' && method === 'POST') {
        serverMenu = JSON.parse(JSON.stringify(DEFAULT_MENU_ITEMS));
        serverOrders = JSON.parse(JSON.stringify(DEFAULT_DEMO_ORDERS));
        serverOrderSeq = 1053;
        sendJson(res, 200, { success: true, message: 'Server demo data reset successfully' });
        return;
      }

      // 3. Menu Endpoints
      if (pathname === '/api/menu') {
        if (method === 'GET') {
          sendJson(res, 200, serverMenu);
          return;
        }

        if (method === 'POST') {
          const body = await parseJsonBody(req);
          if (!body.name || body.name.trim() === '') {
            sendJson(res, 400, { success: false, message: 'Dish name is required.' });
            return;
          }

          const rawName = body.name.trim();
          let baseId = body.id || rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          if (!baseId) baseId = `dish-${Date.now()}`;

          let finalId = baseId;
          let counter = 1;
          while (serverMenu.some((i) => i.id === finalId)) {
            finalId = `${baseId}-${counter++}`;
          }

          const defaultImages = [
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80'
          ];
          const fallbackImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];
          const image = body.image && body.image.trim().length > 0 ? body.image.trim() : fallbackImage;

          const newItem = {
            id: finalId,
            name: rawName.toUpperCase(),
            displayName: rawName,
            category: body.category || 'Snacks',
            description: body.description && body.description.trim().length > 0
              ? body.description.trim()
              : 'Freshly prepared daily in the canteen.',
            price: Math.max(0, parseFloat(body.price) || 0),
            preparationTime: Math.max(1, parseInt(body.preparationTime, 10) || 5),
            inventory: Math.max(0, parseInt(body.inventory, 10) || 0),
            isVeg: body.isVeg !== undefined ? Boolean(body.isVeg) : (body.category !== 'Non-Veg'),
            isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : true,
            image
          };

          serverMenu.push(newItem);
          sendJson(res, 201, { success: true, message: `Dish "${newItem.displayName}" added to menu!`, item: newItem });
          return;
        }
      }

      // 4. Menu Item Specific Endpoints (/api/menu/:id)
      const menuMatch = pathname.match(/^\/api\/menu\/([^/]+)(\/toggle)?$/);
      if (menuMatch) {
        const itemId = decodeURIComponent(menuMatch[1]);
        const isToggle = Boolean(menuMatch[2]);
        const itemIndex = serverMenu.findIndex((i) => i.id === itemId);

        if (itemIndex === -1) {
          sendJson(res, 404, { success: false, message: `Dish with ID "${itemId}" not found.` });
          return;
        }

        if (isToggle && method === 'POST') {
          const item = serverMenu[itemIndex];
          item.isAvailable = item.isAvailable === false ? true : false;
          sendJson(res, 200, {
            success: true,
            isAvailable: item.isAvailable,
            message: `"${item.displayName || item.name}" marked as ${item.isAvailable ? 'Available' : 'Unavailable'}.`
          });
          return;
        }

        if (method === 'PATCH') {
          const body = await parseJsonBody(req);
          const item = serverMenu[itemIndex];

          if (body.name && body.name.trim() !== '') {
            item.displayName = body.name.trim();
            item.name = item.displayName.toUpperCase();
          }
          if (body.category !== undefined) item.category = body.category;
          if (body.description !== undefined) item.description = body.description;
          if (body.price !== undefined) item.price = Math.max(0, parseFloat(body.price) || 0);
          if (body.preparationTime !== undefined) item.preparationTime = Math.max(1, parseInt(body.preparationTime, 10) || 5);
          if (body.inventory !== undefined) item.inventory = Math.max(0, parseInt(body.inventory, 10) || 0);
          if (body.isVeg !== undefined) item.isVeg = Boolean(body.isVeg);
          if (body.isAvailable !== undefined) item.isAvailable = Boolean(body.isAvailable);
          if (body.image && body.image.trim().length > 0) item.image = body.image.trim();

          sendJson(res, 200, { success: true, message: `Updated "${item.displayName}" successfully!`, item });
          return;
        }

        if (method === 'DELETE') {
          const removed = serverMenu.splice(itemIndex, 1)[0];
          sendJson(res, 200, { success: true, message: `Removed "${removed.displayName || removed.name}" from menu.` });
          return;
        }
      }

      // 5. Orders Endpoints
      if (pathname === '/api/orders') {
        if (method === 'GET') {
          sendJson(res, 200, serverOrders);
          return;
        }

        if (method === 'POST') {
          const body = await parseJsonBody(req);
          const cart = Array.isArray(body.items) ? body.items : [];

          if (cart.length === 0) {
            sendJson(res, 400, { success: false, message: 'Your cart is empty. Please add items before checking out.' });
            return;
          }

          // Server-side inventory & availability validation
          const outOfStock = [];
          for (const c of cart) {
            const menuItem = serverMenu.find((m) => m.id === c.id);
            if (!menuItem) {
              outOfStock.push({ id: c.id, name: c.name, requested: c.quantity, available: 0, reason: 'Item no longer on menu' });
            } else if (menuItem.isAvailable === false || menuItem.available === false) {
              outOfStock.push({ id: c.id, name: menuItem.displayName || c.name, requested: c.quantity, available: 0, reason: 'Marked unavailable by kitchen' });
            } else if (menuItem.inventory < c.quantity) {
              outOfStock.push({ id: c.id, name: menuItem.displayName || c.name, requested: c.quantity, available: menuItem.inventory, reason: menuItem.inventory === 0 ? 'Sold out' : `Only ${menuItem.inventory} remaining` });
            }
          }

          if (outOfStock.length > 0) {
            const itemNames = outOfStock.map((i) => i.name).join(', ');
            sendJson(res, 409, {
              success: false,
              message: `Sorry, items unavailable: ${itemNames}. Please update your order.`,
              outOfStockItems: outOfStock
            });
            return;
          }

          // Atomic Order ID Assignment on Server
          const assignedId = `#SC-${serverOrderSeq++}`;

          // Atomic Inventory Decrement on Server
          for (const c of cart) {
            const menuItem = serverMenu.find((m) => m.id === c.id);
            if (menuItem) {
              menuItem.inventory = Math.max(0, menuItem.inventory - c.quantity);
            }
          }

          const newOrder = {
            orderId: assignedId,
            studentName: body.studentName || 'Student',
            studentId: body.studentId || `ST-${Math.floor(100000 + Math.random() * 900000)}`,
            items: cart.map((i) => ({
              id: i.id,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              preparationTime: i.preparationTime || 5,
              isVeg: i.isVeg,
              image: i.image
            })),
            subtotal: body.subtotal || 0,
            taxes: body.taxes || 0,
            total: body.total || 0,
            status: 'PLACED',
            createdAt: new Date().toISOString(),
            preparationTime: body.preparationTime || 10,
            basePreparationTime: body.basePreparationTime,
            queueDelay: body.queueDelay,
            workloadAdjustment: body.workloadAdjustment,
            bulkOrderAdjustment: body.bulkOrderAdjustment,
            pickupSlot: body.pickupSlot || '12:45 PM – 1:00 PM',
            estReadyTime: body.estReadyTime || '12:52 PM',
            explanation: Array.isArray(body.explanation) ? body.explanation : [
              'Order placed in kitchen queue',
              'Preparation time calculated based on workload and batching',
              'All items confirmed in stock'
            ],
            pickupLocation: body.isBulk ? 'Main Canteen - Block A (Bulk Counter)' : 'Main Canteen - Block A',
            isBulk: Boolean(body.isBulk),
            payment: body.payment && body.payment.method === 'ONLINE' ? {
              method: 'ONLINE',
              subMethod: body.payment.subMethod || 'UPI',
              provider: 'MOCK_PAYMENT',
              status: 'PAID',
              transactionId: body.payment.transactionId || `TXN-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`,
              amount: body.total || 0,
              paidAt: body.payment.paidAt || new Date().toISOString()
            } : {
              method: 'CASH',
              subMethod: 'CASH',
              provider: 'CANTEEN',
              status: 'PENDING',
              transactionId: null,
              amount: body.total || 0,
              paidAt: null
            }
          };

          serverOrders.unshift(newOrder);
          sendJson(res, 201, { success: true, orderId: assignedId, order: newOrder });
          return;
        }
      }

      // 6. Order Specific Endpoints (/api/orders/:id)
      const orderMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
      if (orderMatch) {
        const orderId = decodeURIComponent(orderMatch[1]);
        const order = serverOrders.find((o) => o.orderId === orderId);

        if (!order) {
          sendJson(res, 404, { success: false, message: `Order with ID "${orderId}" not found.` });
          return;
        }

        if (method === 'GET') {
          sendJson(res, 200, order);
          return;
        }

        if (method === 'PATCH') {
          const body = await parseJsonBody(req);
          if (body.status) {
            order.status = body.status;
            if (body.status === 'READY') {
              const now = new Date();
              const hrs = now.getHours() % 12 || 12;
              const mins = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
              const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
              order.readySince = `${hrs}:${mins} ${ampm}`;
            } else if (body.status === 'COLLECTED') {
              order.collectedAt = new Date().toISOString();
            }
          }
          if (body.pickupLocation) order.pickupLocation = body.pickupLocation;
          sendJson(res, 200, { success: true, message: `Order ${orderId} updated to ${order.status}`, order });
          return;
        }
      }

      // Unmatched API route
      sendJson(res, 404, { success: false, message: 'API Endpoint not found' });
      return;
    } catch (err) {
      console.error('API Error:', err);
      sendJson(res, 500, { success: false, message: 'Internal server error', error: err.message });
      return;
    }
  }

  // ==========================================
  // STATIC FILE SERVING
  // ==========================================
  let reqUrl = pathname;
  if (reqUrl === '/' || reqUrl === '') {
    reqUrl = '/index.html';
  } else if (reqUrl === '/kitchen') {
    reqUrl = '/kitchen.html';
  } else if (reqUrl === '/engine') {
    reqUrl = '/engine.html';
  }

  const filePath = path.join(__dirname, decodeURIComponent(reqUrl));

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Canteenery local server & REST API running at http://localhost:${PORT}`);
});

module.exports = server;
