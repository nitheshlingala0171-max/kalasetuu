document.addEventListener("DOMContentLoaded", function () {

    loadCrafts();

});


/* =====================================================
   GLOBAL FILTER
===================================================== */

let currentFilter = "All";


/* =====================================================
   LOAD CRAFTS
===================================================== */

function loadCrafts() {

    let crafts = [];

    try {

        crafts =
            JSON.parse(
                localStorage.getItem("creatorCrafts")
            ) || [];

    } catch (error) {

        console.error(
            "Craft data loading error:",
            error
        );

        crafts = [];

    }


    updateCounts(crafts);

    displayCrafts(crafts);

}


/* =====================================================
   UPDATE SUMMARY COUNTS
===================================================== */

function updateCounts(crafts) {

    const total =
        crafts.length;


    const pending =
        crafts.filter(function (craft) {

            return getStatus(craft) ===
                "Under Review";

        }).length;


    const approved =
        crafts.filter(function (craft) {

            return getStatus(craft) ===
                "Approved";

        }).length;


    const rejected =
        crafts.filter(function (craft) {

            return getStatus(craft) ===
                "Rejected";

        }).length;


    document.getElementById(
        "totalCrafts"
    ).textContent = total;


    document.getElementById(
        "pendingCrafts"
    ).textContent = pending;


    document.getElementById(
        "approvedCrafts"
    ).textContent = approved;


    document.getElementById(
        "rejectedCrafts"
    ).textContent = rejected;

}


/* =====================================================
   GET STATUS
===================================================== */

function getStatus(craft) {

    if (!craft || !craft.status) {

        return "Under Review";

    }


    return craft.status;

}


/* =====================================================
   DISPLAY CRAFTS
===================================================== */

