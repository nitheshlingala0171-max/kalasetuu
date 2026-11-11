
const express = require("express");
const bcrypt = require("bcrypt");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const router = express.Router();
// DEMO OTP STORAGE (temporary; clears when server restarts)
const passwordResetOtps = new Map();

const razorpay =
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
        ? new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        })
        : null;


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
            [name, contact, hashedPassword, "Active"]
        );

        res.status(201).json({
            success: true,
            message: "Customer registered successfully.",
            customer: result.rows[0]
        });

    } catch (error) {
        console.error("Customer registration error:", error);
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
        console.error("Customer login error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while logging in."
        });
    }
});

// =====================================================
// CUSTOMER - CHANGE PASSWORD
// =====================================================

router.put("/change-password", async (req, res) => {
    try {
        const { customerId, currentPassword, newPassword } = req.body;

        if (!customerId || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Please fill all password fields."
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must contain at least 8 characters."
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password."
            });
        }

        const pool = req.app.locals.pool;

        const result = await pool.query(
            `SELECT id, password, status
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

        const customer = result.rows[0];

        if (customer.status !== "Active") {
            return res.status(403).json({
                success: false,
                message: "Customer account is not active."
            });
        }

        const passwordMatch = await bcrypt.compare(
            currentPassword,
            customer.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            `UPDATE customers
             SET password = $1
             WHERE id = $2`,
            [hashedPassword, customerId]
        );

        return res.json({
            success: true,
            message: "Password changed successfully."
        });

    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while changing password."
        });
    }
});


// =====================================================
// CUSTOMER - SAVED ADDRESSES
// =====================================================

// GET ALL SAVED ADDRESSES
router.get("/addresses/:customerId", async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const { customerId } = req.params;

        const result = await pool.query(
            `SELECT * FROM customer_addresses
             WHERE customer_id = $1
             ORDER BY id DESC`,
            [customerId]
        );

        res.json({
            success: true,
            addresses: result.rows
        });

    } catch (error) {
        console.error("Get addresses error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load addresses."
        });
    }
});


// ADD SAVED ADDRESS
router.post("/addresses", async (req, res) => {
    try {
        const {
            customerId, name, phone, house,
            street, city, state, pincode, addressType
        } = req.body;

        if (
            !customerId || !name || !phone || !house ||
            !city || !state || !pincode
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required address fields."
            });
        }

        const pool = req.app.locals.pool;

        const result = await pool.query(
            `INSERT INTO customer_addresses
            (customer_id, name, phone, house, street,
             city, state, pincode, address_type)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             RETURNING *`,
            [
                customerId, name, phone, house,
                street || null, city, state, pincode,
                addressType || "Home"
            ]
        );

        res.status(201).json({
            success: true,
            message: "Address saved successfully.",
            address: result.rows[0]
        });

    } catch (error) {
        console.error("Add address error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to save address."
        });
    }
});


// UPDATE SAVED ADDRESS
router.put("/addresses/:addressId", async (req, res) => {
    try {
        const { addressId } = req.params;
        const {
            customerId, name, phone, house,
            street, city, state, pincode, addressType
        } = req.body;

        const pool = req.app.locals.pool;

        const result = await pool.query(
            `UPDATE customer_addresses
             SET name=$1, phone=$2, house=$3, street=$4,
                 city=$5, state=$6, pincode=$7, address_type=$8
             WHERE id=$9 AND customer_id=$10
             RETURNING *`,
            [
                name, phone, house, street || null,
                city, state, pincode, addressType || "Home",
                addressId, customerId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Address not found."
            });
        }

        res.json({
            success: true,
            message: "Address updated successfully.",
            address: result.rows[0]
        });

    } catch (error) {
        console.error("Update address error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update address."
        });
    }
});


// DELETE SAVED ADDRESS
router.delete("/addresses/:addressId", async (req, res) => {
    try {
        const { addressId } = req.params;
        const { customerId } = req.body;

        const pool = req.app.locals.pool;

        const result = await pool.query(
            `DELETE FROM customer_addresses
             WHERE id=$1 AND customer_id=$2
             RETURNING id`,
            [addressId, customerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Address not found."
            });
        }

        res.json({
            success: true,
            message: "Address deleted successfully."
        });

    } catch (error) {
        console.error("Delete address error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to delete address."
        });
    }
});
// UPDATE CUSTOMER PROFILE

router.put("/profile/:customerId", async (req, res) => {
    try {
        const { customerId } = req.params;
        const { name, contact } = req.body;

        if (!name || !contact) {
            return res.status(400).json({
                message: "Name and mobile number are required."
            });
        }

        if (!/^[0-9]{10}$/.test(String(contact))) {
            return res.status(400).json({
                message: "Enter a valid 10-digit mobile number."
            });
        }

        const pool = req.app.locals.pool;

        const result = await pool.query(
            `UPDATE customers
             SET name = $1, contact = $2
             WHERE id = $3
             RETURNING id, name, contact`,
            [name.trim(), contact, customerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Customer not found."
            });
        }

        res.json({
            message: "Profile updated successfully!",
            customer: result.rows[0]
        });

    } catch (error) {
        console.error("Profile update error:", error);

        res.status(500).json({
            message: "Unable to update profile."
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
        console.error("Customer profile error:", error);
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
                payment_status,
                cod_settlement_status,
                cod_settled_at,
                order_date,
                delivered_at,
                delivered_at + INTERVAL '48 hours' AS refund_deadline,
                (
                    delivered_at IS NOT NULL
                    AND CURRENT_TIMESTAMP <= delivered_at + INTERVAL '48 hours'
                ) AS refund_available
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
                paymentStatus: order.payment_status,
                codSettlementStatus: order.cod_settlement_status,
                codSettledAt: order.cod_settled_at,
                totalPrice: order.total_price,
                status: order.status,
                orderDate: order.order_date,
                deliveredAt: order.delivered_at,
                refundDeadline: order.refund_deadline,
                refundAvailable: order.refund_available,

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
        console.error("Customer orders error:", error);
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
    let client;

    try {
        client = await pool.connect();

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

        if (customerResult.rows[0].status !== "Active") {
            return res.status(403).json({
                success: false,
                message: "Customer account is not active."
            });
        }

      const isCOD =
    String(paymentMethod).trim().toLowerCase() === "cash on delivery";

const paymentStatus = isCOD ? "Pending" : "Paid (Demo)";
const codSettlementStatus = isCOD ? "Pending" : "Not Applicable";

        await client.query("BEGIN");

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
                status,
                payment_status,
                cod_settlement_status
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
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
                payment_status,
                cod_settlement_status,
                cod_settled_at,
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
                "Pending",
                paymentStatus,
                codSettlementStatus
            ]
        );

        const order = orderResult.rows[0];

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
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [
                    order.id,
                    null,
                    item.name || "Craft Product",
                    item.image || "images/kalasetu-logo.png",
                    item.category || "Traditional Craft",
                    Number(item.price) || 0,
                    Number(item.quantity) || 1,
                    item.creator || "Local Artisan"
                ]
            );
        }

        await client.query("COMMIT");

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
                paymentStatus: order.payment_status,
                codSettlementStatus: order.cod_settlement_status,
                codSettledAt: order.cod_settled_at,
                totalPrice: Number(order.total_price),
                status: order.status,
                orderDate: order.order_date,
                items: items
            }
        });

    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback error:", rollbackError);
            }
        }

        console.error("Create order error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while creating order."
        });

    } finally {
        if (client) {
            client.release();
        }
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
                payment_status,
                cod_settlement_status,
                cod_settled_at,
                order_date,
                delivered_at,
                payout_eligible_at,
                payout_status
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

            const items = itemsResult.rows.map(item => ({
                id: item.id,
                craftId: item.craft_id,
                name: item.product_name,
                image: item.product_image,
                category: item.category,
                price: Number(item.price),
                quantity: item.quantity,
                creator: item.creator_name
            }));

            const firstItem = items.length > 0 ? items[0] : null;

            orders.push({
                id: order.id,
                customerId: order.customer_id,
                customerName: order.customer_name,
                phone: order.phone,
                address: order.address,
                city: order.city,
                state: order.state,
                pincode: order.pincode,
                paymentMethod: order.payment_method,
                paymentStatus: order.payment_status,
                codSettlementStatus: order.cod_settlement_status,
                codSettledAt: order.cod_settled_at,
                totalPrice: Number(order.total_price),
                status: order.status,
                orderDate: order.order_date,
                deliveredAt: order.delivered_at,
                payoutEligibleAt: order.payout_eligible_at,
                payoutStatus: order.payout_status,
                items: items,
                productName: firstItem ? firstItem.name : "Craft Product",
                productImage: firstItem
                    ? firstItem.image
                    : "images/kalasetu-logo.png",
                quantity: firstItem ? firstItem.quantity : 1,
                price: firstItem
                    ? firstItem.price
                    : Number(order.total_price)
            });
        }

        res.json({
            success: true,
            orders: orders
        });

    } catch (error) {
        console.error("Admin orders loading error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while loading orders."
        });
    }
});


// =====================================================
// ADMIN - UPDATE ORDER STATUS
// =====================================================

router.put("/admin/orders/:orderId/status", async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Shipped",
            "Delivered",
            "Cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status."
            });
        }

        const pool = req.app.locals.pool;

        const result = await pool.query(
            `WITH input AS (
                SELECT $1::varchar AS new_status
            )
            UPDATE orders AS o
            SET
                status = input.new_status,

                delivered_at = CASE
                    WHEN input.new_status = 'Delivered'
                    THEN COALESCE(o.delivered_at, CURRENT_TIMESTAMP)
                    ELSE NULL
                END,

                payout_eligible_at = CASE
                    WHEN input.new_status = 'Delivered'
                    THEN COALESCE(o.delivered_at, CURRENT_TIMESTAMP)
                         + INTERVAL '48 hours'
                    ELSE NULL
                END,

                payout_status = CASE
                    WHEN input.new_status = 'Delivered'
                    THEN 'On Hold'
                    ELSE o.payout_status
                END

            FROM input
            WHERE o.id = $2

            RETURNING
                o.id,
                o.status,
                o.delivered_at,
                o.payout_eligible_at,
                o.payout_status`,
            [status, orderId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        res.json({
            success: true,
            message: "Order status updated successfully.",
            order: result.rows[0]
        });

    } catch (error) {
        console.error("Admin order status error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while updating order status."
        });
    }
});


// =====================================================
// ADMIN - CONFIRM COD SETTLEMENT RECEIVED
// =====================================================

router.put("/admin/orders/:orderId/cod-settlement", async (req, res) => {
    const pool = req.app.locals.pool;
    let client;

    try {
        client = await pool.connect();

        const { orderId } = req.params;

        await client.query("BEGIN");

        const orderResult = await client.query(
            `SELECT
                id,
                payment_method,
                status,
                cod_settlement_status
             FROM orders
             WHERE id = $1
             FOR UPDATE`,
            [orderId]
        );

        if (orderResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        const order = orderResult.rows[0];

        if (
            String(order.payment_method).trim().toLowerCase()
            !== "cash on delivery"
        ) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "This order is not a COD order."
            });
        }

        if (order.status !== "Delivered") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "COD settlement can be confirmed only after delivery."
            });
        }

        if (order.cod_settlement_status === "Received") {
            await client.query("ROLLBACK");
            return res.status(409).json({
                success: false,
                message: "COD settlement is already marked as received."
            });
        }

        const refundResult = await client.query(
            `SELECT status
             FROM refund_requests
             WHERE order_id = $1
             LIMIT 1`,
            [orderId]
        );

        if (
            refundResult.rows.length > 0 &&
            ["Pending", "Approved"].includes(refundResult.rows[0].status)
        ) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "COD settlement cannot be confirmed while a refund is pending or approved."
            });
        }

        const updateResult = await client.query(
            `UPDATE orders
             SET
                cod_settlement_status = 'Received',
                cod_settled_at = CURRENT_TIMESTAMP,
                payment_status = 'Paid'
             WHERE id = $1
             RETURNING
                id,
                payment_status,
                cod_settlement_status,
                cod_settled_at`,
            [orderId]
        );

        await client.query("COMMIT");

        res.json({
            success: true,
            message: "COD settlement marked as received.",
            order: updateResult.rows[0]
        });

    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback error:", rollbackError);
            }
        }

        console.error("COD settlement update error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating COD settlement."
        });

    } finally {
        if (client) {
            client.release();
        }
    }
});


// =====================================================
// CUSTOMER - CANCEL ORDER
// =====================================================

router.put("/orders/:orderId/cancel", async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const pool = req.app.locals.pool;

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


// =====================================================
// ADMIN - GET CUSTOMERS
// =====================================================

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

        const customers = result.rows.map(customer => ({
            id: customer.id,
            name: customer.name,
            contact: customer.contact,
            status: customer.status,
            createdAt: customer.created_at
        }));

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


// =====================================================
// ADMIN - UPDATE CUSTOMER STATUS
// =====================================================

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


// =====================================================
// CUSTOMER - CREATE REFUND REQUEST
// =====================================================

router.post("/orders/:orderId/refund", async (req, res) => {
    try {
        const { orderId } = req.params;
        const { customerId, reason, description } = req.body;

        if (!customerId || !reason) {
            return res.status(400).json({
                success: false,
                message: "Please provide customer ID and refund reason."
            });
        }

        const pool = req.app.locals.pool;

        const orderResult = await pool.query(
            `SELECT
                id,
                customer_id,
                status,
                total_price,
                delivered_at,
                (
                    delivered_at IS NOT NULL
                    AND CURRENT_TIMESTAMP <= delivered_at + INTERVAL '48 hours'
                ) AS refund_available
             FROM orders
             WHERE id = $1 AND customer_id = $2`,
            [orderId, customerId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        const order = orderResult.rows[0];

        if (order.status !== "Delivered") {
            return res.status(400).json({
                success: false,
                message: "Refund can be requested only for delivered orders."
            });
        }

        if (!order.refund_available) {
            return res.status(400).json({
                success: false,
                message: "The 48-hour refund period has expired."
            });
        }

        const result = await pool.query(
            `INSERT INTO refund_requests
             (order_id, customer_id, reason, description, status)
             VALUES ($1, $2, $3, $4, 'Pending')
             ON CONFLICT (order_id) DO NOTHING
             RETURNING *`,
            [orderId, customerId, reason, description || null]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({
                success: false,
                message: "Refund request already exists for this order."
            });
        }

        res.status(201).json({
            success: true,
            message: "Refund request submitted successfully.",
            refund: result.rows[0]
        });

    } catch (error) {
        console.error("Refund request error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while submitting refund request."
        });
    }
});


// =====================================================
// CUSTOMER - GET REFUND HISTORY
// =====================================================

router.get("/refunds/:customerId", async (req, res) => {
    try {
        const { customerId } = req.params;
        const pool = req.app.locals.pool;

        const result = await pool.query(
            `SELECT
                r.id,
                r.order_id,
                r.reason,
                r.description,
                r.status,
                o.payment_status,
                r.admin_note,
                r.requested_at,
                o.total_price,
                o.delivered_at,
                o.delivered_at + INTERVAL '48 hours' AS refund_deadline
             FROM refund_requests r
             JOIN orders o ON o.id = r.order_id
             WHERE r.customer_id = $1
             ORDER BY r.requested_at DESC`,
            [customerId]
        );

        res.json({
            success: true,
            refunds: result.rows
        });

    } catch (error) {
        console.error("Refund history error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while loading refund history."
        });
    }
});


// =====================================================
// ADMIN - GET ALL REFUND REQUESTS
// =====================================================

router.get("/admin/refunds", async (req, res) => {
    try {
        const pool = req.app.locals.pool;

        const result = await pool.query(
            `SELECT
                r.id,
                r.order_id,
                r.customer_id,
                r.reason,
                r.description,
                r.status,
                o.payment_status,
                r.admin_note,
                r.requested_at,
                o.total_price,
                o.payment_method,
                o.delivered_at,
                o.payout_status,
                c.name AS customer_name,
                c.contact AS customer_contact
             FROM refund_requests r
             JOIN orders o ON o.id = r.order_id
             JOIN customers c ON c.id = r.customer_id
             ORDER BY r.requested_at DESC`
        );

        res.json({
            success: true,
            refunds: result.rows
        });

    } catch (error) {
        console.error("Admin refunds error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load refund requests."
        });
    }
});


// =====================================================
// ADMIN - UPDATE REFUND STATUS
// =====================================================

router.put("/admin/refunds/:refundId/status", async (req, res) => {
    try {
        const { refundId } = req.params;
        const { status, adminNote } = req.body;

        const allowedStatuses = [
            "Pending",
            "Approved",
            "Rejected"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid refund status."
            });
        }

        const pool = req.app.locals.pool;

        const result = await pool.query(
            `UPDATE refund_requests
             SET
                status = $1,
                admin_note = $2,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING
                id,
                order_id,
                customer_id,
                reason,
                description,
                status,
                admin_note,
                requested_at,
                updated_at`,
            [status, adminNote || null, refundId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Refund request not found."
            });
        }

        res.json({
            success: true,
            message: "Refund status updated successfully.",
            refund: result.rows[0]
        });

    } catch (error) {
        console.error("Admin refund status error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while updating refund status."
        });
    }
});


// =====================================================
// ADMIN - MARK REFUND PAYMENT AS PROCESSED
// =====================================================

router.put("/admin/refunds/:refundId/payment-status", async (req, res) => {
    const pool = req.app.locals.pool;
    let client;

    try {
        const { refundId } = req.params;
        client = await pool.connect();

        await client.query("BEGIN");

        const refundResult = await client.query(
            `SELECT id, order_id, status, payment_status
             FROM refund_requests
             WHERE id = $1
             FOR UPDATE`,
            [refundId]
        );

        if (refundResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Refund request not found."
            });
        }

        const refund = refundResult.rows[0];

        if (refund.status !== "Approved") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Only approved refunds can be processed."
            });
        }

        if (refund.payment_status === "Processed") {
            await client.query("ROLLBACK");
            return res.status(409).json({
                success: false,
                message: "Refund payment is already processed."
            });
        }

        await client.query(
            `UPDATE refund_requests
             SET payment_status = 'Processed',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [refundId]
        );

        await client.query(
            `UPDATE orders
             SET payment_status = 'Refunded'
             WHERE id = $1`,
            [refund.order_id]
        );

        await client.query("COMMIT");

        res.json({
            success: true,
            message: "Refund payment marked as processed."
        });

    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Refund rollback error:", rollbackError);
            }
        }

        console.error("Refund payment processing error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while processing refund payment."
        });

    } finally {
        if (client) {
            client.release();
        }
    }
});


