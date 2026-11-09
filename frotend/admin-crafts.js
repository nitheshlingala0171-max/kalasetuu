
// =====================================================
// KALASETU ADMIN CRAFT MANAGEMENT
// Database-connected version
// =====================================================

const API = "http://localhost:5000/api/creators/admin/crafts";

let allCrafts = [];
let currentFilter = "All";

document.addEventListener("DOMContentLoaded", loadCrafts);


// =====================================================
// LOAD CRAFTS FROM DATABASE
// =====================================================

async function loadCrafts() {
    const craftsList = document.getElementById("craftsList");
    const emptyState = document.getElementById("emptyState");

    craftsList.innerHTML = "<p>Loading crafts...</p>";
    emptyState.style.display = "none";

    try {
        const response = await fetch(API);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load crafts.");
        }

        allCrafts = data.crafts || [];

        updateCounts();
        displayCrafts();

    } catch (error) {
        console.error("Admin crafts error:", error);
        craftsList.innerHTML = "";
        emptyState.style.display = "block";
        emptyState.querySelector("h3").textContent = "Unable to Load Crafts";
        emptyState.querySelector("p").textContent =
            "Check whether the backend server is running.";
    }
}


// =====================================================
// STATUS
// =====================================================

function getStatus(craft) {
    return craft.status || "Under Review";
}


// =====================================================
// SUMMARY COUNTS
// =====================================================

function updateCounts() {
    document.getElementById("totalCrafts").textContent =
        allCrafts.length;

    document.getElementById("pendingCrafts").textContent =
        allCrafts.filter(c => getStatus(c) === "Under Review").length;

    document.getElementById("approvedCrafts").textContent =
        allCrafts.filter(c => getStatus(c) === "Approved").length;

    document.getElementById("rejectedCrafts").textContent =
        allCrafts.filter(c => getStatus(c) === "Rejected").length;
}


// =====================================================
// DISPLAY CRAFTS
// =====================================================

function displayCrafts() {
    const craftsList = document.getElementById("craftsList");
    const emptyState = document.getElementById("emptyState");

    craftsList.innerHTML = "";

    const filteredCrafts = currentFilter === "All"
        ? allCrafts
        : allCrafts.filter(c => getStatus(c) === currentFilter);

    if (filteredCrafts.length === 0) {
        emptyState.style.display = "block";
        emptyState.querySelector("h3").textContent = "No Crafts Found";
        emptyState.querySelector("p").textContent =
            "Creator submitted crafts will appear here for admin review.";
        return;
    }

    emptyState.style.display = "none";

    filteredCrafts.forEach(craft => {
        craftsList.appendChild(createCraftCard(craft));
    });
}


// =====================================================
// CREATE CRAFT CARD
// =====================================================

function createCraftCard(craft) {
    const card = document.createElement("div");
    card.className = "craft-card";

    const status = getStatus(craft);

    const statusClass = status === "Approved"
        ? "status-approved"
        : status === "Rejected"
            ? "status-rejected"
            : "status-pending";

    const name = escapeHTML(craft.name || "Untitled Craft");
    const category = escapeHTML(craft.category || "Traditional Craft");
    const story = escapeHTML(craft.story || "No craft story provided.");
    const creatorName = escapeHTML(craft.creator_name || "Creator");
    const price = craft.price !== undefined && craft.price !== null
        ? "₹" + escapeHTML(craft.price)
        : "Price not specified";

    const image = craft.image || "images/background.png";

    const safeImage = String(image).replace(/"/g, "&quot;");

    card.innerHTML = `
        <div class="craft-image">
            <img src="${safeImage}" alt="${name}"
                 onerror="this.src='images/background.png'">
        </div>

        <div class="craft-content">
            <span class="craft-category">${category}</span>
            <h3>${name}</h3>
            <p class="craft-story">${story}</p>
            <div class="craft-price">${price}</div>

            <span class="status-badge ${statusClass}">
                ${escapeHTML(status)}
            </span>

            <div class="creator-info">
                <p>Creator: <strong>${creatorName}</strong></p>
                <p>Added: <strong>${formatDate(craft.created_at)}</strong></p>
            </div>

            <div class="card-actions">
                <button class="view-btn"
                    onclick="viewCraft(${Number(craft.id)})">
                    View
                </button>

                ${status !== "Approved" ? `
                    <button class="approve-btn"
                        onclick="updateCraftStatus(${Number(craft.id)}, 'Approved')">
                        Approve
                    </button>
                ` : ""}

                ${status !== "Rejected" ? `
                    <button class="reject-btn"
                        onclick="updateCraftStatus(${Number(craft.id)}, 'Rejected')">
                        Reject
                    </button>
                ` : ""}
            </div>
        </div>
    `;

    return card;
}


// =====================================================
// FILTER
// =====================================================

window.filterCrafts = function(filter, button) {
    currentFilter = filter;

    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    button.classList.add("active");
    displayCrafts();
};


// =====================================================
// APPROVE / REJECT THROUGH DATABASE
// =====================================================

window.updateCraftStatus = async function(id, status) {
    const craft = allCrafts.find(c => String(c.id) === String(id));

    if (!craft) {
        alert("Craft not found.");
        return;
    }

    const action = status === "Approved" ? "Approve" : "Reject";

    if (!confirm(`${action} "${craft.name}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API}/${id}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Status update failed.");
        }

        alert(data.message);
        await loadCrafts();

    } catch (error) {
        console.error("Craft status update error:", error);
        alert(error.message);
    }
};


// =====================================================
// VIEW CRAFT
// =====================================================

window.viewCraft = function(id) {
    const craft = allCrafts.find(c => String(c.id) === String(id));

    if (!craft) {
        alert("Craft not found.");
        return;
    }

    alert(
        "CRAFT DETAILS\n\n" +
        "Name: " + (craft.name || "Not specified") +
        "\nCategory: " + (craft.category || "Not specified") +
        "\nPrice: ₹" + (craft.price ?? "Not specified") +
        "\nCreator: " + (craft.creator_name || "Not specified") +
        "\nStatus: " + getStatus(craft) +
        "\n\nStory:\n" + (craft.story || "No story provided.")
    );
};


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (isNaN(date.getTime())) return "Not available";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// BACK TO DASHBOARD
// =====================================================

window.goDashboard = function() {
    window.location.href = "admin-dashboard.html";
};
