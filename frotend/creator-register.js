
const creatorRegisterForm = document.getElementById("creatorRegisterForm");

if (creatorRegisterForm) {
    creatorRegisterForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const contact = document.getElementById("contact").value.trim();
        const craft = document.getElementById("craft").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (!name || !contact || !craft || !password || !confirmPassword) {
            alert("Please fill all fields.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            alert("Password must contain at least 6 characters.");
            return;
        }

        const submitButton = creatorRegisterForm.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        const originalButtonText = submitButton
            ? (submitButton.textContent || submitButton.value)
            : "";

        if (submitButton) {
            submitButton.disabled = true;
            if (submitButton.tagName === "INPUT") {
                submitButton.value = "Creating Account...";
            } else {
                submitButton.textContent = "Creating Account...";
            }
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/creators/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        contact,
                        craft,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                alert(data.message || "Creator registration failed.");
                return;
            }

            // Store creator details only. Do not store the password.
            localStorage.setItem(
                "creatorAccount",
                JSON.stringify(data.creator)
            );

            alert("Creator account created successfully!");

            window.location.href = "creator-auth.html";

        } catch (error) {
            console.error("Creator registration error:", error);
            alert(
                "Unable to connect to the server. Please make sure the backend is running."
            );
        } finally {
            if (submitButton) {
                submitButton.disabled = false;

                if (submitButton.tagName === "INPUT") {
                    submitButton.value = originalButtonText;
                } else {
                    submitButton.textContent = originalButtonText;
                }
            }
        }
    });
}


// LOGIN LINK

const loginLink = document.getElementById("loginLink");

if (loginLink) {
    loginLink.addEventListener("click", function (event) {
        event.preventDefault();
        window.location.href = "creator-auth.html";
    });
}
