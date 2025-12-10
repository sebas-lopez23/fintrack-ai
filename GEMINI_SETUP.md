# 🤖 Configuración de Gemini AI para FinTrack

## 📋 Requisitos Previos

1. **API Key de Google AI Studio**
2. **Navegador moderno** con soporte para MediaDevices API (Chrome, Edge, Safari)
3. **Permisos** de cámara y micrófono

---

## 🚀 Pasos de Configuración

### 1. Obtener tu API Key de Gemini

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en **"Get API Key"** o **"Create API Key"**
4. Copia la API key generada

### 2. Configurar la API Key en tu proyecto

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
cd /Users/sebas/.gemini/antigravity/scratch/fintrack-ai
touch .env.local
```

Abre el archivo y agrega tu API key:

```env
NEXT_PUBLIC_GEMINI_API_KEY=TU_API_KEY_AQUI
```

**⚠️ IMPORTANTE**: Reemplaza `TU_API_KEY_AQUI` con tu API key real.

### 3. Reiniciar el servidor de desarrollo

Detén el servidor actual (Ctrl+C) y reinícialo:

```bash
npm run dev
```

---

## 🎯 Cómo Usar las Funciones de IA

### 📸 **Captura por Cámara**

1. Haz clic en el botón FAB (+)
2. Selecciona **"Foto"** (📷)
3. Permite el acceso a la cámara cuando el navegador lo solicite
4. Apunta la cámara a una factura o recibo
5. Haz clic en **"Capturar"**
6. Gemini AI analizará la imagen y extraerá:
   - Monto total
   - Categoría (Food, Transport, etc.)
   - Descripción del comercio
   - Tipo (gasto/ingreso)

### 🎤 **Captura por Voz**

1. Haz clic en el botón FAB (+)
2. Selecciona **"Voz"** (🎙️)
3. Permite el acceso al micrófono cuando el navegador lo solicite
4. Habla claramente durante 5 segundos, por ejemplo:
   - *"Gasté cincuenta mil pesos en el supermercado D1"*
   - *"Compré gasolina por treinta mil pesos"*
   - *"Recibí un ingreso de doscientos mil pesos"*
5. Gemini AI procesará el audio y extraerá la información

---

## 🔧 Solución de Problemas

### Error: "No se pudo acceder al micrófono/cámara"

**Solución:**
1. Verifica que tu navegador tenga permisos para acceder a la cámara/micrófono
2. En Chrome: `chrome://settings/content/camera` y `chrome://settings/content/microphone`
3. Asegúrate de que el sitio `localhost:3000` tenga permisos

### Error: "Error al procesar el audio/imagen"

**Posibles causas:**
1. **API Key inválida**: Verifica que copiaste correctamente la API key en `.env.local`
2. **Límite de cuota**: Gemini tiene límites de uso gratuito. Verifica en [AI Studio](https://aistudio.google.com/)
3. **Audio/imagen poco clara**: Intenta hablar más claro o tomar una foto mejor iluminada

### Error: "NEXT_PUBLIC_GEMINI_API_KEY is undefined"

**Solución:**
1. Asegúrate de que el archivo `.env.local` existe en la raíz del proyecto
2. Verifica que la variable empiece con `NEXT_PUBLIC_`
3. Reinicia el servidor de desarrollo (`npm run dev`)

---

## 💡 Consejos para Mejores Resultados

### Para Voz:
- Habla claro y despacio
- Menciona el monto, la categoría y el lugar
- Ejemplo: *"Gasté veinte mil pesos en transporte, taxi al aeropuerto"*

### Para Cámara:
- Buena iluminación
- Enfoca bien el total de la factura
- Asegúrate de que el texto sea legible
- Evita reflejos o sombras

---

## 📊 Modelos Disponibles

El proyecto usa **Gemini 2.0 Flash Experimental** que soporta:
- ✅ Texto
- ✅ Imágenes
- ✅ Audio
- ✅ Video (futuro)

Si quieres cambiar el modelo, edita `/src/services/geminiService.ts`:

```typescript
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp' // o 'gemini-1.5-pro'
});
```

---

## 🔐 Seguridad

- ✅ La API key se almacena en `.env.local` (no se sube a Git)
- ✅ Todo el procesamiento se hace en el cliente
- ✅ No se almacenan imágenes ni audios en servidores

---

## 📱 Compatibilidad

| Navegador | Cámara | Micrófono |
|-----------|--------|-----------|
| Chrome    | ✅     | ✅        |
| Edge      | ✅     | ✅        |
| Safari    | ✅     | ✅        |
| Firefox   | ✅     | ✅        |

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica que la API key sea válida
3. Asegúrate de tener conexión a internet
4. Comprueba los permisos de cámara/micrófono

---

¡Listo! Ahora puedes usar IA para agregar transacciones de forma automática 🎉
