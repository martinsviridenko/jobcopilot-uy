# JobCopilot AI — Uruguay 🇺🇾

> El copiloto de IA que te dice a qué trabajos realmente vale la pena postularte y prepara toda tu postulación en minutos.

Diseñado para estudiantes universitarios y perfiles junior en Montevideo, Uruguay (enfocado en regímenes compatibles de 4h y 6h).

## 🚀 Despliegue Gratuito en Vercel

Esta aplicación es 100% estática (HTML, CSS y JavaScript del lado del cliente) con procesamiento nativo de PDF en el navegador vía Mozilla PDF.js y persistencia en LocalStorage.

### Opción 1: Despliegue con GitHub (Automático y con actualizaciones continuas)
1. Creá un nuevo repositorio en [GitHub](https://github.com/new) llamado `jobcopilot-uy`.
2. Subí los archivos de esta carpeta.
3. Entrá a [Vercel](https://vercel.com) (iniciá sesión con tu cuenta de GitHub).
4. Hacé clic en **"Add New..."** -> **"Project"**.
5. Seleccioná el repositorio `jobcopilot-uy` y hacé clic en **"Deploy"**.
6. En 20 segundos tu aplicación estará pública en: `https://jobcopilot-uy.vercel.app` (o el nombre que elijas).

### Opción 2: Arrastrar y Soltar (Sin cuenta de GitHub)
1. Entrá a [Netlify Drop](https://app.netlify.com/drop) o [Vercel Dashboard](https://vercel.com).
2. Arrastrá directamente la carpeta `jobcopilot-app`.
3. Listo: te genera una URL pública instantánea con certificado SSL gratis.

## 🛠️ Estructura del Proyecto
```
jobcopilot-app/
├── index.html        # Estructura de la aplicación
├── vercel.json       # Configuración para optimización y seguridad en Vercel
├── css/
│   └── styles.css    # Estilos de interfaz responsiva (móvil y escritorio)
└── js/
    ├── jobs.js       # Base de datos de vacantes verificadas (4h, 6h, 8h)
    └── app.js        # Motor de ponderación, PDF.js, modales, Kanban y Copilot
```
