
/* =====================================================
   KALASETU - CRAFT DETAILS
   Fixed Products + Database Creator Crafts + Price Breakdown
===================================================== */


/* ================= FIXED PRODUCT DATA ================= */

const products = {
    "Terracotta Handcrafted Pot": {
        image: "images/featured-pottery.jpg",
        category: "Traditional Pottery",
        price: "₹499",
        creator: "Local Artisan",
        story: "Shaped by patient hands and inspired by the warmth of the earth, this terracotta pot carries the quiet beauty of a tradition that has lived through generations. Every curve and handmade detail reflects the time, care and love of the artisan who created it."
    },

    "Handloom Cotton Saree": {
        image: "images/featured-textiles.jpg",
        category: "Traditional Textiles",
        price: "₹1,299",
        creator: "Local Artisan",
        story: "Every thread of this handloom saree holds a little piece of the artisan's journey. Woven slowly with patience and care, it carries a tradition where generations have turned simple threads into something meaningful, beautiful and timeless."
    },

    "Wooden Elephant Figurine": {
        image: "images/featured-woodcraft.jpeg",
        category: "Woodcraft",
        price: "₹699",
        creator: "Local Artisan",
        story: "From a simple piece of wood to a work of art, this elephant is shaped by hands that understand the language of the craft. Its form carries the patience, imagination and traditional knowledge passed down through generations."
    },

    "Oxidised Silver Earrings": {
        image: "images/featured-jewellery.jpg",
        category: "Handmade Jewellery",
        price: "₹349",
        creator: "Local Artisan",
        story: "These earrings are more than an ornament. Each handmade detail reflects the skill and patience of an artisan who keeps an old craft alive, turning traditional inspiration into something that can become part of someone's own story."
    },

    "Hand Painted Tea Set": {
        image: "images/featured-teaset.jpg",
        category: "Handmade Ceramic",
        price: "₹899",
        creator: "Local Artisan",
        story: "Painted one detail at a time, this tea set carries the gentle touch of the artisan behind it. Its colours and patterns celebrate the joy of handmade work and the traditions that continue to find a place in everyday life."
    },

    "Palm Leaf Basket": {
        image: "images/featured-basket.jpg",
        category: "Natural Craft",
        price: "₹399",
        creator: "Local Artisan",
        story: "Woven from nature and shaped by skilled hands, this basket carries a simple but powerful story of tradition and sustainability. Each weave reflects knowledge that has travelled quietly from one generation to the next."
    }
};


/* ================= GET PRODUCT NAME ================= */

const params = new URLSearchParams(window.location.search);
const productName = params.get("product");
const requestedCraftId = params.get("craftId");


/* ================= DATABASE CREATOR CRAFT ================= */

let creatorCraft = null;
let product = products[productName] || null;


/* ================= LOAD CREATOR CRAFT FROM DATABASE ================= */

async function loadCreatorCraftFromDatabase() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/creators/admin/crafts"
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error("Unable to fetch crafts");
        }

       creatorCraft = data.crafts.find(craft => {

    if (craft.status !== "Approved") return false;

    if (requestedCraftId) {
        return String(craft.id) === String(requestedCraftId);
    }

    return String(craft.name || "").trim().toLowerCase() ===
        String(productName || "").trim().toLowerCase();

});

        if (creatorCraft) {

            product = {
                image: creatorCraft.image || "images/kalasetu-logo.png",
                category: creatorCraft.category || "Handmade Craft",
                price: "₹" + Number(creatorCraft.price || 0).toLocaleString("en-IN"),
                creator: creatorCraft.creator_name || "Local Artisan",
                story: creatorCraft.story || "A beautiful handmade craft created with care.",
                isCreatorCraft: true
            };

        }

    } catch (error) {

        console.error("Database Product Error:", error);

    }
}


/* ================= NUMERIC PRICE ================= */

function getNumericPrice() {

    if (!product) return 0;

    return Number(
        String(product.price).replace(/[₹,]/g, "")
    ) || 0;
}


/* ================= GET PRICE BREAKDOWN ================= */