// =====================================================
// EXPORT ROUTER
// =====================================================
// =====================================================
// RAZORPAY - CREATE TEST PAYMENT ORDER
// =====================================================

router.post("/payment/create-order", async (req, res) => {
    try {
        if (
            !process.env.RAZORPAY_KEY_ID ||
            !process.env.RAZORPAY_KEY_SECRET ||
            process.env.RAZORPAY_KEY_ID === "your_test_key_id" ||
            process.env.RAZORPAY_KEY_SECRET === "your_test_key_secret"
        ) {
            return res.status(503).json({
                success: false,
                message: "Razorpay Test Mode keys are not configured."
            });
        }

        const {
            customerId,
            customerName,
            phone,
            address,
            city,
            state,
            pincode,
            items
        } = req.body;

        if (
            !customerId || !customerName || !phone ||
            !address || !city || !state || !pincode ||
            !Array.isArray(items) || items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Incomplete payment details."
            });
        }

        const pool = req.app.locals.pool;

        const customerResult = await pool.query(
            `SELECT id, status FROM customers WHERE id = $1`,
            [customerId]
        );

        if (
            customerResult.rows.length === 0 ||
            customerResult.rows[0].status !== "Active"
        ) {
            return res.status(403).json({
                success: false,
                message: "Invalid or inactive customer."
            });
        }

        const fixedProducts = {
            "Terracotta Handcrafted Pot": 499,
            "Handloom Cotton Saree": 1299,
            "Wooden Elephant Figurine": 699,
            "Handmade Earrings": 349,
            "Traditional Tea Set": 899,
            "Handwoven Basket": 399
        };

        const verifiedItems = [];
        let totalAmount = 0;

        for (const item of items) {
            const quantity = Number(item.quantity);

            if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product quantity."
                });
            }

            let verifiedItem;

            if (item.craftId) {
                const craftResult = await pool.query(
                    `SELECT id, name, category, price, image, stock_status, status
                     FROM crafts
                     WHERE id = $1`,
                    [item.craftId]
                );

                if (
                    craftResult.rows.length === 0 ||
                    craftResult.rows[0].status !== "Approved" ||
                    craftResult.rows[0].stock_status === "Out of Stock"
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "A selected craft is unavailable."
                    });
                }

                const craft = craftResult.rows[0];

                verifiedItem = {
                    craftId: craft.id,
                    name: craft.name,
                    category: craft.category,
                    image: craft.image || "images/kalasetu-logo.png",
                    price: Number(craft.price),
                    quantity,
                    creator: item.creator || "Local Artisan"
                };

            } else {
                const fixedPrice = fixedProducts[item.name];

                if (fixedPrice === undefined) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid product selected."
                    });
                }

                verifiedItem = {
                    craftId: null,
                    name: item.name,
                    category: item.category || "Traditional Craft",
                    image: item.image || "images/kalasetu-logo.png",
                    price: fixedPrice,
                    quantity,
                    creator: item.creator || "Local Artisan"
                };
            }

            totalAmount += verifiedItem.price * quantity;
            verifiedItems.push(verifiedItem);
        }

        const amountPaise = Math.round(totalAmount * 100);

        const razorpayOrder = await razorpay.orders.create({
            amount: amountPaise,
            currency: "INR",
            receipt: `kalasetu_${customerId}_${Date.now()}`
        });

        const orderDetails = {
            customerName,
            phone,
            address,
            city,
            state,
            pincode,
            items: verifiedItems
        };

        await pool.query(
            `INSERT INTO payment_attempts
             (customer_id, razorpay_order_id, amount_paise,
              currency, order_details, payment_status)
             VALUES ($1, $2, $3, 'INR', $4, 'Created')`,
            [
                customerId,
                razorpayOrder.id,
                amountPaise,
                JSON.stringify(orderDetails)
            ]
        );

        res.json({
            success: true,
            keyId: process.env.RAZORPAY_KEY_ID,
            orderId: razorpayOrder.id,
            amount: amountPaise,
            currency: "INR"
        });

    } catch (error) {
        console.error("Razorpay create order error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create payment order."
        });
    }
});


