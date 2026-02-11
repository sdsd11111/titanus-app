const mysql = require('mysql2/promise');

async function checkStatus() {
    const conn = await mysql.createConnection({
        host: 'mysql.us.stackcp.com',
        port: 42099,
        user: 'formulariodatos-35303938f38b',
        password: 'kw8ucaxhzk',
        database: 'formulariodatos-35303938f38b'
    });

    console.log("=== ESTADO DEL BOT ===");
    const [configs] = await conn.execute('SELECT * FROM configuracion WHERE clave IN ("bot_heartbeat", "envio_hora")');
    configs.forEach(c => {
        console.log(`${c.clave}: ${c.valor}`);
    });

    console.log("\n=== HORA DEL SISTEMA (DB) ===");
    const [time] = await conn.execute('SELECT NOW() as now');
    console.log(`DB Time: ${time[0].now}`);

    console.log("\n=== COLA DE MENSAJES (PENDIENTES) ===");
    const [queue] = await conn.execute('SELECT * FROM cola_mensajes WHERE estado = "pendiente" LIMIT 5');
    console.log(`Pendientes: ${queue.length}`);
    queue.forEach(m => console.log(`  ${m.telefono}: ${m.mensaje.substring(0, 30)}...`));

    await conn.end();
}

checkStatus();
