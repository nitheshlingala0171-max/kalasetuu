
const API = "http://localhost:5000/api/customers";


// =====================================================
// COMMON API REQUEST
// =====================================================

async function apiRequest(url, options = {}) {
    let response;

    try {
        response = await fetch(API + url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });
    } catch (error) {
        throw new Error("Backend connection failed. Start the server.");
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
}


// =====================================================
// CUSTOMER LOGIN
// =====================================================

const customerForm = document.getElementById("customerForm");

customerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const contact = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!contact || !password) {
        alert("Please enter your login details.");
        return;
    }

    try {
        const data = await apiRequest("/login", {
            method: "POST",
            body: JSON.stringify({
                contact: contact,
                password: password
            })
        });

        localStorage.setItem(
            "customerAccount",
            JSON.stringify(data.customer)
        );

        alert("Customer login successful!");

        window.location.href = "customer-home.html";

    } catch (error) {
        console.error("Login error:", error);
        alert(error.message);
    }
});


// =====================================================
// FORGOT PASSWORD - DEMO OTP
// =====================================================

const forgotPassword = document.getElementById("forgotPassword");

forgotPassword.addEventListener("click", async function (event) {
    event.preventDefault();

    // STEP 1: GET REGISTERED CONTACT
    const contact = prompt(
        "Enter your registered mobile number:"
    );

    if (contact === null) return;

    if (!contact.trim()) {
        alert("Please enter your registered mobile number.");
        return;
    }

    try {
        // STEP 2: GENERATE OTP
        const data = await apiRequest(
            "/forgot-password/send-otp",
            {
                method: "POST",
                body: JSON.stringify({
                    contact: contact.trim()
                })
            }
        );

        // DEMO ONLY: DISPLAY OTP ON SCREEN
        alert(
            "Your Kalasetu Demo OTP is: " +
            data.demoOtp +
            "\n\nValid for 5 minutes."
        );

        // STEP 3: ENTER OTP
        const otp = prompt("Enter your 6-digit OTP:");

        if (otp === null) return;

        if (!/^[0-9]{6}$/.test(otp.trim())) {
            alert("Please enter a valid 6-digit OTP.");
            return;
        }

        // STEP 4: NEW PASSWORD
        const newPassword = prompt(
            "Enter your new password (minimum 8 characters):"
        );

        if (newPassword === null) return;

        if (newPassword.length < 8) {
            alert("Password must contain at least 8 characters.");
            return;
        }

        // STEP 5: CONFIRM PASSWORD
        const confirmPassword = prompt(
            "Confirm your new password:"
        );

        if (confirmPassword === null) return;

        if (newPassword !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        // STEP 6: VERIFY OTP AND UPDATE DATABASE
        const resetData = await apiRequest(
            "/forgot-password/reset",
            {
                method: "POST",
                body: JSON.stringify({
                    contact: contact.trim(),
                    otp: otp.trim(),
                    newPassword: newPassword
                })
            }
        );

        alert(
            resetData.message +
            "\n\nYou can now login with your new password."
        );

        document.getElementById("password").value = "";

    } catch (error) {
        console.error("Forgot password error:", error);
        alert(error.message);
    }
});


// =====================================================
// CREATE ACCOUNT
// =====================================================

document.getElementById("registerLink").addEventListener(
    "click",
    function (event) {
        event.preventDefault();
        window.location.href = "customer-register.html";
    }
);
