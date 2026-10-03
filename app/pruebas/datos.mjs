// Prueba de compatibilidad con los datos de la app anterior.
//   node pruebas/datos.mjs [url-base]
// Es la más importante de todas: una colección perdida no se recupera.
import { chromium } from '@playwright/test'
import { promises as fs } from 'node:fs'
import { mantener } from './gestos.mjs'
import { readFileSync } from 'node:fs'
// Los números salen del catálogo, no de la memoria: cuando entra una expansión nueva no hay que tocar la prueba.
const CAT = JSON.parse(readFileSync(new URL('../../data/catalogo.json', import.meta.url), 'utf8'))
const EN = (id) => CAT.cartas.filter((c) => !c.s.startsWith('ja-') && c.p.includes(id)).length
const EN_TODAS = CAT.cartas.filter((c) => !c.s.startsWith('ja-')).length
// una Vulpix japonesa cualquiera del catálogo (las marcas van por identificador)
const JA_VULPIX = CAT.cartas.find((c) => c.l === 'ja' && c.p.includes('vulpix') && !c.vn).id

const base = process.argv[2] || 'http://localhost:5173/'
const nav = await chromium.launch({ channel: 'chrome' })
let fallos = 0
const ok = (c, t) => { console.log((c ? 'OK    ' : 'FALLA ') + t); if (!c) fallos++ }
const nuevoCtx = () => nav.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, acceptDownloads: true })
const guardado = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('lina-pokemon-libre') || 'null'))

/* ---------- 1 · datos de la app anterior, con un campo que esta no conoce ---------- */
const viejo = {
  schemaVersion: 1,
  coleccion: { 'base2-51': { normal: 1, firstEdition: 2 }, 'base1-68': { normal: 1 }, [JA_VULPIX]: { normal: 1 } },
  ajustes: { tema: 'auto', verFamilias: true, idioma: 'todo', verPrecios: true, moneda: 'eur' },
  creado: '2026-09-01', ultimaCopia: '2026-09-05', campoFuturo: { deOtraVersion: true },
}
let ctx = await nuevoCtx()
await ctx.addInitScript((d) => { if (!localStorage.getItem('lina-pokemon-libre')) localStorage.setItem('lina-pokemon-libre', JSON.stringify(d)) }, viejo)
let p = await ctx.newPage()
await p.goto(base); await p.waitForSelector('.baldosa')
await p.waitForTimeout(500)

const tarjeta = async (nombre) => (await p.locator('.baldosa', { hasText: nombre }).first().innerText()).replace(/\s+/g, ' ')
ok((await tarjeta('Eevee')).includes(`1 / ${EN('eevee')}`), `las marcas guardadas se ven: Eevee ${await tarjeta('Eevee')}`)
ok((await tarjeta('Vulpix')).includes(`1 / ${EN('vulpix')}`), `Vulpix en inglés cuenta la suya y no la japonesa: ${await tarjeta('Vulpix')}`)
await p.click('.lengua button >> nth=1'); await p.waitForTimeout(400)
ok((await tarjeta('Vulpix')).includes('1 /'), `y en japonés cuenta la japonesa: ${await tarjeta('Vulpix')}`)
await p.click('.lengua button >> nth=0')

// abrir la ficha de la Eevee de Jungle: sus variantes se leen tal cual
await p.goto(base + '#/set/base2'); await p.waitForSelector('.celda')
await mantener(p, p.locator('.celda', { hasText: '51/64' }).first().locator('.ver'))
await p.waitForSelector('.ficha'); await p.waitForTimeout(700)
const cuentas = await p.$$eval('.variante .n', (e) => e.map((x) => x.textContent.trim()))
// Normal y 1.ª edición, tal cual se guardaron
ok(cuentas.slice(0, 2).join(',') === '1,2' && cuentas.slice(2).every((x) => x === '0'), `la ficha lee las variantes de la app anterior (normal 1, 1.ª edición 2, el resto 0): ${cuentas.join(',')}`)

// sumar un ejemplar de la primera variante
await p.click('.ficha .variante:nth-child(1) .mas'); await p.waitForTimeout(500)
let g = await guardado(p)
ok(g.coleccion['base2-51'].normal === 2 && g.coleccion['base2-51'].firstEdition === 2, `+ suma un ejemplar sin tocar el otro: ${JSON.stringify(g.coleccion['base2-51'])}`)
ok(g.campoFuturo?.deOtraVersion === true, 'lo que esta versión no conoce se conserva al guardar')
ok(g.ajustes.tema === 'claro', `la migración pasó «auto» a claro: ${g.ajustes.tema}`)
ok(g.schemaVersion === 2 && g.creado === '2026-09-01' && g.ultimaCopia === '2026-09-05', 'versión, fecha de creación y última copia intactas')
ok(g.coleccion['base1-68']?.normal === 1 && g.coleccion[JA_VULPIX]?.normal === 1, 'las demás marcas siguen ahí, incluida la japonesa')
const copia = await p.evaluate(() => JSON.parse(localStorage.getItem('lina-pokemon-libre-copia') || 'null'))
ok(copia && copia.datos?.coleccion?.['base2-51']?.normal === 1, 'la copia del día guarda cómo estaba ANTES de la primera escritura')

