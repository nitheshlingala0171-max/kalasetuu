
const express = require("express");
const router = express.Router();

// PostgreSQL pool from server.js
const getPool = (req) => req.app.locals.pool;

// 1. CUSTOMER: Submit custom craft request
router.post("/", async (req, res) => {
    try {
        const pool = getPool(req);

        const {
            customerId,
            craftType,
            occasion,
            budget,
            colour,
            size,
            customisation,
            referenceImage,
            requiredDate,
            instructions
        } = req.body;

        if (
            !customerId ||
            !craftType ||
            !occasion ||
            !budget ||
            !requiredDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        if (
            !Number.isInteger(Number(customerId)) ||
            !Number.isFinite(Number(budget)) ||
            Number(budget) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID or budget."
            });
        }

        // Limit reference image to approximately 5 MB
        if (
            referenceImage &&
            referenceImage.length > 7 * 1024 * 1024
        ) {
            return res.status(400).json({
                success: false,
                message: "Reference image must be under 5 MB."
            });
        }

        const customer = await pool.query(
            "SELECT id FROM customers WHERE id = $1",
            [customerId]
        );

        if (customer.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found. Please login again."
            });
        }

        const result = await pool.query(
            `INSERT INTO custom_craft_requests
            (
                customer_id,
                craft_type,
                occasion,
                budget,
                colour,
                size,
                customisation,
                reference_image,
                required_date,
                instructions
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING *`,
            [
                customerId,
                craftType,
                occasion,
                budget,
                colour || null,
                size || null,
                customisation || null,
                referenceImage || null,
                requiredDate,
                instructions || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Custom craft request submitted successfully!",
            request: result.rows[0]
        });

    } catch (error) {
        console.error("Submit custom request error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to submit request."
        });
    }
});


// 2. CUSTOMER: Get their custom craft requests
router.get("/customer/:customerId", async (req, res) => {
    try {
        const pool = getPool(req);
        const { customerId } = req.params;

        const result = await pool.query(
            `SELECT
                r.*,
                c.name AS accepted_creator_name,
                c.contact AS accepted_creator_contact,
                c.craft_type AS accepted_creator_craft
             FROM custom_craft_requests r
             LEFT JOIN creators c
                ON r.accepted_creator_id = c.id
             WHERE r.customer_id = $1
             ORDER BY r.created_at DESC`,
            [customerId]
        );

        res.json({
            success: true,
            requests: result.rows
        });

    } catch (error) {
        console.error("Customer requests error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load your requests."
        });
    }
});


// 3. CREATOR: View all custom craft requests
router.get("/creator/:creatorId", async (req, res) => {
    try {
        const pool = getPool(req);
        const { creatorId } = req.params;

        const creator = await pool.query(
            "SELECT id, status FROM creators WHERE id = $1",
            [creatorId]
        );

        if (
            creator.rows.length === 0 ||
            creator.rows[0].status !== "Approved"
        ) {
            return res.status(403).json({
                success: false,
                message: "Only approved creators can view requests."
            });
        }

        const result = await pool.query(
            `SELECT
                r.*,
                cu.name AS customer_name,
                ac.name AS accepted_creator_name
             FROM custom_craft_requests r
             JOIN customers cu
                ON r.customer_id = cu.id
             LEFT JOIN creators ac
                ON r.accepted_creator_id = ac.id
             ORDER BY
                CASE WHEN r.status = 'OPEN' THEN 0 ELSE 1 END,
                r.created_at DESC`
        );

        const requests = result.rows.map(request => ({
            ...request,
            can_accept: request.status === "OPEN"
        }));

        res.json({
            success: true,
            requests
        });

    } catch (error) {
        console.error("Creator requests error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load custom craft requests."
        });
    }
});


// 4. CREATOR: Accept a request (only one creator can accept)
router.post("/:requestId/accept", async (req, res) => {
    const pool = getPool(req);
    const client = await pool.connect();

    try {
        const { requestId } = req.params;
        const { creatorId } = req.body;

        if (
            !Number.isInteger(Number(requestId)) ||
            !Number.isInteger(Number(creatorId))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID or creator ID."
            });
        }

        // Check creator approval
        const creator = await client.query(
            "SELECT id, status FROM creators WHERE id = $1",
            [creatorId]
        );

        if (
            creator.rows.length === 0 ||
            creator.rows[0].status !== "Approved"
        ) {
            return res.status(403).json({
                success: false,
                message: "Only approved creators can accept requests."
            });
        }

        await client.query("BEGIN");

        // Lock this request so two creators cannot accept it together
        const request = await client.query(
            `SELECT id, status
             FROM custom_craft_requests
             WHERE id = $1
             FOR UPDATE`,
            [requestId]
        );

        if (request.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Custom craft request not found."
            });
        }

        if (request.rows[0].status !== "OPEN") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "This request has already been accepted by another creator."
            });
        }

        const updated = await client.query(
            `UPDATE custom_craft_requests
             SET status = 'ACCEPTED',
                 accepted_creator_id = $1,
                 accepted_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [creatorId, requestId]
        );

        await client.query("COMMIT");

        res.json({
            success: true,
            message: "You have successfully accepted this request!",
            request: updated.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});

        console.error("Accept request error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to accept this request."
        });

    } finally {
        client.release();
    }
});

module.exports = router;
