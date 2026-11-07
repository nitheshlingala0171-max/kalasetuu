
/* =========================================================
   KALASETU - CHECKOUT JAVASCRIPT
   Price Breakdown + PostgreSQL Backend
========================================================= */

const checkoutItems = document.getElementById("checkoutItems");
const checkoutTotal = document.getElementById("checkoutTotal");

let cart = [];


/* ================= PRICE FORMAT ================= */

function formatMoney(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


/* ================= PRICE CONVERSION ================= */

function getNumericPrice(value) {
    return Number(
        String(value || 0)
            .replace("₹", "")
            .replace(/,/g, "")
    ) || 0;
}


/* ================= GET PRICE BREAKDOWN ================= */

function getBreakdown(item) {

    const saved = item.priceBreakdown || {};

    if (
        item.priceBreakdown ||
        item.creatorPrice !== undefined
    ) {
        const creatorPrice =
            Number(saved.creatorPrice ?? item.creatorPrice) || 0;

        const materials =
            Number(saved.materials ?? item.materials) || 0;

        const packaging =
            Number(saved.packaging ?? item.packaging) || 0;

        const platformServices =
            Number(
                saved.platformServices ?? item.platformServices
            ) || 0;

        const total =
            Number(saved.total) ||
            getNumericPrice(item.price) ||
            (
                creatorPrice +
                materials +
                packaging +
                platformServices
            );

        return {
            creatorPrice,
            materials,
            packaging,
            platformServices,
            total
        };
    }

    // Fallback for older products

    const price = getNumericPrice(item.price);

    const creatorPrice = Math.round(price * 60) / 100;
    const materials = Math.round(price * 20) / 100;
    const packaging = Math.round(price * 10) / 100;

    return {
        creatorPrice,
        materials,
        packaging,
        platformServices:
            Math.round((price - creatorPrice - materials - packaging) * 100) / 100,
        total: price
    };
}


/* ================= LOAD CART ================= */

try {

    const savedCart =
        JSON.parse(localStorage.getItem("cart")) || [];

    const currentOrder =
        JSON.parse(localStorage.getItem("currentOrder"));

    // Buy Now flow

    if (savedCart.length === 0 && currentOrder) {

        cart = [{
            name: currentOrder.name || "Craft Product",
            image: currentOrder.image || "images/kalasetu-logo.png",
            category: currentOrder.category || "Traditional Craft",
            price: currentOrder.price || 0,
            quantity: currentOrder.quantity || 1,
            creator: currentOrder.creator || "Local Artisan",

            priceBreakdown:
                currentOrder.priceBreakdown || {
                    creatorPrice: currentOrder.creatorPrice,
                    materials: currentOrder.materials,
                    packaging: currentOrder.packaging,
                    platformServices: currentOrder.platformServices,
                    total: currentOrder.priceBreakdown?.total ||
                        getNumericPrice(currentOrder.price)
                }
        }];

    } else {

        // Add to Cart flow
        cart = savedCart;

    }

} catch (error) {

    console.error("Checkout data loading error:", error);
    cart = [];

}


/* ================= DISPLAY CHECKOUT ================= */

function displayCheckout() {

    if (cart.length === 0) {

        checkoutItems.innerHTML = `
            <div class="empty-order">
                <h3>Your Cart is Empty</h3>

                <p>
                    Please add a craft to your cart
                    before checkout.
                </p>

                <a href="customer-home.html">
                    Explore Crafts
                </a>
            </div>
        `;

        checkoutTotal.textContent = formatMoney(0);
        return;
    }

    checkoutItems.innerHTML = "";

    let total = 0;

    cart.forEach(function (item) {

        const quantity = Math.max(
            1,
            Number(item.quantity) || 1
        );

        const breakdown = getBreakdown(item);

        const itemTotal = breakdown.total * quantity;

        total += itemTotal;

        const itemElement = document.createElement("div");

        itemElement.className = "order-item";

        itemElement.innerHTML = `

            <div class="order-item-image">

                <img
                    src="${escapeHTML(item.image || "images/kalasetu-logo.png")}"
                    alt="${escapeHTML(item.name || "Craft")}"
                    onerror="this.src='images/kalasetu-logo.png'"
                >

            </div>

            <div class="order-item-info">

                <h4>
                    ${escapeHTML(item.name || "Craft Product")}
                </h4>

                <p>
                    ${escapeHTML(item.category || "Traditional Craft")}
                </p>

                <p>
                    Quantity: ${quantity}
                </p>

                <div class="checkout-price-breakdown">

                    <h4>Price Breakdown</h4>

                    <div class="checkout-price-row">
                        <span>Creator Price</span>
                        <span>${formatMoney(breakdown.creatorPrice * quantity)}</span>
                    </div>

                    <div class="checkout-price-row">
                        <span>Materials</span>
                        <span>${formatMoney(breakdown.materials * quantity)}</span>
                    </div>

                    <div class="checkout-price-row">
                        <span>Packaging</span>
                        <span>${formatMoney(breakdown.packaging * quantity)}</span>
                    </div>

                    <div class="checkout-price-row">
                        <span>Platform & Services</span>
                        <span>${formatMoney(breakdown.platformServices * quantity)}</span>
                    </div>

                    <div class="checkout-price-row checkout-item-total">
                        <strong>You Pay</strong>
                        <strong>${formatMoney(itemTotal)}</strong>
                    </div>

                </div>

            </div>

        `;

        checkoutItems.appendChild(itemElement);

    });

    checkoutTotal.textContent = formatMoney(total);
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


/* ================= PLACE ORDER ================= */

document
    .getElementById("checkoutForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        /* CART CHECK */

        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }


        /* CUSTOMER LOGIN CHECK */

        const customerData =
            localStorage.getItem("customerAccount");

        if (!customerData) {

            alert("Please login before placing an order.");

            window.location.href = "customer-auth.html";
            return;
        }

        let customer;

        try {

            customer = JSON.parse(customerData);

        } catch (error) {

            alert("Customer information is invalid. Please login again.");

            localStorage.removeItem("customerAccount");

            window.location.href = "customer-auth.html";
            return;
        }

        if (!customer.id) {

            alert("Customer ID not found. Please login again.");
            return;
        }


        /* CUSTOMER DETAILS */

        const customerName =
            document.getElementById("customerName").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const address =
            document.getElementById("address").value.trim();

        const city =
            document.getElementById("city").value.trim();

        const state =
            document.getElementById("state").value.trim();

        const pincode =
            document.getElementById("pincode").value.trim();


        /* VALIDATION */

        if (
            !customerName ||
            !phone ||
            !address ||
            !city ||
            !state ||
            !pincode
        ) {

            alert("Please fill all delivery details.");
            return;
        }

        if (!/^[0-9]{10}$/.test(phone)) {

            alert("Please enter a valid 10-digit phone number.");
            return;
        }

        if (!/^[0-9]{6}$/.test(pincode)) {

            alert("Please enter a valid 6-digit pincode.");
            return;
        }


        /* PAYMENT */

        const selectedPayment =
            document.querySelector(
                'input[name="paymentMethod"]:checked'
            );

        if (!selectedPayment) {

            alert("Please select a payment method.");
            return;
        }

        const paymentMethod = selectedPayment.value;


        /* TOTAL + ORDER ITEMS */

        let total = 0;

        const orderItems = cart.map(function (item) {

            const quantity = Math.max(
                1,
                Number(item.quantity) || 1
            );

            const breakdown = getBreakdown(item);

            const itemTotal = breakdown.total * quantity;

            total += itemTotal;

            return {

                name: item.name || "Craft Product",

                image: item.image || "images/kalasetu-logo.png",

                category: item.category || "Traditional Craft",

                price: breakdown.total,

                quantity: quantity,

                creator: item.creator || "Local Artisan",

                creatorPrice: breakdown.creatorPrice,

                materials: breakdown.materials,

                packaging: breakdown.packaging,

                platformServices: breakdown.platformServices,

                priceBreakdown: {
                    creatorPrice: breakdown.creatorPrice,
                    materials: breakdown.materials,
                    packaging: breakdown.packaging,
                    platformServices: breakdown.platformServices,
                    total: breakdown.total
                }

            };

        });


        /* BUTTON */

        const submitButton =
            document.querySelector(
                '#checkoutForm button[type="submit"]'
            );

        if (submitButton) {

            submitButton.disabled = true;
            submitButton.textContent = "Placing Order...";

        }


        /* SEND TO BACKEND */

        try {

            const response = await fetch(
                "http://localhost:5000/api/customers/orders",
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        customerId: customer.id,

                        customerName: customerName,

                        phone: phone,

                        address: address,

                        city: city,

                        state: state,

                        pincode: pincode,

                        paymentMethod: paymentMethod,

                        totalPrice: total,

                        items: orderItems

                    })

                }
            );


            const data = await response.json();

            console.log("ORDER RESPONSE:", data);


            /* SERVER ERROR */

            if (!response.ok) {

                alert(
                    data.message || "Unable to place order."
                );

                if (submitButton) {

                    submitButton.disabled = false;
                    submitButton.textContent = "Place Order";

                }

                return;
            }


            /* SUCCESS ORDER */

            const order = data.order || data;

            localStorage.setItem(
                "currentOrder",
                JSON.stringify(order)
            );


            /* CLEAR CART */

            localStorage.removeItem("cart");


            /* SUCCESS */

            alert("Order placed successfully!");


            /* CONFIRMATION */

            window.location.href = "order-confirmation.html";


        } catch (error) {

            console.error("Order placement error:", error);

            alert(
                "Unable to connect to server. Please make sure the backend is running."
            );

            if (submitButton) {

                submitButton.disabled = false;
                submitButton.textContent = "Place Order";

            }

        }

    });


/* ================= CURRENT LOCATION ================= */

function useCurrentLocation() {

    const address =
        document.getElementById("address");

    const locationStatus =
        document.getElementById("locationStatus");

    if (!navigator.geolocation) {

        locationStatus.textContent =
            "Location is not supported by this browser.";

        return;
    }

    locationStatus.textContent =
        "Getting your current location...";

    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            address.value =
                "Current Location\n" +
                "Latitude: " + latitude +
                "\nLongitude: " + longitude;

            locationStatus.textContent =
                "✓ Current location added";

        },

        function () {

            locationStatus.textContent =
                "Unable to get location. Please allow location access.";

        }

    );

}


/* ================= START ================= */

displayCheckout();
