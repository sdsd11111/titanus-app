import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

async function fetchQrCode() {
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://129.153.116.213:8080';
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
    const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'gym_bot';

    const response = await fetch(
        `${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE_NAME}`,
        {
            headers: {
                'apikey': EVOLUTION_API_KEY || ''
            }
        }
    );

    const data = await response.json();

    if (data.code) {
        // The 'code' is the QR data string, not base64 image
        // We need to generate the QR image from this string
        try {
            const qrImageBuffer = await QRCode.toBuffer(data.code, {
                type: 'png',
                width: 512,
                margin: 2
            });

            return new Response(qrImageBuffer, {
                status: 200,
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'no-store',
                }
            });
        } catch (qrError) {
            console.error('QR Generation Error:', qrError);
            return NextResponse.json({
                success: false,
                error: 'Failed to generate QR image'
            }, { status: 500 });
        }
    } else {
        return NextResponse.json({
            success: false,
            error: data.message || 'No QR code available.'
        }, { status: 400 });
    }
}

export async function POST() {
    try {
        return await fetchQrCode();
    } catch (error: any) {
        console.error('Error fetching QR code:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch QR code'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        return await fetchQrCode();
    } catch (error: any) {
        console.error('Error fetching QR code:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch QR code'
        }, { status: 500 });
    }
}
