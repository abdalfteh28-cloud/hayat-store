// باقات حياة — المنتجات تُحمّل من API
let products = [];
let cart = JSON.parse(localStorage.getItem('hayatCart') || '[]');
let storeConfig = { paymentGateway: 'none', shippingEnabled: true };
let shippingOptions = [];
let appliedCoupon = null;

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
const discountEl = document.getElementById('discountEl');
const shippingEl = document.getElementById('shippingEl');
const totalEl = document.getElementById('totalEl');
const couponInput = document.getElementById('couponInput');
const couponMsg = document.getElementById('couponMsg');
const paymentSuccessToast = document.getElementById('paymentSuccessToast');

function escapeHtml(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function formatLongDesc(text) {
  if (!text) return '';
  return text.split('\n').filter(function(line) { return line.trim(); }).map(function(line) {
    var t = escapeHtml(line.trim());
    if (t.indexOf('•') === 0 || t.indexOf('✨') === 0 || t.indexOf('🛠') === 0) return '<p class="product-data-line">' + t + '</p>';
    return '<p class="product-data-line">' + t + '</p>';
  }).join('');
}

function renderProducts() {
  if (!productsGrid) return;
  if (products.length === 0) {
    productsGrid.innerHTML = '<p class="products-loading">جاري تحميل الباقات...</p>';
    return;
  }
  productsGrid.innerHTML = products.map(function(p) {
    var price = p.price || 0;
    var discountP = (p.discountPercent != null ? p.discountPercent : 0) || 0;
    var finalPrice = discountP > 0 ? Math.round(price * (100 - discountP) / 100) : price;
    var qtyMax = Math.min(10, (p.quantity != null ? p.quantity : 999));
    var longDesc = formatLongDesc(p.longDescription);
    return '<article class="plan-card product-card ' + (p.planClass || '') + '">' +
      '<div class="product-image-wrap"><img src="' + escapeHtml(p.image || 'plan-monthly.png') + '" alt="' + escapeHtml(p.title) + '" class="product-image"></div>' +
      '<span class="product-badge plan-badge">' + escapeHtml(p.period || p.title) + '</span>' +
      '<h3 class="product-title">' + escapeHtml(p.title) + '</h3>' +
      '<p class="product-desc">' + escapeHtml(p.desc || '') + '</p>' +
      '<div class="product-price-wrap">' +
        (discountP > 0 ? '<span class="product-price-old">' + price + ' ر.س</span> ' : '') +
        '<span class="product-price">' + finalPrice + ' ر.س</span>' +
        (discountP > 0 ? ' <span class="product-discount-badge">خصم ' + discountP + '%</span>' : '') +
      '</div>' +
      '<label class="product-qty-label"><span>الكمية</span><select class="product-qty-select" data-id="' + p.id + '">' +
        Array.from({ length: qtyMax }, function(_, i) { return '<option value="' + (i + 1) + '">' + (i + 1) + '</option>'; }).join('') +
      '</select></label>' +
      (longDesc ? '<div class="product-data-block"><strong>بيانات المنتج</strong><div class="product-data-content">' + longDesc + '</div></div>' : '') +
      '<button type="button" class="add-to-cart-btn" data-id="' + p.id + '">أضف إلى السلة</button>' +
    '</article>';
  }).join('');

  productsGrid.querySelectorAll('.add-to-cart-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = parseInt(btn.dataset.id, 10);
      var product = products.find(function(x) { return x.id === id; });
      if (!product) return;
      var select = productsGrid.querySelector('.product-qty-select[data-id="' + id + '"]');
      var qty = select ? parseInt(select.value, 10) : 1;
      var discountP = (product.discountPercent != null ? product.discountPercent : 0) || 0;
      var price = discountP > 0 ? Math.round((product.price || 0) * (100 - discountP) / 100) : (product.price || 0);
      addToCart({ ...product, price: price }, qty);
      cartSidebar.classList.add('open');
      cartOverlay.classList.add('open');
    });
  });
}

function addToCart(product, qty) {
  qty = qty || 1;
  var existing = cart.find(function(x) { return x.id === product.id; });
  if (existing) existing.qty += qty;
  else cart.push({ ...product, qty: qty });
  saveCart();
  updateCartUI();
}

function removeFromCart(id) {
  cart = cart.filter(function(x) { return x.id !== id; });
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('hayatCart', JSON.stringify(cart));
}

