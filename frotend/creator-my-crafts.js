/* Load Crafts from PostgreSQL */

async function loadCrafts() {

    const craftsList = document.getElementById("craftsList");
    const emptyState = document.getElementById("emptyState");
    const craftCount = document.getElementById("craftCount");

    const creator =
        JSON.parse(
            localStorage.getItem("loggedInCreator") ||
            localStorage.getItem("creatorAccount") ||
            "null"
        );

    if (!creator || !creator.id) {
        alert("Creator login details not found. Please login again.");
        return;
    }

    try {

        craftsList.innerHTML = "<p>Loading crafts...</p>";

        const response = await fetch(
            `http://localhost:5000/api/creators/crafts/${creator.id}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load crafts.");
        }

        const crafts = data.crafts || [];

        // Keep database crafts available for Edit/Delete
        window.creatorCraftsCache = crafts;

        craftCount.textContent =
            crafts.length === 1
                ? "1 Craft"
                : crafts.length + " Crafts";

        if (crafts.length === 0) {
            craftsList.innerHTML = "";
            emptyState.style.display = "block";
            return;
        }

        emptyState.style.display = "none";
        craftsList.innerHTML = "";

        crafts.forEach(function (craft, index) {

            const card = document.createElement("div");
            card.className = "craft-card";

            const stock = craft.stock_status || "In Stock";

            card.innerHTML = `
                <div class="craft-image">
                    <img src="${craft.image || ""}" alt="${craft.name || "Craft"}">
                </div>

                <div class="craft-content">

                    <h4>${craft.name || "Craft"}</h4>

                    <p class="craft-category">
                        ${craft.category || "Craft"}
                    </p>

                    <div class="craft-bottom">
                        <span class="craft-price">₹${craft.price || 0}</span>
                        <span class="craft-status">${craft.status || "Under Review"}</span>
                    </div>

                    <div class="stock-control">
                        <label>Stock availability</label>

                        <select onchange="updateCraftStock(${index}, this.value)">
                            <option value="In Stock" ${stock === "In Stock" ? "selected" : ""}>
                                In Stock
                            </option>

                            <option value="Out of Stock" ${stock === "Out of Stock" ? "selected" : ""}>
                                Out of Stock
                            </option>
                        </select>
                    </div>

                    <div class="craft-actions">
                        <button type="button" onclick="editCraft(${index})">
                            EDIT
                        </button>

                        <button type="button" onclick="deleteCraft(${index})">
                            DELETE
                        </button>
                    </div>

                </div>
            `;

            craftsList.appendChild(card);
        });

    } catch (error) {

        console.error("Load crafts error:", error);

        craftsList.innerHTML = "";
        emptyState.style.display = "block";

        alert(error.message);
    }
}
document.addEventListener("DOMContentLoaded", loadCrafts);
async function updateCraftStock(index, stockStatus) {

    const craft = window.creatorCraftsCache[index];

    const creator = JSON.parse(
        localStorage.getItem("loggedInCreator") ||
        localStorage.getItem("creatorAccount") ||
        "null"
    );

    if (!craft || !creator) {
        alert("Craft or creator details not found.");
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/api/creators/crafts/${craft.id}/stock`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    creatorId: creator.id,
                    stockStatus: stockStatus
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Stock update failed");
        }

        craft.stock_status = stockStatus;

        alert("Stock updated successfully!");

    } catch (error) {
        console.error(error);
        alert(error.message);
        loadCrafts();
    }
}