/* ================= PRODUCT DATA ================= */

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


/* ================= LOAD PRODUCT ================= */

const params =
    new URLSearchParams(window.location.search);

const productName =
    params.get("product");

const product =
    products[productName];


if (product) {

    document.querySelector(".craft-image img").src =
        product.image;

    document.querySelector(".craft-image img").alt =
        productName;

    document.querySelector(".craft-category").textContent =
        product.category;

    document.querySelector(".craft-info h1").textContent =
        productName;

    document.querySelector(".craft-price").textContent =
        product.price;

    document.querySelector(".creator-info strong").textContent =
        product.creator;

    document.querySelector(".craft-story p").textContent =
        product.story;

}


/* ================= THUMBNAILS ================= */

const thumbnails =
    document.querySelectorAll(".thumbnail");

const mainImage =
    document.querySelector(".craft-image img");


thumbnails.forEach(function (thumbnail) {

    thumbnail.addEventListener("click", function () {

        const thumbnailImage =
            thumbnail.querySelector("img");

        mainImage.src =
            thumbnailImage.src;

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

    const value =
        searchInput.value.trim();

    if (value === "") {

        alert("Please enter something to search.");

        return;
    }

    alert("Searching for: " + value);
}


/* ================= ENTER KEY SEARCH ================= */

document
    .getElementById("searchInput")
    .addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            searchProducts();

        }

    });


/* ================= HEADER ICONS ================= */

function showMessage(item) {

    alert(item + " feature will be added soon.");

}


/* ================= FEATURE BUTTONS ================= */

function showStory() {

    document
        .querySelector(".craft-story")
        .scrollIntoView({
            behavior: "smooth"
        });

}

function showRelated() {

    alert("Related crafts will be available here.");

}


function showValue() {

    document
        .querySelector(".price-breakdown")
        .scrollIntoView({
            behavior: "smooth"
        });

}


/* ================= ADD TO CART ================= */

/* ================= ADD TO CART ================= */

function addToCart() {

    if (!product) {
        alert("Product not found.");
        return;
    }

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    const existingItem = cart.find(
        item => item.name === productName
    );

    if (existingItem) {

        existingItem.quantity++;

    } else {

        cart.push({
            name: productName,
            image: product.image,
            category: product.category,
            price: product.price.replace("₹", "").replace(",", ""),
            quantity: 1
        });

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

    const order = {
        name: productName,
        image: product.image,
        category: product.category,
        price: product.price,
        creator: product.creator
    };

    localStorage.setItem(
        "currentOrder",
        JSON.stringify(order)
    );

    window.location.href = "checkout.html";
}