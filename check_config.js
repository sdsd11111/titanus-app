const mysql = require('mysql2/promise');

async function checkConfig() {
    const conn = await mysql.createConnection({
        host: 'mysql.us.stackcp.com',
        port: 42099,
        user: 'formulariodatos-35303938f38b',
        password: 'kw8ucaxhzk',
        database: 'formulariodatos-35303938f38b'
    });

    const [rows] = await conn.execute('SELECT clave, valor FROM configuracion WHERE clave IN ("envio_hora", "bot_heartbeat")');
    console.log(JSON.stringify(rows, null, 2));

    await conn.end();
}

checkConfig();
