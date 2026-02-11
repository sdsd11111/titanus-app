import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

export async function GET() {
    try {
        // Usar hora de Ecuador (UTC-5)
        const now = new Date();
        const ecuadorTime = new Date(now.getTime() - (5 * 60 * 60 * 1000));
        const year = ecuadorTime.getFullYear();
        const month = ecuadorTime.getMonth() + 1;
        const day = ecuadorTime.getDate();
        const todayStr = ecuadorTime.toISOString().split('T')[0];

        // 1. Clientes Activos
        const [clientesResult]: any = await pool.query(
            "SELECT COUNT(*) as count FROM clientes WHERE estado = 'activo' OR estado IS NULL"
        );
        const clientesCount = clientesResult[0].count;

        // 2. Vencimientos Hoy
        const [vencimientosResult]: any = await pool.query(
            "SELECT COUNT(*) as count FROM clientes WHERE fecha_vencimiento = ? AND (estado = 'activo' OR estado IS NULL)",
            [todayStr]
        );
        const vencimientosHoy = vencimientosResult[0].count;

        // 3. Cumpleaños Hoy (usando hora de Ecuador)
        const [cumpleResult]: any = await pool.query(
            "SELECT COUNT(*) as count FROM clientes WHERE MONTH(fecha_nacimiento) = ? AND DAY(fecha_nacimiento) = ? AND (estado = 'activo' OR estado IS NULL)",
            [month, day]
        );
        const cumpleañosHoyCount = cumpleResult[0].count;

        // 4. Mensajes Enviados Total
        const [mensajesResult]: any = await pool.query(
            "SELECT COUNT(*) as count FROM cola_mensajes WHERE estado = 'enviado'"
        );
        const mensajesEnviados = mensajesResult[0].count;

        // 5. Bot Heartbeat y diferencia de tiempo (para evitar drift de relojes)
        const [hbResult]: any = await pool.query(
            "SELECT valor, TIMESTAMPDIFF(SECOND, valor, NOW()) as seconds_diff FROM configuracion WHERE clave = 'bot_heartbeat'"
        );
        const hbData = hbResult[0];

        return NextResponse.json({
            total_clientes: clientesCount || 0,
            vencimientos_hoy: vencimientosHoy || 0,
            cumpleaños_hoy: cumpleañosHoyCount || 0,
            mensajes_enviados: mensajesEnviados || 0,
            bot_heartbeat: hbData?.valor ? `${hbData.valor}-05:00` : null,
            seconds_since_heartbeat: hbData?.seconds_diff ?? 999999
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