// =====================================================
// RAZORPAY - VERIFY PAYMENT AND SAVE CUSTOMER ORDER
// =====================================================

router.post("/payment/verify", async (req, res) => {
    const pool = req.app.locals.pool;
    let client;

    try {
        const {
            customerId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (
            !customerId ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment verification details are incomplete."
            });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const expectedBuffer = Buffer.from(expectedSignature);
        const receivedBuffer = Buffer.from(razorpay_signature);

        if (
            expectedBuffer.length !== receivedBuffer.length ||
            !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed."
            });
        }

        const payment = await razorpay.payments.fetch(
            razorpay_payment_id
        );

        if (
            payment.order_id !== razorpay_order_id ||
            payment.status !== "captured"
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment is not successfully captured."
            });
        }

        client = await pool.connect();
        await client.query("BEGIN");

        const attemptResult = await client.query(
            `SELECT *
             FROM payment_attempts
             WHERE razorpay_order_id = $1
               AND customer_id = $2
             FOR UPDATE`,
            [razorpay_order_id, customerId]
        );

        if (attemptResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Payment attempt not found."
            });
        }

        const attempt = attemptResult.rows[0];

        if (attempt.payment_status === "Paid") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "This payment has already been processed."
            });
        }

        if (
            Number(payment.amount) !== Number(attempt.amount_paise) ||
            payment.currency !== attempt.currency
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Payment amount verification failed."
            });
        }

        const details = attempt.order_details;

        const orderResult = await client.query(
            `INSERT INTO orders
             (
                customer_id, customer_name, phone,
                address, city, state, pincode,
                payment_method, total_price, status,
                payment_status, cod_settlement_status
             )
             VALUES ($1,$2,$3,$4,$5,$6,$7,'Razorpay',$8,
                     'Pending','Paid','Not Applicable')
             RETURNING id, customer_id, customer_name,
                       total_price, status, payment_status, order_date`,
            [
                customerId,
                details.customerName,
                details.phone,
                details.address,
                details.city,
                details.state,
                details.pincode,
                Number(attempt.amount_paise) / 100
            ]
        );

        const order = orderResult.rows[0];

        for (const item of details.items) {
            await client.query(
                `INSERT INTO order_items
                 (
                    order_id, craft_id, product_name,
                    product_image, category, price,
                    quantity, creator_name
                 )
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [
                    order.id,
                    item.craftId,
                    item.name,
                    item.image,
                    item.category,
                    item.price,
                    item.quantity,
                    item.creator
                ]
            );
        }

        await client.query(
            `UPDATE payment_attempts
             SET payment_status = 'Paid',
                 razorpay_payment_id = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [razorpay_payment_id, attempt.id]
        );

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: "Payment verified and order placed successfully.",
            order: {
                id: order.id,
                customerId: order.customer_id,
                customerName: order.customer_name,
                totalPrice: Number(order.total_price),
                status: order.status,
                paymentStatus: order.payment_status,
                orderDate: order.order_date
            }
        });

    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Payment rollback error:", rollbackError);
            }
        }

        console.error("Razorpay verification error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to verify payment."
        });

    } finally {
        if (client) {
            client.release();
        }
    }
});
// UPDATE CUSTOMER PROFILE
router.put("/profile/:customerId", async (req, res) => {
    try {
        const pool = req.app.locals.pool;

        const { customerId } = req.params;
        const { name, contact } = req.body;

        if (!name || !contact) {
            return res.status(400).json({
                success: false,
                message: "Name and mobile number are required."
            });
        }

        const result = await pool.query(
            `UPDATE customers
             SET name = $1, contact = $2
             WHERE id = $3
             RETURNING id, name, contact`,
            [name, contact, customerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });
        }

        res.json({
            success: true,
            message: "Profile updated successfully!",
            customer: result.rows[0]
        });

    } catch (error) {
        console.error("Profile update error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update profile."
        });
    }
});

