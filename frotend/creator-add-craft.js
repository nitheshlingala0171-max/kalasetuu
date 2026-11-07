
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

    function money(value) {
        return Math.round((Number(value) || 0) * 100) / 100;
    }

    function updateTotal(updatePriceField = true) {

        const total = money(
            breakdownInputs.reduce((sum, input) => {
                return sum + Math.max(0, Number(input.value) || 0);
            }, 0)
        );

        totalCraftPrice.textContent = "₹" + total.toFixed(2);

        if (updatePriceField) {
            craftPrice.value = total;
        }

        return total;
    }

    function autoSplitPrice() {

        const price = money(craftPrice.value);

        if (!price || price < 0) {
            breakdownInputs.forEach(input => input.value = "0");
            updateTotal(false);
            return;
        }

        const creator = money(price * 0.60);
        const materials = money(price * 0.20);
        const packaging = money(price * 0.10);

        // Remaining amount ensures the total matches the entered price.
        const platform = money(price - creator - materials - packaging);

        creatorPrice.value = creator.toFixed(2);
        materialsPrice.value = materials.toFixed(2);
        packagingPrice.value = packaging.toFixed(2);
        platformPrice.value = platform.toFixed(2);

        updateTotal(false);
    }

    function getBreakdown() {
        return {
            creatorPrice: money(creatorPrice.value),
            materials: money(materialsPrice.value),
            packaging: money(packagingPrice.value),
            platformServices: money(platformPrice.value),
            total: updateTotal(false)
        };
    }

    // AUTO SPLIT WHEN CREATOR ENTERS PRICE
    craftPrice.addEventListener("input", function () {
        if (!isLoadingCraft) {
            autoSplitPrice();
        }
    });

    // MANUAL EDITING OF BREAKDOWN
    breakdownInputs.forEach(input => {

        input.addEventListener("input", function () {

            if (Number(this.value) < 0) {
                this.value = 0;
            }

            updateTotal(true);
        });

    });

    // EDIT MODE
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

    // FORM SUBMIT
    form.addEventListener("submit", function (event) {

        event.preventDefault();

        let creatorAccount = {};

        try {
            creatorAccount = JSON.parse(
                localStorage.getItem("creatorAccount") || "{}"
            );
        } catch (error) {
            creatorAccount = {};
        }

        const creatorName =
            creatorAccount.name ||
            creatorAccount.fullName ||
            creatorAccount.username ||
            "Local Artisan";

        const name = document.getElementById("craftName").value.trim();
        const category = document.getElementById("craftCategory").value;
        const story = document.getElementById("craftStory").value.trim();

        const breakdown = getBreakdown();
        const price = breakdown.total;

        if (
            name === "" ||
            category === "" ||
            story === "" ||
            price <= 0
        ) {
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

        if (imageData === "") {
            alert("Please upload a craft image.");
            return;
        }

        let crafts = [];

        try {
            const savedCrafts = localStorage.getItem("creatorCrafts");

            if (savedCrafts) {
                crafts = JSON.parse(savedCrafts);
            }

            if (!Array.isArray(crafts)) {
                crafts = [];
            }

        } catch (error) {
            console.log("Craft data error:", error);
            crafts = [];
        }

        const craftDetails = {
            creatorPrice: breakdown.creatorPrice,
            materials: breakdown.materials,
            packaging: breakdown.packaging,
            platformServices: breakdown.platformServices,
            priceBreakdown: breakdown
        };

        // EDIT EXISTING CRAFT
        if (
            editingIndex !== null &&
            editingIndex !== "" &&
            !isNaN(editingIndex)
        ) {

            const index = Number(editingIndex);

            if (!crafts[index]) {
                alert("Craft not found.");
                return;
            }

            crafts[index].name = name;
            crafts[index].category = category;
            crafts[index].price = price;
            crafts[index].story = story;
            crafts[index].creatorName = creatorName;

            Object.assign(crafts[index], craftDetails);

            if (imageData !== "") {
                crafts[index].image = imageData;
            }

            crafts[index].status =
                crafts[index].status || "Under Review";

            try {
                localStorage.setItem(
                    "creatorCrafts",
                    JSON.stringify(crafts)
                );
            } catch (error) {
                console.error(error);
                alert("Unable to save craft. Please try a smaller image.");
                return;
            }

            localStorage.removeItem("editingCraftIndex");

            alert("Craft updated successfully!");
            window.location.href = "creator-my-crafts.html";
            return;
        }

        // CREATE NEW CRAFT
        const newCraft = {

            id: "craft_" + Date.now(),

            name: name,
            creatorName: creatorName,
            category: category,
            price: price,
            ...craftDetails,
            story: story,
            image: imageData,
            status: "Under Review",
            stockStatus: "In Stock",
            createdAt: new Date().toISOString()
        };

        crafts.push(newCraft);

        try {
            localStorage.setItem(
                "creatorCrafts",
                JSON.stringify(crafts)
            );
        } catch (error) {
            console.error("Craft storage error:", error);
            alert("Unable to save craft. Please try using a smaller image.");
            return;
        }

        alert("Craft added successfully!");
        window.location.href = "creator-my-crafts.html";
    });

    // LOAD EDITING CRAFT
    function loadEditingCraft(index) {

        const savedCrafts = localStorage.getItem("creatorCrafts");

        if (!savedCrafts) return;

        let crafts = [];

        try {
            crafts = JSON.parse(savedCrafts);
        } catch (error) {
            console.log("Craft data error:", error);
            return;
        }

        if (!Array.isArray(crafts) || !crafts[index]) {
            return;
        }

        const craft = crafts[index];

        isLoadingCraft = true;

        document.getElementById("craftName").value = craft.name || "";
        document.getElementById("craftCategory").value = craft.category || "";
        craftPrice.value = craft.price || "";
        document.getElementById("craftStory").value = craft.story || "";

        const savedBreakdown = craft.priceBreakdown || craft;

        if (
            savedBreakdown.creatorPrice !== undefined &&
            savedBreakdown.materials !== undefined &&
            savedBreakdown.packaging !== undefined &&
            savedBreakdown.platformServices !== undefined
        ) {

            creatorPrice.value = savedBreakdown.creatorPrice;
            materialsPrice.value = savedBreakdown.materials;
            packagingPrice.value = savedBreakdown.packaging;
            platformPrice.value = savedBreakdown.platformServices;

        } else {
            autoSplitPrice();
        }

        updateTotal(false);
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
