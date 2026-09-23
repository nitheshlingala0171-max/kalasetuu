/* =========================================================
   KALASETU - CHECKOUT JAVASCRIPT
   PostgreSQL Connected Version
   ========================================================= */


/* ================= LOAD CART ================= */

let cart = [];

try {

    const savedCart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];

    const currentOrder =
        JSON.parse(
            localStorage.getItem("currentOrder")
        );

    // Buy Now flow
    if (
        savedCart.length === 0 &&
        currentOrder
    ) {

        cart = [{
            name:
                currentOrder.name ||
                "Craft Product",

            image:
                currentOrder.image ||
                "images/kalasetu-logo.png",

            category:
                currentOrder.category ||
                "Traditional Craft",

            price:
                currentOrder.price || 0,

            quantity:
                currentOrder.quantity || 1,

            creator:
                currentOrder.creator ||
                "Local Artisan"
        }];

    } else {

        // Add to Cart flow
        cart = savedCart;

    }

} catch (error) {

    console.log(
        "Checkout data loading error:",
        error
    );

    cart = [];
}

/* ================= DISPLAY CHECKOUT ================= */

function displayCheckout() {

    if (cart.length === 0) {

        checkoutItems.innerHTML = `

            <div class="empty-order">

                <h3>
                    Your Cart is Empty
                </h3>

                <p>
                    Please add a craft to your cart
                    before checkout.
                </p>

                <a href="customer-home.html">
                    Explore Crafts
                </a>

            </div>

        `;

        checkoutTotal.textContent = "₹0";

        return;
    }


    checkoutItems.innerHTML = "";

    let total = 0;


    cart.forEach(function (item) {

        const quantity =
            Number(item.quantity) || 1;


        const price =
            Number(
                String(item.price || 0)
                    .replace("₹", "")
                    .replace(/,/g, "")
            ) || 0;


        const itemTotal =
            price * quantity;


        total += itemTotal;


        const itemElement =
            document.createElement("div");


        itemElement.className =
            "order-item";


        itemElement.innerHTML = `

            <div class="order-item-image">

                <img
                    src="${item.image || "images/kalasetu-logo.png"}"
                    alt="${item.name || "Craft"}"
                    onerror="this.src='images/kalasetu-logo.png'"
                >

            </div>


            <div class="order-item-info">

                <h4>
                    ${item.name || "Craft Product"}
                </h4>

                <p>
                    ${item.category || "Traditional Craft"}
                </p>

                <p>
                    Quantity: ${quantity}
                </p>

            </div>


            <div class="order-item-price">

                ₹${itemTotal.toLocaleString("en-IN")}

            </div>

        `;


        checkoutItems.appendChild(
            itemElement
        );

    });


    checkoutTotal.textContent =
        "₹" + total.toLocaleString("en-IN");
}


/* ================= PLACE ORDER ================= */

