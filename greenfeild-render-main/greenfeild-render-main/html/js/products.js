/* ============================================================
   products.js — filters + cart + checkout (improved)
   ============================================================ */

/* ---- Filter state ---- */
var cards    = document.querySelectorAll(".card");
var sections = document.querySelectorAll(".cat-section");
var catBtns  = document.querySelectorAll(".cat-btn");

var selectedCat    = "all";
var selectedPrice  = 20;
var selectedStock  = false;
var selectedSearch = "";

/* ---- Cart state ---- */
var cart = JSON.parse(localStorage.getItem("gfh_cart") || "[]");

/* ============================================================
   FILTER
   ============================================================ */
function filterCards() {
    var count = 0;
    for (var i = 0; i < cards.length; i++) {
        var card    = cards[i];
        var cat     = card.getAttribute("data-cat");
        var price   = parseFloat(card.getAttribute("data-price"));
        var stock   = card.getAttribute("data-stock");
        var name    = card.getAttribute("data-name");
        var catOk   = selectedCat === "all" || cat === selectedCat;
        var priceOk = price <= selectedPrice;
        var stockOk = !selectedStock || stock === "in";
        var searchOk= name.includes(selectedSearch);
        if (catOk && priceOk && stockOk && searchOk) { card.style.display = ""; count++; }
        else { card.style.display = "none"; }
    }
    document.getElementById("count").textContent = "Showing " + count + " products";
    document.getElementById("empty").style.display = count === 0 ? "block" : "none";
    for (var i = 0; i < sections.length; i++) {
        var vis = false;
        sections[i].querySelectorAll(".card").forEach(function(c){ if(c.style.display !== "none") vis = true; });
        sections[i].style.display = vis ? "" : "none";
    }
}

for (var i = 0; i < catBtns.length; i++) {
    catBtns[i].addEventListener("click", function () {
        for (var k = 0; k < catBtns.length; k++) catBtns[k].classList.remove("active");
        this.classList.add("active");
        selectedCat = this.getAttribute("data-cat");
        filterCards();
    });
}
document.getElementById("search").addEventListener("input", function () {
    selectedSearch = this.value.toLowerCase(); filterCards();
});
document.getElementById("priceRange").addEventListener("input", function () {
    selectedPrice = parseFloat(this.value);
    document.getElementById("priceVal").textContent = "£" + selectedPrice.toFixed(2);
    filterCards();
});
document.getElementById("stockOnly").addEventListener("change", function () {
    selectedStock = this.checked; filterCards();
});
document.getElementById("sort").addEventListener("change", function () {
    var val = this.value;
    if (!val) return;
    var allCards = Array.from(document.querySelectorAll(".card"));
    allCards.sort(function (a, b) {
        if (val === "price-asc")  return parseFloat(a.getAttribute("data-price")) - parseFloat(b.getAttribute("data-price"));
        if (val === "price-desc") return parseFloat(b.getAttribute("data-price")) - parseFloat(a.getAttribute("data-price"));
        if (val === "az")         return a.getAttribute("data-name").localeCompare(b.getAttribute("data-name"));
        return 0;
    });
    allCards.forEach(function (c) { c.parentNode.appendChild(c); });
});

/* ============================================================
   CART
   ============================================================ */
function saveCart() { localStorage.setItem("gfh_cart", JSON.stringify(cart)); }

function getCardData(card) {
    return {
        id    : card.getAttribute("data-name").toLowerCase().replace(/\s+/g, "-"),
        name  : card.querySelector("h3").textContent.trim(),
        img   : card.querySelector("img").getAttribute("src"),
        unit  : card.querySelector(".card-price span").textContent.trim(),
        price : parseFloat(card.getAttribute("data-price"))
    };
}

function addCart(btn) {
    btn.textContent = "✓ Added!";
    btn.classList.add("added");
    setTimeout(function () { btn.textContent = "Add to Cart"; btn.classList.remove("added"); }, 1400);
    var card = btn.closest(".card");
    if (!card) return;
    var data = getCardData(card);
    var ex = cart.find(function(i){ return i.id === data.id; });
    if (ex) ex.qty++;
    else cart.push({ id: data.id, name: data.name, price: data.price, unit: data.unit, img: data.img, qty: 1 });
    saveCart();
    renderCart();
    bumpBadge();
    if (!document.getElementById("cartDrawer").classList.contains("open") && cart.length === 1) toggleCart();
}

