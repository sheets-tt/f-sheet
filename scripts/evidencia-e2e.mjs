#!/usr/bin/env node
// Corre todas las pruebas E2E y deja la evidencia en evidencia-e2e/AAAA-MM-DD_HHMMSS/:
//   reporte-html/   el reporte de Playwright, con las capturas de cada paso y las trazas de los fallos
//   resultados.json el resultado de cada prueba (reporter JSON de Playwright)
//   artefactos/     capturas, trazas y videos por prueba
//   resumen.md      tabla prueba → resultado → duración, con fecha, rama y commit
// Uso: pnpm test:e2e:evidencia [argumentos de playwright, p. ej. -g "Análisis"]
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ahora = new Date()
const dos = (n) => String(n).padStart(2, '0')
// Con segundos: dos corridas en el mismo minuto no comparten carpeta.
const sello = `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}_${dos(ahora.getHours())}${dos(ahora.getMinutes())}${dos(ahora.getSeconds())}`
const carpeta = join('evidencia-e2e', sello)
mkdirSync(carpeta, { recursive: true })

/** Salida de git, o null si no hay git o no es un repositorio. */
const git = (...args) => {
  const r = spawnSync('git', args, { encoding: 'utf8' })
  return r.status === 0 ? r.stdout.trim() : null
}

console.log(`Evidencia E2E → ${carpeta}\n`)
const inicio = Date.now()
const corrida = spawnSync('pnpm', ['exec', 'playwright', 'test', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, E2E_EVIDENCIA: carpeta, E2E_PANTALLA_COMPLETA: '1' },
})
const duracionTotal = (Date.now() - inicio) / 1000

// ---- resumen.md a partir del JSON ------------------------------------------------------------
let filas = []
let resultados = null
try {
  resultados = JSON.parse(readFileSync(join(carpeta, 'resultados.json'), 'utf8'))
} catch {
  /* sin JSON (p. ej. falló el arranque del backend): el resumen lo dice */
}

const ETIQUETA = { expected: '✅ pasó', unexpected: '❌ falló', flaky: '⚠️ inestable (pasó al reintentar)', skipped: '⏭️ omitida' }

function recorrer(suite, titulos) {
  const propios = suite.title && !suite.title.endsWith('.ts') ? [...titulos, suite.title] : titulos
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const intentos = t.results ?? []
      const duracion = intentos.reduce((s, r) => s + (r.duration ?? 0), 0)
      const capturas = intentos.flatMap((r) => r.attachments ?? []).filter((a) => a.contentType === 'image/png').length
      filas.push({
        proyecto: t.projectName,
        archivo: spec.file,
        titulo: [...propios, spec.title].join(' › '),
        estado: ETIQUETA[t.status] ?? t.status,
        duracion,
        capturas,
      })
    }
  }
  for (const s of suite.suites ?? []) recorrer(s, propios)
}
for (const s of resultados?.suites ?? []) recorrer(s, [])

const cuenta = (e) => filas.filter((f) => f.estado === ETIQUETA[e]).length
const seg = (ms) => `${(ms / 1000).toFixed(1)} s`
const esc = (t) => t.replaceAll('|', '\\|')

const md = [
  `# Evidencia E2E — ${sello.replace('_', ' ')}`,
  '',
  git('rev-parse', '--short', 'HEAD') === null
    ? '- Fuera de un repositorio git (sin rama ni commit)'
    : `- Rama: \`${git('branch', '--show-current') || '(detached)'}\` · commit \`${git('rev-parse', '--short', 'HEAD')}\`${git('status', '--porcelain') ? ' (con cambios sin commit)' : ''}`,
  `- Pruebas: **${filas.length}** · pasaron ${cuenta('expected')} · fallaron ${cuenta('unexpected')} · inestables ${cuenta('flaky')} · omitidas ${cuenta('skipped')}`,
  `- Duración total: ${duracionTotal.toFixed(0)} s · código de salida de Playwright: ${corrida.status}`,
  '- Reporte con capturas de cada paso y trazas: `pnpm exec playwright show-report ' + join(carpeta, 'reporte-html') + '`',
  '',
  '| # | Proyecto | Archivo | Prueba | Resultado | Duración | Capturas |',
  '|---:|---|---|---|---|---:|---:|',
  ...filas.map((f, i) => `| ${i + 1} | ${f.proyecto} | ${f.archivo} | ${esc(f.titulo)} | ${f.estado} | ${seg(f.duracion)} | ${f.capturas} |`),
  '',
  resultados ? '' : '> No se generó resultados.json: revisa la salida de la terminal (¿el backend no arrancó?).',
].join('\n')
writeFileSync(join(carpeta, 'resumen.md'), md)
console.log(`\nResumen: ${join(carpeta, 'resumen.md')}`)
process.exit(corrida.status ?? 1)
