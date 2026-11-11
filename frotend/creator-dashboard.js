
document.addEventListener("DOMContentLoaded", async function () {

    // =========================================
    // 1. GET LOGGED-IN CREATOR
    // =========================================

    let creator = null;

    try {
        creator = JSON.parse(
            localStorage.getItem("loggedInCreator")
        );
    } catch (error) {
        console.error("Creator data error:", error);
    }

    if (!creator || !creator.id) {
        alert("Please login as a creator.");
        window.location.href = "creator-auth.html";
        return;
    }

    // Display creator name
    const creatorNameElement =
        document.getElementById("creatorName");

    if (creatorNameElement) {
        creatorNameElement.textContent =
            creator.name || "Creator";
    }

    // =========================================
    // 2. GET VERIFICATION DETAILS FROM POSTGRESQL
    // =========================================

    try {
        const response = await fetch(
            `http://localhost:5000/api/creators/verification/${creator.id}`
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.creator) {
            throw new Error(
                data.message || "Unable to load creator verification."
            );
        }

        const verification = data.creator;

        // Save latest database details
        localStorage.setItem(
            "creatorVerification",
            JSON.stringify(verification)
        );

        creator.status = verification.status;
        creator.craft = verification.craft_type;

        localStorage.setItem(
            "loggedInCreator",
            JSON.stringify(creator)
        );

        // =========================================
        // 3. VERIFICATION STATUS
        // =========================================

        const currentStatus =
            verification.status || "Not Submitted";

        window.creatorVerificationStatus = currentStatus;

        const craft =
            document.getElementById("creatorCraft");

        const location =
            document.getElementById("creatorLocation");

        const experience =
            document.getElementById("creatorExperience");

        const status =
            document.getElementById("verificationStatus");

        if (craft) {
            craft.textContent =
                verification.craft_type || "Not available";
        }

        if (location) {
            location.textContent =
                verification.location || "Not available";
        }

        if (experience) {
            experience.textContent =
                verification.experience
                    ? verification.experience + " years"
                    : "Not available";
        }

        if (status) {
            status.textContent = currentStatus;

            if (currentStatus === "Approved") {
                status.style.background = "#dfead9";
                status.style.color = "#557047";
            } else if (currentStatus === "Rejected") {
                status.style.background = "#f2d9d4";
                status.style.color = "#9b4034";
            } else {
                status.style.background = "";
                status.style.color = "";
            }
        }

    } catch (error) {
        console.error("Dashboard verification error:", error);

        window.creatorVerificationStatus =
            creator.status || "Not Submitted";

        alert(
            "Unable to load verification details. Please check your backend connection and try again."
        );
    }

});


// =========================================
// 4. MY CRAFTS
// =========================================

function openMyCrafts() {

    if (window.creatorVerificationStatus !== "Approved") {
        alert("My Crafts will be available after admin approval.");
        return;
    }

    window.location.href = "creator-my-crafts.html";
}


// =========================================
// 5. ADD NEW CRAFT
// =========================================

function addNewCraft() {

    if (window.creatorVerificationStatus !== "Approved") {
        alert("Your creator verification is pending. You can add crafts after admin approval.");
        return;
    }

    window.location.href = "creator-add-craft.html";
}


// =========================================
// CUSTOM CRAFT REQUESTS
// =========================================

function openCustomCraftRequests() {

    if (window.creatorVerificationStatus !== "Approved") {
        alert("Custom Craft Requests will be available after admin approval.");
        return;
    }

    window.location.href = "creator-custom-requests.html";
}

// =========================================
// 6. ORDERS
// =========================================

function openOrders() {
    window.location.href = "creator-orders.html";
}


// =========================================
// 7. CREATOR PROFILE
// =========================================

function openProfile() {
    window.location.href = "creator-profile.html";
}


// =========================================
// 8. LOGOUT
// =========================================

function logout() {

    const confirmLogout = confirm(
        "Are you sure you want to logout?"
    );

    if (confirmLogout) {

        localStorage.removeItem("loggedInCreator");
        localStorage.removeItem("creatorVerification");

        window.location.href = "creator-auth.html";
    }
}