function displayCrafts(crafts) {

    const craftsList =
        document.getElementById(
            "craftsList"
        );


    const emptyState =
        document.getElementById(
            "emptyState"
        );


    craftsList.innerHTML = "";


    let filteredCrafts =
        crafts;


    if (currentFilter !== "All") {

        filteredCrafts =
            crafts.filter(function (craft) {

                return getStatus(craft) ===
                    currentFilter;

            });

    }


    if (filteredCrafts.length === 0) {

        emptyState.style.display =
            "block";

        return;

    }


    emptyState.style.display =
        "none";


    filteredCrafts.forEach(
        function (craft) {

            const card =
                createCraftCard(
                    craft,
                    crafts
                );


            craftsList.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   CREATE CRAFT CARD
===================================================== */

function createCraftCard(
    craft,
    allCrafts
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "craft-card";


    const status =
        getStatus(craft);


    let statusClass =
        "status-pending";


    if (status === "Approved") {

        statusClass =
            "status-approved";

    }


    if (status === "Rejected") {

        statusClass =
            "status-rejected";

    }


    const image =
        craft.image ||
        "images/background.png";


    const name =
        escapeHTML(
            craft.name ||
            "Untitled Craft"
        );


    const category =
        escapeHTML(
            craft.category ||
            "Traditional Craft"
        );


    const story =
        escapeHTML(
            craft.story ||
            "No craft story provided."
        );


    const price =
        craft.price !== undefined &&
        craft.price !== ""
            ? "₹" + craft.price
            : "Price not specified";


    const creatorName =
        escapeHTML(
            craft.creatorName ||
            craft.creator ||
            "Creator"
        );


    const createdDate =
        formatDate(
            craft.createdAt
        );


    card.innerHTML = `

        <div class="craft-image">

            <img
                src="${image}"
                alt="${name}"
                onerror="this.src='images/background.png'"
            >

        </div>


        <div class="craft-content">

            <span class="craft-category">
                ${category}
            </span>


            <h3>
                ${name}
            </h3>


            <p class="craft-story">
                ${story}
            </p>


            <div class="craft-price">
                ${price}
            </div>


            <span class="
                status-badge
                ${statusClass}
            ">
                ${escapeHTML(status)}
            </span>


            <div class="creator-info">

                <p>
                    Creator:
                    <strong>
                        ${creatorName}
                    </strong>
                </p>

                <p>
                    Added:
                    <strong>
                        ${createdDate}
                    </strong>
                </p>

            </div>


            <div class="card-actions">

                <button
                    class="view-btn"
                    onclick="viewCraft('${craft.id}')"
                >
                    View
                </button>


                ${
                    status !== "Approved"
                    ? `
                    <button
                        class="approve-btn"
                        onclick="approveCraft('${craft.id}')"
                    >
                        Approve
                    </button>
                    `
                    : ""
                }


                ${
                    status !== "Rejected"
                    ? `
                    <button
                        class="reject-btn"
                        onclick="rejectCraft('${craft.id}')"
                    >
                        Reject
                    </button>
                    `
                    : ""
                }

            </div>

        </div>

    `;


    return card;

}


/* =====================================================
   FILTER CRAFTS
===================================================== */

window.filterCrafts =
    function (
        filter,
        button
    ) {

        currentFilter =
            filter;


        document
            .querySelectorAll(
                ".filter-btn"
            )
            .forEach(
                function (btn) {

                    btn.classList.remove(
                        "active"
                    );

                }
            );


        button.classList.add(
            "active"
        );


        loadCrafts();

    };


/* =====================================================
   APPROVE CRAFT
===================================================== */

window.approveCraft =
    function (id) {

        let crafts = [];


        try {

            crafts =
                JSON.parse(
                    localStorage.getItem(
                        "creatorCrafts"
                    )
                ) || [];

        } catch (error) {

            alert(
                "Unable to load craft data."
            );

            return;

        }


        const craft =
            crafts.find(
                function (item) {

                    return String(item.id) ===
                        String(id);

                }
            );


        if (!craft) {

            alert(
                "Craft not found."
            );

            return;

        }


        const confirmApproval =
            confirm(
                "Approve \"" +
                (craft.name || "this craft") +
                "\" for publishing?"
            );


        if (!confirmApproval) {

            return;

        }


        craft.status =
            "Approved";


        craft.approvedAt =
            new Date().toISOString();


        try {

            localStorage.setItem(
                "creatorCrafts",
                JSON.stringify(
                    crafts
                )
            );


            alert(
                "Craft approved successfully!"
            );


            loadCrafts();

        } catch (error) {

            console.error(
                "Craft approval save error:",
                error
            );


            alert(
                "Unable to save craft status."
            );

        }

    };


/* =====================================================
   REJECT CRAFT
===================================================== */

window.rejectCraft =
    function (id) {

        let crafts = [];


        try {

            crafts =
                JSON.parse(
                    localStorage.getItem(
                        "creatorCrafts"
                    )
                ) || [];

        } catch (error) {

            alert(
                "Unable to load craft data."
            );

            return;

        }


        const craft =
            crafts.find(
                function (item) {

                    return String(item.id) ===
                        String(id);

                }
            );


        if (!craft) {

            alert(
                "Craft not found."
            );

            return;

        }


        const confirmReject =
            confirm(
                "Reject \"" +
                (craft.name || "this craft") +
                "\"?"
            );


        if (!confirmReject) {

            return;

        }


        craft.status =
            "Rejected";


        craft.rejectedAt =
            new Date().toISOString();


        try {

            localStorage.setItem(
                "creatorCrafts",
                JSON.stringify(
                    crafts
                )
            );


            alert(
                "Craft rejected."
            );


            loadCrafts();

        } catch (error) {

            console.error(
                "Craft rejection save error:",
                error
            );


            alert(
                "Unable to save craft status."
            );

        }

    };


/* =====================================================
   VIEW CRAFT
===================================================== */

window.viewCraft =
    function (id) {

        let crafts = [];


        try {

            crafts =
                JSON.parse(
                    localStorage.getItem(
                        "creatorCrafts"
                    )
                ) || [];

        } catch (error) {

            alert(
                "Unable to load craft details."
            );

            return;

        }


        const craft =
            crafts.find(
                function (item) {

                    return String(item.id) ===
                        String(id);

                }
            );


        if (!craft) {

            alert(
                "Craft not found."
            );

            return;

        }


        const name =
            craft.name ||
            "Untitled Craft";


        const category =
            craft.category ||
            "Not specified";


        const price =
            craft.price !== undefined &&
            craft.price !== ""
                ? "₹" + craft.price
                : "Not specified";


        const story =
            craft.story ||
            "No story provided.";


        const status =
            getStatus(craft);


        alert(
            "CRAFT DETAILS\n\n" +

            "Name: " +
            name +

            "\nCategory: " +
            category +

            "\nPrice: " +
            price +

            "\nStatus: " +
            status +

            "\n\nStory:\n" +
            story
        );

    };


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(dateValue) {

    if (!dateValue) {

        return "Not available";

    }


    const date =
        new Date(dateValue);


    if (isNaN(date.getTime())) {

        return "Not available";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   BACK TO ADMIN DASHBOARD
===================================================== */

window.goDashboard =
    function () {

        window.location.href =
            "admin-dashboard.html";

    };