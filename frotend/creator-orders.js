document.addEventListener("DOMContentLoaded", function () {

    loadOrders();

});


function loadOrders() {

    const ordersList =
        document.getElementById("ordersList");

    const emptyState =
        document.getElementById("emptyState");

    const totalOrders =
        document.getElementById("totalOrders");

    const pendingOrders =
        document.getElementById("pendingOrders");

    const deliveredOrders =
        document.getElementById("deliveredOrders");

    const orderCount =
        document.getElementById("orderCount");


    // Get orders
    let orders = [];

    try {
        orders =
            JSON.parse(
                localStorage.getItem("orders")
            ) || [];
    } catch (error) {
        console.log("Orders loading error:", error);
        orders = [];
    }


    // Get creator crafts
    let creatorCrafts = [];

    try {
        creatorCrafts =
            JSON.parse(
                localStorage.getItem("creatorCrafts")
            ) || [];
    } catch (error) {
        console.log(
            "Creator crafts loading error:",
            error
        );

        creatorCrafts = [];
    }


    /*
        Find orders belonging to creator crafts
    */

    const creatorOrders =
        orders.filter(function (order) {

            if (!order.productName) {
                return false;
            }

            return creatorCrafts.some(function (craft) {

                return (
                    String(craft.name).trim().toLowerCase() ===
                    String(order.productName).trim().toLowerCase()
                );

            });

        });


    /*
        SUMMARY COUNTS
    */

    totalOrders.textContent =
        creatorOrders.length;


    pendingOrders.textContent =
        creatorOrders.filter(function (order) {

            const status =
                getStatus(order).toLowerCase();

            return (
                status === "pending" ||
                status === "confirmed" ||
                status === "shipped"
            );

        }).length;


    deliveredOrders.textContent =
        creatorOrders.filter(function (order) {

            return (
                getStatus(order).toLowerCase() ===
                "delivered"
            );

        }).length;


    orderCount.textContent =
        creatorOrders.length +
        (
            creatorOrders.length === 1
                ? " Order"
                : " Orders"
        );


    /*
        EMPTY STATE
    */

    if (creatorOrders.length === 0) {

        ordersList.innerHTML = "";

        emptyState.style.display = "block";

        return;
    }


    emptyState.style.display = "none";


    /*
        DISPLAY ORDERS
    */

    ordersList.innerHTML =
        creatorOrders.map(function (order) {

            const status =
                getStatus(order);


            const image =
                order.productImage ||
                order.image ||
                findCraftImage(
                    order.productName,
                    creatorCrafts
                ) ||
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


            const orderId =
                order.id ||
                "N/A";


            return `

                <div class="order-card">

                    <div class="order-top">

                        <div class="product-image">

                            <img
                                src="${image}"
                                alt="${productName}"
                                onerror="this.src='images/kalasetu-logo.png'"
                            >

                        </div>


                        <div class="product-info">

                            <h3>
                                ${productName}
                            </h3>


                            <p class="customer-name">

                                Customer:
                                <strong>
                                    ${customerName}
                                </strong>

                            </p>


                            <div class="order-detail">

                                <span>
                                    Quantity
                                </span>

                                <span>
                                    ${quantity}
                                </span>

                            </div>


                            <div class="order-detail">

                                <span>
                                    Order Date
                                </span>

                                <span>
                                    ${formatDate(date)}
                                </span>

                            </div>


                            <div class="order-detail">

                                <span>
                                    Order ID
                                </span>

                                <span>
                                    ${orderId}
                                </span>

                            </div>

                        </div>

                    </div>


                    <div class="order-bottom">

                        <div>

                            <div class="price">

                                ₹${Number(price)
                                    .toLocaleString("en-IN")}

                            </div>


                            <button
                                class="details-btn"
                                onclick="viewOrder('${orderId}')"
                            >
                                VIEW ORDER DETAILS
                            </button>

                        </div>


                        <span
                            class="status ${status.toLowerCase()}"
                        >
                            ${status}
                        </span>

                    </div>

                </div>

            `;

        }).join("");

}


/*
    FIND CRAFT IMAGE
*/

function findCraftImage(
    productName,
    creatorCrafts
) {

    if (!productName) {
        return "";
    }


    const craft =
        creatorCrafts.find(function (item) {

            return (
                String(item.name).trim().toLowerCase() ===
                String(productName).trim().toLowerCase()
            );

        });


    if (craft && craft.image) {
        return craft.image;
    }


    return "";

}


/*
    ORDER STATUS
*/

function getStatus(order) {

    if (!order || !order.status) {
        return "Pending";
    }


    const status =
        String(order.status)
            .trim()
            .toLowerCase();


    if (status === "confirmed") {
        return "Confirmed";
    }


    if (status === "shipped") {
        return "Shipped";
    }


    if (status === "delivered") {
        return "Delivered";
    }


    if (status === "cancelled") {
        return "Cancelled";
    }


    return "Pending";

}


/*
    DATE FORMAT
*/

function formatDate(date) {

    if (!date) {
        return "Recently";
    }


    const parsedDate =
        new Date(date);


    if (isNaN(parsedDate.getTime())) {
        return date;
    }


    return parsedDate.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/*
    VIEW ORDER DETAILS
*/

function viewOrder(orderId) {

    const orders =
        JSON.parse(
            localStorage.getItem("orders")
        ) || [];


    const order =
        orders.find(function (item) {

            return (
                String(item.id) ===
                String(orderId)
            );

        });


    if (!order) {

        alert(
            "Order details not found."
        );

        return;
    }


    const customerName =
        order.customerName ||
        order.customer ||
        "Customer";


    const productName =
        order.productName ||
        order.name ||
        "Craft Product";


    const quantity =
        order.quantity ||
        1;


    const price =
        order.totalPrice ||
        order.price ||
        0;


    const status =
        getStatus(order);


    alert(

        "ORDER DETAILS\n\n" +

        "Customer: " +
        customerName +

        "\nProduct: " +
        productName +

        "\nQuantity: " +
        quantity +

        "\nPrice: ₹" +
        Number(price).toLocaleString("en-IN") +

        "\nStatus: " +
        status

    );

}


/*
    GO TO DASHBOARD
*/

function goDashboard() {

    window.location.href =
        "creator-dashboard.html";

}