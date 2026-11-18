import type { Analisis, Cromatico, EstadoSincronizacion, Resultado } from './api'

// Cómo se le dice cada cosa a quien usa la web: agrónomos y personal de sanidad forestal, no
// quien entrenó el modelo. Todo el texto de resultados, certeza, color del follaje, envío,
// autor y observaciones sale de aquí, para que cada pantalla diga lo mismo con las mismas palabras.
// Los términos técnicos (modelo, confianza, cromático, pct_*, sincronización) solo aparecen en el
// «Detalle técnico» del detalle de un análisis.

// ---------------------------------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------------------------------
/** Etiqueta corta (cajas, leyendas, tablas, filtros). */
export const ETIQUETA_RESULTADO: Record<Resultado, string> = {
  sano: 'Sano',
  infestado: 'Infestado',
  no_determinado: 'Sin diagnóstico claro',
}

/** Qué significa cada resultado, en una frase corta. */
export const SENTIDO_RESULTADO: Record<Resultado, string> = {
  sano: 'Sin señales de descortezador',
  infestado: 'Señales de descortezador',
  no_determinado: 'Conviene repetir la foto',
}

/** "Infestado: señales de descortezador". */
export const fraseResultado = (r: Resultado) => `${ETIQUETA_RESULTADO[r]}: ${SENTIDO_RESULTADO[r].toLowerCase()}`

// ---------------------------------------------------------------------------------------------
// Certeza del diagnóstico (lo que el modelo llama «confianza»)
// ---------------------------------------------------------------------------------------------
export type NivelCerteza = 'alta' | 'media' | 'baja' | 'sin'

export const TITULO_CERTEZA = 'Certeza del diagnóstico'

export const ETIQUETA_CERTEZA: Record<NivelCerteza, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
  sin: 'Sin dato',
}

export const RANGO_CERTEZA: Record<NivelCerteza, string> = {
  alta: '80 % o más',
  media: 'de 50 % a menos de 80 %',
  baja: 'menos de 50 %',
  sin: 'la foto no trae certeza',
}

// ---------------------------------------------------------------------------------------------
// Qué hacer
// ---------------------------------------------------------------------------------------------
/** Recomendación para quien va a campo, según el resultado y la certeza. */
export function queHacer(r: Resultado, nivel: NivelCerteza, lugar: 'arbol' | 'zona' | null): string {
  const baja = nivel === 'baja'
  if (r === 'infestado') {
    const base =
      lugar === 'zona'
        ? 'Recorre la zona en campo, marca los árboles afectados y avisa al responsable de sanidad forestal.'
        : 'Inspecciona el árbol en campo, márcalo y avisa al responsable de sanidad forestal.'
    return baja ? `${base} Como la certeza es baja, confírmalo en campo antes de tomar medidas.` : base
  }
  if (r === 'no_determinado') return 'Repite la foto con buena luz, de cerca y con la corteza o el follaje bien enfocados.'
  return baja ? 'Sigue con el monitoreo. Como la certeza es baja, conviene repetir la foto para confirmarlo.' : 'Sigue con el monitoreo de costumbre.'
}

// ---------------------------------------------------------------------------------------------
// Color del follaje (lo que el modelo llama «análisis cromático»)
// ---------------------------------------------------------------------------------------------
export const TITULO_FOLLAJE = 'Color del follaje'
export const SENTIDO_FOLLAJE =
  'Qué parte del follaje se ve sana, regular (amarillenta), dañada (rojiza o seca) o incierta (no se distingue en la foto).'

export interface ParteFollaje {
  clave: 'sano' | 'regular' | 'danado' | 'incierto'
  etiqueta: string
  valor: number
  color: string
}

/** Partes de la barra del color del follaje; los colores de estado se conservan. */
export function partesFollaje(c: Cromatico): ParteFollaje[] {
  return [
    { clave: 'sano', etiqueta: 'Sano', valor: c.pctSano, color: 'c-sano' },
    { clave: 'regular', etiqueta: 'Regular', valor: c.pctRegular, color: 'c-regular' },
    { clave: 'danado', etiqueta: 'Dañado', valor: c.pctDanado, color: 'c-infestado' },
    { clave: 'incierto', etiqueta: 'Incierto', valor: c.pctIncierto, color: 'c-neutro' },
  ]
}

// ---------------------------------------------------------------------------------------------
// Envío desde el móvil (lo que el backend llama «sincronización»)
// ---------------------------------------------------------------------------------------------
export const TITULO_ENVIO = 'Envío desde el móvil'

export const ETIQUETA_ENVIO: Record<EstadoSincronizacion, string> = {
  sincronizado: 'Enviado',
  pendiente: 'Pendiente',
  error: 'Con error',
}

// ---------------------------------------------------------------------------------------------
// Quién subió la foto y lo que escribió
// ---------------------------------------------------------------------------------------------
export const SIN_AUTOR = 'Autor no registrado'

/** "Subido por Ana López" o "Autor no registrado" (análisis anteriores a que se guardara). */
export const subidoPor = (a: Pick<Analisis, 'autor'>) => (a.autor ? `Subido por ${a.autor.nombre}` : SIN_AUTOR)

export const TITULO_OBSERVACIONES = 'Observaciones de campo'

/** Las observaciones sin espacios sobrantes; null si no hay nada escrito. */
export function observacionesDe(a: Pick<Analisis, 'observaciones'>): string | null {
  const t = a.observaciones?.trim()
  return t ? t : null
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** "3 personas le dan seguimiento a este árbol" (solo tiene sentido con 2 o más). */
export function fraseSeguimiento(personas: number, lugar: 'arbol' | 'zona'): string {
  return `${plural(personas, 'persona le da', 'personas le dan')} seguimiento a ${lugar === 'arbol' ? 'este árbol' : 'esta zona'}`
}
