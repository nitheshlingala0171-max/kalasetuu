
/* =========================================================
   KALASETU - ADMIN ORDER MANAGEMENT
   PostgreSQL Version + COD Settlement
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    loadOrders();
});

let currentFilter = "All";
let allOrders = [];

/* =====================================================
   LOAD ORDERS FROM POSTGRESQL
===================================================== */

async function loadOrders() {
    const ordersList = document.getElementById("ordersList");
    const emptyState = document.getElementById("emptyState");

    try {
        const response = await fetch(
            "http://localhost:5000/api/customers/admin/orders"
        );

        const data = await response.json();

        console.log("ADMIN ORDERS RESPONSE:", data);

        if (!response.ok) {
            alert(data.message || "Unable to load orders.");
            return;
        }

        allOrders = Array.isArray(data.orders) ? data.orders : [];

        updateCounts(allOrders);
        displayOrders(allOrders, ordersList, emptyState);

    } catch (error) {
        console.error("Admin orders loading error:", error);

        allOrders = [];
        ordersList.innerHTML = "";
        emptyState.style.display = "block";

        alert(
            "Unable to connect to server. Please make sure the backend is running."
        );
    }
}

/* =====================================================
   UPDATE SUMMARY COUNTS
===================================================== */

function updateCounts(orders) {
    const totalOrders = document.getElementById("totalOrders");
    const pendingOrders = document.getElementById("pendingOrders");
    const confirmedOrders = document.getElementById("confirmedOrders");
    const deliveredOrders = document.getElementById("deliveredOrders");

    totalOrders.textContent = orders.length;

    pendingOrders.textContent = orders.filter(function (order) {
        const status = getStatus(order);
        return (
            status === "Pending" ||
            status === "Confirmed" ||
            status === "Shipped"
        );
    }).length;

    confirmedOrders.textContent = orders.filter(function (order) {
        return getStatus(order) === "Confirmed";
    }).length;

    deliveredOrders.textContent = orders.filter(function (order) {
        return getStatus(order) === "Delivered";
    }).length;
}

/* =====================================================
   DISPLAY ORDERS
===================================================== */

