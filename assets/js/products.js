/* ==========================================================================
   GalaBlock — Catálogo de productos
   --------------------------------------------------------------------------
   Esta es la ÚNICA fuente de datos del sitio. index.html, products.html y
   product.html leen de aquí, así que para publicar un modelo nuevo sólo hay
   que añadir un objeto a este array.

   Campos:
     id          slug único; forma la URL -> product.html?id=<id>
     title       nombre visible
     category    debe existir en CATEGORIES (abajo)
     description resumen corto (1-2 frases) usado en tarjeta y buscador
     details     párrafo largo opcional para la página de detalle
     image       ruta base de las imágenes optimizadas en assets/img/
                 (se esperan <image>-card.webp/.jpg y <image>-full.webp/.jpg)
     imageAlt    texto alternativo descriptivo (accesibilidad + SEO)
     width/height dimensiones reales del archivo -full (evita saltos de layout)
     download    ruta del archivo descargable, tal cual está en el repo
     bytes       tamaño del archivo en bytes (se formatea automáticamente)
     format      extensión / tipo de archivo
     software    programa y versión mínima recomendada
     tags        palabras clave adicionales para el buscador
     added       fecha ISO de publicación (ordena "Más recientes")
   ========================================================================== */

const CATEGORIES = [
  { id: 'todos',      label: 'Todos' },
  { id: 'vehiculos',  label: 'Vehículos' },
  { id: 'mobiliario', label: 'Mobiliario' }
];

const PRODUCTS = [
  {
    id: 'mustang-gt500',
    title: 'Mustang GT500',
    category: 'vehiculos',
    description: 'Coche deportivo icónico con carrocería agresiva, ideal para renders de exteriores, parkings y escenas urbanas.',
    details: 'Familia de Revit de un deportivo americano clásico. Geometría optimizada para mantener el rendimiento del modelo incluso al colocar varias instancias en un mismo proyecto, con un nivel de detalle suficiente para primer plano en vistas de exterior.',
    image: 'mustang-gt500',
    imageAlt: 'Render de un coche deportivo Mustang GT500 visto en tres cuartos',
    width: 1600,
    height: 771,
    download: 'galablock.store/LR_Ford_GT40_10353 (2).rfa',
    bytes: 2555904,
    format: 'RFA',
    software: 'Revit 2018 o superior',
    tags: ['coche', 'auto', 'deportivo', 'ford', 'exterior', 'mobiliario urbano'],
    added: '2024-07-25'
  },
  {
    id: 'concrete-truck',
    title: 'Concrete Truck',
    category: 'vehiculos',
    description: 'Camión hormigonera para escenas de obra, logística y planificación de accesos en fase de construcción.',
    details: 'Camión de concreto pensado para documentar fases de obra: radios de giro, accesos a la parcela, zonas de descarga y coordinación de maquinaria. Útil tanto en vistas 3D de presentación como en plantas de logística de obra.',
    image: 'concrete-truck',
    imageAlt: 'Render de un camión hormigonera de obra en vista lateral',
    width: 1600,
    height: 771,
    download: 'galablock.store/Concrete_Truck_2012.rfa',
    bytes: 2191360,
    format: 'RFA',
    software: 'Revit 2018 o superior',
    tags: ['camión', 'hormigonera', 'obra', 'construcción', 'maquinaria', 'logística'],
    added: '2024-07-25'
  },
  {
    id: 'cama-queen-marcel',
    title: 'Cama Queen Marcel',
    category: 'mobiliario',
    description: 'Cama Queen Size de líneas limpias y cabecero tapizado, lista para dormitorios residenciales y hoteleros.',
    details: 'Familia de mobiliario para dormitorio con medidas Queen Size. Pensada para amueblar rápidamente dormitorios en proyectos residenciales, apartamentos turísticos u hotelería, manteniendo un aspecto contemporáneo en vistas de interior.',
    image: 'cama-queen-marcel',
    imageAlt: 'Render de una cama Queen Size con cabecero tapizado y ropa de cama clara',
    width: 768,
    height: 577,
    download: 'galablock.store/Cama Queen Marcel.rfa',
    bytes: 1048576,
    format: 'RFA',
    software: 'Revit 2018 o superior',
    tags: ['cama', 'dormitorio', 'queen', 'interior', 'residencial', 'hotel'],
    added: '2024-07-25'
  }
];

/* `const` en un script clásico no cuelga de `window`, así que lo exponemos
   explícitamente para que app.js pueda leerlo. */
window.CATEGORIES = CATEGORIES;
window.PRODUCTS = PRODUCTS;
