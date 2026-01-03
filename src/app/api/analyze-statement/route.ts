import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini if key exists
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: NextRequest) {
    try {
        if (!genAI) {
            return NextResponse.json({
                error: 'API Key de Gemini no configurada. Por favor revisa las variables de entorno.'
            }, { status: 500 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No se proporcionó archivo PDF' }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Solo se aceptan archivos PDF' }, { status: 400 });
        }

        console.log('Processing PDF with Gemini...');

        // Convert PDF to base64 for inline data
        const bytes = await file.arrayBuffer();
        const base64Data = Buffer.from(bytes).toString('base64');

        // Use Gemini 2.0 Flash Experimental with PDF support
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `
Analiza este extracto bancario en formato PDF y extrae TODAS las transacciones y la información de la cuenta.

**INSTRUCCIONES CRÍTICAS:**
1. **Estructura del PDF**: El documento tiene una tabla con columnas: FECHA | TIPO TRANSACCIÓN | CRÉDITOS | DÉBITOS | SALDOS
2. **Extraer TODO**: Extrae CADA FILA de transacción visible en la tabla, sin omitir ninguna
3. **Formato de Números Colombianos**: 
   - Separador de miles: punto (.)
   - Separador decimal: coma (,)
   - Ejemplo: "43.800,00" = 43800 pesos
   - Ejemplo: "900.000,00" = 900000 pesos
4. **Formato de Fecha**: DD/MM/YYYY → convertir a YYYY-MM-DD
5. **Tipo de Transacción**:
   - Si hay valor en columna DÉBITOS → type: "expense"
   - Si hay valor en columna CRÉDITOS → type: "income"
6. **CATEGORÍAS - REGLAS INTELIGENTES**:
   Clasifica según palabras clave en la descripción del comercio:
   - **Food**: Subway, McDonald, Crepes, Valdez,Éxito, Carulla, Jumbo, Ara, D1, Mercadoli, Panadería, Restaurante
   - **Transport**: Uber, Didi, Beat, Gasolina, Terpel, Mobil, Peaje, Parqueadero, SOAT
   - **Housing**: Arriendo, Alquiler, Administración, Canon
   - **Entertainment**: Netflix, Spotify, Disney, HBO, Cinemark, Procinal, Bar, Concierto
   - **Shopping**: Zara, H&M, Adidas, Nike, Falabella, Compra Web, Compra NAL, Datafono, Mercado Libre
   - **Health**: Farmacia, Cruz Verde, Farmatodo, Hospital, Clínica, EPS, Drogas
   - **Education**: Universidad, Colegio, Curso, Platzi, Udemy, Librería
   - **Salary**: Nómina, Salario, Transferencia (si CRÉDITO grande), Honorarios, Intereses Cuenta
   - **Utilities**: Codensa, Enel, Gas Natural, EPM, Claro, Movistar, Tigo, ETB, Acueducto
   - **Other**: Todo lo demás que no encaje claramente
7. **Metadata**: Extrae saldo final, moneda (COP), período

**FORMATO DE SALIDA (JSON):**
{
  "meta": {
    "balance": 2884559.05,
    "currency": "COP",
    "account_number": "****4354",
    "period": "Enero 2025"
  },
  "transactions": [
    { "date": "2025-01-02", "merchant": "INGRESO POR INTERESES CUENTA DE AHORRO", "amount": 1.24, "type": "income", "category": "Other" },
    { "date": "2025-01-02", "merchant": "ABONO TRANSFERENCIA OTRO BANCO", "amount": 900000, "type": "income", "category": "Salary" },
    { "date": "2025-01-02", "merchant": "COMPRA NAL SUBWAY PAGO MERCADOLI MEDELL", "amount": 43800, "type": "expense", "category": "Food" }
  ]
}

**MUY IMPORTANTE**: 
- Retorna SOLO el JSON, sin bloques de código markdown
- Incluye TODAS las transacciones que veas en el PDF
- Los montos deben ser números, no strings
`;

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Data
                }
            },
            { text: prompt }
        ]);

        const response = result.response;
        const text = response.text();

        console.log('Gemini Response received, parsing...');

        // Cleanup markdown artifacts
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsed = JSON.parse(jsonStr);
            const transactions = Array.isArray(parsed) ? parsed : (parsed.transactions || []);
            const meta = Array.isArray(parsed) ? {} : (parsed.meta || {});

            console.log(`Successfully extracted ${transactions.length} transactions`);

            return NextResponse.json({ transactions, meta });
        } catch (jsonError) {
            console.error('JSON Parse Error:', jsonError);
            console.log('Raw AI Response:', text.substring(0, 500));

            return NextResponse.json({
                error: 'Error al parsear respuesta de Gemini',
                raw: text.substring(0, 200)
            }, { status: 500 });
        }

    } catch (e: any) {
        console.error('API Error:', e);

        return NextResponse.json({
            error: 'Error procesando el PDF',
            details: e.message
        }, { status: 500 });
    }
}
