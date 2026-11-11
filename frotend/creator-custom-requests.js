
const API_URL = "http://localhost:5000/api/custom-crafts";

const requestsList = document.getElementById("requestsList");
const refreshButton = document.getElementById("refreshRequests");

const creator = JSON.parse(
    localStorage.getItem("loggedInCreator") || "null"
);

// Escape HTML to safely display text
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Format date
function formatDate(value) {
    if (!value) return "Not specified";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(value);
    }

    return date.toLocaleDateString("en-IN");
}

// Load all custom craft requests
async function loadCustomRequests() {

    if (!creator || !creator.id) {
        requestsList.innerHTML = `
            <div class="empty-message">
                Please login as a creator first.
            </div>
        `;
        return;
    }

    requestsList.innerHTML = `
        <div class="loading-message">
            Loading custom craft requests...
        </div>
    `;

    try {
        const response = await fetch(
            `${API_URL}/creator/${creator.id}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to load requests."
            );
        }

        // IMPORTANT: Backend returns { success: true, requests: [] }
        const requests = data.requests;

        if (!Array.isArray(requests) || requests.length === 0) {
            requestsList.innerHTML = `
                <div class="empty-message">
                    No custom craft requests available yet.
                </div>
            `;
            return;
        }

        requestsList.innerHTML = requests.map(request => {

            const isAccepted = request.status !== "OPEN";

            let actionHTML = "";

            if (!isAccepted) {

                actionHTML = `
                    <button class="accept-button"
                        onclick="acceptCustomRequest(${Number(request.id)})">
                        Accept Request
                    </button>
                `;

            } else if (
                Number(request.accepted_creator_id) === Number(creator.id)
            ) {

                actionHTML = `
                    <p class="accepted-message">
                        You accepted this request.
                    </p>
                `;

            } else {

                actionHTML = `
                    <p class="accepted-message">
                        Already accepted by
                        ${escapeHTML(
                            request.accepted_creator_name ||
                            "another creator"
                        )}.
                    </p>
                `;
            }

            const imageHTML = request.reference_image
                ? `
                    <img
                        class="request-image"
                        src="${escapeHTML(request.reference_image)}"
                        alt="Customer reference image"
                    >
                `
                : "";

            return `
                <div class="request-card">

                    <h3>${escapeHTML(request.craft_type)}</h3>

                    <div class="request-details">

                        <p>
                            <strong>Customer:</strong>
                            ${escapeHTML(request.customer_name)}
                        </p>

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
                            <strong>Required Date:</strong>
                            ${formatDate(request.required_date)}
                        </p>

                    </div>

                    <div class="request-description">

                        <p>
                            <strong>Customisation:</strong>
                            ${escapeHTML(
                                request.customisation || "Not specified"
                            )}
                        </p>

                        <p>
                            <strong>Instructions:</strong>
                            ${escapeHTML(request.instructions || "None")}
                        </p>

                        ${imageHTML}

                    </div>

                    <div class="request-status">
                        Status: ${escapeHTML(request.status)}
                    </div>

                    ${actionHTML}

                </div>
            `;

        }).join("");

    } catch (error) {

        console.error("Custom requests error:", error);

        requestsList.innerHTML = `
            <div class="empty-message">
                ${escapeHTML(error.message)}
                <p>Please check whether the backend server is running.</p>
            </div>
        `;
    }
}


// Accept a custom craft request
async function acceptCustomRequest(requestId) {

    if (!creator || !creator.id) {
        alert("Please login as a creator.");
        return;
    }

    const confirmed = confirm(
        "Do you want to accept this custom craft request?"
    );

    if (!confirmed) return;

    try {

        const response = await fetch(
            `${API_URL}/${requestId}/accept`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    creatorId: creator.id
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "This request has already been accepted."
            );

            await loadCustomRequests();
            return;
        }

        alert("Custom craft request accepted successfully!");

        await loadCustomRequests();

    } catch (error) {

        console.error("Accept request error:", error);

        alert(
            "Unable to accept request. Please check the backend server."
        );
    }
}


// Refresh button
refreshButton.addEventListener(
    "click",
    loadCustomRequests
);


// Initial loading
loadCustomRequests();


// Automatically refresh every 10 seconds
setInterval(loadCustomRequests, 10000);
