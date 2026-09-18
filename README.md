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
2. Genera las imágenes optimizadas desde tu render original. Ojo con las
   proporciones: el hueco de la tarjeta es **4:3** (`aspect-ratio: 4/3` con
   `object-fit: cover`), así que el recorte `-card` debe salir ya en 4:3 —
   si no, el navegador lo amplía en pantallas 2x.

   ```bash
   pip install Pillow
   python3 - <<'PY'
   from PIL import Image
   SRC  = "Images/mi-render.jpg"   # tu imagen original
   SLUG = "mi-modelo"              # el id que usarás en products.js

   im = Image.open(SRC).convert("RGB")

   # -card: recorte centrado a 4:3, 760x570 (lo que pide la tarjeta a 2x)
   TW, TH = 760, 570
   sw, sh = im.size
   k = max(TW / sw, TH / sh)
   r = im.resize((round(sw * k), round(sh * k)), Image.LANCZOS)
   c = r.crop(((r.width - TW) // 2, (r.height - TH) // 2,
               (r.width - TW) // 2 + TW, (r.height - TH) // 2 + TH))
   c.save(f"assets/img/{SLUG}-card.webp", "WEBP", quality=82, method=6)
   c.save(f"assets/img/{SLUG}-card.jpg", "JPEG", quality=84, optimize=True, progressive=True)

   # -full: mismo encuadre que el original, máximo 1600px de ancho
   w, h = im.size
   f = im.resize((1600, round(h * 1600 / w)), Image.LANCZOS) if w > 1600 else im.copy()
   f.save(f"assets/img/{SLUG}-full.webp", "WEBP", quality=82, method=6)
   f.save(f"assets/img/{SLUG}-full.jpg", "JPEG", quality=84, optimize=True, progressive=True)
   print("card", c.size, "| full", f.size)
   PY
   ```

3. Añade un objeto al array `PRODUCTS` de `assets/js/products.js`. Los campos
   están documentados en el comentario de cabecera del propio archivo. `bytes`
   lo obtienes con `stat -c%s "galablock.store/tu-archivo.rfa"`, y `width`/`height`
   son las dimensiones reales del `-full` que acabas de generar.
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

## Invariantes que conviene no romper

Tres cosas del HTML parecen arbitrarias pero no lo son. Si se cambian, vuelven
a aparecer defectos que ya estaban corregidos:

1. **Los `<script>` de contenido van dentro de `<main>`, antes del bloque del
   anuncio.** El script del banner es de terceros y síncrono: si queda por
   delante, bloquea el parser y nada se pinta hasta que responda ese host (o
   hasta que caduque, con un DNS filtrado). Por eso `products.js`/`app.js` se
   cargan antes y el anuncio recupera su sitio visual con `order` en
   `styles.css`. Medido: con el host colgado 12 s, el catálogo aparece en
   ~120 ms. Como el pie queda por detrás de los scripts, `initYear()` se
   reintenta en `DOMContentLoaded`.
2. **`404.html` usa rutas absolutas (`/assets/...`) y carga los scripts.**
   GitHub Pages la sirve en cualquier ruta profunda (`/a/b/c`), donde una ruta
   relativa apuntaría al sitio equivocado. Sin los scripts, el menú móvil y el
   botón de tema quedan muertos.
3. **El tema sólo se guarda en `localStorage` cuando el usuario pulsa el
   botón.** Si se guardase en el arranque, la primera visita congelaría el
   tema y el sitio dejaría de seguir a `prefers-color-scheme`.

## Accesibilidad

Los colores están elegidos para cumplir WCAG AA (4.5:1) en **ambos** temas. Si
tocas `--accent`, `--success` o `--text-faint`, comprueba el contraste: sobre
los acentos claros del tema oscuro el texto tiene que ser oscuro
(`--text-inverse`), no blanco.