function getPriceBreakdown() {

    const total = getNumericPrice();

    // Use saved creator price breakdown for uploaded crafts.
    if (product && product.isCreatorCraft && creatorCraft) {

        const creator = Number(creatorCraft.creator_price);
        const materials = Number(creatorCraft.materials);
        const packaging = Number(creatorCraft.packaging);
        const platform = Number(creatorCraft.platform_services);

        const hasSavedBreakdown =
            Number.isFinite(creator) &&
            Number.isFinite(materials) &&
            Number.isFinite(packaging) &&
            Number.isFinite(platform) &&
            creator + materials + packaging + platform > 0;

        if (hasSavedBreakdown) {

            return {
                creatorPrice: creator,
                materials: materials,
                packaging: packaging,
                platformServices: platform,
                total: creator + materials + packaging + platform
            };

        }
    }

    // Default split for fixed products or older crafts.
    const creator = Math.round(total * 60) / 100;
    const materials = Math.round(total * 20) / 100;
    const packaging = Math.round(total * 10) / 100;

    const platform = Math.round(
        (total - creator - materials - packaging) * 100
    ) / 100;

    return {
        creatorPrice: creator,
        materials: materials,
        packaging: packaging,
        platformServices: platform,
        total: total
    };
}


/* ================= FORMAT PRICE ================= */

function formatPrice(amount) {

    return "₹" + Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}


/* ================= DISPLAY PRICE BREAKDOWN ================= */

function displayPriceBreakdown() {

    if (!product) return;

    const breakdown = getPriceBreakdown();

    const values = {
        detailCreatorPrice: breakdown.creatorPrice,
        detailMaterials: breakdown.materials,
        detailPackaging: breakdown.packaging,
        detailPlatform: breakdown.platformServices,
        detailTotalPrice: breakdown.total
    };

    Object.entries(values).forEach(([id, amount]) => {

        const element = document.getElementById(id);

        if (element) {
            element.textContent = formatPrice(amount);
        }

    });

}


/* ================= GET CURRENT STOCK ================= */

function getCurrentProductStock() {

    if (!product) return "Out of Stock";

    if (!product.isCreatorCraft) return "In Stock";

    if (!creatorCraft || creatorCraft.status !== "Approved") {
        return "Out of Stock";
    }

    return creatorCraft.stock_status || "In Stock";
}


/* ================= DISPLAY STOCK STATUS ================= */

function updateProductStockDisplay() {

    if (!product) return;

    const priceRating =
        document.querySelector(".price-rating");

    if (!priceRating) return;

    let stockLabel =
        document.getElementById("productStockStatus");

    if (!stockLabel) {

        stockLabel = document.createElement("span");
        stockLabel.id = "productStockStatus";

        priceRating.insertAdjacentElement(
            "afterend",
            stockLabel
        );

    }

    const stockStatus = getCurrentProductStock();

    stockLabel.textContent = stockStatus;
    stockLabel.className = "customer-stock-status";

    stockLabel.classList.add(
        stockStatus === "Out of Stock"
            ? "out-of-stock"
            : "in-stock"
    );

    const unavailable = stockStatus === "Out of Stock";

    const addCartButton =
        document.querySelector(".add-cart-btn");

    const buyButton =
        document.querySelector(".buy-now-btn");

    if (addCartButton) {

        addCartButton.disabled = unavailable;

        addCartButton.textContent =
            unavailable ? "Out of Stock" : "Add to Cart";

    }

    if (buyButton) {

        buyButton.disabled = unavailable;

        buyButton.textContent =
            unavailable ? "Out of Stock" : "Order Now";

    }

}


/* ================= LOAD PRODUCT DETAILS ================= */

async function loadProductDetails() {

    // First load creator crafts from PostgreSQL.
    await loadCreatorCraftFromDatabase();

    if (!product) {

        alert("Product not found.");
        window.location.href = "customer-home.html";

        return;
    }

    const mainImage = document.querySelector(".craft-image img");

    if (mainImage) {
        mainImage.src = product.image;
        mainImage.alt = productName;
    }

    const category = document.querySelector(".craft-category");

    if (category) {
        category.textContent = product.category;
    }

    const heading = document.querySelector(".craft-info h1");

    if (heading) {
        heading.textContent = productName;
    }

    const price = document.querySelector(".craft-price");

    if (price) {
        price.textContent = product.price;
    }

    const creator = document.querySelector(".creator-info strong");

    if (creator) {
        creator.textContent = product.creator;
    }

    const story = document.querySelector(".craft-story p");

    if (story) {
        story.textContent = product.story;
    }

    // Hide thumbnails only for creator crafts.
    if (product.isCreatorCraft) {

        const thumbnailSection =
            document.querySelector(".craft-thumbnails");

        if (thumbnailSection) {
            thumbnailSection.style.display = "none";
        }

    }

    // Keep breakdown visible for all products.
    const priceBreakdown =
        document.querySelector(".price-breakdown");

    if (priceBreakdown) {
        priceBreakdown.style.display = "";
    }

    displayPriceBreakdown();
    updateProductStockDisplay();

}


