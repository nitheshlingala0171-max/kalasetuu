/* =========================================================
   KALASETU - MY ORDERS
   ========================================================= */

const ordersList =
    document.getElementById("ordersList");

let orders = [];


/* ================= LOAD ORDERS ================= */

async function loadOrders() {

    const customerData =
        localStorage.getItem("customerAccount");

    if (!customerData) {

        alert("Please login first.");

        window.location.href =
            "customer-auth.html";

        return;
    }

    try {

        const customer =
            JSON.parse(customerData);

        if (!customer.id) {

            alert("Customer information not found.");

            return;
        }


        const response = await fetch(
            `http://localhost:5000/api/customers/orders/${customer.id}`
        );


        const data =
            await response.json();


        console.log(
            "MY ORDERS RESPONSE:",
            data
        );


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to load orders."
            );

            return;
        }


        orders =
            Array.isArray(data.orders)
                ? data.orders
                : [];


        displayOrders();


    } catch (error) {

        console.error(
            "Orders loading error:",
            error
        );

        orders = [];

        ordersList.innerHTML = `
            <div class="empty-orders">

                <div class="empty-icon">
                    ✦
                </div>

                <h3>
                    Unable to Load Orders
                </h3>

                <p>
                    Please make sure the backend is running
                    and try again.
                </p>

            </div>
        `;
    }
}


/* ================= GET STATUS ================= */

function getOrderStatus(status) {

    const currentStatus =
        String(status || "Pending")
            .trim()
            .toLowerCase();


    if (currentStatus === "confirmed") {
        return "Confirmed";
    }


    if (currentStatus === "shipped") {
        return "Shipped";
    }


    if (currentStatus === "delivered") {
        return "Delivered";
    }


    if (
        currentStatus === "cancelled" ||
        currentStatus === "canceled"
    ) {
        return "Cancelled";
    }


    return "Pending";
}


/* ================= DISPLAY ORDERS ================= */

function displayOrders() {

    if (orders.length === 0) {

        ordersList.innerHTML = `
            <div class="empty-orders">

                <div class="empty-icon">
                    ✦
                </div>

                <h3>
                    No Orders Yet
                </h3>

                <p>
                    You haven't placed any orders yet.
                    Explore beautiful handmade crafts and
                    place your first order.
                </p>

                <a href="customer-home.html">
                    Explore Crafts
                </a>

            </div>
        `;

        return;
    }


    ordersList.innerHTML = "";


    orders.forEach(function(order) {

        const orderCard =
            document.createElement("div");

        orderCard.className =
            "order-card";


        let itemsHTML = "";


        const orderItems =
            Array.isArray(order.items)
                ? order.items
                : [];


        orderItems.forEach(function(item) {

            const quantity =
                Number(item.quantity) || 1;

            const price =
                Number(item.price) || 0;

            const productName =
                item.name ||
                "Craft Product";

            const productImage =
                item.image ||
                "images/kalasetu-logo.png";

            const category =
                item.category ||
                "Handmade Craft";


            itemsHTML += `
                <div class="order-product">

                    <div class="order-product-image">

                        <img
                            src="${productImage}"
                            alt="${escapeHTML(productName)}"
                            onerror="this.src='images/kalasetu-logo.png'"
                        >

                    </div>


                    <div class="order-product-info">

                        <h4>
                            ${escapeHTML(productName)}
                        </h4>

                        <p>
                            ${escapeHTML(category)}
                        </p>

                        <p>
                            Quantity: ${quantity}
                        </p>

                    </div>


                    <strong>
                        ₹${(price * quantity)
                            .toLocaleString("en-IN")}
                    </strong>

                </div>
            `;
        });


        const status =
            getOrderStatus(order.status);


        const totalAmount =
            Number(order.totalPrice) || 0;


        const orderDate =
            order.orderDate ||
            "Recently";


        const customerName =
            order.customerName ||
            "Customer";


        const phone =
            order.phone ||
            "Not provided";


        const address =
            order.address ||
            "Not provided";


        const city =
            order.city ||
            "";


        const state =
            order.state ||
            "";


        const pincode =
            order.pincode ||
            "";


        orderCard.innerHTML = `

            <div class="order-header">

                <div>

                    <h3>
                        Order #${escapeHTML(
                            String(order.id)
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            String(orderDate)
                        )}
                    </p>

                </div>


                <span
                    class="order-status status-${status
                        .toLowerCase()
                        .replace(/\s+/g, "-")}"
                >
                    ${status}
                </span>

            </div>


            <div class="order-products">

                ${itemsHTML}

            </div>


            <div class="order-delivery">

                <h4>
                    Delivery Details
                </h4>

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

                <span>
                    Total Amount
                </span>

                <strong>
                    ₹${totalAmount.toLocaleString("en-IN")}
                </strong>

            </div>


            ${
                status === "Pending" ||
                status === "Confirmed"
                    ? `
                        <button
                            class="cancel-order-btn"
                            onclick="cancelOrder('${String(order.id)}')"
                        >
                            Cancel Order
                        </button>
                    `
                    : ""
            }

        `;


        ordersList.appendChild(orderCard);

    });
}


/* ================= CANCEL ORDER ================= */

async function cancelOrder(orderId) {

    const confirmCancel =
        confirm(
            "Are you sure you want to cancel this order?"
        );


    if (!confirmCancel) {
        return;
    }


    try {

        const response = await fetch(
            `http://localhost:5000/api/customers/orders/${orderId}/cancel`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to cancel order."
            );

            return;
        }


        alert("Order cancelled successfully.");

        await loadOrders();


    } catch (error) {

        console.error(
            "Cancel order error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
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