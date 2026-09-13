document.addEventListener("DOMContentLoaded", function () {

    loadDashboardCounts();

    const adminEmail = localStorage.getItem("adminEmail");

    if (adminEmail) {
        document.getElementById("adminEmail").textContent = adminEmail;
    }

});


function loadDashboardCounts() {

    let customers = [];
    let creators = [];
    let crafts = [];
    let orders = [];

    try {

        customers =
            JSON.parse(localStorage.getItem("customers")) || [];

        creators =
            JSON.parse(localStorage.getItem("creatorProfiles")) || [];

        crafts =
            JSON.parse(localStorage.getItem("creatorCrafts")) || [];

        orders =
            JSON.parse(localStorage.getItem("orders")) || [];

    } catch (error) {

        console.log("Data loading error:", error);

    }


    document.getElementById("customerCount").textContent =
        customers.length;


    const creatorProfile =
        localStorage.getItem("creatorProfile");

    if (creatorProfile) {

        document.getElementById("creatorCount").textContent = "1";

    } else {

        document.getElementById("creatorCount").textContent =
            creators.length;
    }


    document.getElementById("craftCount").textContent =
        crafts.length;


    document.getElementById("orderCount").textContent =
        orders.length;
}


function openPage(page) {
    window.location.href = page;
}


function logoutAdmin() {

    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminEmail");

    window.location.href = "admin-login.html";
}