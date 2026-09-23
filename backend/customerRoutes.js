const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();


// =====================================================
// CUSTOMER REGISTRATION
// =====================================================

router.post("/register", async (req, res) => {

    try {

        const { name, contact, password } = req.body;

        if (!name || !contact || !password) {

            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });

        }

        const pool = req.app.locals.pool;

        const existingCustomer = await pool.query(
            "SELECT id FROM customers WHERE contact = $1",
            [contact]
        );

        if (existingCustomer.rows.length > 0) {

            return res.status(409).json({
                success: false,
                message: "Customer already exists."
            });

        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO customers
            (name, contact, password, status)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, contact, status, created_at`,
            [
                name,
                contact,
                hashedPassword,
                "Active"
            ]
        );

        const customer = result.rows[0];

        res.status(201).json({
            success: true,
            message: "Customer registered successfully.",
            customer: customer
        });

    } catch (error) {

        console.error(
            "Customer registration error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error while registering customer."
        });
    }
});


// =====================================================
// CUSTOMER LOGIN
// =====================================================

router.post("/login", async (req, res) => {

    try {

        const { contact, password } = req.body;

        if (!contact || !password) {

            return res.status(400).json({
                success: false,
                message: "Please enter email/phone and password."
            });

        }

        const pool = req.app.locals.pool;

        const result = await pool.query(
            `SELECT id, name, contact, password, status
             FROM customers
             WHERE contact = $1`,
            [contact]
        );

        if (result.rows.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Customer not found."
            });

        }

        const customer = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            customer.password
        );

        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message: "Invalid password."
            });

        }

        if (customer.status !== "Active") {

            return res.status(403).json({
                success: false,
                message: "Customer account is not active."
            });

        }

        res.json({

            success: true,

            message: "Login successful.",

            customer: {
                id: customer.id,
                name: customer.name,
                contact: customer.contact,
                status: customer.status
            }

        });

    } catch (error) {

        console.error(
            "Customer login error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error while logging in."
        });

    }

});

// =====================================================
// GET CUSTOMER PROFILE
// =====================================================

router.get("/profile/:id", async (req, res) => {

    try {

        const customerId = req.params.id;

        const pool = req.app.locals.pool;

        const result = await pool.query(
            `SELECT id, name, contact, status, created_at
             FROM customers
             WHERE id = $1`,
            [customerId]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });

        }

        res.json({
            success: true,
            customer: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Customer profile error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error while loading profile."
        });

    }

});
// =====================================================
// GET CUSTOMER ORDERS
// =====================================================

router.get("/orders/:customerId", async (req, res) => {

    try {

        const customerId = req.params.customerId;

        const pool = req.app.locals.pool;

        const ordersResult = await pool.query(
            `SELECT
                id,
                customer_id,
                customer_name,
                phone,
                address,
                city,
                state,
                pincode,
                payment_method,
                total_price,
                status,
                order_date
             FROM orders
             WHERE customer_id = $1
             ORDER BY order_date DESC`,
            [customerId]
        );

        const orders = [];

        for (const order of ordersResult.rows) {

            const itemsResult = await pool.query(
                `SELECT
                    oi.id,
                    oi.craft_id,
                    oi.product_name,
                    oi.product_image,
                    oi.category,
                    oi.price,
                    oi.quantity,
                    oi.creator_name
                 FROM order_items oi
                 WHERE oi.order_id = $1
                 ORDER BY oi.id`,
                [order.id]
            );

            orders.push({
                id: order.id,
                customerName: order.customer_name,
                phone: order.phone,
                address: order.address,
                city: order.city,
                state: order.state,
                pincode: order.pincode,
                paymentMethod: order.payment_method,
                totalPrice: order.total_price,
                status: order.status,
                orderDate: order.order_date,
                items: itemsResult.rows.map(item => ({
                    name: item.product_name,
                    image: item.product_image,
                    category: item.category,
                    price: item.price,
                    quantity: item.quantity,
                    creator: item.creator_name,
                    craftId: item.craft_id
                }))
            });
        }

        res.json({
            success: true,
            orders: orders
        });

    } catch (error) {

        console.error(
            "Customer orders error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error while loading orders."
        });
    }

});
// =====================================================
// CREATE CUSTOMER ORDER
// =====================================================

router.post("/orders", async (req, res) => {

    const pool = req.app.locals.pool;

    const client = await pool.connect();

    try {

        const {
            customerId,
            customerName,
            phone,
            address,
            city,
            state,
            pincode,
            paymentMethod,
            totalPrice,
            items
        } = req.body;


        // ================= VALIDATION =================

        if (
            !customerId ||
            !customerName ||
            !phone ||
            !address ||
            !city ||
            !state ||
            !pincode ||
            !paymentMethod ||
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Incomplete order details."
            });

        }


        // ================= CUSTOMER CHECK =================

        const customerResult = await client.query(
            `SELECT id, name, contact, status
             FROM customers
             WHERE id = $1`,
            [customerId]
        );


        if (customerResult.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });

        }


        // ================= START TRANSACTION =================

        await client.query("BEGIN");


        // ================= CREATE ORDER =================

        const orderResult = await client.query(
            `INSERT INTO orders
            (
                customer_id,
                customer_name,
                phone,
                address,
                city,
                state,
                pincode,
                payment_method,
                total_price,
                status
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING
                id,
                customer_id,
                customer_name,
                phone,
                address,
                city,
                state,
                pincode,
                payment_method,
                total_price,
                status,
                order_date`,
            [
                customerId,
                customerName,
                phone,
                address,
                city,
                state,
                pincode,
                paymentMethod,
                totalPrice,
                "Pending"
            ]
        );


        const order = orderResult.rows[0];


        // ================= SAVE ORDER ITEMS =================

        for (const item of items) {

            await client.query(
                `INSERT INTO order_items
                (
                    order_id,
                    craft_id,
                    product_name,
                    product_image,
                    category,
                    price,
                    quantity,
                    creator_name
                )
                VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [
                    order.id,

                    // craft_id currently not available
                    null,

                    item.name || "Craft Product",

                    item.image ||
                    "images/kalasetu-logo.png",

                    item.category ||
                    "Traditional Craft",

                    Number(item.price) || 0,

                    Number(item.quantity) || 1,

                    item.creator ||
                    "Local Artisan"
                ]
            );

        }


        // ================= COMMIT =================

        await client.query("COMMIT");


        // ================= SUCCESS =================

        res.status(201).json({

            success: true,

            message: "Order placed successfully.",

            order: {
                id: order.id,
                customerId: order.customer_id,
                customerName: order.customer_name,
                phone: order.phone,
                address: order.address,
                city: order.city,
                state: order.state,
                pincode: order.pincode,
                paymentMethod: order.payment_method,
                totalPrice: Number(order.total_price),
                status: order.status,
                orderDate: order.order_date,
                items: items
            }

        });


    } catch (error) {

        // ================= ROLLBACK =================

        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "Rollback error:",
                rollbackError
            );
        }


        console.error(
            "Create order error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Server error while creating order."

        });


    } finally {

        client.release();

    }

});
// =====================================================
// ADMIN - GET ALL ORDERS
// =====================================================

