import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // Credenciales Spartan
        if (username === "Titanus Gym" && password === "Contraseña123.") {
            const secret = process.env.DASHBOARD_SECRET || "spartan_fortress_2025_titanus_gym";
            const salt = Math.random().toString(36).substring(7);

            // Generar token firmado
            const token = Buffer.from(`${username}:${salt}:${secret}`).toString('base64');

            return NextResponse.json({ success: true, token });
        }

        return NextResponse.json({ success: false, error: "Credenciales Incorrectas" }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Error de servidor" }, { status: 500 });
    }
}
