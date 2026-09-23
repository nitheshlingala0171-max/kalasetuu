document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       CREATOR ACCOUNT
    ===================================================== */

    const creatorData =
        localStorage.getItem("creatorAccount");

    const creatorNameElement =
        document.getElementById("creatorName");

    let creator = {};

    if (creatorData) {

        try {

            creator = JSON.parse(creatorData);

        } catch (error) {

            console.log(
                "Creator account data error:",
                error
            );

        }

    }


    if (creatorNameElement) {

        creatorNameElement.textContent =
            creator.name || "Creator";

    }



    /* =====================================================
       GET ALL VERIFICATION RECORDS
    ===================================================== */

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
            "Verification records error:",
            error
        );

        verifications = [];

    }



    /* =====================================================
       FIND CURRENT CREATOR
    ===================================================== */

    let matchingRecords = [];


    if (Array.isArray(verifications)) {

        matchingRecords =
            verifications.filter(function (item) {

                const sameContact =
                    creator.contact &&
                    item.contact &&
                    String(item.contact).trim() ===
                    String(creator.contact).trim();


                const sameName =
                    creator.name &&
                    item.name &&
                    String(item.name).trim().toLowerCase() ===
                    String(creator.name).trim().toLowerCase();


                return sameContact || sameName;

            });

    }



    /* =====================================================
       SELECT CORRECT VERIFICATION
    ===================================================== */

    let verification = null;


    /*
       First priority:
       Approved record for this creator
    */

    const approvedRecord =
        matchingRecords.find(function (item) {

            return item.status === "Approved";

        });


    if (approvedRecord) {

        verification =
            approvedRecord;

    }


    /*
       Second priority:
       Pending record
    */

    if (!verification) {

        const pendingRecord =
            matchingRecords.find(function (item) {

                return item.status === "Pending";

            });


        if (pendingRecord) {

            verification =
                pendingRecord;

        }

    }


    /*
       Third priority:
       Rejected record
    */

    if (!verification) {

        const rejectedRecord =
            matchingRecords.find(function (item) {

                return item.status === "Rejected";

            });


        if (rejectedRecord) {

            verification =
                rejectedRecord;

        }

    }



    /* =====================================================
       FALLBACK TO SINGLE VERIFICATION
    ===================================================== */

    if (!verification) {

        try {

            const singleData =
                localStorage.getItem(
                    "creatorVerification"
                );


            if (singleData) {

                verification =
                    JSON.parse(
                        singleData
                    );

            }

        } catch (error) {

            console.log(
                "Single verification error:",
                error
            );

        }

    }



    /* =====================================================
       DISPLAY VERIFICATION INFORMATION
    ===================================================== */

    if (verification) {

        const craft =
            document.getElementById(
                "creatorCraft"
            );

        const location =
            document.getElementById(
                "creatorLocation"
            );

        const experience =
            document.getElementById(
                "creatorExperience"
            );

        const status =
            document.getElementById(
                "verificationStatus"
            );



        /* Craft */

        if (craft) {

            craft.textContent =
                verification.craftType ||
                verification.craft ||
                "Not available";

        }



        /* Location */

        if (location) {

            location.textContent =
                verification.location ||
                "Not available";

        }



        /* Experience */

        if (experience) {

            experience.textContent =
                verification.experience
                    ? verification.experience + " years"
                    : "Not available";

        }



        /* Verification Status */

        if (status) {

            const currentStatus =
                verification.status ||
                "Under Review";


            status.textContent =
                currentStatus;


            if (
                currentStatus ===
                "Approved"
            ) {

                status.style.background =
                    "#dfead9";

                status.style.color =
                    "#557047";


            } else if (
                currentStatus ===
                "Rejected"
            ) {

                status.style.background =
                    "#f2d9d4";

                status.style.color =
                    "#9b4034";


            } else {

                status.style.background =
                    "";

                status.style.color =
                    "";

            }

        }

    }

});



/* =====================================================
   MY CRAFTS
===================================================== */

function openMyCrafts() {

    window.location.href =
        "creator-my-crafts.html";

}



/* =====================================================
   ADD NEW CRAFT
===================================================== */

function addNewCraft() {

    window.location.href =
        "creator-add-craft.html";

}



/* =====================================================
   ORDERS
===================================================== */

function openOrders() {

    window.location.href =
        "creator-orders.html";

}



/* =====================================================
   CREATOR PROFILE
===================================================== */

function openProfile() {

    window.location.href =
        "creator-profile.html";

}



/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    const confirmLogout =
        confirm(
            "Are you sure you want to logout?"
        );


    if (confirmLogout) {

        window.location.href =
            "creator-auth.html";

    }

}