/* =========================================================
   KALASETU - CREATOR PROFILE JS
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    loadProfile();
    loadVerificationStatus();

    const form = document.getElementById("profileForm");
    const imageInput = document.getElementById("profileImageInput");

    form.addEventListener("submit", saveProfile);

    imageInput.addEventListener("change", previewProfileImage);
});


/* ================= LOAD PROFILE ================= */

function loadProfile() {

    const profileData =
        JSON.parse(localStorage.getItem("creatorProfile")) || {};

    document.getElementById("creatorName").value =
        profileData.name || "";

    document.getElementById("creatorPhone").value =
        profileData.phone || "";

    document.getElementById("creatorEmail").value =
        profileData.email || "";

    document.getElementById("creatorLocation").value =
        profileData.location || "";

    document.getElementById("creatorCategory").value =
        profileData.category || "";

    document.getElementById("creatorAbout").value =
        profileData.about || "";

    if (profileData.image) {
        document.getElementById("profileImage").src =
            profileData.image;
    }

    updateDisplayInfo(profileData);
}


/* ================= DISPLAY INFO ================= */

function updateDisplayInfo(profileData) {

    const name =
        profileData.name || "Creator Name";

    const category =
        profileData.category || "Handmade Artisan";

    document.getElementById("displayName").textContent =
        name;

    document.getElementById("displayCategory").textContent =
        category;
}


/* ================= SAVE PROFILE ================= */

function saveProfile(event) {

    event.preventDefault();

    const name =
        document.getElementById("creatorName").value.trim();

    const phone =
        document.getElementById("creatorPhone").value.trim();

    const email =
        document.getElementById("creatorEmail").value.trim();

    const location =
        document.getElementById("creatorLocation").value.trim();

    const category =
        document.getElementById("creatorCategory").value.trim();

    const about =
        document.getElementById("creatorAbout").value.trim();

    if (!name || !phone) {

        alert("Please enter Creator Name and Phone Number.");

        return;
    }


    const oldProfile =
        JSON.parse(localStorage.getItem("creatorProfile")) || {};


    const profileData = {

        name: name,

        phone: phone,

        email: email,

        location: location,

        category: category,

        about: about,

        image: oldProfile.image || "",

        updatedAt: new Date().toISOString()

    };


    localStorage.setItem(
        "creatorProfile",
        JSON.stringify(profileData)
    );


    updateDisplayInfo(profileData);

    alert("Creator Profile saved successfully!");

    window.location.href = "creator-dashboard.html";
}


/* ================= IMAGE PREVIEW ================= */

function previewProfileImage(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {

        alert("Please select a valid image.");

        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {

        const imageData = e.target.result;

        document.getElementById("profileImage").src =
            imageData;


        const profileData =
            JSON.parse(localStorage.getItem("creatorProfile")) || {};

        profileData.image = imageData;

        localStorage.setItem(
            "creatorProfile",
            JSON.stringify(profileData)
        );
    };

    reader.readAsDataURL(file);
}


/* ================= VERIFICATION ================= */

function loadVerificationStatus() {

    const verification =
        JSON.parse(
            localStorage.getItem("creatorVerification")
        ) || {};

    const status =
        verification.status || "Under Review";


    const badge =
        document.getElementById("verificationBadge");

    const text =
        document.getElementById("verificationText");


    if (status === "Approved") {

        badge.textContent = "● Approved";

        badge.style.background = "#e8f0df";
        badge.style.color = "#617044";

        text.textContent =
            "Your creator profile has been approved by the admin.";

    }

    else if (status === "Rejected") {

        badge.textContent = "● Rejected";

        badge.style.background = "#f7e3de";
        badge.style.color = "#a34832";

        text.textContent =
            "Your creator verification was rejected. Please check your verification details.";

    }

    else {

        badge.textContent = "● Under Review";

        badge.style.background = "#f5eadf";
        badge.style.color = "#9a654f";

        text.textContent =
            "Your creator profile is currently under review.";

    }
}


/* ================= DASHBOARD ================= */

function goDashboard() {

    window.location.href =
        "creator-dashboard.html";
}