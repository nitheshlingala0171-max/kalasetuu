console.log("REGISTER JS LOADED");

document.getElementById("registerForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const contact = document.getElementById("contact").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (name === "" || contact === "" || password === "" || confirmPassword === "") {
        alert("Please fill all fields.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {

        const response = await fetch("https://kalasetuu-five.vercel.app/api/customers/register", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                contact: contact,
                password: password
            })
        });

        const data = await response.json();

        console.log("SERVER RESPONSE:", data);

        if (!response.ok) {
            alert(data.message || "Registration failed.");
            return;
        }

        /*
         * Save only the customer information needed
         * by the current frontend.
         *
         * Password is NOT stored here.
         */
        localStorage.setItem(
            "customerAccount",
            JSON.stringify(data.customer)
        );

        alert("Account created successfully.");

        window.location.href = "customer-auth.html";

    } catch (error) {

        console.error("Registration error:", error);

        alert(
            "Unable to connect to server. Please make sure the backend is running."
        );
    }
});


const loginLink = document.getElementById("loginLink");

if (loginLink) {

    loginLink.addEventListener("click", function(event) {

        event.preventDefault();

        window.location.href = "customer-auth.html";

    });

}