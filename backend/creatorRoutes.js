console.log("CREATOR ROUTES LOADED");
const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

const getPool = req => req.app.locals.pool;

// =====================================================
// CREATOR REGISTRATION
// POST /api/creators/register
// =====================================================

router.post("/register", async (req, res) => {
    try {
        const { name, contact, craft, password } = req.body;
        const pool = getPool(req);

        if (!name || !contact || !craft || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters."
            });
        }

        const existing = await pool.query(
            "SELECT id FROM creators WHERE contact = $1",
            [String(contact).trim()]
        );

        if (existing.rows.length) {
            return res.status(409).json({
                success: false,
                message: "Creator account already exists."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO creators
             (name, contact, craft_type, status, password_hash)
             VALUES ($1, $2, $3, 'Not Submitted', $4)
             RETURNING id, name, contact, craft_type, status`,
            [
                String(name).trim(),
                String(contact).trim(),
                String(craft).trim(),
                passwordHash
            ]
        );

        res.status(201).json({
            success: true,
            message: "Creator registered successfully.",
            creator: result.rows[0]
        });

    } catch (error) {
        console.error("Creator registration error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while registering creator."
        });
    }
});


// =====================================================
// CREATOR LOGIN
// POST /api/creators/login
// =====================================================

router.post("/login", async (req, res) => {
    try {
        const { contact, password } = req.body;
        const pool = getPool(req);

        if (!contact || !password) {
            return res.status(400).json({
                success: false,
                message: "Enter your contact and password."
            });
        }

        const result = await pool.query(
            `SELECT id, name, contact, craft_type, status, password_hash
             FROM creators
             WHERE contact = $1`,
            [String(contact).trim()]
        );

        if (!result.rows.length) {
            return res.status(401).json({
                success: false,
                message: "Creator account not found."
            });
        }

        const creator = result.rows[0];

        if (!creator.password_hash) {
            return res.status(401).json({
                success: false,
                message: "Please contact support to reset your creator account."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            creator.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password."
            });
        }

        res.json({
            success: true,
            message: "Creator login successful.",
            creator: {
                id: creator.id,
                name: creator.name,
                contact: creator.contact,
                craft: creator.craft_type,
                status: creator.status
            }
        });

    } catch (error) {
        console.error("Creator login error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while logging in."
        });
    }
});


// =====================================================
// CREATOR VERIFICATION SUBMISSION
// POST /api/creators/verification
// =====================================================

router.post("/verification", async (req, res) => {
    try {
        const {
            creatorId,
            craftType,
            location,
            experience,
            photo
        } = req.body;

        const pool = getPool(req);

        if (!creatorId || !craftType || !location || !experience) {
            return res.status(400).json({
                success: false,
                message: "Please complete all verification details."
            });
        }

        const creator = await pool.query(
            "SELECT id, status FROM creators WHERE id = $1",
            [creatorId]
        );

        if (!creator.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Creator account not found."
            });
        }

        if (creator.rows[0].status === "Approved") {
            return res.status(400).json({
                success: false,
                message: "Your creator account is already approved."
            });
        }

        const result = await pool.query(
            `UPDATE creators
             SET craft_type = $1,
                 location = $2,
                 experience = $3,
                 craft_photo = $4,
                 status = 'Pending',
                 submitted_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING id, name, contact, craft_type, location,
                       experience, craft_photo, status, submitted_at`,
            [
                String(craftType).trim(),
                String(location).trim(),
                String(experience).trim(),
                photo || null,
                creatorId
            ]
        );

        res.json({
            success: true,
            message: "Verification submitted successfully.",
            creator: result.rows[0]
        });

    } catch (error) {
        console.error("Creator verification error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while submitting verification."
        });
    }
});


// =====================================================
// GET CREATOR VERIFICATION STATUS
// GET /api/creators/verification/:creatorId
// =====================================================

router.get("/verification/:creatorId", async (req, res) => {
    try {
        const pool = getPool(req);

        const result = await pool.query(
            `SELECT id, name, contact, craft_type, location,
                    experience, craft_photo, status, submitted_at
             FROM creators
             WHERE id = $1`,
            [req.params.creatorId]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Creator not found."
            });
        }

        res.json({
            success: true,
            creator: result.rows[0]
        });

    } catch (error) {
        console.error("Verification status error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load verification status."
        });
    }
});


// =====================================================
// ADMIN - GET ALL CREATOR VERIFICATIONS
// GET /api/creators/admin/creators
// =====================================================

router.get("/admin/creators", async (req, res) => {
    try {
        const pool = getPool(req);

        const result = await pool.query(
            `SELECT id, name, contact, craft_type, location,
                    experience, craft_photo, status, submitted_at
             FROM creators
             ORDER BY submitted_at DESC NULLS LAST, id DESC`
        );

        res.json({
            success: true,
            creators: result.rows
        });

    } catch (error) {
        console.error("Admin creator loading error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load creators."
        });
    }
});


// =====================================================
// ADMIN - APPROVE OR REJECT CREATOR
// PUT /api/creators/admin/creators/:creatorId/status
// =====================================================

router.put("/admin/creators/:creatorId/status", async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ["Approved", "Rejected", "Pending"];
        const pool = getPool(req);

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid creator status."
            });
        }

        const result = await pool.query(
            `UPDATE creators
             SET status = $1
             WHERE id = $2
             RETURNING id, name, contact, craft_type, status`,
            [status, req.params.creatorId]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Creator not found."
            });
        }

        res.json({
            success: true,
            message: "Creator status updated successfully.",
            creator: result.rows[0]
        });

    } catch (error) {
        console.error("Creator status update error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update creator status."
        });
    }
});


// =====================================================
// CREATOR - GET OWN CRAFTS
// GET /api/creators/crafts/:creatorId
// =====================================================

router.get("/crafts/:creatorId", async (req, res) => {
    try {
        const pool = getPool(req);

        const result = await pool.query(
            `SELECT id, creator_id, name, category, price, story,
                    image, status, created_at, creator_price,
                    materials, packaging, platform_services,stock_status
             FROM crafts
             WHERE creator_id = $1
             ORDER BY created_at DESC`,
            [req.params.creatorId]
        );

        res.json({
            success: true,
            crafts: result.rows
        });

    } catch (error) {
        console.error("Creator crafts loading error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load creator crafts."
        });
    }
});


// =====================================================
// CREATOR - ADD CRAFT
// POST /api/creators/crafts
// =====================================================

router.post("/crafts", async (req, res) => {
    try {
        const {
            creatorId,
            name,
            category,
            price,
            story,
            image,
            creatorPrice,
            materials,
            packaging,
            platformServices
        } = req.body;

        const pool = getPool(req);

        if (!creatorId || !name || !category || !image) {
            return res.status(400).json({
                success: false,
                message: "Please provide craft name, category and image."
            });
        }

        const values = [
            Number(creatorPrice) || 0,
            Number(materials) || 0,
            Number(packaging) || 0,
            Number(platformServices) || 0
        ];

        if (values.some(value => !Number.isFinite(value) || value < 0)) {
            return res.status(400).json({
                success: false,
                message: "Price values must be valid non-negative numbers."
            });
        }

        const total = values.reduce((sum, value) => sum + value, 0);

        const creator = await pool.query(
            "SELECT id, status FROM creators WHERE id = $1",
            [creatorId]
        );

        if (!creator.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Creator account not found."
            });
        }

        if (creator.rows[0].status !== "Approved") {
            return res.status(403).json({
                success: false,
                message: "Your creator account must be approved before uploading crafts."
            });
        }

        const result = await pool.query(
            `INSERT INTO crafts
             (creator_id, name, category, price, story, image, status,
              creator_price, materials, packaging, platform_services)
             VALUES ($1,$2,$3,$4,$5,$6,'Under Review',$7,$8,$9,$10)
             RETURNING *`,
            [
                creatorId,
                String(name).trim(),
                String(category).trim(),
                total,
                story || "",
                image,
                ...values
            ]
        );

        res.status(201).json({
            success: true,
            message: "Craft uploaded successfully. It is under review.",
            craft: result.rows[0]
        });

    } catch (error) {
        console.error("Add craft error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while uploading craft."
        });
    }
});


// =====================================================
// CREATOR - UPDATE OWN CRAFT
// PUT /api/creators/crafts/:craftId
// =====================================================

router.put("/crafts/:craftId", async (req, res) => {
     console.log("STOCK ROUTE HIT");
    try {
        const {
            creatorId,
            name,
            category,
            story,
            image,
            creatorPrice,
            materials,
            packaging,
            platformServices
        } = req.body;

        const pool = getPool(req);

        if (!creatorId || !name || !category) {
            return res.status(400).json({
                success: false,
                message: "Missing craft details."
            });
        }

        const values = [
            Number(creatorPrice) || 0,
            Number(materials) || 0,
            Number(packaging) || 0,
            Number(platformServices) || 0
        ];

        if (values.some(value => !Number.isFinite(value) || value < 0)) {
            return res.status(400).json({
                success: false,
                message: "Invalid price breakdown."
            });
        }

        const total = values.reduce((sum, value) => sum + value, 0);

        const result = await pool.query(
            `UPDATE crafts
             SET name = $1,
                 category = $2,
                 price = $3,
                 story = $4,
                 image = COALESCE($5, image),
                 creator_price = $6,
                 materials = $7,
                 packaging = $8,
                 platform_services = $9,
                 status = 'Under Review'
             WHERE id = $10 AND creator_id = $11
             RETURNING *`,
            [
                String(name).trim(),
                String(category).trim(),
                total,
                story || "",
                image || null,
                ...values,
                req.params.craftId,
                creatorId
            ]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Craft not found for this creator."
            });
        }

        res.json({
            success: true,
            message: "Craft updated successfully.",
            craft: result.rows[0]
        });

    } catch (error) {
        console.error("Update craft error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update craft."
        });
    }
});


// =====================================================
// CREATOR - DELETE OWN CRAFT
// DELETE /api/creators/crafts/:craftId
// =====================================================

router.delete("/crafts/:craftId", async (req, res) => {
    try {
        const { creatorId } = req.body;
        const pool = getPool(req);

        if (!creatorId) {
            return res.status(400).json({
                success: false,
                message: "Creator ID is required."
            });
        }

        const result = await pool.query(
            `DELETE FROM crafts
             WHERE id = $1 AND creator_id = $2
             RETURNING id`,
            [req.params.craftId, creatorId]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Craft not found."
            });
        }

        res.json({
            success: true,
            message: "Craft deleted successfully."
        });

    } catch (error) {
        console.error("Delete craft error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to delete craft."
        });
    }
});

// =====================================================
// CREATOR - UPDATE CRAFT STOCK
// PUT /api/creators/crafts/:craftId/stock
// =====================================================

router.put("/crafts/:craftId/stock", async (req, res) => {
    try {
        const { creatorId, stockStatus } = req.body;
        const pool = getPool(req);

        const allowedStatuses = ["In Stock", "Out of Stock"];

        if (!creatorId || !allowedStatuses.includes(stockStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid stock details."
            });
        }

        const result = await pool.query(
            `UPDATE crafts
             SET stock_status = $1
             WHERE id = $2 AND creator_id = $3
             RETURNING id, stock_status`,
            [stockStatus, req.params.craftId, creatorId]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Craft not found."
            });
        }

        res.json({
            success: true,
            message: "Stock updated successfully.",
            craft: result.rows[0]
        });

    } catch (error) {
        console.error("Stock update error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update stock."
        });
    }
});

// =====================================================
// ADMIN - GET ALL CRAFTS
// GET /api/creators/admin/crafts
// =====================================================

router.get("/admin/crafts", async (req, res) => {
    try {
        const pool = getPool(req);

        const result = await pool.query(
            `SELECT
                c.id,
                c.creator_id,
                c.name,
                c.category,
                c.price,
                c.story,
                c.image,
                c.status,
                c.created_at,
                c.stock_status,
                cr.name AS creator_name
             FROM crafts c
             LEFT JOIN creators cr ON cr.id = c.creator_id
             ORDER BY c.created_at DESC, c.id DESC`
        );

        res.json({
            success: true,
            crafts: result.rows
        });

    } catch (error) {
        console.error("Admin crafts loading error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load crafts."
        });
    }
});


// =====================================================
// ADMIN - APPROVE OR REJECT CRAFT
// PUT /api/creators/admin/crafts/:craftId/status
// =====================================================

router.put("/admin/crafts/:craftId/status", async (req, res) => {
    try {
        const { status } = req.body;
        const pool = getPool(req);

        const allowedStatuses = [
            "Approved",
            "Rejected",
            "Under Review"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid craft status."
            });
        }

        const result = await pool.query(
            `UPDATE crafts
             SET status = $1
             WHERE id = $2
             RETURNING *`,
            [status, req.params.craftId]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Craft not found."
            });
        }

        res.json({
            success: true,
            message: "Craft status updated successfully.",
            craft: result.rows[0]
        });

    } catch (error) {
        console.error("Admin craft status update error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update craft status."
        });
    }
});

module.exports = router;
