document.addEventListener("DOMContentLoaded", function () {

    const craftPhoto =
        document.getElementById("craftPhoto");

    const photoPreview =
        document.getElementById("photoPreview");

    const verificationForm =
        document.getElementById("verificationForm");

    let photoData = "";


    /* =====================================================
       PHOTO PREVIEW + COMPRESSION
    ===================================================== */

    craftPhoto.addEventListener("change", function () {

        const file = this.files[0];

        if (!file) {
            photoPreview.style.display = "none";
            photoData = "";
            return;
        }


        if (!file.type.startsWith("image/")) {

            alert("Please upload an image file.");

            this.value = "";
            photoData = "";

            return;
        }


        const reader = new FileReader();


        reader.onload = function (event) {

            const image = new Image();


            image.onload = function () {

                const canvas =
                    document.createElement("canvas");


                const maxSize = 600;

                let width =
                    image.width;

                let height =
                    image.height;


                /* Resize image */

                if (
                    width > maxSize ||
                    height > maxSize
                ) {

                    if (width > height) {

                        height =
                            height *
                            (maxSize / width);

                        width =
                            maxSize;

                    } else {

                        width =
                            width *
                            (maxSize / height);

                        height =
                            maxSize;

                    }

                }


                canvas.width =
                    width;

                canvas.height =
                    height;


                const ctx =
                    canvas.getContext("2d");


                ctx.drawImage(
                    image,
                    0,
                    0,
                    width,
                    height
                );


                /*
                    Compress image.
                    0.6 quality keeps localStorage
                    size much smaller.
                */

                photoData =
                    canvas.toDataURL(
                        "image/jpeg",
                        0.6
                    );


                /* Preview */

                photoPreview.innerHTML = `
                    <img
                        src="${photoData}"
                        alt="Craft Preview"
                    >
                `;


                photoPreview.style.display =
                    "block";

            };


            image.src =
                event.target.result;

        };


        reader.readAsDataURL(file);

    });


    /* =====================================================
       VERIFICATION FORM
    ===================================================== */

    verificationForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            /* =================================================
               GET FORM DATA
            ================================================= */

            const craftType =
                document.getElementById(
                    "craftType"
                ).value;


            const location =
                document.getElementById(
                    "location"
                ).value.trim();


            const experience =
                document.getElementById(
                    "experience"
                ).value.trim();


            /* =================================================
               VALIDATION
            ================================================= */

            if (
                craftType === "" ||
                location === "" ||
                experience === ""
            ) {

                alert(
                    "Please fill all verification details."
                );

                return;
            }


            if (!photoData) {

                alert(
                    "Please upload a photo of your handmade craft."
                );

                return;
            }


            /* =================================================
               GET CREATOR ACCOUNT
            ================================================= */

            let creator = {};


            const creatorData =
                localStorage.getItem(
                    "creatorAccount"
                );


            if (creatorData) {

                try {

                    creator =
                        JSON.parse(
                            creatorData
                        ) || {};

                } catch (error) {

                    console.log(
                        "Creator account data error:",
                        error
                    );

                }

            }


            const creatorName =
                creator.name ||
                "Creator";


            const creatorContact =
                creator.contact ||
                creator.phone ||
                "";


            /* =================================================
               LOAD EXISTING VERIFICATIONS
            ================================================= */

            let verifications = [];


            try {

                const savedData =
                    localStorage.getItem(
                        "creatorVerifications"
                    );


                if (savedData) {

                    const parsedData =
                        JSON.parse(
                            savedData
                        );


                    if (
                        Array.isArray(
                            parsedData
                        )
                    ) {

                        verifications =
                            parsedData;

                    }

                }

            } catch (error) {

                console.log(
                    "Verification data error:",
                    error
                );

                verifications = [];

            }


            /* =================================================
               FIND EXISTING CREATOR
            ================================================= */

            const existingIndex =
                verifications.findIndex(
                    function (item) {

                        const sameContact =
                            creatorContact &&
                            item.contact &&
                            String(item.contact) ===
                            String(creatorContact);


                        const sameName =
                            item.name &&
                            creatorName &&
                            String(item.name)
                                .trim()
                                .toLowerCase() ===
                            String(creatorName)
                                .trim()
                                .toLowerCase();


                        return (
                            sameContact ||
                            sameName
                        );

                    }
                );


            /* =================================================
               KEEP EXISTING ID IF AVAILABLE
            ================================================= */

            let creatorId =
                "creator_" +
                Date.now();


            if (existingIndex !== -1) {

                creatorId =
                    verifications[
                        existingIndex
                    ].id ||
                    creatorId;

            }


            /* =================================================
               CREATE VERIFICATION DATA
            ================================================= */

            const verificationData = {

                id:
                    creatorId,

                name:
                    creatorName,

                contact:
                    creatorContact,

                craftType:
                    craftType,

                craft:
                    craftType,

                location:
                    location,

                experience:
                    experience,

                craftPhoto:
                    photoData,

                /*
                    New submission starts as Pending.
                */

                status:
                    "Pending",

                submittedAt:
                    new Date().toISOString()

            };


            /* =================================================
               UPDATE OR ADD
            ================================================= */

            if (existingIndex !== -1) {

                /*
                    Replace old record instead of
                    creating another large record.
                */

                verifications[
                    existingIndex
                ] = verificationData;

            } else {

                verifications.push(
                    verificationData
                );

            }


            /* =================================================
               SAVE VERIFICATION DATA
            ================================================= */

            try {

                localStorage.setItem(
                    "creatorVerifications",
                    JSON.stringify(
                        verifications
                    )
                );


                localStorage.setItem(
                    "creatorVerification",
                    JSON.stringify(
                        verificationData
                    )
                );


            } catch (error) {

                console.error(
                    "Storage error:",
                    error
                );


                /*
                    If storage is full,
                    remove old single verification
                    and try once more.
                */

                try {

                    localStorage.removeItem(
                        "creatorVerification"
                    );


                    localStorage.setItem(
                        "creatorVerifications",
                        JSON.stringify(
                            verifications
                        )
                    );


                    localStorage.setItem(
                        "creatorVerification",
                        JSON.stringify(
                            verificationData
                        )
                    );


                } catch (secondError) {

                    console.error(
                        "Second storage error:",
                        secondError
                    );


                    alert(
                        "Unable to save verification data. Please clear old verification data and try again."
                    );

                    return;

                }

            }


            /* =================================================
               SUCCESS
            ================================================= */

            alert(
                "Verification submitted successfully. Your profile is pending admin approval."
            );


            /* =================================================
               GO TO PENDING PAGE
            ================================================= */

            window.location.href =
                "creator-pending.html";

        }
    );

});