
document.addEventListener("DOMContentLoaded", function () {

    const requestsList = document.getElementById("requestsList");

    async function loadRequests() {

        const customerAccount = JSON.parse(
            localStorage.getItem("customerAccount") || "null"
        );

        if (!customerAccount || !customerAccount.id) {

            requestsList.innerHTML = `
                <div class="empty-state">
                    <h3>Please Login</h3>
                    <p>Login to view your custom craft requests.</p>

                    <a href="customer-login.html" class="create-btn">
                        Login
                    </a>
                </div>
            `;

            return;
        }

        try {

            requestsList.innerHTML = "<p>Loading your requests...</p>";

            const response = await fetch(
                `http://localhost:5000/api/custom-crafts/customer/${customerAccount.id}`
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to load requests."
                );
            }

            const requests = result.requests || [];

            if (requests.length === 0) {

                requestsList.innerHTML = `
                    <div class="empty-state">
                        <h3>No Custom Craft Requests Yet</h3>

                        <p>
                            Create your first personalised craft request.
                        </p>

                        <a href="custom-craft-request.html" class="create-btn">
                            + Create New Request
                        </a>
                    </div>
                `;

                return;
            }

            requestsList.innerHTML = "";

            requests.forEach(request => {

                const card = document.createElement("div");

                card.className = "request-item";

                const status = request.status || "OPEN";

                card.innerHTML = `
                    <div class="request-info">

                        <h3>${escapeHTML(request.craft_type)}</h3>

                        <p>
                            <strong>Occasion:</strong>
                            ${escapeHTML(request.occasion)}
                        </p>

                        <p>
                            <strong>Budget:</strong>
                            ₹${escapeHTML(request.budget)}
                        </p>

                        <p>
                            <strong>Colour:</strong>
                            ${escapeHTML(request.colour || "Not specified")}
                        </p>

                        <p>
                            <strong>Size:</strong>
                            ${escapeHTML(request.size || "Not specified")}
                        </p>

                        <p>
                            <strong>Customisation:</strong>
                            ${escapeHTML(request.customisation || "Not specified")}
                        </p>

                        <p>
                            <strong>Required Date:</strong>
                            ${escapeHTML(request.required_date || "Not specified")}
                        </p>

                        <p>
                            <strong>Instructions:</strong>
                            ${escapeHTML(request.instructions || "None")}
                        </p>

                        ${
                            request.reference_image
                            ? `
                                <img
                                    src="${escapeHTML(request.reference_image)}"
                                    alt="Reference image"
                                    style="
                                        max-width:180px;
                                        max-height:180px;
                                        object-fit:contain;
                                    "
                                >
                            `
                            : ""
                        }

                        ${
                            status === "ACCEPTED"
                            ? `
                                <div class="accepted-creator">
                                    <h4>Request Accepted!</h4>

                                    <p>
                                        <strong>Creator:</strong>
                                        ${escapeHTML(request.accepted_creator_name || "Creator")}
                                    </p>

                                    <p>
                                        <strong>Contact:</strong>
                                        ${escapeHTML(request.accepted_creator_contact || "Not available")}
                                    </p>
                                </div>
                            `
                            : ""
                        }

                    </div>

                    <div class="request-status">
                        ${escapeHTML(status)}
                    </div>
                `;

                requestsList.appendChild(card);

            });

        } catch (error) {

            console.error("Load requests error:", error);

            requestsList.innerHTML = `
                <div class="empty-state">
                    <h3>Unable to Load Requests</h3>

                    <p>${escapeHTML(error.message)}</p>

                    <button onclick="location.reload()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    function escapeHTML(value) {

        return String(value ?? "").replace(/[&<>"']/g, function (char) {

            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char];

        });
    }

    loadRequests();

});
