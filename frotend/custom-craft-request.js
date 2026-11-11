
document.addEventListener("DOMContentLoaded", function () {

    const form = document.querySelector("form");

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const customerAccount = JSON.parse(
            localStorage.getItem("customerAccount") || "null"
        );

        if (!customerAccount || !customerAccount.id) {
            alert("Please login first to submit a custom craft request.");
            window.location.href = "customer-auth.html";
            return;
        }

        const referenceFile =
            document.getElementById("reference").files[0];

        // Convert reference image into Base64
        const readImage = (file) => {
            return new Promise((resolve, reject) => {

                if (!file) {
                    resolve(null);
                    return;
                }

                if (file.size > 5 * 1024 * 1024) {
                    reject(new Error("Reference image must be under 5 MB."));
                    return;
                }

                const reader = new FileReader();

                reader.onload = () => resolve(reader.result);
                reader.onerror = () =>
                    reject(new Error("Unable to read reference image."));

                reader.readAsDataURL(file);
            });
        };

        try {

            const referenceImage = await readImage(referenceFile);

            const requestData = {

                customerId: customerAccount.id,

                craftType:
                    document.getElementById("craftType").value,

                occasion:
                    document.getElementById("occasion").value,

                budget:
                    document.getElementById("budget").value,

                colour:
                    document.getElementById("colour").value,

                size:
                    document.getElementById("size").value,

                customisation:
                    document.getElementById("customisation").value,

                referenceImage: referenceImage,

                requiredDate:
                    document.getElementById("requiredDate").value,

                instructions:
                    document.getElementById("instructions").value
            };

            const response = await fetch(
                "http://localhost:5000/api/custom-crafts",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(requestData)
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Request submission failed."
                );
            }

            alert("Custom craft request submitted successfully!");

            window.location.href = "custom-craft-requests.html";

        } catch (error) {

            console.error("Custom request error:", error);

            alert(error.message || "Something went wrong. Please try again.");

        }

    });

});
