const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env.local' });

async function debug() {
    try {
        console.log("Connecting to MySQL...");
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log("--- HEARTBEAT ---");
        const [hb] = await conn.execute('SELECT * FROM configuracion WHERE clave = "bot_heartbeat"');
        console.log(hb);

        console.log("\n--- RECENT LOGS ---");
        const [logs] = await conn.execute('SELECT * FROM cola_mensajes WHERE tipo = "log" ORDER BY fecha_creacion DESC LIMIT 5');
        console.log(logs);

        await conn.end();
    } catch (e) {
        console.error("Error:", e.message);
    }
}

debug();
