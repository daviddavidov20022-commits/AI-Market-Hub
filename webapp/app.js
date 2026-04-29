/**
 * MarketHub — app.js
 * Telegram Mini App Logic
 */

// ─── TELEGRAM INIT ─────────────────────────────────────────────
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#0d0f14');
  tg.setBackgroundColor('#0d0f14');
}

// ─── PRODUCTS DATA ─────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 1,
    name: "Наушники Pro X",
    fullName: "Беспроводные наушники Pro X",
    price: 3990,
    oldPrice: 5499,
    description: "Активное шумоподавление ANC, 40 часов автономности, кодек aptX HD. Профессиональный звук в любом месте.",
    emoji: "🎧",
    category: "Электроника",
    badge: "🔥 Хит продаж",
    stock: 24
  },
  {
    id: 2,
    name: "Смарт-часы Vision S",
    fullName: "Смарт-часы Vision S",
    price: 6490,
    oldPrice: 8999,
    description: "AMOLED 1.85\", встроенный GPS, пульсоксиметр SpO₂, 7 дней без зарядки. Ваш идеальный напарник.",
    emoji: "⌚",
    category: "Электроника",
    badge: "⚡ Новинка",
    stock: 11
  },
  {
    id: 3,
    name: "Клавиатура RGB",
    fullName: "Механическая клавиатура RGB",
    price: 4750,
    oldPrice: null,
    description: "Переключатели Cherry MX Red, полноцветная RGB подсветка 16.8М цветов, алюминиевый корпус 60%.",
    emoji: "⌨️",
    category: "Периферия",
    badge: "✨ Топ выбор",
    stock: 7
  }
];

// ─── STATE ─────────────────────────────────────────────────────
let cart = {};           // { productId: quantity }
let currentFilter = 'all';
let activeModalProduct = null;

