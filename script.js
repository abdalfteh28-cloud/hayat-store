// باقات حياة — لا محدود بدون استخدام عادل
const products = [
  { id: 1, period: 'شهري', title: 'شهري', desc: 'لا محدود بدون استخدام عادل', price: 269, planClass: 'plan-monthly', image: 'plan-monthly.png' },
  { id: 2, period: '3 شهور', title: '٣ شهور', desc: 'لا محدود بدون استخدام عادل', price: 719, planClass: 'plan-3months', image: 'plan-3months.png' },
  { id: 3, period: '6 شهور', title: '٦ شهور', desc: 'لا محدود بدون استخدام عادل', price: 1349, planClass: 'plan-6months', image: 'plan-6months.png' },
  { id: 4, period: 'سنة', title: 'سنة', desc: 'لا محدود بدون استخدام عادل', price: 2200, planClass: 'plan-year', image: 'plan-year.png' },
];

let cart = JSON.parse(localStorage.getItem('hayatCart') || '[]');
let storeConfig = { paymentGateway: 'none', shippingEnabled: true };
let shippingOptions = [];

const productsGrid = document.getElementById('productsGrid');
const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const checkoutModal = document.getElementById('checkoutModal');
const closeModal = document.getElementById('closeModal');
const checkoutForm = document.getElementById('checkoutForm');
const shippingSelect = document.getElementById('shippingSelect');
const shippingHint = document.getElementById('shippingHint');
const subtotalEl = document.getElementById('subtotalEl');
const shippingEl = document.getElementById('shippingEl');
const totalEl = document.getElementById('totalEl');
const orderSummary = document.getElementById('orderSummary');
const paymentSuccessToast = document.getElementById('paymentSuccessToast');

function renderProducts() {
  productsGrid.innerHTML = products.map(p => `
    <article class="plan-card product-card ${p.planClass}">
      <div class="product-image-wrap">
        <img src="${p.image}" alt="${p.title} — ${p.desc}" class="product-image">
      </div>
      <span class="product-badge plan-badge">${p.period}</span>
      <h3 class="product-title">${p.title}</h3>
      <p class="product-desc">${p.desc}</p>
      <div class="product-price">${p.price} ر.س</div>
      <button type="button" data-id="${p.id}">أضف إلى السلة</button>
    </article>
  `).join('');

  productsGrid.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const product = products.find(x => x.id === id);
      if (product) addToCart(product);
    });
  });
}

function addToCart(product) {
  const existing = cart.find(x => x.id === product.id);
  if (existing) existing.qty += 1;
  else cart.push({ ...product, qty: 1 });
  saveCart();
  updateCartUI();
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('open');
}

function removeFromCart(id) {
  cart = cart.filter(x => x.id !== id);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('hayatCart', JSON.stringify(cart));
}

function updateCartUI() {
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  cartCount.textContent = count;

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="cart-empty">السلة فارغة. أضف منتجات من المتجر.</p>';
    cartTotal.textContent = '٠ ر.س';
    checkoutBtn.disabled = true;
    return;
  }
  checkoutBtn.disabled = false;
  cartItems.innerHTML = cart.map(i => `
    <div class="cart-item" data-id="${i.id}">
      <div class="cart-item-info">
        <div class="name">${i.title} — لا محدود بدون استخدام عادل × ${i.qty}</div>
        <div class="price">${(i.price * i.qty)} ر.س</div>
      </div>
      <button type="button" class="cart-item-remove" aria-label="حذف">🗑️</button>
    </div>
  `).join('');

  cartItems.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(parseInt(btn.closest('.cart-item').dataset.id, 10)));
  });

  cartTotal.textContent = total + ' ر.س';
}

function getCartTotalNum() {
  return cart.reduce((sum, i) => sum + (i.price || 0) * i.qty, 0);
}

function openCart() {
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('open');
}

function closeCartSidebar() {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.remove('open');
}

function getSubtotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function updateCheckoutSummary() {
  const sub = getSubtotal();
  const opt = shippingOptions.find(o => o.id === (shippingSelect && shippingSelect.value));
  const ship = opt ? opt.price : 0;
  const total = sub + ship;
  if (subtotalEl) subtotalEl.textContent = sub + ' ر.س';
  if (shippingEl) shippingEl.textContent = ship + ' ر.س';
  if (totalEl) totalEl.textContent = total + ' ر.س';
}

