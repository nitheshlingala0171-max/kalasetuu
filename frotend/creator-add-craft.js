document.addEventListener("DOMContentLoaded", function () {

    const form =
        document.getElementById("addCraftForm");

    const craftImage =
        document.getElementById("craftImage");

    const imagePreview =
        document.getElementById("imagePreview");

    let imageData = "";



    /* =====================================================
       EDIT MODE
    ===================================================== */

    const editingIndex =
        localStorage.getItem("editingCraftIndex");


    if (
        editingIndex !== null &&
        editingIndex !== "" &&
        !isNaN(editingIndex)
    ) {

        loadEditingCraft(
            Number(editingIndex)
        );

    }



    /* =====================================================
       IMAGE PREVIEW + COMPRESSION
    ===================================================== */

    craftImage.addEventListener(
        "change",
        function () {

            const file =
                this.files[0];


            if (!file) {

                imageData = "";

                imagePreview.style.display =
                    "none";

                return;
            }


            if (!file.type.startsWith("image/")) {

                alert(
                    "Please select a valid image file."
                );

                this.value = "";

                imageData = "";

                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    const image =
                        new Image();


                    image.onload =
                        function () {

                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            const maxWidth = 800;
                            const maxHeight = 800;

                            let width =
                                image.width;

                            let height =
                                image.height;


                            /* Resize */

                            if (
                                width >
                                maxWidth
                            ) {

                                height =
                                    height *
                                    (
                                        maxWidth /
                                        width
                                    );

                                width =
                                    maxWidth;

                            }


                            if (
                                height >
                                maxHeight
                            ) {

                                width =
                                    width *
                                    (
                                        maxHeight /
                                        height
                                    );

                                height =
                                    maxHeight;

                            }


                            canvas.width =
                                width;

                            canvas.height =
                                height;


                            const ctx =
                                canvas.getContext(
                                    "2d"
                                );


                            ctx.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );


                            /* Compress */

                            imageData =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.7
                                );


                            /* Preview */

                            imagePreview.innerHTML = `
                                <img
                                    src="${imageData}"
                                    alt="Craft Preview"
                                >
                            `;

                            imagePreview.style.display =
                                "block";

                        };


                    image.src =
                        event.target.result;

                };


            reader.readAsDataURL(file);

        }
    );



    /* =====================================================
       FORM SUBMIT
    ===================================================== */

    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            /* Get details */

            const name =
                document
                    .getElementById("craftName")
                    .value
                    .trim();


            const category =
                document
                    .getElementById("craftCategory")
                    .value;


            const price =
                document
                    .getElementById("craftPrice")
                    .value
                    .trim();


            const story =
                document
                    .getElementById("craftStory")
                    .value
                    .trim();



            /* =================================================
               VALIDATION
            ================================================= */

            if (
                name === "" ||
                category === "" ||
                price === "" ||
                story === ""
            ) {

                alert(
                    "Please fill all craft details."
                );

                return;
            }


            if (imageData === "") {

                alert(
                    "Please upload a craft image."
                );

                return;
            }



            /* =================================================
               GET EXISTING CRAFTS
            ================================================= */

            let crafts = [];


            try {

                const savedCrafts =
                    localStorage.getItem(
                        "creatorCrafts"
                    );


                if (savedCrafts) {

                    crafts =
                        JSON.parse(
                            savedCrafts
                        );

                }


                if (!Array.isArray(crafts)) {

                    crafts = [];

                }

            } catch (error) {

                console.log(
                    "Craft data error:",
                    error
                );

                crafts = [];

            }



            /* =================================================
               EDIT EXISTING CRAFT
            ================================================= */

            if (
                editingIndex !== null &&
                editingIndex !== "" &&
                !isNaN(editingIndex)
            ) {

                const index =
                    Number(editingIndex);


                if (!crafts[index]) {

                    alert(
                        "Craft not found."
                    );

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


                try {

                    localStorage.setItem(
                        "creatorCrafts",
                        JSON.stringify(
                            crafts
                        )
                    );

                } catch (error) {

                    console.error(
                        error
                    );

                    alert(
                        "Unable to save craft. Please try a smaller image."
                    );

                    return;
                }


                localStorage.removeItem(
                    "editingCraftIndex"
                );


                alert(
                    "Craft updated successfully!"
                );


                window.location.href =
                    "creator-my-crafts.html";


                return;
            }



            /* =================================================
               CREATE NEW CRAFT
            ================================================= */

            const newCraft = {

                id:
                    "craft_" +
                    Date.now(),

                name:
                    name,

                category:
                    category,

                price:
                    price,

                story:
                    story,

                image:
                    imageData,

                status:
                    "Under Review",

                createdAt:
                    new Date().toISOString()

            };


            crafts.push(
                newCraft
            );



            /* =================================================
               SAVE NEW CRAFT
            ================================================= */

            try {

                localStorage.setItem(
                    "creatorCrafts",
                    JSON.stringify(
                        crafts
                    )
                );

            } catch (error) {

                console.error(
                    "Craft storage error:",
                    error
                );

                alert(
                    "Unable to save craft. Please try using a smaller image."
                );

                return;
            }



            /* =================================================
               SUCCESS
            ================================================= */

            alert(
                "Craft added successfully!"
            );


            window.location.href =
                "creator-my-crafts.html";

        }
    );



    /* =====================================================
       LOAD EDITING CRAFT
    ================================================= */

    function loadEditingCraft(index) {

        const savedCrafts =
            localStorage.getItem(
                "creatorCrafts"
            );


        if (!savedCrafts) {
            return;
        }


        let crafts = [];


        try {

            crafts =
                JSON.parse(
                    savedCrafts
                );

        } catch (error) {

            console.log(
                "Craft data error:",
                error
            );

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


        document.getElementById(
            "craftName"
        ).value =
            craft.name || "";


        document.getElementById(
            "craftCategory"
        ).value =
            craft.category || "";


        document.getElementById(
            "craftPrice"
        ).value =
            craft.price || "";


        document.getElementById(
            "craftStory"
        ).value =
            craft.story || "";


        if (craft.image) {

            imagePreview.innerHTML = `
                <img
                    src="${craft.image}"
                    alt="Craft Preview"
                >
            `;

            imagePreview.style.display =
                "block";


            imageData =
                craft.image;


            craftImage.removeAttribute(
                "required"
            );

        }

    }

});



/* =====================================================
   BACK TO MY CRAFTS
===================================================== */

function goBack() {

    localStorage.removeItem(
        "editingCraftIndex"
    );

    window.location.href =
        "creator-my-crafts.html";

}