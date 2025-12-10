import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

// Initialize Gemini AI
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export interface TransactionData {
    amount: number;
    category: string;
    description: string;
    type: 'expense' | 'income';
    accountName?: string;
}

/**
 * Process audio from microphone and extract transaction data
 */
export async function processAudioTransaction(audioBlob: Blob, availableAccounts: string[] = []): Promise<TransactionData> {
    try {
        if (!apiKey) throw new Error('API Key de Gemini no configurada');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Convert blob to base64
        const audioBase64 = await blobToBase64(audioBlob);

        const accountsString = availableAccounts.length > 0 ? availableAccounts.join(', ') : 'Efectivo';

        const prompt = `Eres un asistente financiero. Analiza el siguiente audio y extrae la información de una transacción financiera.
    
Debes identificar:
- Monto (amount): número sin símbolos
- Categoría (category): Clasifica EXACTAMENTE en una de estas: "Comida", "Transporte", "Hogar", "Entretenimiento", "Salud", "Compras", "Servicios", "Viajes", "Educación", "Inversiones", "Salario", u "Otros".
- Descripción (description): breve descripción de la transacción
- Tipo (type): "expense" (gasto) o "income" (ingreso)
- Cuenta (accountName): Identifica si se menciona alguna de estas cuentas: [${accountsString}]. Si se menciona una, úsala EXACTAMENTE como está escrita. Si no se menciona ninguna o no estás seguro, usa "Efectivo".

Responde SOLO con un JSON válido en este formato exacto:
{
  "amount": 50000,
  "category": "Comida",
  "description": "Compra en supermercado",
  "type": "expense",
  "accountName": "Bancolombia"
}`;

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: audioBlob.type,
                    data: audioBase64.split(',')[1]
                }
            },
            { text: prompt }
        ]);

        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No se pudo extraer información del audio');
        }

        const transactionData = JSON.parse(jsonMatch[0]);
        return transactionData;
    } catch (error: any) {
        console.error('Error processing audio:', error);
        throw new Error(`Error al procesar el audio: ${error.message || 'Intenta de nuevo'}`);
    }
}

/**
 * Process image from camera and extract transaction data
 */
export async function processImageTransaction(imageBlob: Blob, availableAccounts: string[] = []): Promise<TransactionData> {
    try {
        if (!apiKey) throw new Error('API Key de Gemini no configurada');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Convert blob to base64
        const imageBase64 = await blobToBase64(imageBlob);

        const accountsString = availableAccounts.length > 0 ? availableAccounts.join(', ') : 'Efectivo';

        const prompt = `Eres un asistente financiero. Analiza la siguiente imagen (puede ser una factura, recibo o captura de pantalla) y extrae la información de la transacción.

Debes identificar:
- Monto (amount): el valor total de la transacción, solo el número sin símbolos
- Categoría (category): Clasifica EXACTAMENTE en una de estas: "Comida", "Transporte", "Hogar", "Entretenimiento", "Salud", "Compras", "Servicios", "Viajes", "Educación", "Inversiones", "Salario", u "Otros".
- Descripción (description): nombre del comercio o descripción breve
- Tipo (type): "expense" (gasto) o "income" (ingreso)
- Cuenta (accountName): Identifica si se menciona alguna de estas cuentas: [${accountsString}]. Si se menciona una, úsala EXACTAMENTE como está escrita. Si no se menciona ninguna o no estás seguro, usa "Efectivo".

Responde SOLO con un JSON válido en este formato exacto:
{
  "amount": 50000,
  "category": "Comida",
  "description": "Compra en D1",
  "type": "expense",
  "accountName": "Efectivo"
}`;

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: imageBlob.type,
                    data: imageBase64.split(',')[1]
                }
            },
            { text: prompt }
        ]);

        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No se pudo extraer información de la imagen');
        }

        const transactionData = JSON.parse(jsonMatch[0]);
        return transactionData;
    } catch (error) {
        console.error('Error processing image:', error);
        throw new Error('Error al procesar la imagen. Por favor, intenta de nuevo.');
    }
}