router.get("/admin/orders", async (req, res) => {

    try {

        const pool = req.app.locals.pool;

        const ordersResult = await pool.query(
            `SELECT
                id,
                customer_id,
                customer_name,
                phone,
                address,
                city,
                state,
                pincode,
                payment_method,
                total_price,
                status,
                order_date
             FROM orders
             ORDER BY order_date DESC`
        );


        const orders = [];


        for (const order of ordersResult.rows) {

            const itemsResult = await pool.query(
                `SELECT
                    id,
                    craft_id,
                    product_name,
                    product_image,
                    category,
                    price,
                    quantity,
                    creator_name
                 FROM order_items
                 WHERE order_id = $1
                 ORDER BY id`,
                [order.id]
            );


            const items = itemsResult.rows.map(
                function (item) {

                    return {
                        id: item.id,
                        craftId: item.craft_id,
                        name: item.product_name,
                        image: item.product_image,
                        category: item.category,
                        price: Number(item.price),
                        quantity: item.quantity,
                        creator: item.creator_name
                    };

                }
            );


            const firstItem =
                items.length > 0
                    ? items[0]
                    : null;


            orders.push({

                id: order.id,

                customerId:
                    order.customer_id,

                customerName:
                    order.customer_name,

                phone:
                    order.phone,

                address:
                    order.address,

                city:
                    order.city,

                state:
                    order.state,

                pincode:
                    order.pincode,

                paymentMethod:
                    order.payment_method,

                totalPrice:
                    Number(order.total_price),

                status:
                    order.status,

                orderDate:
                    order.order_date,

                items:
                    items,

                // Compatibility with existing Admin UI

                productName:
                    firstItem
                        ? firstItem.name
                        : "Craft Product",

                productImage:
                    firstItem
                        ? firstItem.image
                        : "images/kalasetu-logo.png",

                quantity:
                    firstItem
                        ? firstItem.quantity
                        : 1,

                price:
                    firstItem
                        ? firstItem.price
                        : Number(order.total_price)

            });

        }


        res.json({

            success: true,

            orders: orders

        });


    } catch (error) {

        console.error(
            "Admin orders loading error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Server error while loading orders."

        });

    }

});


