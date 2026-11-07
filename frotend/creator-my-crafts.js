document.addEventListener("DOMContentLoaded", function () {
    loadCrafts();
    loadVerificationStatus();
});


/* Load Crafts */

function loadCrafts() {

    const craftsList =
        document.getElementById("craftsList");

    const emptyState =
        document.getElementById("emptyState");

    const craftCount =
        document.getElementById("craftCount");


    let crafts = [];

    const savedCrafts =
        localStorage.getItem("creatorCrafts");


    if (savedCrafts) {

        try {
            crafts = JSON.parse(savedCrafts);
        } catch (error) {

            console.log(
                "Creator crafts data error:",
                error
            );

            crafts = [];
        }
    }


    if (!Array.isArray(crafts)) {
        crafts = [];
    }


    /* Count */

    if (crafts.length === 1) {

        craftCount.textContent =
            "1 Craft";

    } else {

        craftCount.textContent =
            crafts.length + " Crafts";
    }


    /* No Crafts */

    if (crafts.length === 0) {

        craftsList.innerHTML = "";

        emptyState.style.display = "block";

        return;
    }


    /* Crafts Available */

    emptyState.style.display = "none";

    craftsList.innerHTML = "";


    crafts.forEach(function (craft, index) {

        const card =
            document.createElement("div");

        card.className = "craft-card";


        const image =
            craft.image || "";

        const name =
            craft.name || "Craft";

        const category =
            craft.category || "Craft";

        const price =
            craft.price || "0";

        const status =
            craft.status || "Under Review";


        card.innerHTML = `

            <div class="craft-image">

                <img
                    src="${image}"
                    alt="${name}"
                >

            </div>


            <div class="craft-content">

                <h4>${name}</h4>

                <p class="craft-category">
                    ${category}
                </p>


                <div class="craft-bottom">
                    <span class="craft-price">₹${price}</span>
                    <span class="craft-status">${status}</span>
                </div>

                <div class="stock-control">
                    <label>Stock availability</label>

                    <select onchange="updateCraftStock(${index}, this.value)">

                        <option value="In Stock" ${(craft.stockStatus || 'In Stock') === 'In Stock' ? 'selected' : ''}>
                            In Stock
                        </option>

                        <option value="Out of Stock" ${craft.stockStatus === 'Out of Stock' ? 'selected' : ''}>
                            Out of Stock
                        </option>

                    </select>
                </div>


                <div class="craft-actions">

                    <button
                        type="button"
                        onclick="editCraft(${index})"
                    >
                        EDIT
                    </button>

                    <button
                        type="button"
                        onclick="deleteCraft(${index})"
                    >
                        DELETE
                    </button>

                </div>

            </div>

        `;


        craftsList.appendChild(card);

    });

}


/* Verification Status */

function loadVerificationStatus() {

    const verificationData =
        localStorage.getItem("creatorVerification");


    if (!verificationData) {
        return;
    }


    try {

        const verification =
            JSON.parse(verificationData);


        const title =
            document.getElementById("verificationTitle");

        const message =
            document.getElementById("verificationMessage");


        if (verification.status === "Approved") {

            if (title) {
                title.textContent =
                    "Verification Status: Approved";
            }

            if (message) {
                message.textContent =
                    "Your creator profile has been approved. Your crafts can now be visible to customers.";
            }

        } else if (verification.status === "Pending") {

            if (title) {
                title.textContent =
                    "Verification Status: Pending";
            }

            if (message) {
                message.textContent =
                    "Your creator profile is under admin review. You may prepare and manage your crafts, but customers will only see crafts after the required approvals.";
            }

        } else if (verification.status === "Rejected") {

            if (title) {
                title.textContent =
                    "Verification Status: Rejected";
            }

            if (message) {
                message.textContent =
                    "Your creator profile was not approved. Please review your verification details.";
            }

        }

    } catch (error) {

        console.log(
            "Verification data error:",
            error
        );

    }

}


/* Add New Craft */

function addNewCraft() {

    window.location.href =
        "creator-add-craft.html";
}


/* Edit Craft */

function editCraft(index) {

    localStorage.setItem(
        "editingCraftIndex",
        index
    );

    window.location.href =
        "creator-add-craft.html";
}


/* Delete Craft */

function deleteCraft(index) {

    const answer =
        confirm(
            "Are you sure you want to delete this craft?"
        );


    if (!answer) {
        return;
    }


    let crafts = [];

    const savedCrafts =
        localStorage.getItem("creatorCrafts");


    if (savedCrafts) {

        try {
            crafts = JSON.parse(savedCrafts);
        } catch (error) {
            crafts = [];
        }

    }


    if (!Array.isArray(crafts)) {
        crafts = [];
    }


    crafts.splice(index, 1);


    localStorage.setItem(
        "creatorCrafts",
        JSON.stringify(crafts)
    );


    loadCrafts();

}


/* Dashboard */

function goDashboard() {

    window.location.href =
        "creator-dashboard.html";
}


/* Stock management */

function updateCraftStock(index, stockStatus) {

    let crafts = JSON.parse(
        localStorage.getItem("creatorCrafts") || "[]"
    );

    if (!crafts[index]) return;

    crafts[index].stockStatus = stockStatus;

    localStorage.setItem(
        "creatorCrafts",
        JSON.stringify(crafts)
    );

    alert(
        stockStatus === "In Stock"
            ? "Craft marked In Stock."
            : "Craft marked Out of Stock."
    );

    loadCrafts();
}