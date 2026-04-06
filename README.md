# SHA Carnet — PWA

## Archivos incluidos

```
sha_carnet_pwa/
├── index.html       ← La app completa
├── manifest.json    ← Configuración PWA (nombre, íconos, colores)
├── sw.js            ← Service Worker (cache offline, notificaciones)
├── README.md        ← Este archivo
└── icons/           ← ⚠️ Creá esta carpeta con tus íconos (ver abajo)
```

---

## Paso 1 — Conectar tu backend

Abrí `index.html` con un editor de texto, buscá estas dos líneas al inicio del `<script>` y editálas:

```javascript
var WEB_APP_URL = 'https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec';
// ↑ Pegá la URL real de tu Web App de Apps Script

modoDemo: false
// ↑ Cambiá true por false
```

---

## Paso 2 — Crear los íconos

Creá una carpeta `icons/` y agregá los íconos de la app en estos tamaños:

| Archivo           | Tamaño  | Para qué sirve                     |
|-------------------|---------|------------------------------------|
| icon-72.png       | 72×72   | Android (legacy)                   |
| icon-96.png       | 96×96   | Favicon del navegador              |
| icon-128.png      | 128×128 | Chrome Web Store                   |
| icon-144.png      | 144×144 | Windows / IE                       |
| icon-152.png      | 152×152 | iPad / Safari                      |
| icon-192.png      | 192×192 | Android — ícono en pantalla inicio |
| icon-384.png      | 384×384 | Android (alta densidad)            |
| icon-512.png      | 512×512 | Splash screen / Play Store         |

**Forma rápida:** Creá un PNG de 512×512 con el ícono del club
y usá https://realfavicongenerator.net para generar todos los tamaños automáticamente.

---

## Paso 3 — Subir a un servidor HTTPS

La PWA **requiere HTTPS** para funcionar (el Service Worker no se activa en HTTP).

**Opciones gratuitas:**

| Opción | Cómo |
|--------|------|
| **GitHub Pages** | Subí los archivos a un repo y activá Pages |
| **Netlify** | Arrastrá la carpeta a https://app.netlify.com/drop |
| **Vercel** | `npx vercel` en la carpeta del proyecto |
| **Firebase Hosting** | `firebase deploy` |
| **Tu propio dominio** | Subí los archivos a la raíz de tu hosting |

---

## Paso 4 — Probar en Android

1. Abrí Chrome en tu celular Android
2. Navegá a la URL donde subiste la app
3. Chrome mostrará automáticamente "Agregar a pantalla de inicio"
4. La app se instala y abre como una app nativa (sin barra del navegador)

### Probar en iPhone (iOS)

1. Abrí Safari (no Chrome) en iPhone
2. Navegá a la URL
3. Tocá el botón compartir → "Agregar a pantalla de inicio"

---

## Paso 5 — Verificar que la PWA es válida

Abrí Chrome en el escritorio, navegá a tu URL,
abrí DevTools (F12) → Pestaña **Lighthouse** → "Generate report".

Debería marcar verde en:
- ✅ PWA installable
- ✅ Service Worker
- ✅ HTTPS
- ✅ Manifest

---

## ¿Cómo actualizar la app?

Editá los archivos y volvé a subirlos.
El Service Worker detecta el cambio y actualiza automáticamente
en el próximo inicio de la app por parte del usuario.

Si querés forzar la actualización, cambiá el número de versión en `sw.js`:
```javascript
const CACHE_NAME = 'sha-carnet-v2';  // ← incrementar este número
```

---

## Pasos siguientes — Play Store (TWA)

Si querés publicar en Play Store, la ruta más fácil desde una PWA es
usar **Bubblewrap** (herramienta de Google):

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://tu-url.com/manifest.json
bubblewrap build
```

Esto genera un `.apk` / `.aab` listo para subir a Play Store.
Requiere cuenta de desarrollador en Google ($25 pago único).

---

## Soporte

- iOS Safari: ✅ (Safari es el único navegador que soporta PWA install en iOS)
- Android Chrome: ✅ (instalación automática con banner)
- Android Firefox: ✅
- Desktop Chrome: ✅
- Desktop Edge: ✅
