
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

        const paymentStatus = "Pending";
        const codSettlementStatus = isCOD
            ? "Pending"
            : "Not Applicable";

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
// EXPORT ROUTER
// =====================================================

module.exports = router;
