document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("addCraftForm");
    const craftImage = document.getElementById("craftImage");
    const imagePreview = document.getElementById("imagePreview");

    let imageData = "";

    /* ============================= */
    /*       EDIT MODE CHECK          */
    /* ============================= */

    const editingIndex =
        localStorage.getItem("editingCraftIndex");


    if (
        editingIndex !== null &&
        editingIndex !== "" &&
        !isNaN(editingIndex)
    ) {
        loadEditingCraft(Number(editingIndex));
    }


    /* ============================= */
    /*         IMAGE PREVIEW          */
    /* ============================= */

    craftImage.addEventListener("change", function () {

        const file = this.files[0];

        if (!file) {
            return;
        }


        if (!file.type.startsWith("image/")) {

            alert("Please select a valid image file.");

            this.value = "";

            return;
        }


        const reader = new FileReader();


        reader.onload = function (event) {

            imageData = event.target.result;

            imagePreview.innerHTML =
                `<img src="${imageData}" alt="Craft Preview">`;

            imagePreview.style.display = "block";

        };


        reader.readAsDataURL(file);

    });


    /* ============================= */
    /*          FORM SUBMIT           */
    /* ============================= */

    form.addEventListener("submit", function (event) {

        event.preventDefault();


        const name =
            document.getElementById("craftName").value.trim();

        const category =
            document.getElementById("craftCategory").value;

        const price =
            document.getElementById("craftPrice").value.trim();

        const story =
            document.getElementById("craftStory").value.trim();


        /* Validation */

        if (
            name === "" ||
            category === "" ||
            price === "" ||
            story === ""
        ) {

            alert("Please fill all craft details.");

            return;
        }


        /* Get existing crafts */

        let crafts = [];

        const savedCrafts =
            localStorage.getItem("creatorCrafts");


        if (savedCrafts) {

            try {

                crafts =
                    JSON.parse(savedCrafts);

            } catch (error) {

                crafts = [];

            }

        }


        if (!Array.isArray(crafts)) {
            crafts = [];
        }


        /* ============================= */
        /*          EDIT MODE             */
        /* ============================= */

        if (
            editingIndex !== null &&
            editingIndex !== "" &&
            !isNaN(editingIndex)
        ) {

            const index =
                Number(editingIndex);


            if (!crafts[index]) {

                alert("Craft not found.");

                return;
            }


            crafts[index].name =
                name;

            crafts[index].category =
                category;

            crafts[index].price =
                price;

            crafts[index].story =
                story;


            if (imageData !== "") {

                crafts[index].image =
                    imageData;

            }


            crafts[index].status =
                crafts[index].status ||
                "Under Review";


            localStorage.setItem(
                "creatorCrafts",
                JSON.stringify(crafts)
            );


            localStorage.removeItem(
                "editingCraftIndex"
            );


            alert("Craft updated successfully!");


            window.location.href =
                "creator-my-crafts.html";


            return;
        }


        /* ============================= */
        /*          NEW CRAFT              */
        /* ============================= */

        if (imageData === "") {

            alert("Please upload a craft image.");

            return;
        }


        const newCraft = {

            name: name,

            category: category,

            price: price,

            story: story,

            image: imageData,

            status: "Under Review",

            createdAt:
                new Date().toISOString()

        };


        crafts.push(newCraft);


        localStorage.setItem(
            "creatorCrafts",
            JSON.stringify(crafts)
        );


        alert("Craft added successfully!");


        /* Move to My Crafts */

        window.location.href =
            "creator-my-crafts.html";

    });

});


/* ============================= */
/*       EDIT CRAFT LOAD         */
/* ============================= */

function loadEditingCraft(index) {

    const savedCrafts =
        localStorage.getItem("creatorCrafts");


    if (!savedCrafts) {
        return;
    }


    let crafts = [];


    try {

        crafts =
            JSON.parse(savedCrafts);

    } catch (error) {

        console.log("Craft data error:", error);

        return;
    }


    if (
        !Array.isArray(crafts) ||
        !crafts[index]
    ) {
        return;
    }


    const craft =
        crafts[index];


    document.getElementById("craftName").value =
        craft.name || "";


    document.getElementById("craftCategory").value =
        craft.category || "";


    document.getElementById("craftPrice").value =
        craft.price || "";


    document.getElementById("craftStory").value =
        craft.story || "";


    /* Existing image */

    if (craft.image) {

        imagePreview.innerHTML =
            `<img src="${craft.image}" alt="Craft Preview">`;

        imagePreview.style.display =
            "block";

        imageData =
            craft.image;


        craftImage.removeAttribute(
            "required"
        );
    }

}


/* ============================= */
/*          BACK BUTTON           */
/* ============================= */

function goBack() {

    localStorage.removeItem(
        "editingCraftIndex"
    );

    window.location.href =
        "creator-my-crafts.html";

}