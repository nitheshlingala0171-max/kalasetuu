/* =========================================================
   KALASETU - LIVE ORDER TRACKING FROM DATABASE
   ========================================================= */

const orderIdElement = document.getElementById("orderId");
const orderDateElement = document.getElementById("orderDate");
const orderTotalElement = document.getElementById("orderTotal");

const API_URL = "http://localhost:5000/api/customers";


/* ================= FORMAT PRICE ================= */

function formatMoney(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
}


/* ================= FORMAT DATE ================= */

function formatDate(value) {
    if (!value) return "--";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


/* ================= GET STATUS STEP ================= */

function getStatusStep(status) {
    const currentStatus = String(status || "Pending")
        .trim()
        .toLowerCase();

    const statusSteps = {
        pending: 0,
        confirmed: 1,
        preparation: 2,
        shipped: 3,
        delivered: 4
    };

    if (
        currentStatus === "cancelled" ||
        currentStatus === "canceled"
    ) {
        return -1;
    }

    return statusSteps[currentStatus] ?? 0;
}


/* ================= UPDATE TIMELINE ================= */
/* ================= UPDATE TIMELINE ================= */

function updateTimeline(status) {
    const timelineItems = document.querySelectorAll(".timeline-item");

    const currentStep = getStatusStep(status);

    timelineItems.forEach(function(item, index) {
        item.classList.remove("completed", "active");

        const icon = item.querySelector(".timeline-icon");

        if (currentStep === -1) {
            if (icon) {
                icon.textContent = "○";
            }
            return;
        }

        // Delivered ayithe all steps green tick
        if (currentStep === 4) {
            item.classList.add("completed");

            if (icon) {
                icon.textContent = "✓";
            }
        }

        // Normal completed steps
        else if (index < currentStep) {
            item.classList.add("completed");

            if (icon) {
                icon.textContent = "✓";
            }
        }

        // Current active step
        else if (index === currentStep) {
            item.classList.add("active");

            if (icon) {
                icon.textContent = "●";
            }
        }

        // Upcoming steps
        else {
            if (icon) {
                icon.textContent = "○";
            }
        }
    });

    let cancelledMessage = document.getElementById("cancelledMessage");

    if (
        String(status).trim().toLowerCase() === "cancelled" ||
        String(status).trim().toLowerCase() === "canceled"
    ) {
        if (!cancelledMessage) {
            cancelledMessage = document.createElement("div");
            cancelledMessage.id = "cancelledMessage";
            cancelledMessage.className = "cancelled-tracking-message";

            const trackingCard = document.querySelector(".tracking-card");

            if (trackingCard) {
                trackingCard.appendChild(cancelledMessage);
            }
        }

        cancelledMessage.textContent = "This order has been cancelled.";

    } else if (cancelledMessage) {
        cancelledMessage.remove();
    }
}

/* ================= DISPLAY ORDER ================= */

function displayOrder(order) {
    if (orderIdElement) {
        orderIdElement.textContent = "#" + order.id;
    }

    if (orderDateElement) {
        orderDateElement.textContent = formatDate(order.orderDate);
    }

    if (orderTotalElement) {
        orderTotalElement.textContent = formatMoney(order.totalPrice);
    }

    updateTimeline(order.status || "Pending");
}


/* ================= LOAD SELECTED ORDER ================= */

async function loadTrackingOrder() {
    const customerData = localStorage.getItem("customerAccount");

    if (!customerData) {
        alert("Please login to track your order.");
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

    // Read order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const selectedOrderId = urlParams.get("id");

    if (!selectedOrderId) {
        showTrackingError("Order ID is missing. Please open Track Order from My Orders.");
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/orders/${encodeURIComponent(customer.id)}`
        );

        const data = await response.json();

        console.log("TRACKING ORDERS RESPONSE:", data);

        if (!response.ok) {
            throw new Error(data.message || "Unable to load order details.");
        }

        const customerOrders = Array.isArray(data.orders)
            ? data.orders
            : [];

        const selectedOrder = customerOrders.find(function(order) {
            return String(order.id) === String(selectedOrderId);
        });

        if (!selectedOrder) {
            showTrackingError("Order not found in your account.");
            return;
        }

        displayOrder(selectedOrder);

    } catch (error) {
        console.error("Tracking error:", error);
        showTrackingError(
            error.message || "Unable to connect to server."
        );
    }
}


/* ================= TRACKING ERROR ================= */

function showTrackingError(message) {
    if (orderIdElement) orderIdElement.textContent = "--";
    if (orderDateElement) orderDateElement.textContent = "--";
    if (orderTotalElement) orderTotalElement.textContent = "₹0";

    const trackingCard = document.querySelector(".tracking-card");

    if (trackingCard) {
        let errorBox = document.getElementById("trackingError");

        if (!errorBox) {
            errorBox = document.createElement("div");
            errorBox.id = "trackingError";
            errorBox.className = "tracking-error";
            trackingCard.appendChild(errorBox);
        }

        errorBox.textContent = message;
    }
}


/* ================= START ================= */

loadTrackingOrder();