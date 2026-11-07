const express = require("express");

const router = express.Router();

const getPool = (req) => req.app.locals.pool;


// =====================================================
// CREATE OR GET CONVERSATION
// POST /api/chat/conversations
// =====================================================

router.post("/conversations", async (req, res) => {
    try {
        const { customerId, creatorId, craftId } = req.body;
        const pool = getPool(req);

        if (!customerId || !creatorId) {
            return res.status(400).json({
                success: false,
                message: "Customer ID and Creator ID are required."
            });
        }

        const customer = await pool.query(
            "SELECT id, status FROM customers WHERE id = $1",
            [customerId]
        );

        if (!customer.rows.length || customer.rows[0].status !== "Active") {
            return res.status(404).json({
                success: false,
                message: "Active customer not found."
            });
        }

        const creator = await pool.query(
            "SELECT id FROM creators WHERE id = $1",
            [creatorId]
        );

        if (!creator.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Creator not found."
            });
        }

        // If a craft ID is supplied, verify that it belongs to this creator.
        if (craftId !== undefined && craftId !== null) {
            const craft = await pool.query(
                `SELECT id
                 FROM crafts
                 WHERE id = $1 AND creator_id = $2`,
                [craftId, creatorId]
            );

            if (!craft.rows.length) {
                return res.status(404).json({
                    success: false,
                    message: "Craft not found for this creator."
                });
            }
        }

        // Find an existing conversation for this exact customer,
        // creator and craft combination.
        let result = await pool.query(
            `SELECT id, customer_id, creator_id, craft_id, created_at
             FROM conversations
             WHERE customer_id = $1
               AND creator_id = $2
               AND craft_id IS NOT DISTINCT FROM $3
             LIMIT 1`,
            [customerId, creatorId, craftId ?? null]
        );

        let isNew = false;

        if (result.rows.length === 0) {
            result = await pool.query(
                `INSERT INTO conversations
                    (customer_id, creator_id, craft_id)
                 VALUES ($1, $2, $3)
                 RETURNING id, customer_id, creator_id, craft_id, created_at`,
                [customerId, creatorId, craftId ?? null]
            );

            isNew = true;
        }

        res.status(isNew ? 201 : 200).json({
            success: true,
            message: isNew
                ? "Conversation created."
                : "Existing conversation opened.",
            conversation: result.rows[0]
        });

    } catch (error) {
        console.error("Create conversation error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create conversation."
        });
    }
});


// =====================================================
// CUSTOMER - GET ALL CONVERSATIONS
// GET /api/chat/customer/:customerId
// =====================================================

router.get("/customer/:customerId", async (req, res) => {
    try {
        const { customerId } = req.params;
        const pool = getPool(req);

        const result = await pool.query(
            `SELECT
                cv.id AS conversation_id,
                cv.customer_id,
                cv.creator_id,
                cv.craft_id,
                cv.created_at,
                cv.updated_at,
                cr.name AS creator_name,
                cr.craft_type,
                cr.status AS creator_status,
                cf.name AS craft_name,
                cf.category AS craft_category,
                cf.price AS craft_price,
                cf.image AS craft_image,
                lm.message AS last_message,
                lm.sender_type AS last_sender_type,
                lm.created_at AS last_message_at

             FROM conversations cv

             JOIN creators cr ON cr.id = cv.creator_id
             LEFT JOIN crafts cf ON cf.id = cv.craft_id

             LEFT JOIN LATERAL (
                SELECT message, sender_type, created_at
                FROM messages
                WHERE conversation_id = cv.id
                ORDER BY created_at DESC, id DESC
                LIMIT 1
             ) lm ON TRUE

             WHERE cv.customer_id = $1
             ORDER BY COALESCE(lm.created_at, cv.created_at) DESC`,
            [customerId]
        );

        res.json({
            success: true,
            conversations: result.rows
        });

    } catch (error) {
        console.error("Customer conversations error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load customer conversations."
        });
    }
});


// =====================================================
// CREATOR - GET ALL CUSTOMER CONVERSATIONS
// GET /api/chat/creator/:creatorId
// =====================================================

