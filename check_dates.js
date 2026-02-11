const mysql = require('mysql2/promise');

async function checkDates() {
    const conn = await mysql.createConnection({
        host: 'mysql.us.stackcp.com',
        port: 42099,
        user: 'formulariodatos-35303938f38b',
        password: 'kw8ucaxhzk',
        database: 'formulariodatos-35303938f38b'
    });

    console.log("=== VERIFICANDO FECHAS DE NACIMIENTO ===\n");
    const [rows] = await conn.execute('SELECT nombre, telefono, fecha_nacimiento FROM clientes');
    rows.forEach(r => {
        console.log(`${r.nombre}: ${r.fecha_nacimiento}`);
    });

    await conn.end();
}

checkDates();
