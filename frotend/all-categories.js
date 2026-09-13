document.addEventListener("DOMContentLoaded", function () {

    const searchInput = document.getElementById("categorySearch");
    const clearButton = document.getElementById("clearButton");
    const resultCount = document.getElementById("resultCount");
    const categoryCards = document.querySelectorAll(".category-card");
    const noResults = document.getElementById("noResults");

    function filterCategories() {

        const searchText = searchInput.value.trim().toLowerCase();

        let visibleCount = 0;

        categoryCards.forEach(function (card) {

            const categoryName =
                card.querySelector("h3").textContent.toLowerCase();

            if (categoryName.includes(searchText)) {

                card.style.display = "";

                visibleCount++;

            } else {

                card.style.display = "none";
            }
        });

        resultCount.textContent =
            visibleCount + " crafts available";

        if (searchText.length > 0) {
            clearButton.style.display = "block";
        } else {
            clearButton.style.display = "none";
        }

        if (visibleCount === 0) {
            noResults.style.display = "block";
        } else {
            noResults.style.display = "none";
        }
    }

    /* Search while typing */
    searchInput.addEventListener("input", filterCategories);


    /* Clear search */
    clearButton.addEventListener("click", function () {

        searchInput.value = "";

        filterCategories();

        searchInput.focus();
    });


    /* Search button */
    const searchButton = document.querySelector(".search-btn");

    if (searchButton) {

        searchButton.addEventListener("click", function () {

            filterCategories();

            searchInput.focus();
        });
    }

});


/* ================================
   OPEN CATEGORY
   ================================ */

function openCategory(categoryName) {

    localStorage.setItem(
        "selectedCraftCategory",
        categoryName
    );

    /*
       Products page ni later connect cheyyachu.

       Ippudu category select ayindani
       temporary ga message chupisthundi.
    */

    alert(categoryName + " selected");
}


/* ================================
   BACK BUTTON
   ================================ */

function goBack() {

    if (window.history.length > 1) {

        window.history.back();

    } else {

        window.location.href = "customer-home.html";
    }
}


/* ================================
   PROFILE
   ================================ */

function showMessage(type) {

    if (type === "Profile") {

        alert("Profile page coming soon.");

    } else {

        alert(type);
    }
}
function openCategory(categoryName) {
    window.location.href =
        "category-products.html?category=" +
        encodeURIComponent(categoryName);
}