function toggleCart() {
    document.getElementById("cartDrawer").classList.toggle("open");
    document.getElementById("cartOverlay").classList.toggle("open");
}

function bumpBadge() {
    var b = document.getElementById("cartBadge");
    b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
    setTimeout(function(){ b.classList.remove("bump"); }, 220);
}

function changeQty(id, delta) {
    var item = cart.find(function(i){ return i.id === id; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) { removeItem(id); return; }
    saveCart();
    renderCart();
}

function removeItem(id) {
    cart = cart.filter(function(i){ return i.id !== id; });
    saveCart(); renderCart();
}

function renderCart() {
    var badge    = document.getElementById("cartBadge");
    var itemsEl  = document.getElementById("cartItems");
    var emptyEl  = document.getElementById("cartEmpty");
    var footerEl = document.getElementById("cartFooter");
    var totalEl  = document.getElementById("cartTotal");
    var totalQty = cart.reduce(function(s,i){ return s+i.qty; }, 0);
    badge.textContent = totalQty;
    if (cart.length === 0) {
        itemsEl.innerHTML = ""; emptyEl.style.display = "flex"; footerEl.style.display = "none"; return;
    }
    emptyEl.style.display = "none"; footerEl.style.display = "block";
    var html = "";
    cart.forEach(function(item) {
        html += '<div class="cart-item">' +
            '<img class="cart-item-img" src="' + item.img + '" alt="' + item.name + '">' +
            '<div class="cart-item-info">' +
                '<div class="cart-item-name">' + item.name + '</div>' +
                '<div class="cart-item-unit">' + item.unit + '</div>' +
                '<div class="cart-item-controls">' +
                    '<button class="qty-btn" onclick="changeQty(\'' + item.id + '\',-1)">−</button>' +
                    '<span class="qty-val">' + item.qty + '</span>' +
                    '<button class="qty-btn" onclick="changeQty(\'' + item.id + '\',1)">+</button>' +
                '</div>' +
                '<button class="cart-item-remove" onclick="removeItem(\'' + item.id + '\')">Remove</button>' +
            '</div>' +
            '<div class="cart-item-price">£' + (item.price * item.qty).toFixed(2) + '</div>' +
        '</div>';
    });
    itemsEl.innerHTML = html;
    totalEl.textContent = "£" + cart.reduce(function(s,i){ return s+i.price*i.qty; }, 0).toFixed(2);
}

/* ============================================================
   CHECKOUT MODAL — injects itself into the DOM
   ============================================================ */
var checkoutStep = 1;

(function buildModal() {
    var el = document.createElement("div");
    el.id  = "checkoutModal";
    el.innerHTML = [
    '<div class="co-backdrop" onclick="closeCheckout()"></div>',
    '<div class="co-panel">',

      /* Progress bar */
      '<div class="co-progress">',
        '<div class="co-prog-track"><div class="co-prog-fill" id="coProgFill"></div></div>',
        '<div class="co-steps">',
          '<div class="co-step active" id="cstep1"><div class="co-step-num">1</div><span>Delivery</span></div>',
          '<div class="co-step-line"></div>',
          '<div class="co-step" id="cstep2"><div class="co-step-num">2</div><span>Payment</span></div>',
          '<div class="co-step-line"></div>',
          '<div class="co-step" id="cstep3"><div class="co-step-num">3</div><span>Confirm</span></div>',
        '</div>',
      '</div>',

      /* STEP 1 — Delivery */
      '<div class="co-body" id="co-s1">',
        '<h2 class="co-title">🏡 Delivery details</h2>',
        '<div class="co-row">',
          '<label>First name <span class="req">*</span><input type="text" id="co-fname" placeholder="Jane" autocomplete="given-name"></label>',
          '<label>Last name <span class="req">*</span><input type="text" id="co-lname" placeholder="Smith" autocomplete="family-name"></label>',
        '</div>',
        '<label class="co-full">Email address <span class="req">*</span><input type="email" id="co-email" placeholder="jane@example.com" autocomplete="email"></label>',
        '<label class="co-full">Phone number <span class="req">*</span><input type="tel" id="co-phone" placeholder="+44 7700 900000" autocomplete="tel"></label>',
        '<label class="co-full">Address line 1 <span class="req">*</span><input type="text" id="co-addr1" placeholder="12 Greenfield Lane" autocomplete="address-line1"></label>',
        '<label class="co-full">Address line 2<input type="text" id="co-addr2" placeholder="Flat / Suite (optional)" autocomplete="address-line2"></label>',
        '<div class="co-row">',
          '<label>Town / City <span class="req">*</span><input type="text" id="co-city" placeholder="Midsomer Norton" autocomplete="address-level2"></label>',
          '<label>Postcode <span class="req">*</span><input type="text" id="co-post" placeholder="BA3 2AA" autocomplete="postal-code"></label>',
        '</div>',
        '<div class="co-delivery-opts">',
          '<p class="co-opts-label">Delivery method</p>',
          '<label class="co-radio"><input type="radio" name="delivery" value="standard" checked>',
            '<div class="co-radio-body"><strong>Standard delivery</strong><span>Free &nbsp;·&nbsp; 3–5 working days</span></div>',
            '<div class="co-radio-price free">FREE</div>',
          '</label>',
          '<label class="co-radio"><input type="radio" name="delivery" value="express">',
            '<div class="co-radio-body"><strong>Express delivery</strong><span>£3.99 &nbsp;·&nbsp; Next working day</span></div>',
            '<div class="co-radio-price">£3.99</div>',
          '</label>',
        '</div>',
      '</div>',

      /* STEP 2 — Payment */
      '<div class="co-body" id="co-s2" style="display:none">',
        '<h2 class="co-title">💳 Payment</h2>',
        '<label class="co-full">Name on card <span class="req">*</span><input type="text" id="co-cname" placeholder="Jane Smith" autocomplete="cc-name"></label>',
        '<label class="co-full">Card number <span class="req">*</span>',
          '<div class="co-card-wrap">',
            '<input type="text" id="co-cardnum" placeholder="1234  5678  9012  3456" maxlength="19" oninput="fmtCard(this)" autocomplete="cc-number">',
            '<span class="co-card-icons">',
              '<svg width="30" height="19" viewBox="0 0 38 24"><rect width="38" height="24" rx="4" fill="#1A1F71"/><rect y="7" width="38" height="6" fill="#F7B600"/></svg>',
              '<svg width="30" height="19" viewBox="0 0 38 24"><rect width="38" height="24" rx="4" fill="#EB001B" opacity=".9"/><circle cx="23" cy="12" r="9" fill="#F79E1B"/><path d="M19 12a9 9 0 019-9 9 9 0 010 18 9 9 0 01-9-9z" fill="#FF5F00"/></svg>',
            '</span>',
          '</div>',
        '</label>',
        '<div class="co-row">',
          '<label>Expiry date <span class="req">*</span><input type="text" id="co-exp" placeholder="MM / YY" maxlength="7" oninput="fmtExpiry(this)" autocomplete="cc-exp"></label>',
          '<label>CVV <span class="req">*</span>',
            '<div style="position:relative">',
              '<input type="text" id="co-cvv" placeholder="123" maxlength="4" autocomplete="cc-csc">',
              '<span class="co-cvv-tip" title="3 digits on back of card (Amex: 4 digits on front)">?</span>',
            '</div>',
          '</label>',
        '</div>',
        '<div class="co-secure-badge">',
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
          'SSL encrypted &amp; secure payment',
        '</div>',
        '<div class="co-order-summary" id="co-summary"></div>',
      '</div>',

      /* STEP 3 — Confirmation */
      '<div class="co-body" id="co-s3" style="display:none">',
        '<div class="co-success-anim">',
          '<svg class="co-check-svg" viewBox="0 0 52 52"><circle class="co-check-circle" cx="26" cy="26" r="24"/><path class="co-check-tick" d="M14 27l8 8 16-16"/></svg>',
        '</div>',
        '<h2 class="co-title" style="text-align:center">Order placed! 🎉</h2>',
        '<p class="co-confirm-msg">A confirmation has been sent to <strong id="co-confirm-email"></strong>.</p>',
        '<div class="co-ref-box">Order reference: <strong id="co-ref"></strong></div>',
        '<div class="co-confirm-items" id="co-confirm-items"></div>',
        '<p class="co-eta" id="co-eta"></p>',
      '</div>',

      /* Footer */
      '<div class="co-footer">',
        '<button class="co-btn-ghost" id="co-back" onclick="checkoutBack()">← Back</button>',
        '<button class="co-btn-ghost" id="co-cancel" onclick="closeCheckout()">Cancel</button>',
        '<button class="co-btn-primary" id="co-next" onclick="checkoutNext()">Continue →</button>',
      '</div>',

    '</div>'
    ].join("");
    document.body.appendChild(el);
})();

/* ---- Open / Close ---- */
function openCheckout() {
    if (cart.length === 0) { alert("Your basket is empty!"); return; }
    checkoutStep = 1;
    renderCheckoutStep();
    document.getElementById("checkoutModal").classList.add("open");
    document.getElementById("cartDrawer").classList.remove("open");
    document.getElementById("cartOverlay").classList.remove("open");
}
function closeCheckout() {
    document.getElementById("checkoutModal").classList.remove("open");
}

/* ---- Navigate ---- */
function checkoutNext() {
    if (checkoutStep === 1) {
        if (!validateDelivery()) return;
        checkoutStep = 2;
        buildPaymentSummary();
    } else if (checkoutStep === 2) {
        if (!validatePayment()) return;
        checkoutStep = 3;
        sendOrderToServer();       // <-- SEND ORDER HERE when Place Order is clicked
        buildConfirmation();
    } else {
        cart = []; saveCart(); renderCart(); closeCheckout();
    }
    renderCheckoutStep();
}
function checkoutBack() {
    if (checkoutStep > 1 && checkoutStep < 3) { checkoutStep--; renderCheckoutStep(); }
}

/* ---- Render step UI ---- */
function renderCheckoutStep() {
    [1,2,3].forEach(function(n){
        document.getElementById("co-s"    + n).style.display = n === checkoutStep ? "block" : "none";
        var stepEl = document.getElementById("cstep" + n);
        stepEl.classList.toggle("active",   n === checkoutStep);
        stepEl.classList.toggle("complete", n < checkoutStep);
    });
    var pct = checkoutStep === 1 ? "33%" : checkoutStep === 2 ? "66%" : "100%";
    document.getElementById("coProgFill").style.width = pct;

    var back   = document.getElementById("co-back");
    var cancel = document.getElementById("co-cancel");
    var next   = document.getElementById("co-next");
    back.style.display   = (checkoutStep > 1 && checkoutStep < 3) ? "inline-flex" : "none";
    cancel.style.display = checkoutStep === 3 ? "none" : "inline-flex";
    next.textContent = checkoutStep === 1 ? "Continue →" : checkoutStep === 2 ? "Place Order →" : "Done ✓";
    if (checkoutStep === 3) next.classList.add("done"); else next.classList.remove("done");
}

/* ---- Validation ---- */
function validateDelivery() {
    var required = ["co-fname","co-lname","co-email","co-phone","co-addr1","co-city","co-post"];
    for (var i = 0; i < required.length; i++) {
        var el = document.getElementById(required[i]);
        if (!el.value.trim()) { el.focus(); shakeField(el); showFieldError(el, "This field is required"); return false; }
        clearFieldError(el);
    }
    var emailEl = document.getElementById("co-email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
        emailEl.focus(); shakeField(emailEl); showFieldError(emailEl, "Enter a valid email address"); return false;
    }
    return true;
}
function validatePayment() {
    var required = ["co-cname","co-cardnum","co-exp","co-cvv"];
    for (var i = 0; i < required.length; i++) {
        var el = document.getElementById(required[i]);
        if (!el.value.trim()) { el.focus(); shakeField(el); showFieldError(el, "Required"); return false; }
        clearFieldError(el);
    }
    var num = document.getElementById("co-cardnum").value.replace(/\s/g,"");
    if (num.length < 16) { shakeField(document.getElementById("co-cardnum")); showFieldError(document.getElementById("co-cardnum"), "Enter a valid 16-digit card number"); return false; }
    var exp = document.getElementById("co-exp").value.replace(/\s/g,"");
    if (!/^\d{2}\/\d{2}$/.test(exp)) { shakeField(document.getElementById("co-exp")); showFieldError(document.getElementById("co-exp"), "Enter MM/YY format"); return false; }
    return true;
}

function showFieldError(el, msg) {
    clearFieldError(el);
    el.classList.add("co-input-error");
    var err = document.createElement("span");
    err.className = "co-error-msg";
    err.textContent = msg;
    el.parentNode.appendChild(err);
}
function clearFieldError(el) {
    el.classList.remove("co-input-error");
    var prev = el.parentNode.querySelector(".co-error-msg");
    if (prev) prev.remove();
}
function shakeField(el) {
    el.classList.remove("co-shake"); void el.offsetWidth; el.classList.add("co-shake");
    setTimeout(function(){ el.classList.remove("co-shake"); }, 500);
}

/* ---- Formatters ---- */
function fmtCard(el) {
    var v = el.value.replace(/\D/g,"").slice(0,16);
    el.value = v.replace(/(.{4})/g,"$1 ").trim();
}
function fmtExpiry(el) {
    var v = el.value.replace(/\D/g,"").slice(0,4);
    if (v.length >= 3) v = v.slice(0,2) + " / " + v.slice(2);
    el.value = v;
}

/* ---- Summary builders ---- */
function getDeliveryCost() {
    var sel = document.querySelector('input[name="delivery"]:checked');
    return sel && sel.value === "express" ? 3.99 : 0;
}
function buildPaymentSummary() {
    var dc  = getDeliveryCost();
    var sub = cart.reduce(function(s,i){ return s + i.price*i.qty; }, 0);
    var tot = sub + dc;
    var html = '<div class="co-summary-title">Order summary</div>';
    cart.forEach(function(item){
        html += '<div class="co-summary-row">' +
            '<span class="co-sum-name"><img src="' + item.img + '" class="co-sum-img">' + item.name + ' <em>× ' + item.qty + '</em></span>' +
            '<span>£' + (item.price*item.qty).toFixed(2) + '</span></div>';
    });
    html += '<div class="co-summary-row co-summary-delivery">' +
        '<span>' + (dc > 0 ? 'Express delivery' : 'Standard delivery') + '</span>' +
        '<span>' + (dc > 0 ? '£' + dc.toFixed(2) : 'Free') + '</span></div>';
    html += '<div class="co-summary-row co-summary-total"><span>Total</span><strong>£' + tot.toFixed(2) + '</strong></div>';
    document.getElementById("co-summary").innerHTML = html;
}
function buildConfirmation() {
    var dc  = getDeliveryCost();
    var sub = cart.reduce(function(s,i){ return s + i.price*i.qty; }, 0);
    var tot = (sub + dc).toFixed(2);
    var ref = "GFH-" + Date.now().toString(36).toUpperCase().slice(-7);
    document.getElementById("co-ref").textContent           = ref;
    document.getElementById("co-confirm-email").textContent = document.getElementById("co-email").value.trim();
    document.getElementById("co-eta").textContent = dc > 0
        ? "🚚 Expected delivery: tomorrow before 5 pm"
        : "🚚 Expected delivery: within 3–5 working days";
    var html = "";
    cart.forEach(function(item){
        html += '<div class="co-confirm-row">' +
            '<img src="' + item.img + '" alt="' + item.name + '">' +
            '<span>' + item.name + ' × ' + item.qty + '</span>' +
            '<span>£' + (item.price*item.qty).toFixed(2) + '</span>' +
        '</div>';
    });
    html += '<div class="co-confirm-total">Total paid: <strong>£' + tot + '</strong></div>';
    document.getElementById("co-confirm-items").innerHTML = html;
}

/* ---- Wire checkout button ---- */
document.addEventListener("DOMContentLoaded", function () {
    var btn = document.querySelector(".checkout-btn");
    if (btn) btn.addEventListener("click", openCheckout);
});

/* ---- Init ---- */
renderCart();

/* ============================================================
   This will allow the ORDER TO send to BACKEND (MongoDB via Node.js)
   ============================================================ */
function sendOrderToServer() {
    var dc = getDeliveryCost();
    var order = {
        fname:        document.getElementById("co-fname").value.trim(),
        lname:        document.getElementById("co-lname").value.trim(),
        email:        document.getElementById("co-email").value.trim(),
        phone:        document.getElementById("co-phone").value.trim(),
        address1:     document.getElementById("co-addr1").value.trim(),
        address2:     document.getElementById("co-addr2").value.trim(),
        city:         document.getElementById("co-city").value.trim(),
        postcode:     document.getElementById("co-post").value.trim(),
        items:        cart,
        deliveryType: dc > 0 ? "express" : "standard",
        deliveryCost: dc,
        total:        cart.reduce(function(s,i){ return s + i.price*i.qty; }, 0) + dc
    };

    fetch("http://localhost:3000/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
    })
    .then(function(res){ return res.json(); })
    .then(function(data){ console.log("Order saved:", data); })
    .catch(function(err){ console.error("Order failed:", err); });
}