/* =========================================================
   KALASETU - MY ORDERS WITH TRACKING & REFUND DETAILS
   ========================================================= */

const ordersList = document.getElementById("ordersList");

let orders = [];
let refunds = [];

/* ================= LOAD ORDERS ================= */

async function loadOrders() {
    const customerData = localStorage.getItem("customerAccount");

    if (!customerData) {
        alert("Please login first.");
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

    ordersList.innerHTML = `
        <div class="empty-orders">
            <h3>Loading Your Orders...</h3>
            <p>Please wait.</p>
        </div>
    `;

    try {
        const response = await fetch(
            `http://localhost:5000/api/customers/orders/${encodeURIComponent(customer.id)}`
        );

        const data = await response.json();

        console.log("MY ORDERS RESPONSE:", data);

        if (!response.ok) {
            throw new Error(data.message || "Unable to load orders.");
        }

        orders = Array.isArray(data.orders) ? data.orders : [];

        // Load refund history
        try {
            const refundResponse = await fetch(
                `http://localhost:5000/api/customers/refunds/${encodeURIComponent(customer.id)}`
            );

            const refundData = await refundResponse.json();

            refunds = refundResponse.ok && refundData.success
                ? (refundData.refunds || [])
                : [];

            console.log("REFUND HISTORY:", refunds);

        } catch (refundError) {
            console.error("Refund history error:", refundError);
            refunds = [];
        }

        displayOrders();

    } catch (error) {
        console.error("Orders loading error:", error);

        orders = [];
        refunds = [];

        ordersList.innerHTML = `
            <div class="empty-orders">
                <div class="empty-icon">✦</div>
                <h3>Unable to Load Orders</h3>
                <p>
                    ${escapeHTML(error.message)}
                    Please check whether the backend is running.
                </p>
                <button class="shop-btn" onclick="loadOrders()">
                    Try Again
                </button>
            </div>
        `;
    }
}


/* ================= GET ORDER STATUS ================= */

function getOrderStatus(status) {
    const currentStatus = String(status || "Pending")
        .trim()
        .toLowerCase();

    if (currentStatus === "confirmed") return "Confirmed";
    if (currentStatus === "preparation") return "Preparation";
    if (currentStatus === "shipped") return "Shipped";
    if (currentStatus === "delivered") return "Delivered";

    if (
        currentStatus === "cancelled" ||
        currentStatus === "canceled"
    ) {
        return "Cancelled";
    }

    return "Pending";
}


/* ================= REFUND DEADLINE ================= */

function getRefundDeadline(order) {
    const value = order.refundDeadline || order.refund_deadline;

    if (!value) return null;

    const deadline = new Date(value);

    return Number.isNaN(deadline.getTime()) ? null : deadline;
}


function isRefundAvailable(order) {
    const deadline = getRefundDeadline(order);

    if (!deadline) return false;

    // The deadline from the backend is the source of truth.
    return new Date() <= deadline;
}


function formatRefundDeadline(order) {
    const deadline = getRefundDeadline(order);

    if (!deadline) return "Deadline unavailable";

    return deadline.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


/* ================= FORMAT DATE ================= */

function formatDate(value) {
    if (!value) return "Not available";

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


/* ================= REFUND DETAILS ================= */

function createRefundDetails(refund, order, totalAmount) {
    if (!refund) return "";

    const refundStatus = String(refund.status || "Pending");
    const reason = refund.reason || "Not provided";
    const description = refund.description || "No additional details";
    const adminNote =
        refund.admin_note ||
        refund.adminNote ||
        "No admin note added";

    const refundAmount = Number(
        refund.refund_amount ??
        refund.refundAmount ??
        totalAmount
    ) || 0;

    const paymentStatus =
        refund.payment_status ||
        refund.paymentStatus ||
        "Not Processed";

    const statusClass = refundStatus
        .toLowerCase()
        .replace(/\s+/g, "-");

    return `
        <section class="refund-details">

            <div class="refund-details-heading">
                <span class="refund-heading-icon">↩</span>
                <div>
                    <h4>Refund Details</h4>
                    <p>Refund information for this order</p>
                </div>
            </div>

            <div class="refund-info-grid">

                <div class="refund-info-item">
                    <span>Refund Request Status</span>
                    <strong class="refund-badge refund-${escapeHTML(statusClass)}">
                        ${escapeHTML(refundStatus)}
                    </strong>
                </div>

                <div class="refund-info-item">
                    <span>Refund Amount</span>
                    <strong>
                        ₹${refundAmount.toLocaleString("en-IN")}
                    </strong>
                </div>

                <div class="refund-info-item">
                    <span>Payment Status</span>
                    <strong class="payment-status">
                        ${escapeHTML(paymentStatus)}
                    </strong>
                </div>

                <div class="refund-info-item">
                    <span>Request Date</span>
                    <strong>
                        ${escapeHTML(formatDate(
                            refund.requested_at || refund.requestedAt
                        ))}
                    </strong>
                </div>

            </div>

            <div class="refund-text-item">
                <span>Refund Reason</span>
                <p>${escapeHTML(reason)}</p>
            </div>

            <div class="refund-text-item">
                <span>Additional Description</span>
                <p>${escapeHTML(description)}</p>
            </div>

            <div class="refund-admin-note">
                <span>Admin Note</span>
                <p>${escapeHTML(adminNote)}</p>
            </div>

            ${
                refundStatus.toLowerCase() === "approved"
                    ? `
                        <p class="refund-message">
                            Your refund request has been approved.
                            Payment has not been confirmed as transferred.
                        </p>
                    `
                    : refundStatus.toLowerCase() === "rejected"
                        ? `
                            <p class="refund-message rejected-message">
                                Your refund request was rejected.
                                Please check the admin note.
                            </p>
                        `
                        : `
                            <p class="refund-message">
                                Your refund request is waiting for admin review.
                            </p>
                        `
            }

        </section>
    `;
}


/* ================= DISPLAY ORDERS ================= */

function displayOrders() {
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-orders">
                <div class="empty-icon">✦</div>
                <h3>No Orders Yet</h3>
                <p>
                    You haven't placed any orders yet.
                    Explore beautiful handmade crafts and
                    place your first order.
                </p>
                <a href="customer-home.html" class="shop-btn">
                    Explore Crafts
                </a>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = "";

    orders.forEach(function(order) {
        const orderCard = document.createElement("div");
        orderCard.className = "order-card";

        let itemsHTML = "";

        const orderItems = Array.isArray(order.items)
            ? order.items
            : [];

        orderItems.forEach(function(item) {
            const quantity = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;

            const productName = item.name || "Craft Product";
            const productImage =
                item.image || "images/kalasetu-logo.png";
            const category = item.category || "Handmade Craft";

            itemsHTML += `
                <div class="order-product">

                    <div class="order-product-image">
                        <img
                            src="${escapeHTML(productImage)}"
                            alt="${escapeHTML(productName)}"
                            onerror="this.src='images/kalasetu-logo.png'"
                        >
                    </div>

                    <div class="order-product-info">
                        <h4>${escapeHTML(productName)}</h4>
                        <p>${escapeHTML(category)}</p>
                        <p>Quantity: ${quantity}</p>
                    </div>

                    <strong>
                        ₹${(price * quantity).toLocaleString("en-IN")}
                    </strong>

                </div>
            `;
        });

        const status = getOrderStatus(order.status);
        const totalAmount = Number(order.totalPrice) || 0;
        const orderDate = formatDate(order.orderDate);

        const customerName = order.customerName || "Customer";
        const phone = order.phone || "Not provided";
        const address = order.address || "Not provided";
        const city = order.city || "";
        const state = order.state || "";
        const pincode = order.pincode || "";

        // Find refund request for this order
        const existingRefund = refunds.find(function(refund) {
            return String(
                refund.order_id ?? refund.orderId
            ) === String(order.id);
        });

        let refundHTML = "";

        if (existingRefund) {
            refundHTML = createRefundDetails(
                existingRefund,
                order,
                totalAmount
            );

        } else if (
            status === "Delivered" &&
            isRefundAvailable(order)
        ) {
            refundHTML = `
                <div class="refund-deadline">
                    <p>
                        <strong>Refund available until:</strong>
                        ${escapeHTML(formatRefundDeadline(order))}
                    </p>

                    <p>
                        You can request a refund within 48 hours
                        after delivery.
                    </p>
                </div>

                <button
                    class="refund-order-btn"
                    onclick="requestRefund('${escapeHTML(String(order.id))}')"
                >
                    Request Refund
                </button>
            `;

        } else if (status === "Delivered") {
            refundHTML = `
                <div class="refund-expired">
                    <strong>Refund period expired or unavailable</strong>
                    <p>
                        The refund request period for this order
                        has ended or is not available.
                    </p>
                </div>
            `;
        }

        const canCancel =
            status === "Pending" || status === "Confirmed";

        orderCard.innerHTML = `
            <div class="order-header">
                <div>
                    <h3>Order #${escapeHTML(String(order.id))}</h3>
                    <p>${escapeHTML(orderDate)}</p>
                </div>

                <span class="order-status status-${status.toLowerCase()}">
                    ${escapeHTML(status)}
                </span>
            </div>

            <div class="order-products">
                ${itemsHTML || "<p>No product details available.</p>"}
            </div>

            <div class="order-delivery">
                <h4>Delivery Details</h4>

                <p>
                    <strong>Name:</strong>
                    ${escapeHTML(customerName)}
                </p>

                <p>
                    <strong>Phone:</strong>
                    ${escapeHTML(phone)}
                </p>

                <p>
                    <strong>Address:</strong>
                    ${escapeHTML(address)}
                </p>

                <p>
                    ${escapeHTML(city)},
                    ${escapeHTML(state)}
                    - ${escapeHTML(String(pincode))}
                </p>
            </div>

            <div class="order-total">
                <span>Total Amount</span>
                <strong>
                    ₹${totalAmount.toLocaleString("en-IN")}
                </strong>
            </div>

            <div class="order-actions">

                ${
                    status !== "Cancelled"
                        ? `
                            <button
                                class="track-order-btn"
                                onclick="trackOrder('${escapeHTML(String(order.id))}')"
                            >
                                Track Order
                            </button>
                        `
                        : ""
                }

                ${
                    canCancel
                        ? `
                            <button
                                class="cancel-order-btn"
                                onclick="cancelOrder('${escapeHTML(String(order.id))}')"
                            >
                                Cancel Order
                            </button>
                        `
                        : ""
                }

            </div>

            ${refundHTML}
        `;

        ordersList.appendChild(orderCard);
    });
}


/* ================= TRACK ORDER ================= */

function trackOrder(orderId) {
    window.location.href =
        `order-tracking.html?id=${encodeURIComponent(orderId)}`;
}


/* ================= CANCEL ORDER ================= */

async function cancelOrder(orderId) {
    const confirmCancel = confirm(
        "Are you sure you want to cancel this order?"
    );

    if (!confirmCancel) return;

    try {
        const response = await fetch(
            `http://localhost:5000/api/customers/orders/${encodeURIComponent(orderId)}/cancel`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to cancel order.");
            return;
        }

        alert("Order cancelled successfully.");
        await loadOrders();

    } catch (error) {
        console.error("Cancel order error:", error);
        alert("Unable to connect to server.");
    }
}


/* ================= REQUEST REFUND ================= */

async function requestRefund(orderId) {
    const customerData = localStorage.getItem("customerAccount");

    if (!customerData) {
        alert("Please login first.");
        window.location.href = "customer-auth.html";
        return;
    }

    let customer;

    try {
        customer = JSON.parse(customerData);
    } catch (error) {
        alert("Customer information is invalid. Please login again.");
        return;
    }

    if (!customer.id) {
        alert("Customer information not found.");
        return;
    }

    const selectedOrder = orders.find(function(order) {
        return String(order.id) === String(orderId);
    });

    if (
        !selectedOrder ||
        getOrderStatus(selectedOrder.status) !== "Delivered" ||
        !isRefundAvailable(selectedOrder)
    ) {
        alert("The refund period has expired or refund is unavailable.");
        await loadOrders();
        return;
    }

    const reason = prompt(
        "Enter your refund reason:\n\n" +
        "Example: Product damaged, Wrong product, Other"
    );

    if (!reason || !reason.trim()) {
        alert("Please enter a refund reason.");
        return;
    }

    const description = prompt(
        "Enter additional details (optional):"
    ) || "";

    const confirmRequest = confirm(
        "Are you sure you want to submit this refund request?"
    );

    if (!confirmRequest) return;

    try {
        const response = await fetch(
            `http://localhost:5000/api/customers/orders/${encodeURIComponent(orderId)}/refund`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    customerId: customer.id,
                    reason: reason.trim(),
                    description: description.trim()
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            alert(data.message || "Unable to submit refund request.");
            await loadOrders();
            return;
        }

        alert("Refund request submitted successfully!");
        await loadOrders();

    } catch (error) {
        console.error("Refund request error:", error);
        alert("Unable to connect to server.");
    }
}


/* ================= HTML SAFETY ================= */

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ================= START ================= */

loadOrders();