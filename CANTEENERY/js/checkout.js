/**
 * Canteenery - Smart Cart & Intelligent Checkout Logic with Mock Payment Integration
 */

document.addEventListener('DOMContentLoaded', () => {
  initCheckoutPage();
});

let selectedSlotValue = null;
let currentPaymentMethod = 'ONLINE'; // 'ONLINE' | 'CASH'
let paymentState = null;
let activePaymentTab = 'upi';

function initCheckoutPage() {
  if (!window.canteeneryStore) return;

  window.canteeneryStore.subscribe('cart-change', () => {
    handleCartChanged();
    renderCheckout();
  });
  window.canteeneryStore.subscribe('menu-change', renderCheckout);
  window.canteeneryStore.subscribe('orders-changed', renderCheckout);
  window.canteeneryStore.subscribe('state-reset', () => {
    paymentState = null;
    currentPaymentMethod = 'ONLINE';
    renderCheckout();
  });

  const placeOrderBtn = document.getElementById('place-order-btn');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', handlePlaceOrder);
  }

  initPaymentControls();
  renderCheckout();
}

function handleCartChanged() {
  if (!window.canteeneryStore) return;
  const totals = window.canteeneryStore.getCartTotals();
  // Invalidate payment if cart total changed after mock payment
  if (paymentState && paymentState.amount !== totals.total) {
    paymentState = null;
    if (window.showToast && totals.total > 0) {
      window.showToast('Cart updated. Please re-confirm online payment with the new total.', 'warning');
    }
  }
}

function initPaymentControls() {
  // Radio change listeners
  const methodRadios = document.querySelectorAll('input[name="payment-method"]');
  methodRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      currentPaymentMethod = e.target.value;
      renderPaymentSection();
    });
  });

  // Pay online button opens modal
  const payOnlineBtn = document.getElementById('pay-online-btn');
  if (payOnlineBtn) {
    payOnlineBtn.addEventListener('click', openPaymentModal);
  }

  // Close modal button
  const closePaymentModalBtn = document.getElementById('close-payment-modal-btn');
  if (closePaymentModalBtn) {
    closePaymentModalBtn.addEventListener('click', closePaymentModal);
  }

  // Reset/Change payment button
  const resetPaymentBtn = document.getElementById('reset-payment-btn');
  if (resetPaymentBtn) {
    resetPaymentBtn.addEventListener('click', () => {
      paymentState = null;
      renderPaymentSection();
      if (window.showToast) {
        window.showToast('Payment reset. You can choose another method.', 'info');
      }
    });
  }

  // Modal tabs
  const tabBtns = document.querySelectorAll('.mock-tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      selectPaymentTab(tab);
    });
  });

  // Modal Complete Payment Button
  const completePaymentBtn = document.getElementById('complete-payment-btn');
  if (completePaymentBtn) {
    completePaymentBtn.addEventListener('click', simulateCompletePayment);
  }
}

function selectPaymentTab(tab) {
  activePaymentTab = tab;
  const tabBtns = document.querySelectorAll('.mock-tab-btn');
  tabBtns.forEach((btn) => {
    const isTab = btn.getAttribute('data-tab') === tab;
    if (isTab) {
      btn.className = 'mock-tab-btn active p-sm rounded-lg border-2 border-primary bg-primary-container/20 text-primary font-label-sm text-label-sm font-semibold flex flex-col items-center justify-center gap-xs cursor-pointer text-center';
    } else {
      btn.className = 'mock-tab-btn p-sm rounded-lg border-2 border-outline-variant bg-surface text-on-surface-variant font-label-sm text-label-sm font-semibold flex flex-col items-center justify-center gap-xs cursor-pointer text-center';
    }
  });

  const contents = document.querySelectorAll('.mock-tab-content');
  contents.forEach((content) => {
    if (content.id === `tab-content-${tab}`) {
      content.classList.remove('hidden');
    } else {
      content.classList.add('hidden');
    }
  });
}

function openPaymentModal() {
  const store = window.canteeneryStore;
  if (!store) return;
  const totals = store.getCartTotals();
  if (totals.total <= 0) {
    if (window.showToast) window.showToast('Your cart is empty', 'warning');
    return;
  }

  const modal = document.getElementById('payment-modal');
  const modalAmountEl = document.getElementById('modal-amount-display');
  const completeBtnText = document.getElementById('complete-payment-btn-text');

  if (modalAmountEl) modalAmountEl.textContent = `₹${totals.total.toFixed(2)}`;
  if (completeBtnText) completeBtnText.textContent = `Simulate Payment (₹${totals.total.toFixed(2)})`;

  selectPaymentTab(activePaymentTab || 'upi');

  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  if (modal) modal.classList.add('hidden');
}

