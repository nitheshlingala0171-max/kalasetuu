
document.addEventListener("DOMContentLoaded", function () {
    const craftPhoto = document.getElementById("craftPhoto");
    const photoPreview = document.getElementById("photoPreview");
    const verificationForm = document.getElementById("verificationForm");

    let photoData = "";

    // Get logged-in creator from localStorage
    let creator = null;

    try {
        creator = JSON.parse(localStorage.getItem("loggedInCreator"));
    } catch (error) {
        console.error("Creator data error:", error);
    }

    if (!creator || !creator.id) {
        alert("Please login as a creator first.");
        window.location.href = "creator-login.html";
        return;
    }

    // PHOTO PREVIEW + COMPRESSION
    craftPhoto.addEventListener("change", function () {
        const file = this.files[0];

        if (!file) {
            photoPreview.style.display = "none";
            photoData = "";
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Please upload an image file.");
            this.value = "";
            photoData = "";
            photoPreview.style.display = "none";
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
            const image = new Image();

            image.onload = function () {
                const canvas = document.createElement("canvas");
                const maxSize = 600;

                let width = image.width;
                let height = image.height;

                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = height * (maxSize / width);
                        width = maxSize;
                    } else {
                        width = width * (maxSize / height);
                        height = maxSize;
                    }
                }

                canvas.width = Math.round(width);
                canvas.height = Math.round(height);

                const ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

                photoData = canvas.toDataURL("image/jpeg", 0.6);

                photoPreview.innerHTML = `
                    <img src="${photoData}" alt="Craft Preview">
                `;

                photoPreview.style.display = "block";
            };

            image.onerror = function () {
                alert("Unable to read this image. Please select another image.");
                craftPhoto.value = "";
                photoData = "";
            };

            image.src = event.target.result;
        };

        reader.onerror = function () {
            alert("Unable to read the selected image.");
        };

        reader.readAsDataURL(file);
    });

    // VERIFICATION FORM SUBMISSION
    verificationForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const craftType = document.getElementById("craftType").value;
        const location = document.getElementById("location").value.trim();
        const experience = document.getElementById("experience").value.trim();

        if (!craftType || !location || !experience) {
            alert("Please fill all verification details.");
            return;
        }

        if (!photoData) {
            alert("Please upload a photo of your handmade craft.");
            return;
        }

        const submitButton = verificationForm.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch(
                "http://localhost:5000/api/creators/verification",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        creatorId: creator.id,
                        craftType: craftType,
                        location: location,
                        experience: experience,
                        photo: photoData
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success || !data.creator) {
                alert(data.message || "Unable to submit verification.");
                return;
            }

            // Save returned PostgreSQL creator details
            localStorage.setItem(
                "creatorVerification",
                JSON.stringify(data.creator)
            );

            localStorage.setItem(
                "loggedInCreator",
                JSON.stringify({
                    ...creator,
                    status: data.creator.status,
                    craft: data.creator.craft_type
                })
            );

            alert(
                "Verification submitted successfully. Your profile is pending admin approval."
            );

            window.location.href = "creator-pending.html";

        } catch (error) {
            console.error("Verification submission error:", error);
            alert(
                "Unable to connect to the server. Please make sure the backend is running."
            );
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
});
