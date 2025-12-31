import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { phoneNumber, message } = await request.json();

        if (!phoneNumber || !message) {
            return NextResponse.json(
                { error: 'Phone number and message are required' },
                { status: 400 }
            );
        }

        const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://129.153.116.213:8080';
        const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
        const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'gym_bot';

        // Clean phone number (remove spaces, dashes, etc.)
        const cleanNumber = phoneNumber.replace(/\D/g, '');

        const response = await fetch(
            `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY || ''
                },
                body: JSON.stringify({
                    number: cleanNumber,
                    text: message
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to send message');
        }

        return NextResponse.json({
            success: true,
            message: 'Message sent successfully',
            data: data
        });
    } catch (error: any) {
        console.error('Error sending test message:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to send message'
        }, { status: 500 });
    }
}
