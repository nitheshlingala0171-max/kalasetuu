 document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("adminLoginForm");
    const passwordInput = document.getElementById("adminPassword");
    const togglePassword = document.getElementById("togglePassword");
    const loginMessage = document.getElementById("loginMessage");


    // Show / Hide Password
    togglePassword.addEventListener("click", function () {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";
            togglePassword.textContent = "Hide";

        } else {

            passwordInput.type = "password";
            togglePassword.textContent = "Show";
        }

    });


    // Login
    form.addEventListener("submit", function (event) {

        event.preventDefault();

        const email =
            document.getElementById("adminEmail").value.trim();

        const password =
            document.getElementById("adminPassword").value.trim();


        if (email === "" || password === "") {

            loginMessage.textContent =
                "Please enter email and password.";

            loginMessage.style.color = "#C65D3B";

            return;
        }


        // ADMIN LOGIN DETAILS
        const correctEmail = "admin@kalasetu.com";
        const correctPassword = "admin123";


        if (
            email.toLowerCase() === correctEmail &&
            password === correctPassword
        ) {

            // Save login
            localStorage.setItem(
                "adminLoggedIn",
                "true"
            );

            localStorage.setItem(
                "adminEmail",
                email
            );


            loginMessage.textContent =
                "Login successful!";

            loginMessage.style.color =
                "#7B8060";


            // Go to dashboard
            setTimeout(function () {

                window.location.href =
                    "admin-dashboard.html";

            }, 300);


        } else {

            loginMessage.textContent =
                "Invalid admin email or password.";

            loginMessage.style.color =
                "#C65D3B";
        }

    });

});


function goBack() {

    window.history.back();

}