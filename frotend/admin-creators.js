
document.addEventListener("DOMContentLoaded", function () {

    const API = "http://localhost:5000/api/creators";

    const creatorRequests = document.getElementById("creatorRequests");
    const approvedCreators = document.getElementById("approvedCreators");
    const emptyMessage = document.getElementById("emptyMessage");

    const pendingCount = document.getElementById("pendingCount");
    const approvedCount = document.getElementById("approvedCount");
    const rejectedCount = document.getElementById("rejectedCount");

    const adminEmail = document.getElementById("adminEmail");

    // ADMIN LOGIN CHECK
    if (localStorage.getItem("adminLoggedIn") !== "true") {
        window.location.href = "admin-login.html";
        return;
    }

    const savedAdminEmail = localStorage.getItem("adminEmail");
    if (savedAdminEmail) {
        adminEmail.textContent = savedAdminEmail;
    }

    let creators = [];

    // SAFE TEXT
    function safe(value) {
        return String(value ?? "Not provided").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    // LOAD CREATORS FROM POSTGRESQL
    async function loadCreators() {

        creatorRequests.innerHTML = "<p>Loading creator requests...</p>";

        try {
            const response = await fetch(`${API}/admin/creators`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to load creators.");
            }

            creators = data.creators || [];

            renderCreators();

        } catch (error) {
            console.error("Creator loading error:", error);

            creatorRequests.innerHTML = `
                <div class="empty-message">
                    <h3>Unable to Load Creator Requests</h3>
                    <p>${safe(error.message)}</p>
                    <p>Check whether the backend server is running.</p>
                    <button onclick="loadCreatorRequests()">RETRY</button>
                </div>
            `;
        }
    }

    // RENDER CREATOR DETAILS
    function renderCreators() {

        const pending = creators.filter(c => c.status === "Pending");
        const approved = creators.filter(c => c.status === "Approved");
        const rejected = creators.filter(c => c.status === "Rejected");

        pendingCount.textContent = pending.length;
        approvedCount.textContent = approved.length;
        rejectedCount.textContent = rejected.length;

        // PENDING REQUESTS
        creatorRequests.innerHTML = "";

        emptyMessage.style.display =
            pending.length === 0 ? "block" : "none";

        pending.forEach(creator => {

            const card = document.createElement("div");
            card.className = "creator-card";

            const photo = creator.craft_photo
                ? `<img src="${safe(creator.craft_photo)}" alt="Uploaded craft photo">`
                : `<p>No craft photo uploaded</p>`;

            card.innerHTML = `
                <div class="creator-photo">
                    ${photo}
                </div>

                <div class="creator-details">
                    <h4>${safe(creator.name)}</h4>

                    <p><strong>Contact:</strong> ${safe(creator.contact)}</p>
                    <p><strong>Craft:</strong> ${safe(creator.craft_type)}</p>
                    <p><strong>Location:</strong> ${safe(creator.location)}</p>
                    <p><strong>Experience:</strong> ${safe(creator.experience)}</p>
                    <p><strong>Submitted:</strong> ${creator.submitted_at ? safe(new Date(creator.submitted_at).toLocaleString()) : "Not available"}</p>

                    <span class="pending-badge">PENDING VERIFICATION</span>
                </div>

                <div class="creator-actions">
                    <button class="view-btn" onclick="viewCreator('${safe(creator.id)}')">
                        VIEW DETAILS
                    </button>

                    <button class="approve-btn" onclick="approveCreator('${safe(creator.id)}')">
                        APPROVE
                    </button>

                    <button class="reject-btn" onclick="rejectCreator('${safe(creator.id)}')">
                        REJECT
                    </button>
                </div>
            `;

            creatorRequests.appendChild(card);
        });

        // APPROVED CREATORS
        approvedCreators.innerHTML = "";

        if (approved.length === 0) {
            approvedCreators.innerHTML = `
                <div class="empty-message">
                    <h3>No Approved Creators</h3>
                    <p>Approved creators will appear here.</p>
                </div>
            `;
        } else {

            approved.forEach(creator => {

                const card = document.createElement("div");
                card.className = "approved-card";

                card.innerHTML = `
                    <div>
                        <h4>${safe(creator.name)}</h4>
                        <p>${safe(creator.craft_type)} • ${safe(creator.location)}</p>
                    </div>

                    <span class="approved-badge">APPROVED</span>
                `;

                approvedCreators.appendChild(card);
            });
        }
    }

    // VIEW CREATOR
    window.viewCreator = function (id) {

        const creator = creators.find(
            item => String(item.id) === String(id)
        );

        if (!creator) {
            alert("Creator details not found.");
            return;
        }

        alert(
            "CREATOR DETAILS\n\n" +
            "Name: " + (creator.name || "Not provided") +
            "\nContact: " + (creator.contact || "Not provided") +
            "\nCraft: " + (creator.craft_type || "Not provided") +
            "\nLocation: " + (creator.location || "Not provided") +
            "\nExperience: " + (creator.experience || "Not provided") +
            "\nStatus: " + (creator.status || "Not provided")
        );
    };

    // UPDATE STATUS IN POSTGRESQL
    async function updateCreatorStatus(id, status) {

        try {
            const response = await fetch(
                `${API}/admin/creators/${encodeURIComponent(id)}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ status })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Status update failed.");
            }

            alert(`Creator ${status.toLowerCase()} successfully!`);

            await loadCreators();

        } catch (error) {
            console.error("Status update error:", error);
            alert(error.message);
        }
    }

    // APPROVE
    window.approveCreator = async function (id) {

        const creator = creators.find(
            item => String(item.id) === String(id)
        );

        if (!creator) {
            alert("Creator not found.");
            return;
        }

        if (confirm(`Approve ${creator.name} as a Kalasetu creator?`)) {
            await updateCreatorStatus(id, "Approved");
        }
    };

    // REJECT
    window.rejectCreator = async function (id) {

        const creator = creators.find(
            item => String(item.id) === String(id)
        );

        if (!creator) {
            alert("Creator not found.");
            return;
        }

        if (confirm(`Reject ${creator.name}'s verification request?`)) {
            await updateCreatorStatus(id, "Rejected");
        }
    };

    // RETRY BUTTON
    window.loadCreatorRequests = loadCreators;

    // INITIAL LOAD
    loadCreators();

});

// BACK TO DASHBOARD
function goBack() {
    window.location.href = "admin-dashboard.html";
}
