
/* =========================================================
   KALASETU - CUSTOMER HOME JAVASCRIPT
   Clean version - Git conflicts removed
   ========================================================= */


/* ================= FESTIVAL CAROUSEL ================= */

let currentFestival = 0;

const festivalTrack = document.getElementById("festivalTrack");

const totalFestivals = 3;


/* Show selected festival */

function showFestival(index) {

    if (!festivalTrack) {
        return;
    }

    if (index < 0) {
        currentFestival = totalFestivals - 1;
    }

    else if (index >= totalFestivals) {
        currentFestival = 0;
    }

    else {
        currentFestival = index;
    }

    festivalTrack.style.transform =
        `translateX(-${currentFestival * 100}%)`;
}


/* Next festival */

function nextFestival() {

    showFestival(currentFestival + 1);

}


/* Previous festival */

function previousFestival() {

    showFestival(currentFestival - 1);

}


/* Automatic festival carousel */

setInterval(function () {

    nextFestival();

}, 5000);



/* ================= FESTIVAL BUTTON ================= */

function exploreFestival(festivalName) {

    alert(
        festivalName +
        " collection will be available here."
    );

}



/* ================= CATEGORY ================= */

function openCategory(categoryName) {

    alert(
        categoryName +
        " category selected."
    );

}



/* ================= PRODUCT ================= */

function openProduct(productName, craftId = null) {

    let productUrl =
        "craft-details.html?product=" +
        encodeURIComponent(productName);

    if (craftId !== null && craftId !== undefined) {

        productUrl +=
            "&craftId=" + encodeURIComponent(craftId);

    }

    window.location.href = productUrl;

}


/* ================= CUSTOMER STOCK STATUS ================= */

function updateCustomerStockStatus() {

    const crafts = JSON.parse(
        localStorage.getItem("creatorCrafts") || "[]"
    );

    document.querySelectorAll(".product-card").forEach(card => {

        const title = card.querySelector("h3");

        if (!title) return;

        const productName = title.innerText.trim();

        const creatorCraft = crafts.find(item =>
            String(item.name || "").trim().toLowerCase() ===
            productName.toLowerCase()
        );

        if (!creatorCraft) return;

        let stockLabel = card.querySelector(".customer-stock-status");

        if (!stockLabel) {
            stockLabel = document.createElement("span");
            stockLabel.className = "customer-stock-status";
            card.appendChild(stockLabel);
        }

        const status = creatorCraft.stockStatus || "In Stock";

        stockLabel.textContent = status;

        stockLabel.classList.toggle(
            "out-of-stock",
            status === "Out of Stock"
        );

        stockLabel.classList.toggle(
            "in-stock",
            status !== "Out of Stock"
        );
    });
}

updateCustomerStockStatus();


/* ================= HEADER ICONS ================= */

function showMessage(item) {

    if (item === "Profile") {

        window.location.href = "customer-profile.html";

        return;
    }

    alert(
        item +
        " feature will be added soon."
    );

}


/* ================= WISHLIST ================= */

function addToWishlist(event, productName, category, price, image) {

    event.stopPropagation();

    let wishlist =
        JSON.parse(localStorage.getItem("wishlist")) || [];

    // Check if already added
    const alreadyExists = wishlist.some(
        item => item.name === productName
    );

    if (alreadyExists) {
        alert("Already added to Wishlist ❤️");
        return;
    }

    // Add product
    wishlist.push({
        name: productName,
        category: category,
        price: price,
        image: image
    });

    // Save wishlist
    localStorage.setItem(
        "wishlist",
        JSON.stringify(wishlist)
    );

    alert(productName + " added to Wishlist ❤️");
}


/* ================= SEARCH WITH SUGGESTIONS ================= */

const searchInput = document.getElementById("searchInput");

