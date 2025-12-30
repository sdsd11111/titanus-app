import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Clientes Activos
        const clientesCount = await query("SELECT COUNT(*) FROM clientes WHERE estado = 'activo'");

        // 2. Vencimientos Hoy (Cambiado a 'vencimiento = hoy + 1' según nueva lógica de bot, o mantenemos real)
        // El usuario pidió "Vencimientos Hoy" en el dashboard para información
        const vencimientosHoy = await query("SELECT COUNT(*) FROM clientes WHERE fecha_vencimiento = $1 AND estado = 'activo'", [today]);

        // 3. Cumpleaños Hoy
        const dateParts = today.split('-');
        const cumpleañosHoy = await query(
            "SELECT COUNT(*) FROM clientes WHERE EXTRACT(MONTH FROM fecha_nacimiento) = $1 AND EXTRACT(DAY FROM fecha_nacimiento) = $2 AND estado = 'activo'",
            [parseInt(dateParts[1]), parseInt(dateParts[2])]
        );

        // 4. Mensajes Enviados Total
        const mensajesEnviados = await query("SELECT COUNT(*) FROM cola_mensajes WHERE estado = 'enviado'");

        return NextResponse.json({
            total_clientes: Number(clientesCount.rows[0].count) || 0,
            vencimientos_hoy: Number(vencimientosHoy.rows[0].count) || 0,
            cumpleaños_hoy: Number(cumpleañosHoy.rows[0].count) || 0,
            mensajes_enviados: Number(mensajesEnviados.rows[0].count) || 0
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
