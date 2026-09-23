/* =========================================================
   KALASETU - CREATOR PROFILE JS
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    loadProfile();
    loadVerificationStatus();

    const form =
        document.getElementById("profileForm");

    const imageInput =
        document.getElementById("profileImageInput");


    if (form) {
        form.addEventListener(
            "submit",
            saveProfile
        );
    }


    if (imageInput) {
        imageInput.addEventListener(
            "change",
            previewProfileImage
        );
    }

});


/* =========================================================
   LOAD PROFILE
   ========================================================= */

function loadProfile() {

    const profileData =
        JSON.parse(
            localStorage.getItem("creatorProfile")
        ) || {};


    const creatorAccount =
        JSON.parse(
            localStorage.getItem("creatorAccount")
        ) || {};


    const name =
        profileData.name ||
        creatorAccount.name ||
        "";


    const phone =
        profileData.phone ||
        creatorAccount.phone ||
        creatorAccount.contact ||
        "";


    const email =
        profileData.email ||
        creatorAccount.email ||
        "";


    const location =
        profileData.location ||
        "";


    const category =
        profileData.category ||
        "";


    const about =
        profileData.about ||
        "";


    document.getElementById(
        "creatorName"
    ).value = name;


    document.getElementById(
        "creatorPhone"
    ).value = phone;


    document.getElementById(
        "creatorEmail"
    ).value = email;


    document.getElementById(
        "creatorLocation"
    ).value = location;


    document.getElementById(
        "creatorCategory"
    ).value = category;


    document.getElementById(
        "creatorAbout"
    ).value = about;


    if (profileData.image) {

        document.getElementById(
            "profileImage"
        ).src = profileData.image;

    }


    updateDisplayInfo({

        name: name,

        category: category

    });

}


/* =========================================================
   DISPLAY PROFILE INFORMATION
   ========================================================= */

function updateDisplayInfo(profileData) {

    const name =
        profileData.name ||
        "Creator Name";


    const category =
        profileData.category ||
        "Handmade Artisan";


    document.getElementById(
        "displayName"
    ).textContent = name;


    document.getElementById(
        "displayCategory"
    ).textContent = category;

}


/* =========================================================
   SAVE PROFILE
   ========================================================= */

function saveProfile(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "creatorName"
        ).value.trim();


    const phone =
        document.getElementById(
            "creatorPhone"
        ).value.trim();


    const email =
        document.getElementById(
            "creatorEmail"
        ).value.trim();


    const location =
        document.getElementById(
            "creatorLocation"
        ).value.trim();


    const category =
        document.getElementById(
            "creatorCategory"
        ).value.trim();


    const about =
        document.getElementById(
            "creatorAbout"
        ).value.trim();


    if (!name || !phone) {

        alert(
            "Please enter Creator Name and Phone Number."
        );

        return;
    }


    const oldProfile =
        JSON.parse(
            localStorage.getItem("creatorProfile")
        ) || {};


    const profileData = {

        name: name,

        phone: phone,

        email: email,

        location: location,

        category: category,

        about: about,

        image:
            oldProfile.image || "",

        updatedAt:
            new Date().toISOString()

    };


    try {

        localStorage.setItem(
            "creatorProfile",
            JSON.stringify(profileData)
        );

    } catch (error) {

        console.log(
            "Profile save error:",
            error
        );

        alert(
            "Unable to save profile. Please try again."
        );

        return;
    }


    updateDisplayInfo(profileData);


    alert(
        "Creator Profile saved successfully!"
    );


    window.location.href =
        "creator-dashboard.html";

}


/* =========================================================
   PROFILE IMAGE
   ========================================================= */

function previewProfileImage(event) {

    const file =
        event.target.files[0];


    if (!file) {
        return;
    }


    if (!file.type.startsWith("image/")) {

        alert(
            "Please select a valid image."
        );

        return;
    }


    const reader =
        new FileReader();


    reader.onload = function (e) {

        const image =
            new Image();


        image.onload = function () {

            const canvas =
                document.createElement("canvas");


            const maxSize = 800;


            let width =
                image.width;


            let height =
                image.height;


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


            const imageData =
                canvas.toDataURL(
                    "image/jpeg",
                    0.7
                );


            document.getElementById(
                "profileImage"
            ).src = imageData;


            const profileData =
                JSON.parse(
                    localStorage.getItem(
                        "creatorProfile"
                    )
                ) || {};


            profileData.image =
                imageData;


            try {

                localStorage.setItem(
                    "creatorProfile",
                    JSON.stringify(
                        profileData
                    )
                );

            } catch (error) {

                console.log(
                    "Image save error:",
                    error
                );

                alert(
                    "Image is too large. Please choose another image."
                );

            }

        };


        image.src =
            e.target.result;

    };


    reader.readAsDataURL(file);

}


