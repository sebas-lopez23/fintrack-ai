const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ Error: GEMINI_API_KEY not found in .env.local");
        return;
    }

    console.log("🔑 API Key found (starts with):", apiKey.substring(0, 5) + "...");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // For listing models, we don't need a specific model instance, 
        // but the SDK structure usually requires getting a model or using the manager.
        // Actually, looking at the SDK docs, listModels is on the GoogleGenerativeAI instance or similar.
        // Let's try to just instantiate a model and see if we can get info, 
        // or use the raw API if needed. The Node SDK might not expose listModels directly on the main class easily in all versions.
        // Let's try a direct fetch to the API endpoint which is often more reliable for just listing.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("❌ API Error:", data.error.message);
            return;
        }

        console.log("\n✅ Available Models:");
        if (data.models) {
            data.models.forEach(model => {
                if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${model.name.replace('models/', '')} (${model.displayName})`);
                }
            });
        } else {
            console.log("No models found.");
        }

    } catch (error) {
        console.error("❌ Error listing models:", error.message);
    }
}

listModels();
