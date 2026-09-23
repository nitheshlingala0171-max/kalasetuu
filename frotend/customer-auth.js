const customerForm = document.getElementById("customerForm");

customerForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const contact = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (contact === "" || password === "") {
        alert("Please enter your login details.");
        return;
    }

    try {

        const response = await fetch(
            "http://localhost:5000/api/customers/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    contact: contact,
                    password: password
                })
            }
        );

        const data = await response.json();

        console.log("LOGIN RESPONSE:", data);

        if (!response.ok) {
            alert(data.message || "Login failed.");
            return;
        }

        /*
         * Save only customer information needed
         * by the current frontend.
         *
         * Password is NOT stored.
         */
        localStorage.setItem(
            "customerAccount",
            JSON.stringify(data.customer)
        );

        alert("Customer login successful!");

        window.location.href = "customer-home.html";

    } catch (error) {

        console.error("Customer login error:", error);

        alert(
            "Unable to connect to server. Please make sure the backend is running."
        );
    }
});


/* Forgot Password */

document.getElementById("forgotPassword").addEventListener(
    "click",
    function (event) {

        event.preventDefault();

        alert(
            "Password reset will be connected to the backend soon."
        );
    }
);


/* Create Account */

document.getElementById("registerLink").addEventListener(
    "click",
    function (event) {

        event.preventDefault();

        window.location.href = "customer-register.html";
    }
);