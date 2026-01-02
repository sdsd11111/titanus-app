import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
        }

        // Validar tipo (opcional, pero recomendado)
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `campaigns/${timestamp}_${safeName}`;

        const { data, error } = await supabaseAdmin
            .storage
            .from('bot')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (error) {
            console.error("Supabase Storage Error:", error);
            throw error;
        }

        // Obtener URL Pública
        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('bot')
            .getPublicUrl(fileName);

        return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
        console.error("Upload API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
