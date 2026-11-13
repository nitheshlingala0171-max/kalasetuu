require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");
app.use(express.static(path.join(__dirname, "../frotend")));


const app = express();
const PORT = 5000;

// ================= MIDDLEWARE =================

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ================= POSTGRESQL =================

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "kalasetu_db",
    password: "24027cs016",
    port: 5432
});


// Make PostgreSQL pool available to routes
app.locals.pool = pool;


// CUSTOMER ROUTES
const customerRoutes = require("./customerRoutes");
app.use("/api/customers", customerRoutes);

// CREATOR ROUTES
const creatorRoutes = require("./creatorRoutes");
app.use("/api/creators", (req, res, next) => {
    console.log("CREATOR REQUEST:", req.method, req.originalUrl);
    next();
});

app.use("/api/creators", creatorRoutes);
// CHAT ROUTES
const chatRoutes = require("./chatRoutes");
app.use("/api/chat", chatRoutes);
const customCraftRoutes = require("./customCraftRoutes");
app.use("/api/custom-crafts", customCraftRoutes);
// ================= HOME TEST =================

app.get("/", (req, res) => {

    res.send("Kalasetu Backend is Running!");

});


// ================= DATABASE TEST =================

app.get("/db-test", async (req, res) => {

    try {

        const result =
            await pool.query("SELECT NOW()");

        res.json({

            success: true,

            message:
                "PostgreSQL connected successfully!",

            time:
                result.rows[0].now

        });

    } catch (error) {

        console.error(
            "Database connection error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Database connection failed."

        });

    }

});


// ================= START SERVER =================
app.put("/test-stock", (req, res) => {
    console.log("TEST STOCK ROUTE HIT");
    res.json({ success: true });
});
app.listen(PORT, () => {

    console.log(
        `Kalasetu Backend running on http://localhost:${PORT}`
    );

});