function displayOrders(orders, ordersList, emptyState) {
    ordersList.innerHTML = "";

    let filteredOrders = orders;

    if (currentFilter !== "All") {
        filteredOrders = orders.filter(function (order) {
            return getStatus(order) === currentFilter;
        });
    }

    if (filteredOrders.length === 0) {
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";

    filteredOrders.forEach(function (order) {
        const card = createOrderCard(order);
        ordersList.appendChild(card);
    });
}

/* =====================================================
   CREATE ORDER CARD
===================================================== */

function createOrderCard(order) {
    const card = document.createElement("div");
    card.className = "order-card";

    const status = getStatus(order);

    /* STATUS CLASS */

    let statusClass = "status-pending";

    if (status === "Confirmed") {
        statusClass = "status-confirmed";
    }

    if (status === "Shipped") {
        statusClass = "status-shipped";
    }

    if (status === "Delivered") {
        statusClass = "status-delivered";
    }

    if (status === "Cancelled") {
        statusClass = "status-cancelled";
    }

    /* PRODUCT */

    const productName = escapeHTML(
        order.productName ||
        order.name ||
        "Craft Product"
    );

    /* CUSTOMER */

    const customerName = escapeHTML(
        order.customerName ||
        order.customer ||
        "Customer"
    );

    /* QUANTITY */

    const quantity = order.quantity || 1;

    /* PRICE */

    const price = order.totalPrice || order.price || 0;

    /* IMAGE */

    const image = escapeHTML(
        order.productImage ||
        order.image ||
        "images/kalasetu-logo.png"
    );

    /* DATE */

    const date = order.orderDate || order.createdAt || "";

    /* ORDER ID */

    const orderId = order.id || "N/A";

    /* =================================================
       COD SETTLEMENT DATA
    ================================================= */

    const paymentMethod =
        order.paymentMethod ||
        order.payment_method ||
        "";

    const paymentStatus =
        order.paymentStatus ||
        order.payment_status ||
        "Pending";

    const codSettlementStatus =
        order.codSettlementStatus ||
        order.cod_settlement_status ||
        "Not Applicable";

    const isCOD =
        String(paymentMethod).trim().toLowerCase() ===
        "cash on delivery";

    const canConfirmCOD =
        isCOD &&
        status === "Delivered" &&
        String(codSettlementStatus).toLowerCase() !== "received" &&
        status !== "Cancelled";

    card.innerHTML = `

        <div class="order-top">

            <div class="order-title">

                <img
                    class="product-image"
                    src="${image}"
                    alt="${productName}"
                    onerror="this.src='images/kalasetu-logo.png'"
                >

                <div>

                    <h3>${productName}</h3>

                    <p class="order-id">
                        Order ID: ${escapeHTML(orderId)}
                    </p>

                </div>

            </div>

            <span class="status-badge ${statusClass}">
                ${status}
            </span>

        </div>

        <div class="order-details">

            <div class="detail-item">
                <span>Customer</span>
                <strong>${customerName}</strong>
            </div>

            <div class="detail-item">
                <span>Quantity</span>
                <strong>${quantity}</strong>
            </div>

            <div class="detail-item">
                <span>Order Date</span>
                <strong>${formatDate(date)}</strong>
            </div>

            <div class="detail-item">
                <span>Payment</span>
                <strong>
                    ${escapeHTML(paymentMethod || "Not provided")}
                </strong>
            </div>

        </div>

        ${
            isCOD
            ? `
                <div class="cod-settlement-box">

                    <h4>COD Settlement</h4>

                    <p>
                        Payment Status:
                        <strong>${escapeHTML(paymentStatus)}</strong>
                    </p>

                    <p>
                        Courier Settlement:
                        <strong>${escapeHTML(codSettlementStatus)}</strong>
                    </p>

                    ${
                        canConfirmCOD
                        ? `
                            <button
                                class="cod-confirm-btn"
                                onclick="confirmCODReceived('${escapeHTML(orderId)}')"
                            >
                                Confirm COD Received
                            </button>
                        `
                        : String(codSettlementStatus).toLowerCase() === "received"
                            ? `
                                <p class="cod-received">
                                    ✓ COD Amount Received
                                </p>
                            `
                            : `
                                <p class="cod-waiting">
                                    Available after delivery
                                </p>
                            `
                    }

                </div>
            `
            : ""
        }

        <div class="order-price">

            <span>Order Total</span>

            <strong>
                ₹${Number(price).toLocaleString("en-IN")}
            </strong>

        </div>

        <div class="order-actions">

            <button
                class="view-btn"
                onclick="viewOrder('${escapeHTML(orderId)}')"
            >
                View Details
            </button>

            ${
                status !== "Delivered" &&
                status !== "Cancelled"
                ? `
                    <button
                        class="update-btn"
                        onclick="updateOrderStatus('${escapeHTML(orderId)}')"
                    >
                        Update Status
                    </button>
                `
                : ""
            }

        </div>

    `;

    return card;
}

/* =====================================================
   CONFIRM COD RECEIVED FROM COURIER
===================================================== */

window.confirmCODReceived = async function (orderId) {
    const order = allOrders.find(function (item) {
        return String(item.id) === String(orderId);
    });

    if (!order) {
        alert("Order not found.");
        return;
    }

    const paymentMethod =
        order.paymentMethod ||
        order.payment_method ||
        "";

    const settlementStatus =
        order.codSettlementStatus ||
        order.cod_settlement_status ||
        "Not Applicable";

    if (
        String(paymentMethod).trim().toLowerCase() !==
        "cash on delivery"
    ) {
        alert("This is not a COD order.");
        return;
    }

    if (getStatus(order) !== "Delivered") {
        alert("COD settlement can be confirmed only after delivery.");
        return;
    }

    if (String(settlementStatus).toLowerCase() === "received") {
        alert("COD amount is already marked as received.");
        return;
    }

    const confirmed = confirm(
        "Have you actually received the COD amount from the courier company?\n\n" +
        "Only click OK after verifying the courier settlement."
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/api/customers/admin/orders/${orderId}/cod-settlement`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        console.log("COD SETTLEMENT RESPONSE:", data);

        if (!response.ok) {
            alert(
                data.message ||
                "Unable to confirm COD settlement."
            );
            return;
        }

        alert(
            data.message ||
            "COD settlement marked as received successfully!"
        );

        await loadOrders();

    } catch (error) {
        console.error("COD settlement error:", error);

        alert(
            "Unable to connect to server. Please check the backend."
        );
    }
};

/* =====================================================
   FILTER ORDERS
===================================================== */

window.filterOrders = function (filter, button) {
    currentFilter = filter;

    document.querySelectorAll(".filter-btn").forEach(function (btn) {
        btn.classList.remove("active");
    });

    button.classList.add("active");

    displayOrders(
        allOrders,
        document.getElementById("ordersList"),
        document.getElementById("emptyState")
    );
};

/* =====================================================
   ORDER STATUS
===================================================== */

function getStatus(order) {
    if (!order || !order.status) {
        return "Pending";
    }

    const rawStatus = String(order.status).trim().toLowerCase();

    if (
        rawStatus === "order placed" ||
        rawStatus === "placed" ||
        rawStatus === "pending"
    ) {
        return "Pending";
    }

    if (rawStatus === "confirmed") {
        return "Confirmed";
    }

    if (rawStatus === "shipped") {
        return "Shipped";
    }

    if (rawStatus === "delivered") {
        return "Delivered";
    }

    if (
        rawStatus === "cancelled" ||
        rawStatus === "canceled"
    ) {
        return "Cancelled";
    }

    return "Pending";
}

/* =====================================================
   VIEW ORDER DETAILS
===================================================== */

window.viewOrder = function (orderId) {
    const order = allOrders.find(function (item) {
        return String(item.id) === String(orderId);
    });

    if (!order) {
        alert("Order details not found.");
        return;
    }

    const productName =
        order.productName ||
        order.name ||
        "Craft Product";

    const customerName =
        order.customerName ||
        order.customer ||
        "Customer";

    const quantity = order.quantity || 1;

    const price = order.totalPrice || order.price || 0;

    const status = getStatus(order);

    const date = order.orderDate || order.createdAt || "";

    const payment =
        order.paymentMethod ||
        order.payment_method ||
        "Not provided";

    const paymentStatus =
        order.paymentStatus ||
        order.payment_status ||
        "Pending";

    const codSettlementStatus =
        order.codSettlementStatus ||
        order.cod_settlement_status ||
        "Not Applicable";

    alert(
        "ORDER DETAILS\n\n" +

        "Order ID: " + (order.id || "N/A") +

        "\n\nProduct: " + productName +

        "\nCustomer: " + customerName +

        "\nPhone: " + (order.phone || "Not provided") +

        "\nAddress: " + (order.address || "Not provided") +

        "\n\nQuantity: " + quantity +

        "\nPrice: ₹" +
        Number(price).toLocaleString("en-IN") +

        "\nPayment: " + payment +

        "\nPayment Status: " + paymentStatus +

        "\nCourier Settlement: " + codSettlementStatus +

        "\nStatus: " + status +

        "\nOrder Date: " + formatDate(date)
    );
};

/* =====================================================
   UPDATE ORDER STATUS
===================================================== */

window.updateOrderStatus = async function (orderId) {
    const order = allOrders.find(function (item) {
        return String(item.id) === String(orderId);
    });

    if (!order) {
        alert("Order not found.");
        return;
    }

    const currentStatus = getStatus(order);

    const choice = prompt(
        "Current Status: " + currentStatus +

        "\n\nEnter new status:\n\n" +

        "1. Pending\n" +
        "2. Confirmed\n" +
        "3. Shipped\n" +
        "4. Delivered\n" +
        "5. Cancelled"
    );

    if (choice === null) {
        return;
    }

    const statusNumber = parseInt(choice, 10);

    const statusList = [
        "Pending",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled"
    ];

    if (
        isNaN(statusNumber) ||
        statusNumber < 1 ||
        statusNumber > 5
    ) {
        alert("Please enter a number from 1 to 5.");
        return;
    }

    const newStatus = statusList[statusNumber - 1];

    const confirmUpdate = confirm(
        'Change order status from "' +
        currentStatus +
        '" to "' +
        newStatus +
        '"?'
    );

    if (!confirmUpdate) {
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/api/customers/admin/orders/${orderId}/status`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        const data = await response.json();

        console.log("STATUS UPDATE RESPONSE:", data);

        if (!response.ok) {
            alert(
                data.message ||
                "Unable to update order status."
            );
            return;
        }

        alert("Order status updated successfully!");

        await loadOrders();

    } catch (error) {
        console.error("Order status update error:", error);

        alert("Unable to connect to server.");
    }
};

/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(date) {
    if (!date) {
        return "Recently";
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
        return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =====================================================
   DASHBOARD
===================================================== */

window.goDashboard = function () {
    window.location.href = "admin-dashboard.html";
};
