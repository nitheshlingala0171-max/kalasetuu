document.addEventListener("DOMContentLoaded", function () {

    loadOrders();

});


function loadOrders() {

    const ordersList = document.getElementById("ordersList");
    const emptyState = document.getElementById("emptyState");

    const totalOrders = document.getElementById("totalOrders");
    const pendingOrders = document.getElementById("pendingOrders");
    const deliveredOrders = document.getElementById("deliveredOrders");
    const orderCount = document.getElementById("orderCount");


    /*
        Customer side nunchi orders
        localStorage lo "orders" ane key tho save avuthayi.
    */

    let orders = JSON.parse(localStorage.getItem("orders")) || [];


    /*
        Current creator crafts
    */

    let creatorCrafts =
        JSON.parse(localStorage.getItem("creatorCrafts")) || [];


    /*
        Creator ki sambandhinchina orders
        matrame filter cheyyadam
    */

    let creatorOrders = orders.filter(function (order) {

        if (!order.productName) {
            return false;
        }

        return creatorCrafts.some(function (craft) {

            return craft.name === order.productName;

        });

    });


    /*
        Counts
    */

    totalOrders.textContent = creatorOrders.length;

    pendingOrders.textContent =
        creatorOrders.filter(function (order) {
            return getStatus(order) === "Pending";
        }).length;

    deliveredOrders.textContent =
        creatorOrders.filter(function (order) {
            return getStatus(order) === "Delivered";
        }).length;

    orderCount.textContent =
        creatorOrders.length +
        (creatorOrders.length === 1 ? " Order" : " Orders");


    /*
        Empty state
    */

    if (creatorOrders.length === 0) {

        ordersList.innerHTML = "";

        emptyState.style.display = "block";

        return;
    }


    emptyState.style.display = "none";


    /*
        Display orders
    */

    ordersList.innerHTML = creatorOrders.map(function (order) {

        const status = getStatus(order);

        const image =
            order.productImage ||
            order.image ||
            "images/kalasetu-logo.png";

        const productName =
            order.productName ||
            order.name ||
            "Craft Product";

        const customerName =
            order.customerName ||
            order.customer ||
            "Customer";

        const quantity =
            order.quantity ||
            1;

        const price =
            order.totalPrice ||
            order.price ||
            0;

        const date =
            order.orderDate ||
            order.createdAt ||
            "Recently";


        return `

            <div class="order-card">

                <div class="order-top">

                    <div class="product-image">
                        <img
                            src="${image}"
                            alt="${productName}"
                        >
                    </div>


                    <div class="product-info">

                        <h3>${productName}</h3>

                        <p class="customer-name">
                            Customer:
                            <strong>${customerName}</strong>
                        </p>


                        <div class="order-detail">
                            <span>Quantity</span>
                            <span>${quantity}</span>
                        </div>


                        <div class="order-detail">
                            <span>Order Date</span>
                            <span>${formatDate(date)}</span>
                        </div>


                        <div class="order-detail">
                            <span>Order ID</span>
                            <span>${order.id || "N/A"}</span>
                        </div>

                    </div>

                </div>


                <div class="order-bottom">

                    <div>

                        <div class="price">
                            ₹${Number(price).toLocaleString("en-IN")}
                        </div>

                        <button
                            class="details-btn"
                            onclick="viewOrder('${order.id || ""}')"
                        >
                            VIEW ORDER DETAILS
                        </button>

                    </div>


                    <span class="status ${status.toLowerCase()}">
                        ${status}
                    </span>

                </div>

            </div>

        `;

    }).join("");

}


/*
    Order status
*/

function getStatus(order) {

    if (!order.status) {
        return "Pending";
    }

    const status =
        order.status.toLowerCase();

    if (status === "confirmed") {
        return "Confirmed";
    }

    if (status === "shipped") {
        return "Shipped";
    }

    if (status === "delivered") {
        return "Delivered";
    }

    return "Pending";
}


/*
    Date format
*/

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


/*
    View order
*/

function viewOrder(orderId) {

    const orders =
        JSON.parse(localStorage.getItem("orders")) || [];

    const order =
        orders.find(function (item) {

            return String(item.id) === String(orderId);

        });


    if (!order) {

        alert("Order details not found.");

        return;
    }


    alert(

        "ORDER DETAILS\n\n" +

        "Customer: " +
        (order.customerName || order.customer || "Customer") +

        "\nProduct: " +
        (order.productName || order.name || "Craft Product") +

        "\nQuantity: " +
        (order.quantity || 1) +

        "\nPrice: ₹" +
        (order.totalPrice || order.price || 0) +

        "\nStatus: " +
        getStatus(order)

    );

}


/*
    Dashboard
*/

function goDashboard() {

    window.location.href =
        "creator-dashboard.html";

}