/**
 * Convert Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export interface OnboardingData {
    accounts: {
        name: string;
        type: 'bank' | 'cash' | 'credit' | 'investment';
        balance: number;
        currency: string;
    }[];
    categories: {
        name: string;
        budget?: number;
        icon?: string;
    }[];
    goals: {
        name: string;
        targetAmount: number;
        deadline?: string; // YYYY-MM-DD
    }[];
    userProfile: {
        name: string;
        financialPersona: string; // e.g., "Ahorrador agresivo", "Gastador impulsivo"
        advice: string;
    };
}

export async function generateOnboardingPlan(userInput: string): Promise<OnboardingData> {
    try {
        if (!apiKey) throw new Error('API Key de Gemini no configurada');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `Eres un arquitecto financiero experto. El usuario te contará su situación financiera y tú debes estructurarla en datos para la app.

Entrada del usuario: "${userInput}"

Tu tarea:
1. Identifica todas las cuentas (bancos, efectivo, tarjetas) y sus saldos aproximados.
2. Identifica las categorías de gasto principales y sugiere un presupuesto mensual estimado para cada una (si no se menciona, infiérelo basado en el perfil).
3. Identifica metas financieras.
4. Crea un perfil del usuario y dale un consejo inicial.

Responde SOLO con un JSON válido en este formato exacto:
{
  "accounts": [
    { "name": "Bancolombia", "type": "bank", "balance": 2000000, "currency": "COP" }
  ],
  "categories": [
    { "name": "Restaurantes", "budget": 500000, "icon": "🍽️" }
  ],
  "goals": [
    { "name": "Viaje a Japón", "targetAmount": 10000000, "deadline": "2025-12-01" }
  ],
  "userProfile": {
    "name": "Sebas",
    "financialPersona": "Viajero Ambicioso",
    "advice": "Para llegar a Japón, necesitas ahorrar 1M mensual. Reduce restaurantes."
  }
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No se pudo generar el plan financiero');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error generating onboarding plan:', error);
        throw new Error('Error al generar el plan. Intenta ser más específico.');
    }
}

/**
 * Transcribe audio to text using Gemini
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
        if (!apiKey) throw new Error('API Key de Gemini no configurada');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const audioBase64 = await blobToBase64(audioBlob);

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: audioBlob.type,
                    data: audioBase64.split(',')[1]
                }
            },
            { text: "Transcribe el siguiente audio a texto exactamente como fue dicho. Solo devuelve el texto, sin comentarios adicionales." }
        ]);

        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error transcribing audio:', error);
        throw new Error('Error al transcribir el audio.');
    }
}

/**
 * Fetch financial context from Supabase
 */
async function getFinancialContext(userId: string) {
    try {
        const [accounts, transactions, subscriptions] = await Promise.all([
            supabase.from('accounts').select('*').eq('owner_user_id', userId),
            supabase.from('transactions').select('*').eq('created_by', userId).order('date', { ascending: false }).limit(10),
            supabase.from('subscriptions').select('*').eq('owner_user_id', userId)
        ]);

        return {
            accounts: accounts.data || [],
            transactions: transactions.data || [],
            subscriptions: subscriptions.data || []
        };
    } catch (error) {
        console.error('Error fetching financial context:', error);
        return null;
    }
}

/**
 * Chat with Gemini using financial context
 */
export async function chatWithGemini(message: string, userId: string) {
    try {
        if (!apiKey) throw new Error('API Key de Gemini no configurada');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Fetch real data
        const context = await getFinancialContext(userId);

        const systemPrompt = `Eres FinTrack AI, un asistente financiero personal experto, amable y proactivo.
        
CONTEXTO FINANCIERO DEL USUARIO (Datos Reales):
${JSON.stringify(context, null, 2)}

INSTRUCCIONES:
1. Usa los datos proporcionados para responder preguntas específicas (ej: "¿Cuánto gasté en comida?", "¿Cuál es mi saldo?").
2. Si el usuario pregunta algo que requiere cálculos (ej: "total gastado"), haz el cálculo con los datos disponibles.
3. Si no tienes datos suficientes para responder con certeza, dilo honestamente y pide aclaración.
4. Sé breve, directo y usa formato Markdown para que sea legible (negritas, listas).
5. Tu tono es motivador pero realista. Ayuda al usuario a mejorar su salud financiera.

Usuario: ${message}`;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error in chatWithGemini:', error);
        return "Lo siento, tuve un problema al procesar tu solicitud. Por favor intenta de nuevo.";
    }
}
