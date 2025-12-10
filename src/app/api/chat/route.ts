import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
    try {
        const { message, financialContext } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Check if API key is configured
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                error: 'API key not configured',
                response: 'Lo siento, el servicio de IA no está configurado correctamente. Por favor, configura tu GEMINI_API_KEY en el archivo .env.local'
            }, { status: 200 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-2.0-flash as verified from available models list
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Build context-aware prompt
        const systemPrompt = `Eres un asistente financiero personal experto llamado "FinTrack AI". 
Tu objetivo es ayudar al usuario a gestionar sus finanzas personales de manera inteligente.

CONTEXTO FINANCIERO DEL USUARIO:
${financialContext ? JSON.stringify(financialContext, null, 2) : 'No hay datos disponibles'}

INSTRUCCIONES:
- Analiza los datos financieros del usuario cuando sea relevante
- Da recomendaciones personalizadas basadas en sus gastos y ahorros
- Sé conciso pero útil (máximo 3-4 párrafos)
- Usa emojis ocasionalmente para hacer la conversación más amigable
- Si detectas patrones de gasto preocupantes, menciónalos con tacto
- Sugiere formas de ahorrar o mejorar la situación financiera
- Habla en español de manera natural y cercana
- Si no tienes suficiente información, pide más detalles

PREGUNTA DEL USUARIO:
${message}`;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ response: text });
    } catch (error: any) {
        console.error('Error calling Gemini API:', error);

        // Return a user-friendly error message
        return NextResponse.json({
            response: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo. Si el problema persiste, verifica que tu API key de Gemini esté configurada correctamente.',
            error: error.message
        }, { status: 200 });
    }
}
