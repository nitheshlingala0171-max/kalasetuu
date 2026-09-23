/* =========================================================
   KALASETU - ADMIN REPORTS JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    loadReports();
});


/* ================= LOAD REPORTS ================= */

function loadReports() {

    let customers = [];
    let creators = [];
    let crafts = [];
    let orders = [];

    /* ================= LOAD DATA ================= */

    try {
        customers =
            JSON.parse(
                localStorage.getItem("customers")
            ) || [];
    } catch (error) {
        console.log("Customers loading error:", error);
        customers = [];
    }


    try {
        creators =
            JSON.parse(
                localStorage.getItem("creatorVerifications")
            ) || [];
    } catch (error) {
        console.log("Creators loading error:", error);
        creators = [];
    }


    try {
        crafts =
            JSON.parse(
                localStorage.getItem("creatorCrafts")
            ) || [];
    } catch (error) {
        console.log("Crafts loading error:", error);
        crafts = [];
    }


    try {
        orders =
            JSON.parse(
                localStorage.getItem("orders")
            ) || [];
    } catch (error) {
        console.log("Orders loading error:", error);
        orders = [];
    }


    /* ================= CUSTOMER COUNT ================= */

    document.getElementById("totalCustomers").textContent =
        customers.length;


    /* ================= CREATOR COUNT ================= */

    const approvedCreators =
        creators.filter(function (creator) {

            return String(
                creator.status || ""
            ).toLowerCase() === "approved";

        });


    const pendingCreators =
        creators.filter(function (creator) {

            return String(
                creator.status || ""
            ).toLowerCase() === "pending";

        });


    document.getElementById("totalCreators").textContent =
        approvedCreators.length;


    document.getElementById("approvedCreators").textContent =
        approvedCreators.length;


    document.getElementById("pendingCreators").textContent =
        pendingCreators.length;


    /* ================= CRAFT COUNT ================= */

    document.getElementById("totalCrafts").textContent =
        crafts.length;


    /* ================= CRAFTS UNDER REVIEW ================= */

    const craftsUnderReview =
        crafts.filter(function (craft) {

            const status =
                String(
                    craft.status || "Under Review"
                ).toLowerCase();

            return (
                status === "under review" ||
                status === "pending"
            );

        });


    document.getElementById("reviewCrafts").textContent =
        craftsUnderReview.length;


    /* ================= ORDER COUNT ================= */

    document.getElementById("totalOrders").textContent =
        orders.length;


    /* ================= ORDER STATUS ================= */

    let pending = 0;
    let confirmed = 0;
    let shipped = 0;
    let delivered = 0;
    let cancelled = 0;


    orders.forEach(function (order) {

        const status =
            String(
                order.status || "Pending"
            )
            .trim()
            .toLowerCase();


        if (
            status === "pending" ||
            status === "order placed" ||
            status === "placed"
        ) {

            pending++;

        } else if (status === "confirmed") {

            confirmed++;

        } else if (status === "shipped") {

            shipped++;

        } else if (
            status === "delivered"
        ) {

            delivered++;

        } else if (
            status === "cancelled" ||
            status === "canceled"
        ) {

            cancelled++;

        } else {

            pending++;

        }

    });


    /* ================= DISPLAY STATUS ================= */

    document.getElementById("pendingOrders").textContent =
        pending;

    document.getElementById("confirmedOrders").textContent =
        confirmed;

    document.getElementById("shippedOrders").textContent =
        shipped;

    document.getElementById("deliveredOrders").textContent =
        delivered;

    document.getElementById("cancelledOrders").textContent =
        cancelled;
}


/* ================= DASHBOARD ================= */

function goDashboard() {

    window.location.href =
        "admin-dashboard.html";
}