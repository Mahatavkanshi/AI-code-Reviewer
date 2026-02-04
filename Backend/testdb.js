const pool = require("./db");

pool.query("SELECT NOW()", (err, result) => {
    if (err) {
        console.error("❌ Database connection error:", err);
    } else {
        console.log("✅ Database connected at:", result.rows[0]);
    }
});