# Lina Pokémon Libre

**Todas las cartas de Eevee, Vulpix, Minccino y Cinccino, de todos los sets.** Marca las que tienes, descubre las que te faltan y llévate la lista a la tienda. Gratis, sin cuenta, sin anuncios y sin suscripción.

👉 **[applibre.github.io/lina-pokemon-libre](https://applibre.github.io/lina-pokemon-libre/)**

Es la hermana de [Pokémon Libre](https://applibre.github.io/pokemon-libre/): la misma app, para otra colección. Tus marcas de una y otra no se mezclan.

---

## Qué trae

Las cartas de **Eevee** y **Vulpix** (también la de Alola) —solo ellos, sin sus evoluciones— y de **Minccino** y **Cinccino**, en inglés desde el Base Set de 1999 y en japonés, con sus variantes.

Se reúnen por **número de Pokédex**, no por nombre: así entran «Eevee & Snorlax GX», y se quedan fuera los Entrenadores que solo llevan el nombre. Fuera también las de **Pokémon TCG Pocket** (son del juego de móvil) y las **cartas gigantes** (oversize).

## Qué hace

- **Un toque = la tengo.** Otro toque la quita. Manteniendo pulsada, se abre en grande y en 3D.
- **Normal, Holo, Reverse, 1.ª edición:** cada una con su contador, en la ficha de la carta.
- **Las variantes especiales son otra carta** (el sello de Prerelease, Pokémon Day, Cosmos Holo, Prize Pack…), con su foto, y la ficha dice **en qué se distingue**. Solo es variante lo que se ve distinto en la carta; se revisaron una a una.
- **Lo que te falta, listo para la tienda,** con el precio orientativo.
- **Inglés y japonés,** como dos colecciones aparte.
- **Funciona sin internet** y se instala en la pantalla de inicio.
- **Novedades:** cada semana busca cartas nuevas y te pregunta en la app si añadirlas.

## Dónde viven tus datos

En tu dispositivo y en ningún sitio más. Si borras los datos del navegador, se van: usa la copia de seguridad de Ajustes. En iPhone, instálala en la pantalla de inicio.

## Cómo se genera el catálogo

El mismo proceso que Pokémon Libre (ver su README), con `scripts/objetivos.json` apuntando a Eevee, Vulpix, Minccino y Cinccino:

```bash
python scripts/japonesas.py sets && python scripts/japonesas.py cartas && python scripts/japonesas.py fichas && python scripts/japonesas.py detalles
node scripts/catalogo.mjs
node scripts/rescate-imagenes.mjs && node scripts/rescate-bulbapedia.mjs && python scripts/rescate-tcgplayer.py
python scripts/bajar-imagenes.py
python scripts/tcgcollector.py && python scripts/tcgplayer.py
python scripts/traer-variantes.py && python scripts/traer-imagenes-variantes.py
bash scripts/publicar.sh
```

## Construir

La app está en `app/` (Svelte 5 + Vite). `cd app && npm install && node construir.mjs` la construye en la raíz del repositorio, que es lo que publica GitHub Pages. Pruebas: `node --test tests/dominio.test.js` y `app/pruebas/`.

## Licencia y créditos

GPL-3.0. El efecto 3D de las cartas está adaptado de [pokemon-cards-css](https://github.com/simeydotme/pokemon-cards-css) (GPL-3.0), de simeydotme. Los datos vienen de TCGdex, TCG Collector, TCGplayer y Pokellector.

Proyecto de aficionado de **[applibre](https://github.com/applibre)**. Sin relación con Nintendo, Creatures, GAME FREAK ni The Pokémon Company. Las imágenes de las cartas son propiedad de sus autores y se muestran únicamente para llevar el control de una colección personal.