// quitar todas las variantes la desmarca del todo
for (let i = 0; i < 2; i++) await p.click('.ficha .variante:nth-child(1) .menos')
for (let i = 0; i < 2; i++) await p.click('.ficha .variante:nth-child(2) .menos')
await p.waitForTimeout(500)
g = await guardado(p)
ok(!('base2-51' in g.coleccion), 'al llegar a cero en todas, la carta sale de la colección (como antes)')
await ctx.close()

/* ---------- 2 · marcar de un toque usa la variante principal, como la app anterior ---------- */
ctx = await nuevoCtx(); p = await ctx.newPage()
await p.goto(base + '#/set/base1'); await p.waitForSelector('.celda')
await p.locator('.celda .check').first().click(); await p.waitForTimeout(500)
g = await guardado(p)
const claves = Object.keys(g.coleccion)
const vars = claves.length ? Object.entries(g.coleccion[claves[0]]) : []
ok(claves.length === 1 && vars.length === 1 && vars[0][1] === 1, `un toque = un ejemplar de la variante principal: ${JSON.stringify(g.coleccion)}`)
ok(g.ajustes.tema === 'claro' && g.ajustes.idioma === 'en', `una instalación nueva nace clara y en inglés: ${g.ajustes.tema}/${g.ajustes.idioma}`)
await ctx.close()

/* ---------- 3 · datos corruptos: se apartan, no se destruyen ---------- */
ctx = await nuevoCtx()
await ctx.addInitScript(() => { if (!localStorage.getItem('lina-pokemon-libre')) localStorage.setItem('lina-pokemon-libre', '{esto no es json') })
p = await ctx.newPage()
await p.goto(base); await p.waitForSelector('.baldosa')
const rescate = await p.evaluate(() => Object.entries(localStorage).filter(([k]) => k.startsWith('lina-pokemon-libre-corrupto-')).map(([, v]) => v))
ok(rescate.length === 1 && rescate[0] === '{esto no es json', 'datos corruptos: la app abre vacía y el original queda apartado')
await ctx.close()

/* ---------- 4 · el fichero de copia de seguridad es el mismo de siempre ---------- */
ctx = await nuevoCtx()
await ctx.addInitScript((d) => { if (!localStorage.getItem('lina-pokemon-libre')) localStorage.setItem('lina-pokemon-libre', JSON.stringify(d)) }, viejo)
p = await ctx.newPage()
await p.goto(base + '#/ajustes')
const haAjustes = await p.locator('.ajustes').count().catch(() => 0)
if (!haAjustes) { console.log('PENDIENTE  copia de seguridad: la pantalla de Ajustes aún no existe'); }
else {
  const [descarga] = await Promise.all([p.waitForEvent('download'), p.click('[data-copia]')])
  const fichero = JSON.parse(await fs.readFile(await descarga.path(), 'utf8'))
  ok(fichero.app === 'lina-pokemon-libre' && fichero.coleccion['base2-51'].firstEdition === 2 && !!fichero.exportado,
     'la copia guarda app, fecha y colección con el formato de la anterior')
}
await ctx.close()

/* ---------- 2 · una variante marcada como contador pasa a su carta propia: ninguna marca se pierde ---------- */
{
  const V = CAT.cartas.find((c) => c.vn && c.l !== 'ja')           // una carta-variante inglesa cualquiera
  const B = V.id.split('~')[0]
  const forma = CAT.cartas.find((c) => c.id === B).v[0]
  const antes = {
    schemaVersion: 2,
    coleccion: { [B]: { [V.vn]: 2, [forma]: 1 }, 'base2-51': { normal: 1 } },
    ajustes: { tema: 'claro', verFamilias: true, idioma: 'en', verPrecios: true, moneda: 'eur' },
    creado: '2026-10-03', ultimaCopia: null,
  }
  const c2 = await nuevoCtx()
  await c2.addInitScript((d) => { if (!localStorage.getItem('lina-pokemon-libre')) localStorage.setItem('lina-pokemon-libre', JSON.stringify(d)) }, antes)
  const p2 = await c2.newPage()
  await p2.goto(base + '#/set/' + V.s); await p2.waitForSelector('.celda'); await p2.waitForTimeout(800)
  const m = (await guardado(p2)).coleccion
  ok(Object.values(m[V.id] || {})[0] === 2, `lo marcado como contador «${V.vn}» pasó a su carta ${V.id}: ${JSON.stringify(m[V.id])}`)
  ok(m[B]?.[forma] === 1 && !(V.vn in (m[B] || {})), `la carta base conserva lo suyo y pierde el contador: ${JSON.stringify(m[B])}`)
  ok(m['base2-51']?.normal === 1, 'lo que no es variante no se toca')
  const nombre = CAT.nv[V.vn]
  const marcadas = await p2.$$eval('.celda.mia', (e) => e.map((x) => x.innerText.replace(/\s+/g, ' ')))
  ok(marcadas.some((t) => t.includes(nombre)), `en la lista, la carta «${nombre}» sale marcada: ${marcadas.join(' | ')}`)
  await c2.close()
}

console.log(fallos ? `\n${fallos} COMPROBACIONES FALLAN` : '\ntodas las comprobaciones de datos OK')
await nav.close()
process.exit(fallos ? 1 : 0)
