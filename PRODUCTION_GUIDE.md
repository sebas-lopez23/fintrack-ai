# 🚀 Guía para llevar FinTrack AI a Producción

Para compartir la app con tu esposa y amigos, necesitas dos servicios gratuitos:
1. **Supabase**: Para la base de datos y usuarios.
2. **Vercel**: Para poner la app en internet.

---

## Paso 1: Configurar la Base de Datos (Supabase)

1. Ve a [supabase.com](https://supabase.com/) y crea una cuenta.
2. Haz clic en **"New Project"**.
3. Ponle nombre (ej: `fintrack-ai`) y una contraseña segura a la base de datos.
4. Espera a que se cree el proyecto (tarda unos minutos).
5. Ve al menú lateral izquierdo, busca el ícono de **SQL Editor** (parece una terminal).
6. Haz clic en **"New Query"**.
7. Copia TODO el contenido del archivo `supabase_schema.sql` que está en tu proyecto.
8. Pégalo en el editor de Supabase y dale al botón **"Run"**.
   - *¡Listo! Ya tienes todas las tablas creadas.*

### Obtener las Llaves
1. En Supabase, ve a **Project Settings** (engranaje abajo a la izquierda).
2. Ve a **API**.
3. Copia la `Project URL` y la `anon public` Key.
4. Pégalas en tu archivo `.env.local` así:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
```

---

## Paso 2: Publicar en Internet (Vercel)

1. Ve a [vercel.com](https://vercel.com/) y crea una cuenta (idealmente con GitHub).
2. Instala Vercel en tu terminal (si no lo tienes):
   ```bash
   npm i -g vercel
   ```
3. En la carpeta de tu proyecto, ejecuta:
   ```bash
   vercel
   ```
4. Sigue las instrucciones (dale Enter a todo).
5. Cuando te pregunte por "Environment Variables", dile que sí y agrega las mismas que tienes en `.env.local`:
   - `NEXT_PUBLIC_GEMINI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

¡Al finalizar, te dará un link (ej: `fintrack-ai.vercel.app`) que puedes enviar por WhatsApp a tu esposa!

---

## Paso 3: Cómo funciona la "Familia"

Con la estructura de base de datos que creé:
1. Cuando tu esposa se registre, tendrá su propio usuario.
2. Tú podrás crear una "Familia" en la base de datos.
3. Podrás agregar el usuario de tu esposa a esa familia.
4. Las cuentas bancarias que marques como "Familiares" serán visibles para ambos.
5. Las cuentas "Personales" solo las verás tú.

---

## ¿Qué sigue ahora?

El código actual de la app (`FinanceContext`) todavía usa datos de prueba. El siguiente paso de programación es conectar las pantallas reales a Supabase.

¿Quieres que empiece a modificar el código para que lea y escriba en Supabase en lugar de usar datos falsos?

---

## 💰 Costos y Alternativas

Para tu tranquilidad, este proyecto está diseñado para funcionar **GRATIS** en su etapa personal.

### Comparativa de Costos

| Servicio | Plan | Costo | ¿Por qué usarlo? |
| :--- | :--- | :--- | :--- |
| **Vercel** | Hobby | **$0 / mes** | Ideal para uso personal. Incluye HTTPS, dominio `.vercel.app` y despliegue automático. |
| **Supabase** | Free | **$0 / mes** | Base de datos de hasta 500MB (suficiente para millones de transacciones de texto). |
| **Gemini AI** | Free | **$0 / mes** | Google ofrece una capa gratuita generosa para uso personal. |

### ¿Por qué no Hostinger?
Hostinger es excelente para WordPress, pero para aplicaciones modernas (Next.js), Vercel es superior porque:
1. **Es Gratis**: Hostinger cobra desde $3-5 USD/mes.
2. **Es Nativo**: Vercel creó la tecnología que usa tu app.
3. **Cero Configuración**: No tienes que configurar servidores Linux, Node.js ni puertos.

**Recomendación:** Usa el plan gratuito de Vercel y Supabase. Si algún día tu app se vuelve un negocio masivo, solo entonces tendrás que pensar en pagar.