/* =========================================================
   VERIFICATION STATUS
   ========================================================= */

function loadVerificationStatus() {

    let verifications = [];


    try {

        verifications =
            JSON.parse(
                localStorage.getItem(
                    "creatorVerifications"
                )
            ) || [];

    } catch (error) {

        console.log(
            "Verification loading error:",
            error
        );

        verifications = [];

    }


    const creatorAccount =
        JSON.parse(
            localStorage.getItem(
                "creatorAccount"
            )
        ) || {};


    const profileData =
        JSON.parse(
            localStorage.getItem(
                "creatorProfile"
            )
        ) || {};


    /*
        Find records belonging to current creator.
    */

    const matchingRecords =
        verifications.filter(function (item) {

            const itemName =
                String(item.name || "")
                    .trim()
                    .toLowerCase();


            const accountName =
                String(creatorAccount.name || "")
                    .trim()
                    .toLowerCase();


            const profileName =
                String(profileData.name || "")
                    .trim()
                    .toLowerCase();


            const itemContact =
                String(item.contact || "")
                    .trim();


            const accountContact =
                String(
                    creatorAccount.contact ||
                    creatorAccount.phone ||
                    ""
                ).trim();


            const contactMatch =
                itemContact &&
                accountContact &&
                itemContact === accountContact;


            const accountNameMatch =
                itemName &&
                accountName &&
                itemName === accountName;


            const profileNameMatch =
                itemName &&
                profileName &&
                itemName === profileName;


            return (
                contactMatch ||
                accountNameMatch ||
                profileNameMatch
            );

        });


    /*
        APPROVED gets highest priority.
    */

    let verification =
        matchingRecords.find(function (item) {

            return String(item.status)
                .trim()
                .toLowerCase() ===
                "approved";

        });


    /*
        If no Approved record,
        check Pending.
    */

    if (!verification) {

        verification =
            matchingRecords.find(function (item) {

                return String(item.status)
                    .trim()
                    .toLowerCase() ===
                    "pending";

            });

    }


    /*
        If no Pending record,
        check Rejected.
    */

    if (!verification) {

        verification =
            matchingRecords.find(function (item) {

                return String(item.status)
                    .trim()
                    .toLowerCase() ===
                    "rejected";

            });

    }


    /*
        Fallback only if no matching creator
        record was found.
    */

    if (!verification &&
        verifications.length > 0) {

        verification =
            verifications[
                verifications.length - 1
            ];

    }


    /*
        Old single verification storage
        as final fallback.
    */

    if (!verification) {

        try {

            verification =
                JSON.parse(
                    localStorage.getItem(
                        "creatorVerification"
                    )
                ) || {};

        } catch (error) {

            verification = {};

        }

    }


    const status =
        verification.status ||
        "Under Review";


    const badge =
        document.getElementById(
            "verificationBadge"
        );


    const text =
        document.getElementById(
            "verificationText"
        );


    /* ================= APPROVED ================= */

    if (
        String(status)
            .trim()
            .toLowerCase() ===
        "approved"
    ) {

        badge.textContent =
            "● Approved";


        badge.style.background =
            "#e8f0df";


        badge.style.color =
            "#617044";


        text.textContent =
            "Your creator profile has been approved by the admin.";

    }


    /* ================= REJECTED ================= */

    else if (
        String(status)
            .trim()
            .toLowerCase() ===
        "rejected"
    ) {

        badge.textContent =
            "● Rejected";


        badge.style.background =
            "#f7e3de";


        badge.style.color =
            "#a34832";


        text.textContent =
            "Your creator verification was rejected. Please check your verification details.";

    }


    /* ================= PENDING ================= */

    else {

        badge.textContent =
            "● Under Review";


        badge.style.background =
            "#f5eadf";


        badge.style.color =
            "#9a654f";


        text.textContent =
            "Your creator profile is currently under review.";

    }

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function goDashboard() {

    window.location.href =
        "creator-dashboard.html";

}