async function loadShippingOptions() {
  try {
    const res = await fetch('/api/shipping/options');
    const data = await res.json();
    if (data.success && data.options && data.options.length) {
      shippingOptions = data.options;
      shippingSelect.innerHTML = '<option value="">اختر التوصيل...</option>' +
        data.options.map(o => '<option value="' + o.id + '" data-price="' + o.price + '" data-days="' + o.days + '">' + o.label + ' — ' + o.price + ' ر.س (' + o.days + ')</option>').join('');
      if (shippingHint) shippingHint.textContent = '';
    } else {
      shippingSelect.innerHTML = '<option value="none">توصيل — يتم الاتفاق لاحقاً</option>';
      shippingOptions = [{ id: 'none', price: 0, days: '' }];
    }
  } catch (err) {
    shippingSelect.innerHTML = '<option value="none">توصيل — يتم الاتفاق لاحقاً</option>';
    shippingOptions = [{ id: 'none', price: 0, days: '' }];
  }
  updateCheckoutSummary();
}

function openCheckout() {
  if (cart.length === 0) return;
  loadShippingOptions();
  updateCheckoutSummary();
  checkoutModal.classList.add('open');
}

function closeCheckoutModal() {
  checkoutModal.classList.remove('open');
}

if (shippingSelect) {
  shippingSelect.addEventListener('change', updateCheckoutSummary);
}

checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('.submit-order');
  const selectedShip = shippingOptions.find(o => o.id === (shippingSelect && shippingSelect.value));
  const shippingCost = selectedShip ? selectedShip.price : 0;
  const subtotal = getSubtotal();
  const totalWithShipping = subtotal + shippingCost;

  const data = {
    name: form.name.value,
    phone: form.phone.value,
    email: form.email.value,
    address: form.address.value,
    notes: form.notes.value,
    items: cart,
    total: subtotal,
    shippingOptionId: (shippingSelect && shippingSelect.value) || 'none',
    shippingCost
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'جاري الإرسال...';

  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();

    if (result.success && result.paymentRequired && result.orderId && storeConfig.paymentGateway === 'moyasar') {
      const payRes = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: result.orderId,
          amount: totalWithShipping,
          description: 'طلب #' + result.orderId + ' — حياة'
        })
      });
      const payData = await payRes.json();
      if (payData.success && payData.paymentUrl) {
        cart = [];
        saveCart();
        updateCartUI();
        closeCheckoutModal();
        closeCartSidebar();
        form.reset();
        window.location.href = payData.paymentUrl;
        return;
      }
      alert('تعذر فتح صفحة الدفع: ' + (payData.message || 'حاول لاحقاً'));
    } else if (result.success) {
      alert('تم استلام طلبك بنجاح! رقم الطلب: #' + result.orderId + '\nسنتواصل معك قريباً.');
      cart = [];
      saveCart();
      updateCartUI();
      closeCheckoutModal();
      closeCartSidebar();
      form.reset();
    } else {
      alert('حدث خطأ: ' + (result.message || 'يرجى المحاولة لاحقاً'));
    }
  } catch (err) {
    alert('تعذر الاتصال بالخادم. تأكد من تشغيل المتجر مع الباك إند أو حاول لاحقاً.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'تأكيد الطلب';
  }
});

cartBtn.addEventListener('click', openCart);
closeCart.addEventListener('click', closeCartSidebar);
cartOverlay.addEventListener('click', closeCartSidebar);
checkoutBtn.addEventListener('click', openCheckout);
closeModal.addEventListener('click', closeCheckoutModal);
checkoutModal.addEventListener('click', (e) => { if (e.target === checkoutModal) closeCheckoutModal(); });

// تأكيد ربط المتجر بالباك إند
fetch('/api/health')
  .then(r => r.json())
  .then(function(d) {
    if (d.ok) window.__backendConnected = true;
  })
  .catch(function() { window.__backendConnected = false; });

fetch('/api/config').then(r => r.json()).then(c => { storeConfig = c; }).catch(() => {});

if (paymentSuccessToast) {
  var params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'success' && params.get('orderId')) {
    paymentSuccessToast.classList.add('show');
    setTimeout(function() { paymentSuccessToast.classList.remove('show'); }, 5000);
    history.replaceState({}, '', window.location.pathname);
  }
}

setTimeout(function() {
  var el = document.getElementById('backendStatus');
  if (!el) return;
  if (window.__backendConnected === true) {
    el.textContent = 'متصل بالباك إند';
    el.classList.add('backend-ok');
  } else if (window.__backendConnected === false) {
    el.textContent = 'غير متصل — شغّل السيرفر (npm start) وافتح الموقع من نفس العنوان';
    el.classList.add('backend-off');
  } else {
    el.textContent = 'افتح الموقع عبر السيرفر: http://localhost:3000';
    el.classList.add('backend-off');
  }
}, 800);

renderProducts();
updateCartUI();
