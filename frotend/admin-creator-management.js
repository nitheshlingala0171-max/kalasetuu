document.addEventListener("DOMContentLoaded", function () {
    loadCreators();
});


let allCreators = [];


/* ================= LOAD CREATORS ================= */

function loadCreators() {

    const creatorsList =
        document.getElementById("creatorsList");

    const emptyState =
        document.getElementById("emptyState");


    let creators = [];

    try {

        creators =
            JSON.parse(
                localStorage.getItem("creatorVerifications")
            ) || [];

    } catch (error) {

        console.log(
            "Creator loading error:",
            error
        );

        creators = [];
    }


    /*
        Manage Creators should show
        approved creators only.
    */

    creators =
        creators.filter(function (creator) {

            return String(
                creator.status || ""
            ).toLowerCase() === "approved";

        });


    allCreators = creators;


    updateCreatorCounts(creators);


    if (creators.length === 0) {

        creatorsList.innerHTML = "";

        emptyState.style.display = "block";

        return;
    }


    emptyState.style.display = "none";

    displayCreators(creators);
}



/* ================= DISPLAY CREATORS ================= */

function displayCreators(creators) {

    const creatorsList =
        document.getElementById("creatorsList");

    const emptyState =
        document.getElementById("emptyState");


    if (creators.length === 0) {

        creatorsList.innerHTML = "";

        emptyState.style.display = "block";

        return;
    }


    emptyState.style.display = "none";


    creatorsList.innerHTML =
        creators.map(function (creator, index) {

            const name =
                creator.name ||
                "Creator";


            const craftType =
                creator.craftType ||
                creator.craft ||
                "Traditional Craft";


            const location =
                creator.location ||
                "Not provided";


            const experience =
                creator.experience ||
                "Not provided";


            const contact =
                creator.contact ||
                "Not provided";


            const image =
                creator.craftPhoto ||
                "images/kalasetu-logo.png";


            const createdAt =
                creator.submittedAt ||
                creator.createdAt ||
                "";


            return `

                <div class="creator-card">


                    <div class="creator-top">

                        <img
                            class="creator-photo"
                            src="${image}"
                            alt="${escapeHTML(name)}"
                            onerror="this.src='images/kalasetu-logo.png'"
                        >


                        <div class="creator-info">

                            <h3>
                                ${escapeHTML(name)}
                            </h3>

                            <p>
                                Verified Creator #${index + 1}
                            </p>

                        </div>

                    </div>



                    <div class="creator-details">


                        <div class="detail-item">

                            <span>
                                Craft
                            </span>

                            <strong>
                                ${escapeHTML(craftType)}
                            </strong>

                        </div>



                        <div class="detail-item">

                            <span>
                                Location
                            </span>

                            <strong>
                                ${escapeHTML(location)}
                            </strong>

                        </div>



                        <div class="detail-item">

                            <span>
                                Experience
                            </span>

                            <strong>
                                ${escapeHTML(experience)}
                            </strong>

                        </div>



                        <div class="detail-item">

                            <span>
                                Contact
                            </span>

                            <strong>
                                ${escapeHTML(contact)}
                            </strong>

                        </div>


                    </div>



                    <div class="creator-bottom">


                        <span class="creator-date">

                            ${
                                createdAt
                                    ? "Verified: " +
                                      formatDate(createdAt)
                                    : "Verified Creator"
                            }

                        </span>


                        <span class="creator-status">

                            Approved

                        </span>


                    </div>


                </div>

            `;

        }).join("");
}



/* ================= SEARCH ================= */

function searchCreators() {

    const searchInput =
        document.getElementById("creatorSearch");


    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    if (searchText === "") {

        displayCreators(allCreators);

        return;
    }


    const filteredCreators =
        allCreators.filter(function (creator) {

            const name =
                String(
                    creator.name || ""
                ).toLowerCase();


            const craft =
                String(
                    creator.craftType ||
                    creator.craft ||
                    ""
                ).toLowerCase();


            const location =
                String(
                    creator.location ||
                    ""
                ).toLowerCase();


            return (
                name.includes(searchText) ||
                craft.includes(searchText) ||
                location.includes(searchText)
            );

        });


    displayCreators(filteredCreators);
}



/* ================= COUNTS ================= */

function updateCreatorCounts(creators) {

    const totalCreators =
        document.getElementById("totalCreators");


    const approvedCreators =
        document.getElementById("approvedCreators");


    const pendingCreators =
        document.getElementById("pendingCreators");


    /*
        Total creators:
        all verification records.
    */

    let allVerificationRecords = [];

    try {

        allVerificationRecords =
            JSON.parse(
                localStorage.getItem(
                    "creatorVerifications"
                )
            ) || [];

    } catch (error) {

        allVerificationRecords = [];

    }


    totalCreators.textContent =
        allVerificationRecords.filter(
            function (creator) {

                return String(
                    creator.status || ""
                ).toLowerCase() === "approved";

            }
        ).length;


    approvedCreators.textContent =
        creators.length;


    pendingCreators.textContent =
        allVerificationRecords.filter(
            function (creator) {

                return String(
                    creator.status || ""
                ).toLowerCase() === "pending";

            }
        ).length;
}



/* ================= DATE ================= */

function formatDate(date) {

    if (!date) {
        return "Recently";
    }


    const parsedDate =
        new Date(date);


    if (
        isNaN(
            parsedDate.getTime()
        )
    ) {

        return "Recently";
    }


    return parsedDate.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}



/* ================= SECURITY ================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}



/* ================= DASHBOARD ================= */

function goDashboard() {

    window.location.href =
        "admin-dashboard.html";
}