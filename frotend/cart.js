
/* =========================================================
   KALASETU - CART WITH PRICE BREAKDOWN
========================================================= */

const cartList = document.getElementById("cartList");
const cartSummary = document.getElementById("cartSummary");
const subtotalElement = document.getElementById("subtotal");
const totalElement = document.getElementById("total");

let cart = [];

try {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (!Array.isArray(cart)) cart = [];
} catch (error) {
    cart = [];
}


/* ================= PRICE FORMAT ================= */

function formatMoney(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


/* ================= GET BREAKDOWN ================= */

function getBreakdown(item) {

    if (item.priceBreakdown) {

        const b = item.priceBreakdown;

        return {
            creatorPrice: Number(b.creatorPrice) || 0,
            materials: Number(b.materials) || 0,
            packaging: Number(b.packaging) || 0,
            platformServices: Number(b.platformServices) || 0,
            total: Number(b.total) || Number(item.price) || 0
        };
    }

    // Fallback for older cart items

    const price = Number(item.price) || 0;

    const creator = Math.round(price * 60) / 100;
    const materials = Math.round(price * 20) / 100;
    const packaging = Math.round(price * 10) / 100;

    return {
        creatorPrice: creator,
        materials: materials,
        packaging: packaging,
        platformServices: Math.round(
            (price - creator - materials - packaging) * 100
        ) / 100,
        total: price
    };
}


/* ================= DISPLAY CART ================= */

function displayCart() {

    if (cart.length === 0) {

        cartList.innerHTML = `
            <div class="empty-cart">

                <div class="empty-cart-icon">🛒</div>

                <h3>Your Cart is Empty</h3>

                <p>
                    You haven't added any crafts to your cart yet.
                    Explore beautiful handmade crafts and add your favourites here.
                </p>

                <a href="customer-home.html" class="explore-btn">
                    Explore Crafts
                </a>

            </div>
        `;

        cartSummary.style.display = "none";
        updateCartStorage();
        return;
    }

    cartSummary.style.display = "block";
    cartList.innerHTML = "";

    cart.forEach((item, index) => {

        const quantity = Math.max(1, Number(item.quantity) || 1);
        const breakdown = getBreakdown(item);

        const itemTotal = breakdown.total * quantity;

        const card = document.createElement("div");

        card.className = "cart-item";

        card.innerHTML = `

            <div class="cart-item-image">

                <img
                    src="${escapeHTML(item.image || "images/kalasetu-logo.png")}"
                    alt="${escapeHTML(item.name)}"
                >

            </div>

            <div class="cart-item-info">

                <h3>${escapeHTML(item.name)}</h3>

                <p>${escapeHTML(item.category || "")}</p>

                <span class="cart-item-price">
                    ${formatMoney(breakdown.total)}
                </span>

                <div class="cart-price-breakdown">

                    <h4>Price Breakdown</h4>

                    <div class="cart-price-row">
                        <span>Creator Price</span>
                        <span>${formatMoney(breakdown.creatorPrice * quantity)}</span>
                    </div>

                    <div class="cart-price-row">
                        <span>Materials</span>
                        <span>${formatMoney(breakdown.materials * quantity)}</span>
                    </div>

                    <div class="cart-price-row">
                        <span>Packaging</span>
                        <span>${formatMoney(breakdown.packaging * quantity)}</span>
                    </div>

                    <div class="cart-price-row">
                        <span>Platform & Services</span>
                        <span>${formatMoney(breakdown.platformServices * quantity)}</span>
                    </div>

                    <div class="cart-price-row cart-item-total">
                        <strong>You Pay</strong>
                        <strong>${formatMoney(itemTotal)}</strong>
                    </div>

                </div>

            </div>

            <div class="quantity-box">

                <button type="button" onclick="decreaseQuantity(${index})">
                    −
                </button>

                <span>${quantity}</span>

                <button type="button" onclick="increaseQuantity(${index})">
                    +
                </button>

            </div>

            <button
                type="button"
                class="remove-cart"
                onclick="removeFromCart(${index})"
            >
                Remove
            </button>

        `;

        cartList.appendChild(card);

    });

    updateTotal();
}


/* ================= HTML ESCAPE ================= */

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);

}


/* ================= INCREASE ================= */

function increaseQuantity(index) {

    if (!cart[index]) return;

    cart[index].quantity =
        (Number(cart[index].quantity) || 1) + 1;

    saveCart();
    displayCart();
}


/* ================= DECREASE ================= */

function decreaseQuantity(index) {

    if (!cart[index]) return;

    if (Number(cart[index].quantity) > 1) {
        cart[index].quantity--;
    } else {
        cart.splice(index, 1);
    }

    saveCart();
    displayCart();
}


/* ================= REMOVE ================= */

function removeFromCart(index) {

    cart.splice(index, 1);

    saveCart();
    displayCart();
}


/* ================= TOTAL ================= */

function updateTotal() {

    let subtotal = 0;

    cart.forEach(item => {

        const breakdown = getBreakdown(item);

        subtotal +=
            breakdown.total * (Number(item.quantity) || 1);

    });

    subtotalElement.textContent = formatMoney(subtotal);
    totalElement.textContent = formatMoney(subtotal);
}


/* ================= SAVE ================= */

function updateCartStorage() {

    localStorage.setItem("cart", JSON.stringify(cart));

}

function saveCart() {
    updateCartStorage();
}


/* ================= CHECKOUT ================= */

function proceedToCheckout() {

    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    localStorage.setItem(
        "checkoutCart",
        JSON.stringify(cart)
    );

    if (cart.length === 1) {
        localStorage.setItem(
            "currentOrder",
            JSON.stringify(cart[0])
        );
    }

    window.location.href = "checkout.html";
}


/* ================= START ================= */

displayCart();