// =====================================================
// FORGOT PASSWORD - GENERATE DEMO OTP
// =====================================================

router.post("/forgot-password/send-otp", async (req, res) => {
    try {
        const contact = String(req.body.contact || "").trim();

        if (!contact) {
            return res.status(400).json({
                success: false,
                message: "Please enter your registered mobile number."
            });
        }

        const pool = req.app.locals.pool;

        const result = await pool.query(
            `SELECT id, contact, status
             FROM customers
             WHERE contact = $1`,
            [contact]
        );

        if (
            result.rows.length === 0 ||
            result.rows[0].status !== "Active"
        ) {
            return res.status(404).json({
                success: false,
                message: "Registered active customer not found."
            });
        }

        const customer = result.rows[0];

        // 60-second resend limit
        const existing = passwordResetOtps.get(contact);

        if (existing && Date.now() - existing.createdAt < 60000) {
            return res.status(429).json({
                success: false,
                message: "Please wait 60 seconds before requesting another OTP."
            });
        }

        // Generate a six-digit OTP
        const otp = String(
            crypto.randomInt(100000, 1000000)
        );

        passwordResetOtps.set(contact, {
            customerId: customer.id,
            otp: otp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 5 * 60 * 1000,
            attempts: 0
        });

        res.json({
            success: true,
            message: "Demo OTP generated successfully.",
            demoOtp: otp,
            expiresIn: "5 minutes"
        });

    } catch (error) {
        console.error("Forgot password OTP error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to generate OTP."
        });
    }
});


