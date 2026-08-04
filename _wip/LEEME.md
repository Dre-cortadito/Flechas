# _wip — modos de Flechas que NO estan en la web

**Desvio, Rumbo y Flujo no son jugables.** Estan aqui, fuera de `flechas/`,
para que Cloudflare no los sirva. `_wip` tambien esta en `.assetsignore`.

Retirados el 2026-08-04. Lo que se toco al sacarlos:

- `flechas/index.html` — se quitaron las pestanas Rumbo y Flujo (la grilla
  paso de 5 a 3 columnas: Cascada · Clasico · Borde), sus entradas en
  `LAND_MODES`, sus ramas de "Reto del dia", y el alias `?modo=desvio`.
- `Cortadito Games/index.html` y `Cortadito Games/gate.js` — el pool de
  rotacion de Flechas paso a `["borde","cascada","clasico"]`. Antes incluia
  los tres retirados, asi que la rotacion diaria gratis podia ofrecer un modo
  que no se puede jugar.
- `../rumbo.html`, `../desvio.html`, `../flujo.html` (raiz del repo) — eran
  redirecciones a las URL profundas; ahora apuntan a `/flechas`.

## Para volver a publicar uno

1. Mover el archivo de vuelta a `flechas/`.
2. Reponer su entrada en `LAND_MODES` y su pestana en `flechas/index.html`
   (y ajustar `grid-template-columns` de `.land-tabs`).
3. Agregarlo al pool en `Cortadito Games/gate.js` **y** en
   `Cortadito Games/index.html` (son dos copias de la misma lista).
4. Restaurar su redireccion en la raiz del repo si quieres que las URL viejas
   de workers.dev sigan funcionando.
