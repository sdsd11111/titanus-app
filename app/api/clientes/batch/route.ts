import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Helper to clean phone numbers (handles scientific notation and strings)
function cleanPhoneNumber(phone: any): string {
    if (!phone) return '';
    let phoneStr = String(phone).trim();

    // Handle scientific notation e.g. "5.93967E+11" or "5,93967E+11"
    if (phoneStr.toUpperCase().includes('E+')) {
        // Try parsing as float first to expand it
        try {
            // Replace comma with dot for JS float parsing if present
            const normalized = phoneStr.replace(',', '.');
            const num = parseFloat(normalized);
            if (!isNaN(num)) {
                // expanding: 5.93967E+11 -> 593967000000
                phoneStr = num.toLocaleString('fullwide', { useGrouping: false });
            }
        } catch (e) {
            console.warn('Failed to parse scientific notation phone:', phoneStr);
        }
    }

    // Remove anything that is not a digit
    phoneStr = phoneStr.replace(/\D/g, '');

    return phoneStr;
}

// Convert Excel serial number or verify date string
function parseDate(input: any): string | null {
    if (!input) return null;

    // Case 1: Already YYYY-MM-DD
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
        return input;
    }

    // Case 2: DD/MM/YYYY or D/M/YYYY
    if (typeof input === 'string' && input.includes('/')) {
        const parts = input.split('/'); // 31/12/1990
        if (parts.length === 3) {
            // Check if it's DD/MM/YYYY or MM/DD/YYYY? Assuming DD/MM/YYYY based on user input
            let day = parseInt(parts[0]);
            let month = parseInt(parts[1]);
            let year = parseInt(parts[2]);

            // Fix 2-digit years if necessary (though usually 4)
            if (year < 100) year += 2000;

            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }
    }

    // Case 3: Excel Serial Number
    const serialNum = Number(input);
    if (!isNaN(serialNum) && serialNum > 20000) { // arbitrary check to ensure it looks like a recent-ish serial date
        // Excel epoch starts at December 30, 1899
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + serialNum * 86400000); // 86400000 ms per day

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    return null;
}

export async function POST(request: Request) {
    try {
        const rawBody = await request.json();

        // 1. Validar input
        if (!Array.isArray(rawBody)) {
            return NextResponse.json({ error: "Formato inválido. Se espera un array de clientes." }, { status: 400 });
        }

        // 2. Preprocesar y Deduplicar
        const uniqueClients = new Map<string, any>();

        for (const client of rawBody) {
            const cleanPhone = cleanPhoneNumber(client.telefono);

            // Skip rows without valid phone
            if (!cleanPhone || cleanPhone.length < 5) continue;

            const processedClient = {
                telefono: cleanPhone, // Unique Key
                nombre: client.nombre ? String(client.nombre).trim() : 'Sin Nombre',
                fecha_vencimiento: parseDate(client.fecha_vencimiento),
                fecha_nacimiento: parseDate(client.fecha_nacimiento),
                estado: 'activo',
                deuda: client.deuda ? Number(client.deuda) : 0,
                inasistencias: client.inasistencias ? Number(client.inasistencias) : 0
            };

            // If duplicate exists, overwrite with the latest one (or stick with first? User's CSV suggests multiple rows for same phone. We keep LAST seen to update.)
            uniqueClients.set(cleanPhone, processedClient);
        }

        const clientsToUpsert = Array.from(uniqueClients.values());

        if (clientsToUpsert.length === 0) {
            return NextResponse.json({
                message: "No se encontraron clientes válidos para procesar.",
                stats: { total: 0, inserted_or_updated: 0, errors: 0 }
            });
        }

        console.log(`Processing batch: ${rawBody.length} rows -> ${clientsToUpsert.length} unique clients`);

        // 3. Upsert
        const { data, error } = await supabaseAdmin
            .from('clientes')
            .upsert(clientsToUpsert, { onConflict: 'telefono', ignoreDuplicates: false })
            .select();

        if (error) {
            console.error("Supabase Batch Upsert Error:", error);
            throw new Error(error.message);
        }

        // Calcular estadísticas
        // Si data es vacío (puede pasar en upsert si no cambia nada a veces), asumimos éxito basado en input
        const totalProcessed = data && data.length > 0 ? data.length : clientsToUpsert.length;

        return NextResponse.json({
            message: "Carga masiva completada exitosamente",
            stats: {
                total: rawBody.length,
                inserted_or_updated: totalProcessed,
                errors: 0
            }
        });

    } catch (error: any) {
        console.error("Batch Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