/* ================= INITIALIZE PRODUCT DETAILS ================= */

loadProductDetails();


/* ================= THUMBNAILS ================= */

const thumbnails = document.querySelectorAll(".thumbnail");
const mainImage = document.querySelector(".craft-image img");

thumbnails.forEach(function (thumbnail) {

    thumbnail.addEventListener("click", function () {

        const thumbnailImage = thumbnail.querySelector("img");

        if (!thumbnailImage || !mainImage) return;

        mainImage.src = thumbnailImage.src;

        thumbnails.forEach(function (item) {
            item.classList.remove("active");
        });

        thumbnail.classList.add("active");

    });

});


/* ================= SEARCH ================= */

function searchProducts() {

    const searchInput =
        document.getElementById("searchInput");

    if (!searchInput) return;

    const value = searchInput.value.trim();

    if (value === "") {

        alert("Please enter something to search.");
        return;

    }

    alert("Searching for: " + value);

}


/* ================= ENTER KEY SEARCH ================= */

const searchInput = document.getElementById("searchInput");

if (searchInput) {

    searchInput.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {
            searchProducts();
        }

    });

}


/* ================= HEADER ICONS ================= */

function showMessage(item) {

    if (item === "Cart") {

        window.location.href = "cart.html";
        return;

    }

    alert(item + " feature will be added soon.");

}


/* ================= FEATURE BUTTONS ================= */

function showStory() {

    const story = document.querySelector(".craft-story");

    if (story) {
        story.scrollIntoView({ behavior: "smooth" });
    }

}


function showRelated() {

    alert("Related crafts will be available here.");

}


function showValue() {

    const breakdown =
        document.querySelector(".price-breakdown");

    if (breakdown && product) {

        breakdown.scrollIntoView({
            behavior: "smooth"
        });

    }

}


/* ================= CREATE CART ITEM ================= */

function createOrderItem(quantity = 1) {

    const breakdown = getPriceBreakdown();

    return {
         craftId: creatorCraft ? Number(creatorCraft.id) : null,

        name: productName,
        image: product.image,
        category: product.category,
        price: getNumericPrice(),
        creator: product.creator,
        quantity: quantity,

        // Save the same breakdown shown on Craft Details.
        priceBreakdown: {
            creatorPrice: breakdown.creatorPrice,
            materials: breakdown.materials,
            packaging: breakdown.packaging,
            platformServices: breakdown.platformServices,
            total: breakdown.total
        }

    };

}


/* ================= ADD TO CART ================= */

function addToCart() {

    if (!product) {

        alert("Product not found.");
        return;

    }

    if (getCurrentProductStock() === "Out of Stock") {

        alert("This product is currently Out of Stock.");
        updateProductStockDisplay();

        return;

    }

    let cart = [];

    try {

        cart = JSON.parse(
            localStorage.getItem("cart") || "[]"
        );

        if (!Array.isArray(cart)) {
            cart = [];
        }

    } catch (error) {

        cart = [];

    }

    const existingItem = cart.find(
        item => item.name === productName
    );

    if (existingItem) {

        existingItem.quantity =
            (Number(existingItem.quantity) || 1) + 1;

        // Refresh saved breakdown too.
        const updatedItem = createOrderItem(
            existingItem.quantity
        );

        Object.assign(existingItem, updatedItem);

    } else {

        cart.push(createOrderItem(1));

    }

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    alert(productName + " added to cart.");

    window.location.href = "cart.html";

}


/* ================= BUY NOW ================= */

function buyNow() {

    if (!product) {

        alert("Product not found.");
        return;

    }

    if (getCurrentProductStock() === "Out of Stock") {

        alert("This product is currently Out of Stock.");
        updateProductStockDisplay();

        return;

    }

    const order = createOrderItem(1);

    localStorage.setItem(
        "currentOrder",
        JSON.stringify(order)
    );

    window.location.href = "checkout.html";


}
function chatWithCreator() {

    if (!creatorCraft || !creatorCraft.creator_id) {
        alert("Creator details are not available for this product.");
        return;
    }

    const creatorId = creatorCraft.creator_id;
    const craftId = creatorCraft.id;

    window.location.href =
        `chat-with-creator.html?creatorId=${creatorId}&craftId=${craftId}`;
}