if (searchInput) {

    // Browser's built-in suggestion dropdown
    searchInput.setAttribute("list", "searchSuggestions");

    let dataList = document.getElementById("searchSuggestions");

    if (!dataList) {
        dataList = document.createElement("datalist");
        dataList.id = "searchSuggestions";
        document.body.appendChild(dataList);
    }

    // Get existing products from the Home page
    function getProducts() {
        const cards = document.querySelectorAll(".product-card");

        return Array.from(cards).map(card => {
            const title = card.querySelector("h3");
            const category = card.querySelector("p");

            return {
                name: title ? title.innerText.trim() : "",
                category: category ? category.innerText.trim() : "",
                card: card
            };
        }).filter(product => product.name !== "");
    }

    // Show suggestions while typing
    searchInput.addEventListener("input", function () {

        const value = searchInput.value.trim().toLowerCase();

        dataList.innerHTML = "";

        if (value === "") {
            return;
        }

        const products = getProducts();

        const matches = products.filter(product =>
            product.name.toLowerCase().includes(value) ||
            product.category.toLowerCase().includes(value)
        );

        matches.forEach(product => {

            const option = document.createElement("option");

            option.value = product.name;

            dataList.appendChild(option);
        });
    });


    // Search button / Enter key
    function searchProducts() {

        const value = searchInput.value.trim().toLowerCase();

        const products = getProducts();

        if (value === "") {
            alert("Please enter something to search.");
            return;
        }

        let found = false;

        products.forEach(product => {

            const productName =
                product.name.toLowerCase();

            const productCategory =
                product.category.toLowerCase();

            if (
                productName.includes(value) ||
                productCategory.includes(value)
            ) {
                product.card.style.display = "";
                found = true;
            } else {
                product.card.style.display = "none";
            }
        });

        if (found) {

            const firstResult = products.find(product =>
                product.name.toLowerCase().includes(value) ||
                product.category.toLowerCase().includes(value)
            );

            if (firstResult) {
                firstResult.card.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }

        } else {

            alert("No crafts found for: " + searchInput.value);

            // Show all products again
            products.forEach(product => {
                product.card.style.display = "";
            });
        }
    }


    // Enter key
    searchInput.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {
            event.preventDefault();
            searchProducts();
        }

    });


    // Make search button work
    window.searchProducts = searchProducts;
}


/* ================= CUSTOMER STOCK STATUS ================= */

function getCreatorCraftStock(productName) {
    const crafts = JSON.parse(
        localStorage.getItem("creatorCrafts") || "[]"
    );

    const craft = crafts.find(item =>
        String(item.name || "").trim().toLowerCase() ===
        String(productName || "").trim().toLowerCase()
    );

    return craft ? (craft.stockStatus || "In Stock") : "In Stock";
}

function displayCustomerStockStatus() {
    const productCards = document.querySelectorAll(".product-card");

    productCards.forEach(card => {
        const title = card.querySelector("h3");
        const productInfo = card.querySelector(".product-info");

        if (!title || !productInfo) return;

        const stockStatus = getCreatorCraftStock(title.textContent.trim());

        let stockLabel = card.querySelector(".customer-stock-status");

        if (!stockLabel) {
            stockLabel = document.createElement("span");
            stockLabel.className = "customer-stock-status";

            const price = productInfo.querySelector(".price");

            if (price) {
                price.insertAdjacentElement("afterend", stockLabel);
            } else {
                productInfo.appendChild(stockLabel);
            }
        }

        stockLabel.textContent = stockStatus;

        stockLabel.classList.toggle(
            "in-stock",
            stockStatus === "In Stock"
        );

        stockLabel.classList.toggle(
            "out-of-stock",
            stockStatus === "Out of Stock"
        );
    });
}

displayCustomerStockStatus();


/* ================= INITIAL SLIDE ================= */

showFestival(0);


/* ============ DISPLAY APPROVED CREATOR CRAFTS FROM DATABASE ============ */

async function displayCreatorCrafts() {

    const container = document.getElementById("creatorCraftsContainer");

    if (!container) return;

    try {

        const response = await fetch(
            "http://localhost:5000/api/creators/admin/crafts"
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error("Unable to load crafts");
        }

        container.innerHTML = "";

        // Display only Admin Approved crafts
        const approvedCrafts = data.crafts.filter(
            craft => craft.status === "Approved"
        );

        approvedCrafts.forEach(craft => {

            const card = document.createElement("div");
            card.className = "product-card";

            const imageBox = document.createElement("div");
            imageBox.className = "product-image";

            const img = document.createElement("img");
            img.src = craft.image || "";
            img.alt = craft.name || "Craft";

            imageBox.appendChild(img);

            const info = document.createElement("div");
            info.className = "product-info";

            const title = document.createElement("h3");
            title.textContent = craft.name;

            const category = document.createElement("p");
            category.textContent = craft.category;

            const price = document.createElement("span");
            price.className = "price";
            price.textContent = "₹" + craft.price;

            const stock = document.createElement("span");
            stock.className = "customer-stock-status";

            const stockStatus = craft.stock_status || "In Stock";

            stock.textContent = stockStatus;

            stock.classList.add(
                stockStatus === "Out of Stock"
                    ? "out-of-stock"
                    : "in-stock"
            );

            info.appendChild(title);
            info.appendChild(category);
            info.appendChild(price);
            info.appendChild(stock);

            card.appendChild(imageBox);
            card.appendChild(info);

            card.addEventListener("click", () => {
                openProduct(craft.name, craft.id);
            });

            container.appendChild(card);

        });

    } catch (error) {

        console.error("Customer Crafts Error:", error);

        container.innerHTML =
            "<p>Unable to load crafts. Please try again.</p>";

    }
}

displayCreatorCrafts();
