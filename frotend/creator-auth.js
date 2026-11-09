
const creatorForm = document.getElementById("creatorForm");

creatorForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const loginId = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!loginId || !password) {
        alert("Please enter your login details.");
        return;
    }

    const submitButton = creatorForm.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    try {
        // STEP 1: Login using PostgreSQL
        const response = await fetch(
            "http://localhost:5000/api/creators/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contact: loginId,
                    password: password
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.creator) {
            alert(data.message || "Invalid creator login details.");
            return;
        }

        const creator = data.creator;

       localStorage.setItem(
    "loggedInCreator",
    JSON.stringify(creator)
);

localStorage.setItem(
    "creatorAccount",
    JSON.stringify(creator)
        );

        // STEP 2: Get verification status
        const verificationResponse = await fetch(
            `http://localhost:5000/api/creators/verification/${creator.id}`
        );

        const verificationData = await verificationResponse.json();

        if (!verificationResponse.ok) {
            alert("Unable to load verification details. Please try again.");
            return;
        }

       const verification = verificationData.creator;

        const status = verification.status;
        console.log("LOGIN CREATOR:", creator);
console.log("VERIFICATION DATA:", verification);
console.log("CREATOR STATUS:", status);

        // STEP 3: First login - verification not submitted
        if (!status || status === "Not Submitted") {
            window.location.href = "creator-verification.html";
            return;
        }

        localStorage.setItem(
            "creatorVerification",
            JSON.stringify(verification)
        );

        // STEP 4: Rejected creator must submit verification again
        if (status === "Rejected") {
            alert("Your verification was rejected. Please submit your details again.");
            window.location.href = "creator-verification.html";
            return;
        }

        // STEP 5: Pending or Approved - dashboard
        if (status === "Pending" || status === "Approved") {
            window.location.href = "creator-dashboard.html";
            return;
        }

        alert("Unknown verification status: " + status);

    } catch (error) {
        console.error("Creator login error:", error);
        alert("Unable to connect to the server. Please make sure the backend is running.");
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
});


// Forgot Password
document.getElementById("forgotPassword").addEventListener("click", function (event) {
    event.preventDefault();
    alert("Forgot password feature will be added later.");
});


// Create Account
document.getElementById("registerLink").addEventListener("click", function (event) {
    event.preventDefault();
    window.location.href = "creator-register.html";
});
