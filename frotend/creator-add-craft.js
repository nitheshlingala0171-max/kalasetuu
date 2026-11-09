
document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("addCraftForm");
    const craftImage = document.getElementById("craftImage");
    const imagePreview = document.getElementById("imagePreview");
    const craftPrice = document.getElementById("craftPrice");

    const creatorPrice = document.getElementById("creatorPrice");
    const materialsPrice = document.getElementById("materialsPrice");
    const packagingPrice = document.getElementById("packagingPrice");
    const platformPrice = document.getElementById("platformPrice");
    const totalCraftPrice = document.getElementById("totalCraftPrice");

    const breakdownInputs = [
        creatorPrice,
        materialsPrice,
        packagingPrice,
        platformPrice
    ];

    let imageData = "";
    let isLoadingCraft = false;

    const editingIndex = localStorage.getItem("editingCraftIndex");

    function getCreator() {
        return JSON.parse(
            localStorage.getItem("loggedInCreator") ||
            localStorage.getItem("creatorAccount") ||
            "null"
        );
    }

    function money(value) {
        return Math.round((Number(value) || 0) * 100) / 100;
    }

    function updateTotal() {
        const total = money(craftPrice.value);
        totalCraftPrice.textContent = "₹" + total.toFixed(2);
        return total;
    }

    // AUTOMATIC PRICE DIVISION - 60:20:10:10

    function autoSplitPrice() {

        const price = money(craftPrice.value);

        if (price <= 0) {
            breakdownInputs.forEach(input => {
                input.value = "0.00";
            });

            updateTotal();
            return;
        }

        const creator = money(price * 60 / 100);
        const materials = money(price * 20 / 100);
        const packaging = money(price * 10 / 100);
        const platform = money(price - creator - materials - packaging);

        creatorPrice.value = creator.toFixed(2);
        materialsPrice.value = materials.toFixed(2);
        packagingPrice.value = packaging.toFixed(2);
        platformPrice.value = platform.toFixed(2);

        updateTotal();
    }

    function getBreakdown() {

        return {
            creatorPrice: money(creatorPrice.value),
            materials: money(materialsPrice.value),
            packaging: money(packagingPrice.value),
            platformServices: money(platformPrice.value),
            total: money(craftPrice.value)
        };
    }

    function breakdownMatchesPrice() {

        const breakdownTotal = money(
            breakdownInputs.reduce((sum, input) => {
                return sum + money(input.value);
            }, 0)
        );

        return breakdownTotal === money(craftPrice.value);
    }

    // CRAFT PRICE CHANGE

    craftPrice.addEventListener("input", function () {

        if (!isLoadingCraft) {
            autoSplitPrice();
        }

    });

    // MANUAL BREAKDOWN EDIT

    breakdownInputs.forEach(input => {

        input.addEventListener("input", function () {

            if (Number(this.value) < 0) {
                this.value = "0";
            }

            // Total craft price remains unchanged.
            updateTotal();

        });

    });

    if (
        editingIndex !== null &&
        editingIndex !== "" &&
        !isNaN(editingIndex)
    ) {
        loadEditingCraft(Number(editingIndex));
    }

    // IMAGE PREVIEW + COMPRESSION

    craftImage.addEventListener("change", function () {

        const file = this.files[0];

        if (!file) {
            imageData = "";
            imagePreview.style.display = "none";
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file.");
            this.value = "";
            imageData = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {

            const image = new Image();

            image.onload = function () {

                const canvas = document.createElement("canvas");

                const maxWidth = 800;
                const maxHeight = 800;

                let width = image.width;
                let height = image.height;

                if (width > maxWidth) {
                    height = height * (maxWidth / width);
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width = width * (maxHeight / height);
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");

                ctx.drawImage(image, 0, 0, width, height);

                imageData = canvas.toDataURL("image/jpeg", 0.7);

                imagePreview.innerHTML = `
                    <img src="${imageData}" alt="Craft Preview">
                `;

                imagePreview.style.display = "block";
            };

            image.src = event.target.result;
        };

        reader.readAsDataURL(file);
    });


    // FORM SUBMIT - BACKEND

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const creator = getCreator();

        if (!creator || !creator.id) {
            alert("Creator login details not found. Please login again.");
            return;
        }

        const name = document.getElementById("craftName").value.trim();
        const category = document.getElementById("craftCategory").value;
        const story = document.getElementById("craftStory").value.trim();

        const breakdown = getBreakdown();
        const price = breakdown.total;

        if (!name || !category || !story || price <= 0) {
            alert("Please fill all craft details and enter a valid price.");
            return;
        }

        if (breakdownInputs.some(input =>
            input.value === "" ||
            !Number.isFinite(Number(input.value)) ||
            Number(input.value) < 0
        )) {
            alert("Please enter valid amounts in all price categories.");
            return;
        }

        if (!breakdownMatchesPrice()) {
            alert(
                "The total of Creator, Materials, Packaging and Platform & Services must equal the Craft Price."
            );
            return;
        }

        if (!imageData) {
            alert("Please upload a craft image.");
            return;
        }

        const craftDetails = {
            creatorId: creator.id,
            name,
            category,
            price,
            story,
            image: imageData,
            creatorPrice: breakdown.creatorPrice,
            materials: breakdown.materials,
            packaging: breakdown.packaging,
            platformServices: breakdown.platformServices
        };

        const isEditing =
            editingIndex !== null &&
            editingIndex !== "" &&
            !isNaN(editingIndex);

        try {

            let response;

            if (isEditing) {

                const crafts = JSON.parse(
                    localStorage.getItem("creatorCrafts") || "[]"
                );

                const index = Number(editingIndex);
                const existingCraft = crafts[index];

                if (!existingCraft || !existingCraft.id) {
                    alert("Craft not found. Please return to My Crafts and try again.");
                    return;
                }

                response = await fetch(
                    `http://localhost:5000/api/creators/crafts/${existingCraft.id}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(craftDetails)
                    }
                );

            } else {

                response = await fetch(
                    "http://localhost:5000/api/creators/crafts",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(craftDetails)
                    }
                );

            }

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to save craft.");
            }

            localStorage.removeItem("editingCraftIndex");

            alert(
                isEditing
                    ? "Craft updated successfully!"
                    : "Craft added successfully!"
            );

            window.location.href = "creator-my-crafts.html";

        } catch (error) {

            console.error("Craft save error:", error);
            alert(error.message);

        }

    });


    // LOAD EDITING CRAFT

    function loadEditingCraft(index) {

        let crafts = [];

        try {
            crafts = JSON.parse(
                localStorage.getItem("creatorCrafts") || "[]"
            );
        } catch (error) {
            console.error("Craft data error:", error);
            return;
        }

        if (!Array.isArray(crafts) || !crafts[index]) {
            alert("Craft not found. Please return to My Crafts.");
            return;
        }

        const craft = crafts[index];

        isLoadingCraft = true;

        document.getElementById("craftName").value = craft.name || "";
        document.getElementById("craftCategory").value = craft.category || "";
        craftPrice.value = craft.price || "";
        document.getElementById("craftStory").value = craft.story || "";

        creatorPrice.value = craft.creator_price ?? craft.creatorPrice ?? 0;
        materialsPrice.value = craft.materials ?? 0;
        packagingPrice.value = craft.packaging ?? 0;

        platformPrice.value =
            craft.platform_services ?? craft.platformServices ?? 0;

        updateTotal();

        isLoadingCraft = false;

        if (craft.image) {

            imagePreview.innerHTML = `
                <img src="${craft.image}" alt="Craft Preview">
            `;

            imagePreview.style.display = "block";
            imageData = craft.image;
            craftImage.removeAttribute("required");

        }

    }

});


/* BACK TO MY CRAFTS */

function goBack() {

    localStorage.removeItem("editingCraftIndex");

    window.location.href = "creator-my-crafts.html";

}
