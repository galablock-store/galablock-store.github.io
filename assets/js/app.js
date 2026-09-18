/* ==========================================================================
   GalaBlock — Lógica compartida
   Depende de products.js (CATEGORIES, PRODUCTS), que debe cargarse antes.
   ========================================================================== */
(function () {
  'use strict';

  /* --- Utilidades ------------------------------------------------------- */

  /** Codifica una ruta relativa segmento a segmento (respeta espacios, paréntesis…). */
  function encodePath(path) {
    return String(path).split('/').map(encodeURIComponent).join('/');
  }

  /** 2555904 -> "2,4 MB" */
  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, i);
    const decimals = i === 0 || value >= 100 ? 0 : 1;
    return value.toFixed(decimals).replace('.', ',') + ' ' + units[i];
  }

  /** "2024-07-25" -> "25 jul 2024" */
  function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /** Quita acentos y pasa a minúsculas, para que "camion" encuentre "camión". */
  function normalize(text) {
    return String(text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  function categoryLabel(id) {
    const found = (window.CATEGORIES || []).find(c => c.id === id);
    return found ? found.label : id;
  }

  function debounce(fn, wait) {
    let t;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), wait);
    };
  }

  /* --- Tema (claro / oscuro) ------------------------------------------- */

  const Theme = {
    KEY: 'galablock-theme',

    stored() {
      try { return localStorage.getItem(Theme.KEY); } catch (_) { return null; }
    },

    systemPrefersDark() {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    },

    current() {
      const attr = document.documentElement.getAttribute('data-theme');
      if (attr) return attr;
      return Theme.systemPrefersDark() ? 'dark' : 'light';
    },

    // persist=true SÓLO cuando la elección es del usuario. Si guardásemos en
    // el arranque, la primera visita congelaría el tema y el sitio dejaría de
    // seguir a prefers-color-scheme cuando el sistema cambie a oscuro.
    apply(mode, persist) {
      document.documentElement.setAttribute('data-theme', mode);
      if (persist) {
        try { localStorage.setItem(Theme.KEY, mode); } catch (_) { /* modo privado */ }
      }
      Theme.syncLabel(document.querySelector('.theme-toggle'), mode);
    },

    syncLabel(btn, mode) {
      if (!btn) return;
      const next = mode === 'dark' ? 'claro' : 'oscuro';
      btn.setAttribute('aria-label', 'Cambiar a tema ' + next);
      btn.setAttribute('title', 'Cambiar a tema ' + next);
    },

    init() {
      const btn = document.querySelector('.theme-toggle');
      // Sólo fijamos el atributo si el usuario ya eligió antes; si no, dejamos
      // que manden las media queries y sólo sincronizamos la etiqueta del botón.
      const saved = Theme.stored();
      if (saved === 'light' || saved === 'dark') Theme.apply(saved, false);
      Theme.syncLabel(btn, Theme.current());
      if (!btn) return;
      btn.addEventListener('click', () => {
        Theme.apply(Theme.current() === 'dark' ? 'light' : 'dark', true);
      });
    }
  };

  /* --- Navegación móvil ------------------------------------------------ */

  function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.site-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.setAttribute('data-open', String(open));
      toggle.setAttribute('aria-expanded', String(open));
    }

    toggle.addEventListener('click', () => {
      const open = nav.getAttribute('data-open') !== 'true';
      setOpen(open);
      // El panel es opaco y se superpone al contenido: si no movemos el foco,
      // el siguiente Tab cae en controles tapados por el propio menú.
      if (open) {
        const first = nav.querySelector('a');
        if (first) first.focus();
      }
    });

    // Cerrar cuando el foco o el puntero salen de la cabecera.
    const header = toggle.closest('.site-header') || document.body;
    document.addEventListener('focusin', e => {
      if (nav.getAttribute('data-open') === 'true' && !header.contains(e.target)) setOpen(false);
    });
    document.addEventListener('pointerdown', e => {
      if (nav.getAttribute('data-open') === 'true' && !header.contains(e.target)) setOpen(false);
    });

    nav.addEventListener('click', e => {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.getAttribute('data-open') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Al volver a escritorio, el menú desplegable deja de tener sentido.
    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth > 640) setOpen(false);
    }, 150));
  }

  /* --- Enlace activo en la navegación --------------------------------- */

  function markCurrentNavLink() {
    const here = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.site-nav a[href]').forEach(a => {
      const href = a.getAttribute('href');
      // Un enlace con ancla apunta a una sección, no a "la página actual":
      // marcarlo dejaría dos elementos con aria-current a la vez.
      if (href.includes('#')) return;
      const target = href.split('/').pop();
      if (target && target === here) a.setAttribute('aria-current', 'page');
    });
  }

  /* --- Tarjeta de producto -------------------------------------------- */

  function createCard(product, animate) {
    const card = document.createElement('article');
    // El contenedor ya reserva su espacio con aspect-ratio, así que no hace
    // falta animar en cada re-render del buscador (parpadearía).
    card.className = animate === false ? 'card' : 'card reveal';

    const href = 'product.html?id=' + encodeURIComponent(product.id);
    const img = 'assets/img/' + product.image;

    const media = document.createElement('a');
    media.className = 'card__media';
    media.href = href;
    media.setAttribute('aria-label', 'Ver detalles de ' + product.title);
    media.innerHTML =
      '<picture>' +
        '<source type="image/webp" srcset="' + img + '-card.webp">' +
        '<img src="' + img + '-card.jpg" alt=""' +
             ' width="760" height="570" loading="lazy" decoding="async">' +
      '</picture>';

    const badge = document.createElement('span');
    badge.className = 'card__badge';
    badge.textContent = categoryLabel(product.category);
    media.appendChild(badge);

    const free = document.createElement('span');
    free.className = 'card__free';
    free.textContent = 'Gratis';
    media.appendChild(free);

    const body = document.createElement('div');
    body.className = 'card__body';

    const title = document.createElement('h3');
    title.className = 'card__title';
    const titleLink = document.createElement('a');
    titleLink.href = href;
    titleLink.textContent = product.title;
    title.appendChild(titleLink);

    const desc = document.createElement('p');
    desc.className = 'card__desc';
    desc.textContent = product.description;

    const meta = document.createElement('p');
    meta.className = 'card__meta';
    meta.innerHTML =
      '<span>' + product.format + '</span>' +
      '<span>' + formatBytes(product.bytes) + '</span>';

    const actions = document.createElement('div');
    actions.className = 'card__actions';

    const detailBtn = document.createElement('a');
    detailBtn.className = 'btn btn--ghost';
    detailBtn.href = href;
    detailBtn.textContent = 'Detalles';

    const dl = document.createElement('a');
    dl.className = 'btn btn--primary';
    dl.href = encodePath(product.download);
    dl.setAttribute('download', '');
    dl.setAttribute('aria-label', 'Descargar ' + product.title + ' (' + product.format + ', ' + formatBytes(product.bytes) + ')');
    dl.innerHTML = ICONS.download + '<span>Descargar</span>';

    actions.append(detailBtn, dl);
    body.append(title, desc, meta, actions);
    card.append(media, body);
    return card;
  }

  /* --- Iconos inline --------------------------------------------------- */

  const ICONS = {
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>'
  };

  /* --- Página de inicio: destacados ----------------------------------- */

  function initFeatured() {
    const host = document.getElementById('featured-grid');
    if (!host) return;

    const limit = parseInt(host.dataset.limit || '3', 10);
    // La sección se llama "Últimos modelos": hay que ordenar por fecha, no
    // confiar en el orden en que estén escritos en el array.
    const items = (window.PRODUCTS || []).slice()
      .sort((a, b) => String(b.added).localeCompare(String(a.added)))
      .slice(0, limit);
    const frag = document.createDocumentFragment();
    items.forEach(p => frag.appendChild(createCard(p)));
    host.appendChild(frag);

    const count = document.querySelectorAll('[data-stat="count"]');
    count.forEach(el => { el.textContent = String((window.PRODUCTS || []).length); });
  }

  /* --- Página de catálogo: buscar / filtrar / ordenar ------------------ */

  function initCatalog() {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;

    const all = window.PRODUCTS || [];
    const searchWrap = document.querySelector('.search');
    const input = document.getElementById('search-input');
    const clearBtn = document.querySelector('.search__clear');
    const sortSelect = document.getElementById('sort-select');
    const chipHost = document.getElementById('category-chips');
    const countEl = document.getElementById('results-count');
    const params = new URLSearchParams(location.search);
    let firstRender = true;

    const state = {
      q: params.get('q') || '',
      category: params.get('cat') || 'todos',
      sort: params.get('sort') || 'recientes'
    };

    /* Chips de categoría */
    if (chipHost) (window.CATEGORIES || []).forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.textContent = cat.label;
      btn.dataset.category = cat.id;
      btn.setAttribute('aria-pressed', String(cat.id === state.category));
      btn.addEventListener('click', () => {
        state.category = cat.id;
        chipHost.querySelectorAll('.chip').forEach(function (c) {
          c.setAttribute('aria-pressed', String(c.dataset.category === cat.id));
        });
        render();
      });
      chipHost.appendChild(btn);
    });

    if (input) {
      input.value = state.q;
      if (searchWrap) searchWrap.setAttribute('data-filled', String(Boolean(state.q)));
      input.addEventListener('input', debounce(() => {
        state.q = input.value.trim();
        if (searchWrap) searchWrap.setAttribute('data-filled', String(Boolean(input.value)));
        render();
      }, 180));
    }

    if (clearBtn && input) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        state.q = '';
        if (searchWrap) searchWrap.setAttribute('data-filled', 'false');
        input.focus();
        render();
      });
    }

    if (sortSelect) {
      sortSelect.value = state.sort;
      sortSelect.addEventListener('change', () => {
        state.sort = sortSelect.value;
        render();
      });
    }

    function matches(product, needle) {
      if (!needle) return true;
      const haystack = normalize([
        product.title,
        product.description,
        product.details || '',
        categoryLabel(product.category),
        (product.tags || []).join(' ')
      ].join(' '));
      // Todos los términos deben aparecer (búsqueda AND).
      return normalize(needle).split(/\s+/).filter(Boolean).every(term => haystack.includes(term));
    }

    function sorted(list) {
      const copy = list.slice();
      switch (state.sort) {
        case 'az':      return copy.sort((a, b) => a.title.localeCompare(b.title, 'es'));
        case 'za':      return copy.sort((a, b) => b.title.localeCompare(a.title, 'es'));
        case 'ligeros': return copy.sort((a, b) => a.bytes - b.bytes);
        default:        return copy.sort((a, b) => String(b.added).localeCompare(String(a.added)));
      }
    }

    function syncUrl() {
      const next = new URLSearchParams();
      if (state.q) next.set('q', state.q);
      if (state.category !== 'todos') next.set('cat', state.category);
      if (state.sort !== 'recientes') next.set('sort', state.sort);
      const qs = next.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    }

    function render() {
      const list = sorted(all.filter(p =>
        (state.category === 'todos' || p.category === state.category) && matches(p, state.q)
      ));

      grid.textContent = '';

      if (!list.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        const h3 = document.createElement('h3');
        h3.textContent = 'Sin resultados';
        const p = document.createElement('p');
        p.textContent = state.q
          ? 'No encontramos modelos para “' + state.q + '”. Prueba con otro término o revisa el catálogo completo.'
          : 'Todavía no hay modelos en esta categoría.';
        const reset = document.createElement('button');
        reset.type = 'button';
        reset.className = 'btn btn--primary';
        reset.textContent = 'Ver todo el catálogo';
        reset.addEventListener('click', () => {
          state.q = '';
          state.category = 'todos';
          if (input) input.value = '';
          if (searchWrap) searchWrap.setAttribute('data-filled', 'false');
          if (chipHost) chipHost.querySelectorAll('.chip').forEach(c => {
            c.setAttribute('aria-pressed', String(c.dataset.category === 'todos'));
          });
          render();
          // render() vacía la rejilla y destruye este mismo botón: sin esto el
          // foco se perdería y el tabulador volvería al principio del documento.
          if (input) {
            input.focus();
          } else if (countEl) {
            countEl.setAttribute('tabindex', '-1');
            countEl.focus();
          }
        });
        empty.append(h3, p, reset);
        grid.appendChild(empty);
      } else {
        const frag = document.createDocumentFragment();
        list.forEach(p => frag.appendChild(createCard(p, firstRender)));
        grid.appendChild(frag);
      }
      firstRender = false;

      if (countEl) {
        countEl.innerHTML = '';
        const strong = document.createElement('strong');
        strong.textContent = String(list.length);
        countEl.append(
          strong,
          document.createTextNode(
            (list.length === 1 ? ' modelo' : ' modelos') +
            (state.category !== 'todos' ? ' en ' + categoryLabel(state.category) : '') +
            (state.q ? ' para “' + state.q + '”' : '')
          )
        );
      }

      syncUrl();
      revealAll();
    }

    render();
  }

  /* --- Página de detalle ---------------------------------------------- */

  function findProduct(params) {
    const all = window.PRODUCTS || [];
    const byId = params.get('id');
    if (byId) {
      const hit = all.find(p => p.id === byId);
      if (hit) return hit;
    }
    // Compatibilidad con los enlaces antiguos (?img=&title=&download=&description=).
    // Sólo se usan para BUSCAR el producto: nunca se pintan rutas que vengan
    // de la URL, para no abrir la puerta a inyecciones.
    const legacyTitle = params.get('title');
    if (legacyTitle) {
      // URLSearchParams.get ya descodifica: volver a hacerlo lanzaría URIError
      // con un '%' literal (?title=100%) y dejaría la página en blanco.
      const needle = normalize(legacyTitle);
      const hit = all.find(p => normalize(p.title) === needle);
      if (hit) return hit;
    }
    const legacyDownload = params.get('download');
    if (legacyDownload) {
      const needle = legacyDownload;
      const hit = all.find(p => p.download === needle);
      if (hit) return hit;
    }
    return null;
  }

  function initDetail() {
    const root = document.getElementById('product-detail');
    if (!root) return;

    const notFound = document.getElementById('product-not-found');
    let product = null;
    try {
      product = findProduct(new URLSearchParams(location.search));
    } catch (_) {
      product = null; // un parámetro malformado cae en "no encontrado"
    }

    if (!product) {
      root.hidden = true;
      if (notFound) notFound.hidden = false;
      document.title = 'Modelo no encontrado — GalaBlock';
      setMeta('robots', 'noindex, follow');
      // Sin esto quedaba el titular "Otros modelos" sobre una rejilla vacía.
      const relEmpty = document.getElementById('related-section');
      if (relEmpty) relEmpty.hidden = true;
      const crumbEmpty = document.querySelector('[data-role="breadcrumb-current"]');
      if (crumbEmpty) crumbEmpty.textContent = 'No encontrado';
      revealAll();
      return;
    }

    if (notFound) notFound.hidden = true;
    root.hidden = false;

    const img = 'assets/img/' + product.image;
    const size = formatBytes(product.bytes);

    document.title = product.title + ' — Familia Revit gratis | GalaBlock';
    setMeta('description', product.description);
    setLink('canonical', location.origin + location.pathname + '?id=' + encodeURIComponent(product.id));
    setMeta('og:title', product.title + ' — GalaBlock', 'property');
    setMeta('og:description', product.description, 'property');
    setMeta('og:image', location.origin + location.pathname.replace(/[^/]*$/, '') + img + '-full.jpg', 'property');

    root.innerHTML =
      '<figure class="detail__figure">' +
        '<picture>' +
          '<source type="image/webp" srcset="' + img + '-full.webp">' +
          '<img src="' + img + '-full.jpg" alt="" width="' + product.width + '" height="' + product.height + '" decoding="async">' +
        '</picture>' +
      '</figure>' +
      '<div class="detail__panel">' +
        '<p class="eyebrow" data-role="category"></p>' +
        '<h1 data-role="title"></h1>' +
        '<p class="detail__desc" data-role="details"></p>' +
        '<a class="btn btn--primary btn--lg btn--block" data-role="download">' + ICONS.download + '<span></span></a>' +
        '<div class="notice">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-5"/><path d="M12 8h.01"/></svg>' +
          '<span>En Revit: <strong>Insertar › Cargar familia</strong> y selecciona el archivo descargado.</span>' +
        '</div>' +
        '<dl class="spec-list" data-role="specs"></dl>' +
        '<ul class="tags" data-role="tags"></ul>' +
      '</div>';

    root.querySelector('[data-role="category"]').textContent = categoryLabel(product.category);
    root.querySelector('[data-role="title"]').textContent = product.title;
    root.querySelector('[data-role="details"]').textContent = product.details || product.description;
    root.querySelector('.detail__figure img').alt = product.imageAlt || product.title;

    const dl = root.querySelector('[data-role="download"]');
    dl.href = encodePath(product.download);
    dl.setAttribute('download', '');
    dl.querySelector('span').textContent = 'Descargar ' + product.format + ' · ' + size;

    const specs = root.querySelector('[data-role="specs"]');
    [
      ['Categoría', categoryLabel(product.category)],
      ['Formato',   product.format],
      ['Tamaño',    size],
      ['Software',  product.software],
      ['Licencia',  'Uso libre en proyectos'],
      ['Publicado', formatDate(product.added)]
    ].forEach(([label, value]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      row.append(dt, dd);
      specs.appendChild(row);
    });

    const tagHost = root.querySelector('[data-role="tags"]');
    (product.tags || []).forEach(tag => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'tag';
      a.href = 'products.html?q=' + encodeURIComponent(tag);
      a.textContent = tag;
      li.appendChild(a);
      tagHost.appendChild(li);
    });

    // Migajas de pan
    const crumb = document.querySelector('[data-role="breadcrumb-current"]');
    if (crumb) crumb.textContent = product.title;

    // Datos estructurados para buscadores
    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.description,
      image: location.origin + location.pathname.replace(/[^/]*$/, '') + img + '-full.jpg',
      category: categoryLabel(product.category),
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock'
      }
    });

    // Relacionados
    const relatedHost = document.getElementById('related-grid');
    const relatedSection = document.getElementById('related-section');
    if (relatedHost) {
      const related = (window.PRODUCTS || [])
        .filter(p => p.id !== product.id)
        .sort((a, b) => (b.category === product.category) - (a.category === product.category))
        .slice(0, 3);
      if (related.length) {
        related.forEach(p => relatedHost.appendChild(createCard(p)));
      } else if (relatedSection) {
        relatedSection.hidden = true;
      }
    }

    revealAll();
  }

  /* --- Head helpers ---------------------------------------------------- */

  function setMeta(name, content, attr) {
    const key = attr || 'name';
    let el = document.head.querySelector('meta[' + key + '="' + name + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(key, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function setLink(rel, href) {
    let el = document.head.querySelector('link[rel="' + rel + '"]');
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }

  function injectJsonLd(data) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /* --- Aparición al hacer scroll --------------------------------------- */

  let observer = null;

  function revealAll() {
    const targets = document.querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    }
    targets.forEach(el => observer.observe(el));
  }

  /* --- Año en el pie --------------------------------------------------- */

  function initYear() {
    document.querySelectorAll('[data-role="year"]').forEach(el => {
      el.textContent = String(new Date().getFullYear());
    });
  }

  // En index/products/product este script va DENTRO de <main> (para no
  // depender del banner de terceros), así que el <footer> todavía no existe
  // cuando arrancamos. Reintentamos al acabar el parseo; es idempotente.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initYear);
  }

  /* --- Arranque -------------------------------------------------------- */

  function boot() {
    Theme.init();
    initNav();
    markCurrentNavLink();
    initYear();
    initFeatured();
    initCatalog();
    initDetail();
    revealAll();
  }

  let started = false;
  function start() {
    if (started) return;
    started = true;
    try {
      boot();
    } catch (err) {
      // Nunca dejar la página a medio pintar por un fallo nuestro.
      console.error('GalaBlock:', err);
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      const nf = document.getElementById('product-not-found');
      const pd = document.getElementById('product-detail');
      if (nf && pd && pd.hidden) nf.hidden = false;
    }
  }

  // Este script se carga DESPUÉS del contenido en las 4 páginas, así que el
  // DOM que necesitamos ya existe y no esperamos a DOMContentLoaded: un
  // <script> de terceros situado más abajo lo retrasaría y el catálogo
  // tardaría en aparecer. Si algún día se moviera a <head>, document.body
  // sería null y caeríamos al comportamiento clásico.
  if (document.body) {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start);
  }

  // Expuesto para depuración / reutilización.
  window.GalaBlock = { formatBytes, encodePath, normalize, createCard };
})();
