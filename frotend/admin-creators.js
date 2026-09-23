document.addEventListener("DOMContentLoaded", function () {

    const creatorRequests =
        document.getElementById("creatorRequests");

    const approvedCreators =
        document.getElementById("approvedCreators");

    const emptyMessage =
        document.getElementById("emptyMessage");

    const pendingCount =
        document.getElementById("pendingCount");

    const approvedCount =
        document.getElementById("approvedCount");

    const rejectedCount =
        document.getElementById("rejectedCount");

    const adminEmail =
        document.getElementById("adminEmail");


    /* ================= ADMIN LOGIN CHECK ================= */

    const isAdminLoggedIn =
        localStorage.getItem("adminLoggedIn");

    if (isAdminLoggedIn !== "true") {
        window.location.href = "admin-login.html";
        return;
    }


    /* ================= ADMIN EMAIL ================= */

    const savedAdminEmail =
        localStorage.getItem("adminEmail");

    if (savedAdminEmail) {
        adminEmail.textContent = savedAdminEmail;
    }


    /* ================= LOAD CREATORS ================= */

    function loadCreators() {

        let creators =
            JSON.parse(
                localStorage.getItem("creatorVerifications")
            ) || [];


        /* ---------- COUNTS ---------- */

        const pendingCreators =
            creators.filter(
                creator => creator.status === "Pending"
            );

        const approved =
            creators.filter(
                creator => creator.status === "Approved"
            );

        const rejected =
            creators.filter(
                creator => creator.status === "Rejected"
            );


        pendingCount.textContent =
            pendingCreators.length;

        approvedCount.textContent =
            approved.length;

        rejectedCount.textContent =
            rejected.length;


        /* ---------- PENDING LIST ---------- */

        creatorRequests.innerHTML = "";


        if (pendingCreators.length === 0) {

            emptyMessage.style.display = "block";

        } else {

            emptyMessage.style.display = "none";


            pendingCreators.forEach(function (creator) {

                const card =
                    document.createElement("div");

                card.className = "creator-card";


                card.innerHTML = `

                    <div class="creator-photo">

                        <img
                            src="${creator.craftPhoto || "images/creator.png"}"
                            alt="Craft Photo"
                        >

                    </div>


                    <div class="creator-details">

                        <h4>
                            ${creator.name || "Creator"}
                        </h4>

                        <p>
                            <strong>Craft:</strong>
                            ${creator.craftType || "Not provided"}
                        </p>

                        <p>
                            <strong>Location:</strong>
                            ${creator.location || "Not provided"}
                        </p>

                        <p>
                            <strong>Experience:</strong>
                            ${creator.experience || "Not provided"}
                        </p>

                        <span class="pending-badge">
                            PENDING VERIFICATION
                        </span>

                    </div>


                    <div class="creator-actions">

                        <button
                            class="view-btn"
                            onclick="viewCreator('${creator.id}')"
                        >
                            VIEW DETAILS
                        </button>


                        <button
                            class="approve-btn"
                            onclick="approveCreator('${creator.id}')"
                        >
                            APPROVE
                        </button>


                        <button
                            class="reject-btn"
                            onclick="rejectCreator('${creator.id}')"
                        >
                            REJECT
                        </button>

                    </div>

                `;


                creatorRequests.appendChild(card);

            });

        }


        /* ---------- APPROVED LIST ---------- */

        approvedCreators.innerHTML = "";


        if (approved.length === 0) {

            approvedCreators.innerHTML = `

                <div class="empty-message">

                    <div class="empty-icon">
                        —
                    </div>

                    <h3>
                        No Approved Creators
                    </h3>

                    <p>
                        Approved creators will appear here.
                    </p>

                </div>

            `;

        } else {

            approved.forEach(function (creator) {

                const card =
                    document.createElement("div");

                card.className = "approved-card";


                card.innerHTML = `

                    <div>

                        <h4>
                            ${creator.name || "Creator"}
                        </h4>

                        <p>
                            ${creator.craftType || "Craft"} •
                            ${creator.location || "Location not provided"}
                        </p>

                    </div>


                    <span class="approved-badge">
                        APPROVED
                    </span>

                `;


                approvedCreators.appendChild(card);

            });

        }

    }


    /* ================= INITIAL LOAD ================= */

    loadCreators();


    /* ================= VIEW CREATOR ================= */

    window.viewCreator = function (id) {

        const creators =
            JSON.parse(
                localStorage.getItem("creatorVerifications")
            ) || [];


        const creator =
            creators.find(
                item => String(item.id) === String(id)
            );


        if (!creator) {
            alert("Creator details not found.");
            return;
        }


        alert(
            "CREATOR DETAILS\n\n" +

            "Name: " +
            (creator.name || "Not provided") +

            "\n\nCraft Type: " +
            (creator.craftType || "Not provided") +

            "\n\nLocation: " +
            (creator.location || "Not provided") +

            "\n\nExperience: " +
            (creator.experience || "Not provided") +

            "\n\nStatus: " +
            (creator.status || "Pending")
        );

    };


    /* ================= APPROVE CREATOR ================= */

   window.approveCreator = function (id) {

    const creators =
        JSON.parse(
            localStorage.getItem("creatorVerifications")
        ) || [];

    const creator =
        creators.find(
            item => String(item.id) === String(id)
        );

    if (!creator) {

        alert("Creator not found.");

        return;
    }


    const confirmApproval =
        confirm(
            "Approve " +
            (creator.name || "this creator") +
            " as a Kalasetu creator?"
        );


    if (!confirmApproval) {

        return;
    }


    /* Update main creator verification record */

    creator.status = "Approved";


    /* Save all creator requests */

    localStorage.setItem(
        "creatorVerifications",
        JSON.stringify(creators)
    );


    /* =====================================================
       ALSO UPDATE SINGLE CREATOR VERIFICATION
       This is used by Creator Dashboard
    ===================================================== */

    const currentVerification =
        localStorage.getItem(
            "creatorVerification"
        );


    if (currentVerification) {

        try {

            const current =
                JSON.parse(
                    currentVerification
                );


            if (
                String(current.id) ===
                String(creator.id)
            ) {

                current.status =
                    "Approved";


                localStorage.setItem(
                    "creatorVerification",
                    JSON.stringify(current)
                );

            }

        } catch (error) {

            console.log(
                "Creator verification update error:",
                error
            );

        }

    }


    alert(
        "Creator approved successfully!"
    );


    loadCreators();

};
    /* ================= REJECT CREATOR ================= */

    window.rejectCreator = function (id) {

        const creators =
            JSON.parse(
                localStorage.getItem("creatorVerifications")
            ) || [];


        const creator =
            creators.find(
                item => String(item.id) === String(id)
            );


        if (!creator) {
            alert("Creator not found.");
            return;
        }


        const confirmRejection =
            confirm(
                "Reject " +
                (creator.name || "this creator") +
                " verification request?"
            );


        if (!confirmRejection) {
            return;
        }


        creator.status = "Rejected";


        localStorage.setItem(
            "creatorVerifications",
            JSON.stringify(creators)
        );


        alert(
            "Creator verification rejected."
        );


        loadCreators();

    };

});


/* ================= BACK TO DASHBOARD ================= */

function goBack() {

    window.location.href =
        "admin-dashboard.html";

}