function simulateCompletePayment() {
  const store = window.canteeneryStore;
  if (!store) return;
  const totals = store.getCartTotals();
  const completeBtn = document.getElementById('complete-payment-btn');

  if (completeBtn) {
    completeBtn.disabled = true;
    completeBtn.innerHTML = `
      <span class="material-symbols-outlined animate-spin text-[20px]">sync</span>
      Simulating Payment...
    `;
  }

  setTimeout(() => {
    let subMethodLabel = 'UPI (Google Pay / PhonePe)';
    if (activePaymentTab === 'card') subMethodLabel = 'Card (Visa / Mastercard)';
    else if (activePaymentTab === 'netbanking') {
      const bankSelect = document.getElementById('mock-bank-select');
      subMethodLabel = `Net Banking (${bankSelect ? bankSelect.value : 'HDFC'})`;
    } else if (activePaymentTab === 'wallet') subMethodLabel = 'Campus Dining Wallet';

    const txnId = `TXN-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

    paymentState = {
      method: 'ONLINE',
      subMethod: subMethodLabel,
      provider: 'MOCK_PAYMENT',
      status: 'PAID',
      transactionId: txnId,
      amount: totals.total,
      paidAt: new Date().toISOString()
    };

    closePaymentModal();
    if (completeBtn) {
      completeBtn.disabled = false;
      completeBtn.innerHTML = `
        <span class="material-symbols-outlined text-[20px]">lock</span>
        <span id="complete-payment-btn-text">Simulate Payment (₹${totals.total.toFixed(2)})</span>
      `;
    }

    if (window.showToast) {
      window.showToast('Demo payment successful! You can now place your order.', 'success');
    }

    renderPaymentSection();
  }, 450);
}

function renderCheckout() {
  renderCartSummary();
  renderPickupEngine();
  renderPaymentSection();
}

function renderPaymentSection() {
  if (!window.canteeneryStore) return;
  const totals = window.canteeneryStore.getCartTotals();

  const onlineBox = document.getElementById('online-payment-box');
  const cashBox = document.getElementById('cash-payment-box');
  const pendingView = document.getElementById('payment-pending-view');
  const successView = document.getElementById('payment-success-view');

  const optionOnline = document.getElementById('payment-option-online');
  const optionCash = document.getElementById('payment-option-cash');

  const paymentAmountDisplay = document.getElementById('payment-amount-display');
  const payOnlineBtnText = document.getElementById('pay-online-btn-text');
  const cashAmountDisplay = document.getElementById('cash-amount-display');

  const txnIdEl = document.getElementById('payment-txn-id');
  const methodDisplayEl = document.getElementById('payment-method-display');
  const amountPaidEl = document.getElementById('payment-amount-paid');

  if (paymentAmountDisplay) paymentAmountDisplay.textContent = `₹${totals.total.toFixed(2)}`;
  if (payOnlineBtnText) payOnlineBtnText.textContent = `Pay ₹${totals.total.toFixed(2)} (Mock Gateway)`;
  if (cashAmountDisplay) cashAmountDisplay.textContent = `₹${totals.total.toFixed(2)}`;

  if (currentPaymentMethod === 'ONLINE') {
    if (optionOnline) {
      optionOnline.className = 'flex flex-col p-sm rounded-lg border-2 border-primary bg-primary/5 cursor-pointer transition-all';
      const radio = optionOnline.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    }
    if (optionCash) {
      optionCash.className = 'flex flex-col p-sm rounded-lg border-2 border-outline-variant bg-surface cursor-pointer transition-all';
    }

    if (onlineBox) onlineBox.classList.remove('hidden');
    if (cashBox) cashBox.classList.add('hidden');

    if (paymentState && paymentState.status === 'PAID' && paymentState.amount === totals.total) {
      if (pendingView) pendingView.classList.add('hidden');
      if (successView) successView.classList.remove('hidden');
      if (txnIdEl) txnIdEl.textContent = paymentState.transactionId;
      if (methodDisplayEl) methodDisplayEl.textContent = paymentState.subMethod;
      if (amountPaidEl) amountPaidEl.textContent = `₹${paymentState.amount.toFixed(2)}`;
    } else {
      if (pendingView) pendingView.classList.remove('hidden');
      if (successView) successView.classList.add('hidden');
    }
  } else {
    // CASH
    if (optionCash) {
      optionCash.className = 'flex flex-col p-sm rounded-lg border-2 border-primary bg-primary/5 cursor-pointer transition-all';
      const radio = optionCash.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    }
    if (optionOnline) {
      optionOnline.className = 'flex flex-col p-sm rounded-lg border-2 border-outline-variant bg-surface cursor-pointer transition-all';
    }

    if (onlineBox) onlineBox.classList.add('hidden');
    if (cashBox) cashBox.classList.remove('hidden');
  }
}

function renderCartSummary() {
  const container = document.getElementById('checkout-items-list');
  const subtotalEl = document.getElementById('checkout-subtotal');
  const taxesEl = document.getElementById('checkout-taxes');
  const totalEl = document.getElementById('checkout-total');
  const placeOrderBtn = document.getElementById('place-order-btn');

  if (!container || !window.canteeneryStore) return;

  const cart = window.canteeneryStore.getCart();
  const totals = window.canteeneryStore.getCartTotals();

  if (cart.length === 0) {
    container.innerHTML = `
      <li class="py-8 text-center">
        <span class="material-symbols-outlined text-4xl text-outline mb-2">shopping_bag</span>
        <p class="font-headline-sm text-headline-sm text-primary mb-2">Your cart is empty</p>
        <p class="font-body-sm text-on-surface-variant mb-4">Add items from the menu to select a smart pickup slot.</p>
        <a href="menu.html" class="inline-flex items-center gap-1 bg-secondary-container text-white px-4 py-2 rounded-lg font-label-md hover:bg-secondary transition-colors">
          <span class="material-symbols-outlined text-sm">restaurant_menu</span> Browse Today's Menu
        </a>
      </li>
    `;
    if (subtotalEl) subtotalEl.textContent = '₹0.00';
    if (taxesEl) taxesEl.textContent = '₹0.00';
    if (totalEl) totalEl.textContent = '₹0.00';
    if (placeOrderBtn) {
      placeOrderBtn.disabled = true;
      placeOrderBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
    return;
  }

  if (placeOrderBtn) {
    placeOrderBtn.disabled = false;
    placeOrderBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }

  container.innerHTML = cart.map(item => {
    const itemSubtotal = item.price * item.quantity;
    return `
      <li class="flex justify-between items-start py-2 border-b border-outline-variant/40 last:border-0 group">
        <div class="flex gap-sm items-center">
          <div class="flex items-center bg-surface-variant rounded-md overflow-hidden border border-outline-variant/50">
            <button onclick="handleUpdateCartQty('${item.id}', ${item.quantity - 1})" class="px-2 py-1 hover:bg-surface-container-high text-primary transition-colors text-xs font-bold" title="Decrease">
              -
            </button>
            <span class="font-label-sm text-label-sm text-on-surface px-2 py-1 font-bold min-w-[24px] text-center">${item.quantity}x</span>
            <button onclick="handleUpdateCartQty('${item.id}', ${item.quantity + 1})" class="px-2 py-1 hover:bg-surface-container-high text-primary transition-colors text-xs font-bold" title="Increase">
              +
            </button>
          </div>
          <div>
            <p class="font-label-md text-label-md text-on-surface font-semibold">${item.name}</p>
            <p class="font-body-sm text-body-sm text-on-surface-variant">₹${item.price} each · <span class="text-xs text-outline">${item.preparationTime || 5} min prep</span></p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-label-md text-label-md text-on-surface font-bold">₹${itemSubtotal.toFixed(2)}</span>
          <button onclick="handleRemoveCartItem('${item.id}')" class="text-outline hover:text-error transition-colors p-1" title="Remove item">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </li>
    `;
  }).join('');

  if (subtotalEl) subtotalEl.textContent = `₹${totals.subtotal.toFixed(2)}`;
  if (taxesEl) taxesEl.textContent = `₹${totals.taxes.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `₹${totals.total.toFixed(2)}`;
}

function renderPickupEngine() {
  if (!window.canteeneryStore) return;

  const cart = window.canteeneryStore.getCart();
  const totals = window.canteeneryStore.getCartTotals();
  const smartPickup = window.canteeneryStore.calculateSmartPickup(cart);

  // 1. Live Kitchen Load Metric
  const loadEl = document.getElementById('metric-kitchen-load');
  const loadBarEl = document.getElementById('metric-kitchen-load-bar');
  if (loadEl) {
    loadEl.textContent = `${smartPickup.workload.percentage}%`;
  }
  if (loadBarEl) {
    loadBarEl.style.width = `${smartPickup.workload.percentage}%`;
    if (smartPickup.workload.percentage >= 90) {
      loadBarEl.className = 'bg-error h-1.5 rounded-full transition-all duration-500';
    } else if (smartPickup.workload.percentage >= 70) {
      loadBarEl.className = 'bg-secondary-container h-1.5 rounded-full transition-all duration-500';
    } else {
      loadBarEl.className = 'bg-primary-container h-1.5 rounded-full transition-all duration-500';
    }
  }

  // 2. Orders Ahead Metric
  const aheadEl = document.getElementById('metric-orders-ahead');
  const aheadTagEl = document.getElementById('metric-orders-ahead-tag');
  if (aheadEl) {
    aheadEl.textContent = smartPickup.ordersAhead;
  }
  if (aheadTagEl) {
    if (smartPickup.ordersAhead === 0) {
      aheadTagEl.textContent = 'Queue clear';
    } else if (smartPickup.ordersAhead <= 2) {
      aheadTagEl.textContent = 'Light queue';
    } else if (smartPickup.ordersAhead <= 5) {
      aheadTagEl.textContent = 'Moderate traffic';
    } else {
      aheadTagEl.textContent = 'Heavy rush';
    }
  }

  // 3. Est. Prep Time Metric
  const prepEl = document.getElementById('metric-est-prep');
  if (prepEl) {
    prepEl.innerHTML = `${smartPickup.estimatedPreparationTime} <span class="font-headline-sm text-headline-sm text-on-surface-variant">min</span>`;
  }

  // 4. Recommended Slot Display
  const recSlotEl = document.getElementById('recommended-slot-display');
  if (recSlotEl) {
    recSlotEl.innerHTML = `${smartPickup.recommendedPickupSlot}`;
  }

  // 5. Dynamic Explanation List
  const explainListEl = document.getElementById('recommended-explanation-list');
  if (explainListEl && smartPickup.explanation) {
    explainListEl.innerHTML = smartPickup.explanation.map(exp => `
      <li class="flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[16px] text-green-300">check</span>
        <span>${exp}</span>
      </li>
    `).join('');
  }

  // 6. Alternative Slots
  const slotsContainer = document.getElementById('alternative-slots-grid');
  if (slotsContainer && smartPickup.slots) {
    if (!selectedSlotValue || !smartPickup.slots.some(s => s.value === selectedSlotValue)) {
      selectedSlotValue = smartPickup.recommendedPickupSlot;
    }

    slotsContainer.innerHTML = smartPickup.slots.map((slot) => {
      const isSelected = selectedSlotValue === slot.value || (!selectedSlotValue && slot.isRecommended);
      
      const cardClass = isSelected
        ? 'bg-surface border-2 border-secondary-container rounded-lg p-md text-center bg-secondary-fixed text-on-secondary-fixed ring-2 ring-secondary-container ring-offset-2 transition-all cursor-pointer shadow-sm'
        : 'bg-surface border border-outline-variant rounded-lg p-md text-center hover:bg-surface-container-high transition-all cursor-pointer';

      return `
        <label class="cursor-pointer">
          <input type="radio" name="pickup_slot" value="${slot.value}" class="peer sr-only" ${isSelected ? 'checked' : ''} onchange="handleSlotSelection('${slot.value}')" />
          <div class="${cardClass}">
            <span class="font-label-md text-label-md block font-semibold">${slot.label}</span>
            <span class="font-body-sm text-body-sm text-on-surface-variant block mt-xs">${slot.tag}</span>
          </div>
        </label>
      `;
    }).join('');
  }

  // 7. Inventory Pre-Check & Status Banner
  const inventoryStatusEl = document.getElementById('checkout-inventory-alert');
  const inventoryBadgeEl = document.getElementById('checkout-inventory-badge');
  const placeOrderBtn = document.getElementById('place-order-btn');
  const validation = window.canteeneryStore.validateCart();

  if (inventoryStatusEl) {
    if (totals.itemCount > 0 && !validation.valid) {
      inventoryStatusEl.className = 'bg-error-container text-on-error-container p-md rounded-lg flex items-start gap-sm border border-error mb-4 shadow-sm';
      inventoryStatusEl.innerHTML = `
        <span class="material-symbols-outlined text-[24px] text-error shrink-0 mt-0.5">error</span>
        <div>
          <p class="font-label-md text-label-md font-bold text-on-error-container">Inventory Stock Alert</p>
          <p class="font-body-sm text-body-sm text-on-error-container mt-0.5">${validation.message}</p>
        </div>
      `;
      inventoryStatusEl.classList.remove('hidden');
      if (placeOrderBtn) {
        placeOrderBtn.disabled = true;
        placeOrderBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
      if (inventoryBadgeEl) {
        inventoryBadgeEl.innerHTML = `
          <div class="bg-red-100 text-red-800 px-md py-sm rounded-full flex items-center gap-sm border border-red-200">
            <span class="material-symbols-outlined text-[20px]">warning</span>
            <span class="font-label-md text-label-md font-semibold">Stock Issue</span>
          </div>
        `;
      }
    } else if (totals.itemCount > 0) {
      inventoryStatusEl.classList.add('hidden');
      if (placeOrderBtn) {
        placeOrderBtn.disabled = false;
        placeOrderBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
      if (inventoryBadgeEl) {
        inventoryBadgeEl.innerHTML = `
          <div class="bg-green-100 text-green-800 px-md py-sm rounded-full flex items-center gap-sm border border-green-200">
            <span class="material-symbols-outlined text-[20px]">check_circle</span>
            <span class="font-label-md text-label-md font-semibold">${smartPickup.isBulkOrder ? 'Bulk Order Ready' : 'All items available'}</span>
          </div>
        `;
      }
    } else {
      inventoryStatusEl.classList.add('hidden');
    }
  }
}

window.handleSlotSelection = function(slotValue) {
  selectedSlotValue = slotValue;
  renderPickupEngine();
};

window.handleUpdateCartQty = function(itemId, qty) {
  if (!window.canteeneryStore) return;
  const result = window.canteeneryStore.updateCartQuantity(itemId, qty);
  if (!result.success) {
    window.showToast(result.message, 'warning');
  }
};

window.handleRemoveCartItem = function(itemId) {
  if (!window.canteeneryStore) return;
  window.canteeneryStore.removeFromCart(itemId);
  window.showToast('Item removed from order', 'info');
};

window.handlePlaceOrder = async function() {
  if (!window.canteeneryStore) return;

  const store = window.canteeneryStore;
  const totals = store.getCartTotals();
  const placeOrderBtn = document.getElementById('place-order-btn');

  // 1. Validate Cart items
  const validation = store.validateCart();
  if (!validation.valid) {
    if (window.showToast) window.showToast(validation.message, 'error');
    renderCheckout();
    return;
  }

  // 2. Validate Payment
  if (currentPaymentMethod === 'ONLINE') {
    if (!paymentState || paymentState.status !== 'PAID' || paymentState.amount !== totals.total) {
      if (window.showToast) {
        window.showToast('Please complete the online payment before placing your order.', 'warning');
      }
      openPaymentModal();
      return;
    }
  }

  // Construct canonical payment info
  const finalPayment = currentPaymentMethod === 'ONLINE' ? paymentState : {
    method: 'CASH',
    subMethod: 'CASH',
    provider: 'CANTEEN',
    status: 'PENDING',
    transactionId: null,
    amount: totals.total,
    paidAt: null
  };

  if (placeOrderBtn) {
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = `
      <span class="material-symbols-outlined animate-spin text-[20px]">sync</span>
      Authorizing & Placing Order...
    `;
  }

  try {
    const result = await store.createOrder(selectedSlotValue, finalPayment);
    if (result.success) {
      if (window.showToast) {
        window.showToast(`Order ${result.orderId} placed successfully!`, 'success');
      }
      setTimeout(() => {
        window.location.href = `order-confirmed.html?orderId=${encodeURIComponent(result.orderId)}`;
      }, 350);
    } else {
      if (window.showToast) {
        window.showToast(result.message || 'Failed to place order', 'error');
      }
      if (placeOrderBtn) {
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = `
          Place Pre-Order
          <span class="material-symbols-outlined" data-icon="arrow_forward">arrow_forward</span>
        `;
      }
      renderCheckout();
    }
  } catch (err) {
    console.error('Order creation error:', err);
    if (window.showToast) window.showToast('An error occurred while creating order', 'error');
    if (placeOrderBtn) {
      placeOrderBtn.disabled = false;
      placeOrderBtn.innerHTML = `
        Place Pre-Order
        <span class="material-symbols-outlined" data-icon="arrow_forward">arrow_forward</span>
      `;
    }
  }
};
