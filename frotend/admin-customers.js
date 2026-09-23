document.addEventListener("DOMContentLoaded", function () {
    loadCustomers();
});

let allCustomers = [];


/* =========================================================
   LOAD CUSTOMERS FROM POSTGRESQL
   ========================================================= */

async function loadCustomers() {

    const customersList =
        document.getElementById("customersList");

    const emptyState =
        document.getElementById("emptyState");


    try {

        const response = await fetch(
            "http://localhost:5000/api/customers/admin/customers"
        );


        const data = await response.json();


        console.log(
            "ADMIN CUSTOMERS RESPONSE:",
            data
        );


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to load customers."
            );

            return;
        }


        allCustomers =
            data.customers || [];


        updateCustomerCounts(
            allCustomers
        );


        if (allCustomers.length === 0) {

            customersList.innerHTML = "";

            emptyState.style.display =
                "block";

            return;
        }


        emptyState.style.display =
            "none";


        displayCustomers(
            allCustomers
        );


    } catch (error) {

        console.error(
            "Customer loading error:",
            error
        );


        customersList.innerHTML = "";

        emptyState.style.display =
            "block";


        alert(
            "Unable to connect to server. Please make sure the backend is running."
        );
    }
}



/* =========================================================
   DISPLAY CUSTOMERS
   ========================================================= */

function displayCustomers(customers) {

    const customersList =
        document.getElementById("customersList");

    const emptyState =
        document.getElementById("emptyState");


    if (customers.length === 0) {

        customersList.innerHTML = "";

        emptyState.style.display =
            "block";

        return;
    }


    emptyState.style.display =
        "none";


    customersList.innerHTML =
        customers.map(function (
            customer,
            index
        ) {

            const name =
                customer.name ||
                "Customer";


            const contact =
                customer.contact ||
                "Not provided";


            const status =
                customer.status ||
                "Active";


            const initial =
                name
                    .charAt(0)
                    .toUpperCase();


            const isActive =
                String(status)
                    .toLowerCase() ===
                "active";


            return `

                <div class="customer-card">

                    <div class="customer-top">

                        <div class="customer-avatar">
                            ${escapeHTML(initial)}
                        </div>


                        <div class="customer-info">

                            <h3>
                                ${escapeHTML(name)}
                            </h3>

                            <p>
                                Customer #${index + 1}
                            </p>

                        </div>

                    </div>


                    <div class="customer-details">

                        <div class="detail-item">

                            <span>
                                Contact
                            </span>

                            <strong>
                                ${escapeHTML(contact)}
                            </strong>

                        </div>


                        <div class="detail-item">

                            <span>
                                Account Status
                            </span>

                            <strong>
                                ${escapeHTML(status)}
                            </strong>

                        </div>

                    </div>


                    <div class="customer-bottom">

                        <span class="customer-date">

                            ${
                                customer.createdAt
                                    ? "Joined: " +
                                      formatDate(
                                          customer.createdAt
                                      )
                                    : "Registered Customer"
                            }

                        </span>


                        <span class="customer-status">

                            ${escapeHTML(status)}

                        </span>


                        <button
                            class="customer-action-btn"
                            onclick="toggleCustomerStatus(${customer.id}, '${status}')"
                        >

                            ${
                                isActive
                                    ? "Block Customer"
                                    : "Activate Customer"
                            }

                        </button>

                    </div>

                </div>

            `;

        }).join("");
}



/* =========================================================
   SEARCH CUSTOMERS
   ========================================================= */

function searchCustomers() {

    const searchInput =
        document.getElementById(
            "customerSearch"
        );


    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    if (searchText === "") {

        displayCustomers(
            allCustomers
        );

        return;
    }


    const filteredCustomers =
        allCustomers.filter(
            function (customer) {

                const name =
                    String(
                        customer.name || ""
                    ).toLowerCase();


                const contact =
                    String(
                        customer.contact || ""
                    ).toLowerCase();


                return (
                    name.includes(searchText) ||
                    contact.includes(searchText)
                );

            }
        );


    displayCustomers(
        filteredCustomers
    );
}



/* =========================================================
   CUSTOMER COUNTS
   ========================================================= */

function updateCustomerCounts(
    customers
) {

    const totalCustomers =
        document.getElementById(
            "totalCustomers"
        );


    const activeCustomers =
        document.getElementById(
            "activeCustomers"
        );


    const newCustomers =
        document.getElementById(
            "newCustomers"
        );


    totalCustomers.textContent =
        customers.length;


    const activeCount =
        customers.filter(
            function (customer) {

                return String(
                    customer.status ||
                    "Active"
                ).toLowerCase() ===
                "active";

            }
        ).length;


    activeCustomers.textContent =
        activeCount;


    const sevenDaysAgo =
        new Date(
            Date.now() -
            (
                7 *
                24 *
                60 *
                60 *
                1000
            )
        );


    const newCount =
        customers.filter(
            function (customer) {

                if (!customer.createdAt) {
                    return false;
                }


                const createdDate =
                    new Date(
                        customer.createdAt
                    );


                return (
                    !isNaN(
                        createdDate.getTime()
                    ) &&
                    createdDate >=
                    sevenDaysAgo
                );

            }
        ).length;


    newCustomers.textContent =
        newCount;
}



/* =========================================================
   FORMAT DATE
   ========================================================= */

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



/* =========================================================
   UPDATE CUSTOMER STATUS
   ========================================================= */

async function toggleCustomerStatus(
    customerId,
    currentStatus
) {

    const isCurrentlyActive =
        String(currentStatus)
            .toLowerCase() ===
        "active";


    const newStatus =
        isCurrentlyActive
            ? "Blocked"
            : "Active";


    const confirmAction =
        confirm(
            isCurrentlyActive
                ? "Are you sure you want to block this customer?"
                : "Are you sure you want to activate this customer?"
        );


    if (!confirmAction) {
        return;
    }


    try {

        const response =
            await fetch(
                `http://localhost:5000/api/customers/admin/customers/${customerId}/status`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );


        const data =
            await response.json();


        console.log(
            "CUSTOMER STATUS RESPONSE:",
            data
        );


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to update customer status."
            );

            return;
        }


        alert(
            `Customer status changed to ${newStatus}.`
        );


        await loadCustomers();


    } catch (error) {

        console.error(
            "Customer status error:",
            error
        );


        alert(
            "Unable to connect to server. Please make sure the backend is running."
        );
    }
}



/* =========================================================
   SECURITY
   ========================================================= */

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



/* =========================================================
   DASHBOARD
   ========================================================= */

function goDashboard() {

    window.location.href =
        "admin-dashboard.html";
}