const { Pool } = require("pg");
require('dotenv').config()

const pool = new Pool({
    user: "sajal",
    host: "100.79.239.89",
    database: "Code-review",
    password: "12345678",
    port: 5432,
});

module.exports = pool;