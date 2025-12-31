import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const [year, month, day] = today.split('-');

        // 1. Clientes Activos
        const { count: clientesCount, error: errorClientes } = await supabaseAdmin
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'activo');

        if (errorClientes) throw errorClientes;

        // 2. Vencimientos Hoy
        const { count: vencimientosHoy, error: errorVencimientos } = await supabaseAdmin
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .eq('fecha_vencimiento', today)
            .eq('estado', 'activo');

        if (errorVencimientos) throw errorVencimientos;

        // 3. Cumpleaños Hoy (Supabase no tiene EXTRACT directo fácil en JS, usamos filtro de rango o RPC si fuera complejo, pero aquí podemos traer los de hoy si la fecha coincide en dia/mes)
        // Nota: Filtrar por día/mes exacto en Supabase JS client es complejo sin RPC.
        // Solución alternativa eficiente: Traer todos los activos y filtrar en memoria (si son pocos) O usar una función de base de datos.
        // Para mantener JS puro: Usaremos una query simple o RPC si existe.
        // Dado que migramos de SQL puro, lo mejor es crear un RPC 'get_birthdays' o filtrar en cliente si son < 1000.
        // Vamos a asumir volumen bajo por ahora y traer campos necesarios.

        // OPCIÓN MEJORADA: RPC call (pero requiere crear función).
        // OPCIÓN RÁPIDA (JS Filter):
        const { data: allClients, error: errorCumple } = await supabaseAdmin
            .from('clientes')
            .select('fecha_nacimiento')
            .eq('estado', 'activo');

        if (errorCumple) throw errorCumple;

        const cumpleañosHoyCount = allClients?.filter(c => {
            if (!c.fecha_nacimiento) return false;
            const d = new Date(c.fecha_nacimiento);
            // Ajustar zona horaria si es necesario, pero asumiendo string YYYY-MM-DD directo
            const nacMonth = parseInt(c.fecha_nacimiento.split('-')[1]);
            const nacDay = parseInt(c.fecha_nacimiento.split('-')[2]);
            return nacMonth === parseInt(month) && nacDay === parseInt(day);
        }).length || 0;


        // 4. Mensajes Enviados Total
        const { count: mensajesEnviados, error: errorMensajes } = await supabaseAdmin
            .from('cola_mensajes')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'enviado');

        if (errorMensajes) throw errorMensajes;

        // 5. Bot Heartbeat
        const { data: hbData } = await supabaseAdmin
            .from('configuracion')
            .select('valor')
            .eq('clave', 'bot_heartbeat')
            .single();

        return NextResponse.json({
            total_clientes: clientesCount || 0,
            vencimientos_hoy: vencimientosHoy || 0,
            cumpleaños_hoy: cumpleañosHoyCount,
            mensajes_enviados: mensajesEnviados || 0,
            bot_heartbeat: hbData?.valor || null
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
