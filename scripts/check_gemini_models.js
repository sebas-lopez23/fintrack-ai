const https = require('https');
const fs = require('fs');
const path = require('path');

// 1. Leer la API Key del archivo .env.local
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('Error: No se encontró el archivo .env.local');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    // Buscar NEXT_PUBLIC_GEMINI_API_KEY o GEMINI_API_KEY
    let match = envContent.match(/NEXT_PUBLIC_GEMINI_API_KEY=(.*)/);
    if (!match) {
        match = envContent.match(/^GEMINI_API_KEY=(.*)/m);
    }

    if (!match) {
        console.error('Error: No se encontró la API Key de Gemini en .env.local');
        process.exit(1);
    }

    const apiKey = match[1].trim();
    console.log('Consultando modelos disponibles con la API Key...');

    // 2. Consultar la API REST de Google para listar modelos
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.error) {
                    console.error('❌ Error devuelto por la API:', json.error.message);
                } else {
                    console.log('\n✅ Modelos Disponibles:');
                    console.log('================================');
                    const models = json.models || [];

                    // Filtrar y mostrar modelos interesantes
                    const chatModels = models.filter(m => m.supportedGenerationMethods?.includes('generateContent'));

                    chatModels.forEach(m => {
                        console.log(`\n🔹 Nombre: ${m.name}`);
                        console.log(`   Versión: ${m.version}`);
                        console.log(`   Descripción: ${m.description}`);
                    });

                    console.log('\n================================');
                    console.log(`Total modelos encontrados: ${models.length}`);
                    console.log(`Modelos de generación de contenido: ${chatModels.length}`);
                }
            } catch (e) {
                console.error('Error parseando respuesta:', e);
                console.log('Respuesta cruda:', data);
            }
        });

    }).on('error', (err) => {
        console.error('Error en la petición HTTP:', err);
    });

} catch (err) {
    console.error('Error inesperado:', err);
}