// ─── RENDER CATALOG ────────────────────────────────────────────
function renderProducts(filter = 'all') {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';

  const filtered = filter === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === filter);

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text3);font-size:14px;">Товаров нет</div>`;
    return;
  }

  filtered.forEach((product, idx) => {
    const discount = product.oldPrice
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : null;

    const inCart = cart[product.id] > 0;

    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${idx * 0.05}s`;
    card.dataset.productId = product.id;
    card.setAttribute('id', `card-${product.id}`);

    card.innerHTML = `
      <div class="card-image-wrap" onclick="openModal(${product.id})">
        <div class="card-emoji">${product.emoji}</div>
        <div class="card-badge-chip">${product.badge}</div>
        <div class="card-stock-indicator"></div>
      </div>
      <div class="card-body">
        <div class="card-name" onclick="openModal(${product.id})">${product.name}</div>
        <div class="card-desc">${product.description.split('.')[0]}.</div>
        <div class="card-price-row">
          <div>
            <div class="card-price">${formatPrice(product.price)} ₽</div>
            ${product.oldPrice ? `<div class="card-old-price">${formatPrice(product.oldPrice)} ₽</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
            ${discount ? `<div class="card-discount">-${discount}%</div>` : ''}
            <button
              class="card-add-btn ${inCart ? 'added' : ''}"
              id="addbtn-${product.id}"
              onclick="event.stopPropagation(); quickAddToCart(${product.id})"
              aria-label="Добавить в корзину"
            >
              ${inCart ? '✓' : '+'}
            </button>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

function filterCatalog(category, btnEl) {
  currentFilter = category;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');
  renderProducts(category);
}

// ─── QUICK ADD ─────────────────────────────────────────────────
function quickAddToCart(productId) {
  addToCart(productId);
  const btn = document.getElementById(`addbtn-${productId}`);
  if (btn) {
    btn.classList.add('added');
    btn.textContent = '✓';
    btn.style.transform = 'scale(1.2)';
    setTimeout(() => { btn.style.transform = ''; }, 300);
  }
  updateCartUI();
  showToast('✅ Добавлено в корзину');
}

// ─── CART LOGIC ────────────────────────────────────────────────
function addToCart(productId) {
  cart[productId] = (cart[productId] || 0) + 1;
  updateCartUI();
}

function removeFromCart(productId) {
  if (!cart[productId]) return;
  cart[productId]--;
  if (cart[productId] <= 0) delete cart[productId];
  updateCartUI();
  renderCartItems();

  // Update add button
  const btn = document.getElementById(`addbtn-${productId}`);
  if (btn && !cart[productId]) {
    btn.classList.remove('added');
    btn.textContent = '+';
  }
}

function getCartTotal() {
  let total = 0;
  Object.entries(cart).forEach(([id, qty]) => {
    const p = PRODUCTS.find(p => p.id === parseInt(id));
    if (p) total += p.price * qty;
  });
  return total;
}

function getCartCount() {
  return Object.values(cart).reduce((sum, q) => sum + q, 0);
}

function updateCartUI() {
  const count = getCartCount();
  const badge = document.getElementById('cartBadge');
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';

  // Animate badge
  badge.style.transform = 'scale(1.5)';
  setTimeout(() => { badge.style.transform = 'scale(1)'; badge.style.transition = 'transform 0.3s var(--spring,ease)'; }, 10);
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  const empty = document.getElementById('cartEmpty');

  const entries = Object.entries(cart);

  if (entries.length === 0) {
    container.innerHTML = '';
    container.appendChild(createCartEmptyEl());
    footer.style.display = 'none';
    return;
  }

  container.innerHTML = '';
  footer.style.display = 'block';

  entries.forEach(([id, qty]) => {
    const p = PRODUCTS.find(p => p.id === parseInt(id));
    if (!p) return;

    const item = document.createElement('div');
    item.className = 'cart-item';
    item.innerHTML = `
      <div class="cart-item-emoji">${p.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${p.fullName}</div>
        <div class="cart-item-price">${formatPrice(p.price * qty)} ₽</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="removeFromCart(${p.id})">−</button>
        <span class="qty-num">${qty}</span>
        <button class="qty-btn" onclick="addToCart(${p.id}); renderCartItems()">+</button>
      </div>
    `;
    container.appendChild(item);
  });

  // Update summary
  document.getElementById('cartCount').textContent = `${getCartCount()} шт.`;
  document.getElementById('cartTotal').textContent = `${formatPrice(getCartTotal())} ₽`;
}

function createCartEmptyEl() {
  const div = document.createElement('div');
  div.className = 'cart-empty';
  div.innerHTML = `
    <div class="cart-empty-icon">🛍</div>
    <p>Корзина пуста</p>
    <span>Добавьте товары из каталога</span>
  `;
  return div;
}

// ─── OPEN / CLOSE CART ─────────────────────────────────────────
function openCart() {
  renderCartItems();
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── PRODUCT MODAL ─────────────────────────────────────────────
function openModal(productId) {
  const p = PRODUCTS.find(p => p.id === productId);
  if (!p) return;
  activeModalProduct = p;

  document.getElementById('modalEmoji').textContent = p.emoji;
  document.getElementById('modalName').textContent = p.fullName;
  document.getElementById('modalBadge').textContent = p.badge;
  document.getElementById('modalDesc').textContent = p.description;
  document.getElementById('modalStock').textContent = `${p.stock} в наличии`;
  document.getElementById('modalCategory').textContent = p.category;
  document.getElementById('modalPrice').textContent = `${formatPrice(p.price)} ₽`;

  const oldPriceEl = document.getElementById('modalOldPrice');
  oldPriceEl.textContent = p.oldPrice ? `${formatPrice(p.oldPrice)} ₽` : '';

  document.getElementById('productModal').classList.add('open');
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('productModal').classList.remove('open');
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
  activeModalProduct = null;
}

function addFromModal() {
  if (!activeModalProduct) return;
  addToCart(activeModalProduct.id);

  const btn = document.getElementById('addbtn-' + activeModalProduct.id);
  if (btn) {
    btn.classList.add('added');
    btn.textContent = '✓';
  }

  showToast(`✅ ${activeModalProduct.name} добавлен`);
  closeModal();
}

// ─── CHECKOUT ──────────────────────────────────────────────────
function checkout() {
  if (getCartCount() === 0) return;

  const items = Object.entries(cart).map(([id, qty]) => {
    const p = PRODUCTS.find(p => p.id === parseInt(id));
    return {
      id: p.id,
      name: p.fullName,
      price: p.price,
      qty,
      total: p.price * qty
    };
  });

  const payload = {
    action: 'order',
    items,
    total: getCartTotal(),
    timestamp: new Date().toISOString()
  };

  if (tg && tg.sendData) {
    tg.sendData(JSON.stringify(payload));
    cart = {};
    updateCartUI();
    closeCart();
    renderProducts(currentFilter);
    showToast('🎉 Заказ отправлен!');
  } else {
    // Dev mode fallback
    console.log('Order payload:', payload);
    showToast(`🧪 [Dev] Заказ на ${formatPrice(getCartTotal())} ₽`);
    setTimeout(() => {
      cart = {};
      updateCartUI();
      closeCart();
      renderProducts(currentFilter);
    }, 1500);
  }
}

// ─── TOAST ─────────────────────────────────────────────────────
let toastTimeout = null;

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ─── HELPERS ───────────────────────────────────────────────────
function formatPrice(n) {
  return n.toLocaleString('ru-RU');
}

// ─── HAPTIC FEEDBACK ───────────────────────────────────────────
function haptic(type = 'light') {
  try {
    tg?.HapticFeedback?.impactOccurred(type);
  } catch (_) {}
}

// Patch buttons for haptic
document.addEventListener('click', e => {
  if (e.target.matches('button, .product-card, .card-add-btn')) haptic('light');
});

// ─── MAIN ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Hide cart badge initially
  document.getElementById('cartBadge').style.display = 'none';

  // Render products
  renderProducts('all');

  // Telegram Main Button — checkout shortcut
  if (tg?.MainButton) {
    tg.MainButton.setText('🛒 Оформить заказ');
    tg.MainButton.color = '#6c63ff';
    tg.MainButton.textColor = '#ffffff';
    tg.MainButton.onClick(checkout);
  }

  // Back button
  if (tg?.BackButton) {
    tg.BackButton.onClick(() => {
      if (document.getElementById('productModal').classList.contains('open')) {
        closeModal();
      } else if (document.getElementById('cartDrawer').classList.contains('open')) {
        closeCart();
      } else {
        tg.close();
      }
    });
    tg.BackButton.show();
  }
});

// ─── CART COUNT → MAIN BUTTON ──────────────────────────────────
setInterval(() => {
  const count = getCartCount();
  if (tg?.MainButton) {
    if (count > 0) {
      tg.MainButton.setText(`🛒 Оформить заказ (${count}) · ${formatPrice(getCartTotal())} ₽`);
      tg.MainButton.show();
    } else {
      tg.MainButton.hide();
    }
  }
}, 300);
