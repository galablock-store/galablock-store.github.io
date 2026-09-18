# GalaBlock

Biblioteca gratuita de familias de Revit (`.rfa`) publicada con GitHub Pages en
**https://galablock-store.github.io/**

Es un sitio estático: no hay build, ni dependencias, ni paso de compilación.
Se edita el HTML/CSS/JS y al hacer push GitHub Pages lo publica.

## Estructura

```
index.html            Portada: hero, últimos modelos, ventajas y cómo funciona
products.html         Catálogo con buscador, filtro por categoría y orden
product.html          Ficha de un modelo; se rellena con ?id=<slug>
404.html              Página de error (rutas absolutas: se sirve en cualquier ruta)
assets/css/styles.css Sistema de diseño completo (tema claro y oscuro)
assets/js/products.js ⭐ Catálogo de datos: la única fuente de verdad
assets/js/app.js      Lógica compartida: tema, menú, buscador, ficha
assets/img/           Imágenes optimizadas (WebP + JPG) e iconos PWA
Images/               Imágenes originales sin comprimir (archivo maestro)
galablock.store/      Archivos .rfa que se descargan
sitemap.xml robots.txt site.webmanifest favicon.svg
```

## Añadir un modelo nuevo

1. Copia el `.rfa` a la carpeta `galablock.store/`.
2. Genera las imágenes optimizadas desde tu render original:

   ```bash
   pip install Pillow
   python3 - <<'PY'
   from PIL import Image
   SRC  = "Images/mi-render.jpg"   # tu imagen original
   SLUG = "mi-modelo"              # el id que usarás en products.js
   im = Image.open(SRC).convert("RGB")
   for label, maxw in (("card", 800), ("full", 1600)):
       w, h = im.size
       r = im.resize((maxw, round(h * maxw / w)), Image.LANCZOS) if w > maxw else im.copy()
       r.save(f"assets/img/{SLUG}-{label}.webp", "WEBP", quality=82, method=6)
       r.save(f"assets/img/{SLUG}-{label}.jpg", "JPEG", quality=84, optimize=True, progressive=True)
       print(label, r.size)
   PY
   ```

3. Añade un objeto al array `PRODUCTS` de `assets/js/products.js`. Los campos
   están documentados en el comentario de cabecera del propio archivo. `bytes`
   lo obtienes con `stat -c%s "galablock.store/tu-archivo.rfa"`.
4. Si es una categoría nueva, añádela también a `CATEGORIES` del mismo archivo.
5. Añade la URL nueva a `sitemap.xml`:
   `https://galablock-store.github.io/product.html?id=<slug>`

La portada, el catálogo, el buscador, los modelos relacionados y las fichas se
generan solos a partir de ese array. No hay que tocar el HTML.

## Probar en local

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Hace falta servirlo por HTTP: abrir los archivos con `file://` rompe las rutas
relativas y los parámetros de consulta.

## Notas de mantenimiento

- **Tema claro/oscuro**: sigue la preferencia del sistema y se puede forzar con
  el botón de la cabecera; la elección se guarda en `localStorage`.
- **Enlaces antiguos**: los `product.html?img=…&title=…` que circulen por ahí
  siguen funcionando — `app.js` usa esos parámetros sólo para *localizar* el
  modelo en el catálogo, nunca para pintar rutas que vengan de la URL.
- **Sin JavaScript**: el contenido estático se ve igual y cada página incluye un
  `<noscript>` con enlaces de descarga directos.
- **Banner de anuncios**: está en el `<aside class="ad-slot">` de cada página.
  Para quitarlo, borra ese bloque; el diseño no depende de él.