// =====================================================
// ADMIN - UPDATE ORDER STATUS
// =====================================================

router.put(
    "/admin/orders/:orderId/status",
    async (req, res) => {

        try {

            const orderId =
                req.params.orderId;

            const {
                status
            } = req.body;


            const allowedStatuses = [

                "Pending",
                "Confirmed",
                "Shipped",
                "Delivered",
                "Cancelled"

            ];


            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid order status."

                });

            }


            const pool =
                req.app.locals.pool;


            const result =
                await pool.query(
                    `UPDATE orders
                     SET status = $1
                     WHERE id = $2
                     RETURNING
                        id,
                        status`,
                    [
                        status,
                        orderId
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Order not found."

                });

            }


            res.json({

                success: true,

                message:
                    "Order status updated successfully.",

                order:
                    result.rows[0]

            });


        } catch (error) {

            console.error(
                "Admin order status error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Server error while updating order status."

            });

        }

    }
);
router.put("/orders/:orderId/cancel", async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const pool = req.app.locals.pool;

        // Current order status check
        const orderResult = await pool.query(
            `SELECT id, status
             FROM orders
             WHERE id = $1`,
            [orderId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        const currentStatus = orderResult.rows[0].status;

        // Only Pending or Confirmed orders can be cancelled
        if (
            currentStatus !== "Pending" &&
            currentStatus !== "Confirmed"
        ) {
            return res.status(400).json({
                success: false,
                message: "This order cannot be cancelled now."
            });
        }

        const updateResult = await pool.query(
            `UPDATE orders
             SET status = 'Cancelled'
             WHERE id = $1
             RETURNING id, status`,
            [orderId]
        );

        res.json({
            success: true,
            message: "Order cancelled successfully.",
            order: updateResult.rows[0]
        });

    } catch (error) {
        console.error("Cancel order error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while cancelling order."
        });
    }
});
/* ================= ADMIN - GET CUSTOMERS ================= */

router.get("/admin/customers", async (req, res) => {
    try {
        const pool = req.app.locals.pool;

        const result = await pool.query(
            `SELECT
                id,
                name,
                contact,
                status,
                created_at
             FROM customers
             ORDER BY created_at DESC`
        );

        const customers = result.rows.map(function (customer) {
            return {
                id: customer.id,
                name: customer.name,
                contact: customer.contact,
                status: customer.status,
                createdAt: customer.created_at
            };
        });

        res.json({
            success: true,
            customers: customers
        });

    } catch (error) {

        console.error("Admin customers loading error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while loading customers."
        });
    }
});
/* ================= ADMIN - UPDATE CUSTOMER STATUS ================= */

router.put("/admin/customers/:customerId/status", async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const { status } = req.body;

        const allowedStatuses = ["Active", "Blocked"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer status."
            });
        }

        const pool = req.app.locals.pool;

        const result = await pool.query(
            `UPDATE customers
             SET status = $1
             WHERE id = $2
             RETURNING id, name, contact, status, created_at`,
            [status, customerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });
        }

        res.json({
            success: true,
            message: "Customer status updated successfully.",
            customer: {
                id: result.rows[0].id,
                name: result.rows[0].name,
                contact: result.rows[0].contact,
                status: result.rows[0].status,
                createdAt: result.rows[0].created_at
            }
        });

    } catch (error) {
        console.error("Customer status update error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating customer status."
        });
    }
});
module.exports = router;