router.get("/creator/:creatorId", async (req, res) => {
    try {
        const { creatorId } = req.params;
        const pool = getPool(req);

        const result = await pool.query(
            `SELECT
                cv.id AS conversation_id,
                cv.customer_id,
                cv.creator_id,
                cv.craft_id,
                cv.created_at,
                cv.updated_at,
                cu.name AS customer_name,
                cu.contact AS customer_contact,
                cf.name AS craft_name,
                cf.category AS craft_category,
                cf.price AS craft_price,
                cf.image AS craft_image,
                lm.message AS last_message,
                lm.sender_type AS last_sender_type,
                lm.created_at AS last_message_at

             FROM conversations cv

             JOIN customers cu ON cu.id = cv.customer_id
             LEFT JOIN crafts cf ON cf.id = cv.craft_id

             LEFT JOIN LATERAL (
                SELECT message, sender_type, created_at
                FROM messages
                WHERE conversation_id = cv.id
                ORDER BY created_at DESC, id DESC
                LIMIT 1
             ) lm ON TRUE

             WHERE cv.creator_id = $1
             ORDER BY COALESCE(lm.created_at, cv.created_at) DESC`,
            [creatorId]
        );

        res.json({
            success: true,
            conversations: result.rows
        });

    } catch (error) {
        console.error("Creator conversations error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load creator conversations."
        });
    }
});


// =====================================================
// GET CONVERSATION MESSAGES
// GET /api/chat/conversations/:conversationId/messages
// =====================================================

router.get("/conversations/:conversationId/messages", async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { customerId, creatorId } = req.query;
        const pool = getPool(req);

        if (!customerId && !creatorId) {
            return res.status(400).json({
                success: false,
                message: "Customer ID or Creator ID is required."
            });
        }

        let participant;

        if (customerId) {
            participant = await pool.query(
                `SELECT id
                 FROM conversations
                 WHERE id = $1 AND customer_id = $2`,
                [conversationId, customerId]
            );
        } else {
            participant = await pool.query(
                `SELECT id
                 FROM conversations
                 WHERE id = $1 AND creator_id = $2`,
                [conversationId, creatorId]
            );
        }

        if (!participant.rows.length) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this conversation."
            });
        }

        const result = await pool.query(
            `SELECT
                id,
                conversation_id,
                sender_type,
                sender_id,
                message,
                is_read,
                created_at
             FROM messages
             WHERE conversation_id = $1
             ORDER BY created_at ASC, id ASC`,
            [conversationId]
        );

        // Mark messages sent by the other participant as read.
        if (customerId) {
            await pool.query(
                `UPDATE messages
                 SET is_read = TRUE
                 WHERE conversation_id = $1
                   AND sender_type = 'creator'
                   AND is_read = FALSE`,
                [conversationId]
            );
        } else {
            await pool.query(
                `UPDATE messages
                 SET is_read = TRUE
                 WHERE conversation_id = $1
                   AND sender_type = 'customer'
                   AND is_read = FALSE`,
                [conversationId]
            );
        }

        res.json({
            success: true,
            messages: result.rows
        });

    } catch (error) {
        console.error("Load messages error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load messages."
        });
    }
});


// =====================================================
// SEND MESSAGE
// POST /api/chat/conversations/:conversationId/messages
// =====================================================

router.post("/conversations/:conversationId/messages", async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { senderType, senderId, message } = req.body;
        const pool = getPool(req);

        if (
            !["customer", "creator"].includes(senderType) ||
            !senderId ||
            !message ||
            !String(message).trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid sender details and message are required."
            });
        }

        const conversation = await pool.query(
            `SELECT id, customer_id, creator_id
             FROM conversations
             WHERE id = $1`,
            [conversationId]
        );

        if (!conversation.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found."
            });
        }

        const chat = conversation.rows[0];

        // Ensure the sender belongs to this conversation.
        const isParticipant =
            senderType === "customer"
                ? Number(senderId) === Number(chat.customer_id)
                : Number(senderId) === Number(chat.creator_id);

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You cannot send messages in this conversation."
            });
        }

        const cleanMessage = String(message).trim();

        if (cleanMessage.length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Message cannot exceed 5000 characters."
            });
        }

        const result = await pool.query(
            `INSERT INTO messages
                (conversation_id, sender_type, sender_id, message)
             VALUES ($1, $2, $3, $4)
             RETURNING
                id,
                conversation_id,
                sender_type,
                sender_id,
                message,
                is_read,
                created_at`,
            [conversationId, senderType, senderId, cleanMessage]
        );

        await pool.query(
            `UPDATE conversations
             SET updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [conversationId]
        );

        res.status(201).json({
            success: true,
            message: "Message sent successfully.",
            chatMessage: result.rows[0]
        });

    } catch (error) {
        console.error("Send message error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to send message."
        });
    }
});


module.exports = router;