function updateCartUI() {
  var total = cart.reduce(function(sum, i) { return sum + (i.price || 0) * i.qty; }, 0);
  var count = cart.reduce(function(sum, i) { return sum + i.qty; }, 0);
  if (cartCount) cartCount.textContent = count;

  if (cart.length === 0) {
    if (cartItems) cartItems.innerHTML = '<p class="cart-empty">السلة فارغة. أضف منتجات من المتجر.</p>';
    if (cartTotal) cartTotal.textContent = '٠ ر.س';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }
  if (checkoutBtn) checkoutBtn.disabled = false;
  if (cartItems) {
    cartItems.innerHTML = cart.map(function(i) {
      return '<div class="cart-item" data-id="' + i.id + '">' +
        '<div class="cart-item-info">' +
          '<div class="name">' + escapeHtml(i.title) + ' × ' + i.qty + '</div>' +
          '<div class="price">' + ((i.price || 0) * i.qty) + ' ر.س</div>' +
        '</div>' +
        '<button type="button" class="cart-item-remove" aria-label="حذف">🗑️</button>' +
      '</div>';
    }).join('');
    cartItems.querySelectorAll('.cart-item-remove').forEach(function(btn) {
      btn.addEventListener('click', function() {
        removeFromCart(parseInt(btn.closest('.cart-item').dataset.id, 10));
      });
    });
  }
  if (cartTotal) cartTotal.textContent = total + ' ر.س';
}

function getSubtotal() {
  return cart.reduce(function(s, i) { return s + (i.price || 0) * i.qty; }, 0);
}

function getDiscountAmount(subtotal) {
  if (!appliedCoupon || !appliedCoupon.valid) return 0;
  if (appliedCoupon.type === 'percent') return Math.round(subtotal * (appliedCoupon.value || 0) / 100);
  return Math.min(appliedCoupon.value || 0, subtotal);
}

function updateCheckoutSummary() {
  var sub = getSubtotal();
  var discount = getDiscountAmount(sub);
  var opt = shippingOptions.find(function(o) { return o.id === (shippingSelect && shippingSelect.value); });
  var ship = opt ? opt.price : 0;
  var total = Math.max(0, sub - discount + ship);
  if (subtotalEl) subtotalEl.textContent = sub + ' ر.س';
  if (discountEl) discountEl.textContent = discount + ' ر.س';
  if (shippingEl) shippingEl.textContent = ship + ' ر.س';
  if (totalEl) totalEl.textContent = total + ' ر.س';
}

async function applyCoupon() {
  var code = (couponInput && couponInput.value || '').trim();
  if (!code) {
    appliedCoupon = null;
    if (couponMsg) couponMsg.textContent = '';
    updateCheckoutSummary();
    return;
  }
  try {
    var res = await fetch('/api/coupon/' + encodeURIComponent(code));
    var data = await res.json();
    if (data.valid) {
      appliedCoupon = { valid: true, type: data.type || 'percent', value: data.value || 0 };
      if (couponMsg) { couponMsg.textContent = 'تم تطبيق الخصم'; couponMsg.style.color = 'var(--primary)'; }
    } else {
      appliedCoupon = null;
      if (couponMsg) { couponMsg.textContent = 'كود غير صالح'; couponMsg.style.color = '#f85149'; }
    }
  } catch (e) {
    appliedCoupon = null;
    if (couponMsg) couponMsg.textContent = '';
  }
  updateCheckoutSummary();
}

async function loadShippingOptions() {
  try {
    var res = await fetch('/api/shipping/options');
    var data = await res.json();
    if (data.success && data.options && data.options.length) {
      shippingOptions = data.options;
      shippingSelect.innerHTML = '<option value="">اختر التوصيل...</option>' +
        data.options.map(function(o) { return '<option value="' + o.id + '">' + o.label + ' — ' + o.price + ' ر.س (' + o.days + ')</option>'; }).join('');
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
  appliedCoupon = null;
  if (couponInput) couponInput.value = '';
  if (couponMsg) couponMsg.textContent = '';
  loadShippingOptions();
  checkoutModal.classList.add('open');
}

function closeCheckoutModal() {
  checkoutModal.classList.remove('open');
}

if (shippingSelect) shippingSelect.addEventListener('change', updateCheckoutSummary);
if (couponInput) couponInput.addEventListener('blur', applyCoupon);

checkoutForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  var form = e.target;
  var submitBtn = form.querySelector('.submit-order');
  var selectedShip = shippingOptions.find(function(o) { return o.id === (shippingSelect && shippingSelect.value); });
  var shippingCost = selectedShip ? selectedShip.price : 0;
  var subtotal = getSubtotal();
  var discount = getDiscountAmount(subtotal);
  var totalWithShipping = Math.max(0, subtotal - discount + shippingCost);

  var data = {
    name: form.name.value,
    phone: form.phone.value,
    email: form.email.value,
    address: form.address.value,
    notes: form.notes.value,
    items: cart,
    total: subtotal,
    shippingOptionId: (shippingSelect && shippingSelect.value) || 'none',
    shippingCost: shippingCost,
    couponCode: (couponInput && couponInput.value) || '',
    discountAmount: discount
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'جاري الإرسال...';

  try {
    var res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    var result = await res.json();

    if (result.success && result.paymentRequired && result.orderId && storeConfig.paymentGateway === 'moyasar') {
      var payRes = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: result.orderId,
          amount: totalWithShipping,
          description: 'طلب #' + result.orderId + ' — حياة'
        })
      });
      var payData = await payRes.json();
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
    alert('تعذر الاتصال بالخادم. حاول لاحقاً.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'تأكيد الطلب';
  }
});

