const mysql = require('mysql2/promise');

async function checkConfigExact() {
    const conn = await mysql.createConnection({
        host: 'mysql.us.stackcp.com',
        port: 42099,
        user: 'formulariodatos-35303938f38b',
        password: 'kw8ucaxhzk',
        database: 'formulariodatos-35303938f38b'
    });

    const [rows] = await conn.execute('SELECT clave, valor FROM configuracion WHERE clave IN ("envio_hora", "bot_heartbeat")');
    console.log("=== CONFIGURACIÓN DB ===");
    rows.forEach(r => console.log(`${r.clave} = "${r.valor}"`));

    const [time] = await conn.execute('SELECT DATE_FORMAT(NOW(), "%Y-%m-%d %H:%i:%s") as now_ec');
    console.log(`DB Time (UTC): ${time[0].now_ec}`); // Actually DB is likely UTC, bot converts to EC

    await conn.end();
}

checkConfigExact();