// =====================================================
// FORGOT PASSWORD - VERIFY OTP AND RESET PASSWORD
// =====================================================

router.post("/forgot-password/reset", async (req, res) => {
    try {
        const contact = String(req.body.contact || "").trim();
        const otp = String(req.body.otp || "").trim();
        const newPassword = String(req.body.newPassword || "");

        if (!contact || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        const record = passwordResetOtps.get(contact);

        if (!record) {
            return res.status(400).json({
                success: false,
                message: "OTP not found. Please request a new OTP."
            });
        }

        if (Date.now() > record.expiresAt) {
            passwordResetOtps.delete(contact);

            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new OTP."
            });
        }

        if (record.attempts >= 5) {
            passwordResetOtps.delete(contact);

            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Request a new OTP."
            });
        }

        if (otp !== record.otp) {
            record.attempts += 1;

            if (record.attempts >= 5) {
                passwordResetOtps.delete(contact);

                return res.status(429).json({
                    success: false,
                    message: "Too many incorrect attempts. Request a new OTP."
                });
            }

            return res.status(400).json({
                success: false,
                message: "Incorrect OTP. Please try again."
            });
        }

        const pool = req.app.locals.pool;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updateResult = await pool.query(
            `UPDATE customers
             SET password = $1
             WHERE id = $2 AND status = 'Active'
             RETURNING id`,
            [hashedPassword, record.customerId]
        );

        if (updateResult.rows.length === 0) {
            passwordResetOtps.delete(contact);

            return res.status(404).json({
                success: false,
                message: "Customer account not found or inactive."
            });
        }

        // OTP can be used only once
        passwordResetOtps.delete(contact);

        res.json({
            success: true,
            message: "Password reset successfully. Please login with your new password."
        });

    } catch (error) {
        console.error("Password reset error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to reset password."
        });
    }
});

module.exports = router;