cartBtn.addEventListener('click', function() {
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('open');
});
closeCart.addEventListener('click', closeCartSidebar);
cartOverlay.addEventListener('click', closeCartSidebar);
checkoutBtn.addEventListener('click', openCheckout);
closeModal.addEventListener('click', closeCheckoutModal);
checkoutModal.addEventListener('click', function(e) { if (e.target === checkoutModal) closeCheckoutModal(); });

function closeCartSidebar() {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.remove('open');
}

fetch('/api/health').then(function(r) { return r.json(); }).then(function(d) { if (d.ok) window.__backendConnected = true; }).catch(function() { window.__backendConnected = false; });
fetch('/api/config').then(function(r) { return r.json(); }).then(function(c) { storeConfig = c; }).catch(function() {});

fetch('/api/products')
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success && Array.isArray(data.products)) products = data.products;
    renderProducts();
  })
  .catch(function() {
    products = [
      { id: 1, period: 'شهري', title: 'شهري', desc: 'لا محدود بدون استخدام عادل', price: 269, planClass: 'plan-monthly', image: 'plan-monthly.png', quantity: 999 },
      { id: 2, period: '3 شهور', title: '٣ شهور', desc: 'لا محدود بدون استخدام عادل', price: 719, planClass: 'plan-3months', image: 'plan-3months.png', quantity: 999 },
      { id: 3, period: '6 شهور', title: '٦ شهور', desc: 'لا محدود بدون استخدام عادل', price: 1349, planClass: 'plan-6months', image: 'plan-6months.png', quantity: 999 },
      { id: 4, period: 'سنة', title: 'سنة', desc: 'لا محدود بدون استخدام عادل', price: 2200, planClass: 'plan-year', image: 'plan-year.png', quantity: 999 }
    ];
    renderProducts();
  });

if (paymentSuccessToast) {
  var params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'success' && params.get('orderId')) {
    paymentSuccessToast.classList.add('show');
    setTimeout(function() { paymentSuccessToast.classList.remove('show'); }, 5000);
    history.replaceState({}, '', window.location.pathname);
  }
}

var supportForm = document.getElementById('supportForm');
if (supportForm) {
  supportForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    var msgEl = document.getElementById('supportFormMsg');
    var btn = supportForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      var res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: supportForm.name.value.trim(),
          phone: supportForm.phone.value.trim(),
          email: supportForm.email.value.trim(),
          subject: supportForm.subject.value.trim(),
          message: supportForm.message.value.trim()
        })
      });
      var data = await res.json();
      if (data.success) {
        if (msgEl) { msgEl.textContent = 'تم إرسال رسالتك. سنتواصل معك قريباً.'; msgEl.style.color = 'var(--primary)'; }
        supportForm.reset();
      } else {
        if (msgEl) { msgEl.textContent = data.message || 'فشل الإرسال'; msgEl.style.color = '#f85149'; }
      }
    } catch (err) {
      if (msgEl) { msgEl.textContent = 'تعذر الاتصال. حاول لاحقاً.'; msgEl.style.color = '#f85149'; }
    }
    btn.disabled = false;
  });
}

setTimeout(function() {
  var el = document.getElementById('backendStatus');
  if (!el) return;
  if (window.__backendConnected === true) {
    el.textContent = 'متصل بالباك إند';
    el.classList.add('backend-ok');
  } else {
    el.textContent = 'غير متصل — شغّل السيرفر أو افتح الموقع من رابط الاستضافة';
    el.classList.add('backend-off');
  }
}, 800);

updateCartUI();
