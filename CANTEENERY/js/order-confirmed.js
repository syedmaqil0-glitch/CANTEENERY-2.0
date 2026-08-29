/**
 * Canteenery - Order Confirmation Page Logic (Phase 3)
 */

document.addEventListener('DOMContentLoaded', () => {
  initOrderConfirmedPage();
});

function initOrderConfirmedPage() {
  if (!window.canteeneryStore) return;

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');

  let order = null;
  if (orderId) {
    order = window.canteeneryStore.getOrder(orderId);
  } else {
    const activeId = window.canteeneryStore.getActiveOrderId();
    if (activeId) {
      order = window.canteeneryStore.getOrder(activeId);
    }
  }

  // If orderId was explicitly requested in URL but does not exist, show Order Not Found state
  if (orderId && !order) {
    renderOrderNotFound(orderId);
    return;
  }

  // If no order at all (fresh session without placing an order), fallback to active or demo
  if (!order) {
    const orders = window.canteeneryStore.getOrders();
    if (orders.length > 0) {
      order = orders[0];
    } else {
      renderOrderNotFound(orderId || 'Active Order');
      return;
    }
  }

  // Populate Elements
  const orderNumberEl = document.getElementById('confirmed-order-number');
  if (orderNumberEl) orderNumberEl.textContent = order.orderId;

  const pickupSlotEl = document.getElementById('confirmed-pickup-slot');
  if (pickupSlotEl) pickupSlotEl.textContent = order.pickupSlot;

  const estReadyEl = document.getElementById('confirmed-est-ready');
  if (estReadyEl) estReadyEl.textContent = order.estReadyTime || '12:52 PM';

  // Populate Payment Information
  const paymentCard = document.getElementById('confirmed-payment-card');
  const paymentIcon = document.getElementById('confirmed-payment-icon');
  const paymentTitle = document.getElementById('confirmed-payment-title');
  const paymentBadge = document.getElementById('confirmed-payment-badge');
  const paymentSubtitle = document.getElementById('confirmed-payment-subtitle');
  const paymentAmount = document.getElementById('confirmed-payment-amount');

  const payment = order.payment || { method: 'CASH', status: 'PENDING', amount: order.total || 0 };

  if (paymentCard) {
    if (payment.status === 'PAID') {
      if (paymentIcon) {
        paymentIcon.className = 'w-10 h-10 rounded-full bg-green-100 text-green-800 flex items-center justify-center shrink-0';
        paymentIcon.innerHTML = '<span class="material-symbols-outlined text-[22px]">verified</span>';
      }
      if (paymentTitle) paymentTitle.textContent = `Payment: Paid Online (${payment.subMethod || 'UPI/Card'})`;
      if (paymentBadge) {
        paymentBadge.className = 'bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full';
        paymentBadge.textContent = 'PAID';
      }
      if (paymentSubtitle) {
        paymentSubtitle.textContent = `Transaction ID: ${payment.transactionId || 'TXN-CONFIRMED'} · Simulated Payment`;
      }
    } else {
      if (paymentIcon) {
        paymentIcon.className = 'w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0';
        paymentIcon.innerHTML = '<span class="material-symbols-outlined text-[22px]">store</span>';
      }
      if (paymentTitle) paymentTitle.textContent = 'Payment: Pay at Canteen Counter';
      if (paymentBadge) {
        paymentBadge.className = 'bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full';
        paymentBadge.textContent = 'PENDING';
      }
      if (paymentSubtitle) {
        paymentSubtitle.textContent = 'Please pay in cash or counter UPI when picking up your food.';
      }
    }
    if (paymentAmount) {
      paymentAmount.textContent = `₹${(payment.amount || order.total || 0).toFixed(2)}`;
    }
  }

  // Populate Dynamic Explanation
  const explanationEl = document.getElementById('confirmed-explanation-list');
  const engineBoxEl = document.getElementById('confirmed-engine-box');
  if (explanationEl) {
    const explanations = order.explanation || [
      'Orders ahead in queue calculated dynamically',
      'Kitchen workload factored into preparation window',
      `Estimated preparation time: ${order.preparationTime || 10} min`,
      'All items verified in stock'
    ];
    explanationEl.innerHTML = explanations.map(exp => `
      <li class="flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[16px] text-green-600">check</span>
        <span>${exp}</span>
      </li>
    `).join('');
    if (engineBoxEl) engineBoxEl.classList.remove('hidden');
  }

  const itemsListEl = document.getElementById('confirmed-items-list');
  if (itemsListEl && order.items) {
    itemsListEl.innerHTML = order.items.map(item => {
      const itemSubtotal = item.price * item.quantity;
      return `
        <div class="flex justify-between items-start py-md border-b border-outline-variant hover:bg-background transition-colors px-sm rounded-md">
          <div class="flex gap-md">
            <div class="font-label-md text-label-md text-on-surface bg-surface-variant w-8 h-8 rounded flex items-center justify-center shrink-0 font-bold">${item.quantity}x</div>
            <div>
              <div class="font-body-md text-body-md font-medium text-on-surface">${item.name}</div>
              <div class="font-body-sm text-body-sm text-on-surface-variant mt-1">₹${item.price} each</div>
            </div>
          </div>
          <div class="font-body-md text-body-md font-medium text-on-surface font-semibold">₹${itemSubtotal}</div>
        </div>
      `;
    }).join('');
  }

  const subtotalEl = document.getElementById('confirmed-subtotal');
  if (subtotalEl) subtotalEl.textContent = `₹${(order.subtotal || 0).toFixed(2)}`;

  const taxEl = document.getElementById('confirmed-tax');
  if (taxEl) taxEl.textContent = `₹${(order.taxes || 0).toFixed(2)}`;

  const totalEl = document.getElementById('confirmed-total');
  if (totalEl) totalEl.textContent = `₹${(order.total || 0).toFixed(2)}`;

  // Buttons
  const trackBtn = document.getElementById('track-order-btn');
  if (trackBtn) {
    trackBtn.addEventListener('click', () => {
      window.location.href = `tracking.html?orderId=${encodeURIComponent(order.orderId)}`;
    });
  }

  const menuBtn = document.getElementById('return-menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      window.location.href = 'menu.html';
    });
  }
}

function renderOrderNotFound(orderId) {
  const mainEl = document.querySelector('main');
  if (!mainEl) return;

  mainEl.innerHTML = `
    <div class="w-full max-w-lg bg-surface-container-lowest rounded-xl border border-outline-variant shadow-lg p-xl text-center flex flex-col items-center">
      <div class="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center mb-md">
        <span class="material-symbols-outlined text-[36px]">search_off</span>
      </div>
      <h1 class="font-headline-md text-headline-md font-bold text-on-surface mb-xs">Order Not Found</h1>
      <p class="font-body-md text-body-md text-on-surface-variant mb-lg">
        We couldn't find order details for <strong class="text-primary">${orderId || 'this identifier'}</strong>. Please check your order ID or place a new pre-order from the menu.
      </p>
      <div class="flex gap-md w-full">
        <a href="menu.html" class="flex-1 bg-primary text-white py-3 rounded-lg font-label-md hover:bg-primary-container transition-colors flex items-center justify-center gap-1">
          <span class="material-symbols-outlined text-sm">restaurant_menu</span> Browse Menu
        </a>
        <a href="kitchen.html" class="flex-1 bg-surface-variant text-primary py-3 rounded-lg font-label-md hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1">
          <span class="material-symbols-outlined text-sm">kitchen</span> Kitchen Dashboard
        </a>
      </div>
    </div>
  `;
}
