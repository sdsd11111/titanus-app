import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

export async function GET() {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const todayStr = today.toISOString().split('T')[0];

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

        // 3. Cumpleaños Hoy
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

        // 5. Bot Heartbeat
        const [hbResult]: any = await pool.query(
            "SELECT valor FROM configuracion WHERE clave = 'bot_heartbeat'"
        );
        const hbData = hbResult[0];

        return NextResponse.json({
            total_clientes: clientesCount || 0,
            vencimientos_hoy: vencimientosHoy || 0,
            cumpleaños_hoy: cumpleañosHoyCount || 0,
            mensajes_enviados: mensajesEnviados || 0,
            bot_heartbeat: hbData?.valor || null
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
