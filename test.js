const { Pool } = require('pg');

const pool = new Pool({
    host: '129.153.116.213',
    port: 5432,
    user: 'evolution',
    password: 'evolution',
    database: 'evolution',
    connectionTimeoutMillis: 5000
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('ERROR:', err.message);
    } else {
        console.log('SUCCESS:', res.rows[0]);
    }
    pool.end();
});
