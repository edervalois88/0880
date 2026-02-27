# 0880 - Next.js 15

## Descripción

Sitio web de lujo para bolsas artesanales 0880. Arte en cada puntada.

**Stack Tecnológico:**
- Next.js 15 (App Router)
- React 19
- Tailwind CSS
- DaisyUI
- Framer Motion

## Características

- 🌐 Sitio bilingüe (Español/Inglés)
- 🎨 Animaciones suaves con Framer Motion
- 📱 Diseño responsive
- 🛍️ Integración con WhatsApp para ventas
- 🎭 Tema luxury personalizado
- ⚡ Optimizado con Next.js 15

## Instalación

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar servidor de producción
npm start
```

## Estructura del Proyecto

```
0880/
├── app/
│   ├── components/
│   │   ├── BrandLogo.jsx
│   │   └── Loader.jsx
│   ├── data/
│   │   └── constants.js
│   ├── globals.css
│   ├── layout.jsx
│   └── page.jsx
├── public/
│   └── images/
├── next.config.mjs
├── tailwind.config.js
└── package.json
```

## Imágenes Requeridas

Asegúrate de tener las siguientes imágenes en `/public/images/`:

- `Gemini_Generated_Image_fzyqpqfzyqpqfzyq.png` (Hero)
- `Gemini_Generated_Image_de5chode5chode5c.png` (Origin)
- `banner-clean.png` (Banner)
- `valentina.png` (Producto)
- `love.png` (Producto)
- `amelia.png` (Producto)
- `ines.png` (Producto)

## Configuración

### WhatsApp

Número configurado: `5215633551085`

Para cambiar el número de WhatsApp, edita el archivo `app/data/constants.js`:

```javascript
export const whatsappNumber = "TU_NUMERO_AQUI";
```

### Productos

Los productos se pueden editar en `app/data/constants.js` en el array `productsData`.

### Traducciones

Las traducciones están en `app/data/constants.js` en el objeto `translations`.

## Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

O conecta tu repositorio de GitHub con Vercel para deploys automáticos.

## Licencia

Proyecto privado - 0880

## Soporte

Para soporte, contacta vía WhatsApp: [5215633551085](https://wa.me/5215633551085)

