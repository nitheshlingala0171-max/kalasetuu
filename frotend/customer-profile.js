document.addEventListener("DOMContentLoaded", async function () {

    const customerData = localStorage.getItem("customerAccount");

    const nameElement = document.getElementById("profileName");
    const contactElement = document.getElementById("profileContact");

    if (!customerData) {

        alert("Please login first.");

        window.location.href = "customer-auth.html";

        return;
    }

    try {

        const customer = JSON.parse(customerData);

        if (!customer.id) {

            console.log("Customer ID not found.");

            if (nameElement) {
                nameElement.textContent =
                    customer.name || "Customer";
            }

            if (contactElement) {
                contactElement.textContent =
                    customer.contact || "Not available";
            }

        } else {

            const response = await fetch(
                `http://localhost:5000/api/customers/profile/${customer.id}`
            );

            const data = await response.json();

            console.log("PROFILE RESPONSE:", data);

            if (!response.ok) {

                alert(
                    data.message ||
                    "Unable to load customer profile."
                );

                return;
            }

            const profile = data.customer;

            if (nameElement) {
                nameElement.textContent =
                    profile.name || "Customer";
            }

            if (contactElement) {
                contactElement.textContent =
                    profile.contact || "Not available";
            }

            // Update current logged-in customer data
            localStorage.setItem(
                "customerAccount",
                JSON.stringify(profile)
            );
        }

    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }


    // =================================================
    // LOGOUT
    // =================================================

    const logoutButton =
        document.querySelector(".logout-button");

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function () {

                const confirmLogout =
                    confirm(
                        "Are you sure you want to logout?"
                    );

                if (confirmLogout) {

                    localStorage.removeItem(
                        "customerAccount"
                    );

                    window.location.href =
                        "customer-auth.html";
                }

            }
        );
    }

});