document
    .getElementById("checkoutForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /* ================= CART CHECK ================= */

            if (cart.length === 0) {

                alert(
                    "Your cart is empty."
                );

                return;
            }


            /* ================= CUSTOMER LOGIN CHECK ================= */

            const customerData =
                localStorage.getItem(
                    "customerAccount"
                );


            if (!customerData) {

                alert(
                    "Please login before placing an order."
                );

                window.location.href =
                    "customer-auth.html";

                return;
            }


            let customer;

            try {

                customer =
                    JSON.parse(
                        customerData
                    );

            } catch (error) {

                alert(
                    "Customer information is invalid. Please login again."
                );

                localStorage.removeItem(
                    "customerAccount"
                );

                window.location.href =
                    "customer-auth.html";

                return;
            }


            if (!customer.id) {

                alert(
                    "Customer ID not found. Please login again."
                );

                return;
            }


            /* ================= CUSTOMER DETAILS ================= */

            const customerName =
                document
                    .getElementById(
                        "customerName"
                    )
                    .value
                    .trim();


            const phone =
                document
                    .getElementById(
                        "phone"
                    )
                    .value
                    .trim();


            const address =
                document
                    .getElementById(
                        "address"
                    )
                    .value
                    .trim();


            const city =
                document
                    .getElementById(
                        "city"
                    )
                    .value
                    .trim();


            const state =
                document
                    .getElementById(
                        "state"
                    )
                    .value
                    .trim();


            const pincode =
                document
                    .getElementById(
                        "pincode"
                    )
                    .value
                    .trim();


            /* ================= VALIDATION ================= */

            if (
                customerName === "" ||
                phone === "" ||
                address === "" ||
                city === "" ||
                state === "" ||
                pincode === ""
            ) {

                alert(
                    "Please fill all delivery details."
                );

                return;
            }


            if (
                !/^[0-9]{10}$/.test(
                    phone
                )
            ) {

                alert(
                    "Please enter a valid 10-digit phone number."
                );

                return;
            }


            if (
                !/^[0-9]{6}$/.test(
                    pincode
                )
            ) {

                alert(
                    "Please enter a valid 6-digit pincode."
                );

                return;
            }


            /* ================= PAYMENT ================= */

            const selectedPayment =
                document.querySelector(
                    'input[name="paymentMethod"]:checked'
                );


            if (!selectedPayment) {

                alert(
                    "Please select a payment method."
                );

                return;
            }


            const paymentMethod =
                selectedPayment.value;


            /* ================= TOTAL ================= */

            let total = 0;


            const orderItems =
                cart.map(function (item) {

                    const price =
                        Number(
                            String(
                                item.price || 0
                            )
                                .replace(
                                    "₹",
                                    ""
                                )
                                .replace(
                                    /,/g,
                                    ""
                                )
                        ) || 0;


                    const quantity =
                        Number(
                            item.quantity
                        ) || 1;


                    total +=
                        price * quantity;


                    return {

                        name:
                            item.name ||
                            "Craft Product",

                        image:
                            item.image ||
                            "images/kalasetu-logo.png",

                        category:
                            item.category ||
                            "Traditional Craft",

                        price:
                            price,

                        quantity:
                            quantity,

                        creator:
                            item.creator ||
                            "Local Artisan"

                    };

                });


            /* ================= BUTTON ================= */

            const submitButton =
                document.querySelector(
                    '#checkoutForm button[type="submit"]'
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Placing Order...";

            }


            /* ================= SEND TO BACKEND ================= */

            try {

                const response =
                    await fetch(
                        "http://localhost:5000/api/customers/orders",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body: JSON.stringify({

                                customerId:
                                    customer.id,

                                customerName:
                                    customerName,

                                phone:
                                    phone,

                                address:
                                    address,

                                city:
                                    city,

                                state:
                                    state,

                                pincode:
                                    pincode,

                                paymentMethod:
                                    paymentMethod,

                                totalPrice:
                                    total,

                                items:
                                    orderItems

                            })

                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "ORDER RESPONSE:",
                    data
                );


                /* ================= SERVER ERROR ================= */

                if (!response.ok) {

                    alert(
                        data.message ||
                        "Unable to place order."
                    );

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "Place Order";

                    }

                    return;
                }


                /* ================= SUCCESS ORDER ================= */

                const order =
                    data.order;


                /* ================= SAVE CURRENT ORDER ================= */

                localStorage.setItem(
                    "currentOrder",
                    JSON.stringify(
                        order
                    )
                );


                /* ================= CLEAR CART ================= */

                localStorage.removeItem(
                    "cart"
                );


                /* ================= SUCCESS ================= */

                alert(
                    "Order placed successfully!"
                );


                /* ================= CONFIRMATION ================= */

                window.location.href =
                    "order-confirmation.html";


            } catch (error) {

                console.error(
                    "Order placement error:",
                    error
                );


                alert(
                    "Unable to connect to server. Please make sure the backend is running."
                );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Place Order";

                }

            }

        }
    );


/* ================= CURRENT LOCATION ================= */

function useCurrentLocation() {

    const address =
        document.getElementById(
            "address"
        );


    const locationStatus =
        document.getElementById(
            "locationStatus"
        );


    if (!navigator.geolocation) {

        locationStatus.textContent =
            "Location is not supported by this browser.";

        return;
    }


    locationStatus.textContent =
        "Getting your current location...";


    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude =
                position.coords.latitude;


            const longitude =
                position.coords.longitude;


            address.value =
                "Current Location\n" +
                "Latitude: " +
                latitude +
                "\nLongitude: " +
                longitude;


            locationStatus.textContent =
                "✓ Current location added";

        },


        function () {

            locationStatus.textContent =
                "Unable to get location. Please allow location access.";

        }

    );

}


/* ================= START ================= */

displayCheckout();