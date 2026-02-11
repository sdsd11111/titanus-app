const mysql = require('mysql2/promise');
require('dotenv').config({ path: './dashboard/.env.local' });

async function checkTables() {
    try {
        console.log("Conectando a MySQL...");
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            connectTimeout: 20000
        });

        console.log("Listando tablas:");
        const [rows] = await connection.execute("SHOW TABLES");

        if (rows.length === 0) {
            console.log("No hay tablas en la base de datos.");
        } else {
            rows.forEach(row => {
                console.log("- " + Object.values(row)[0]);
            });
        }

        await connection.end();
    } catch (error) {
        console.error("Error conectando a MySQL:", error.message);
    }
}

checkTables();
