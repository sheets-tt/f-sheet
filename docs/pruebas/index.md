---
hide:
  - toc
---

# Cómo se prueba Desco

Cada función de Desco nace de una prueba que falla (TDD), y la arquitectura en capas (Clean Architecture)
hace que cada capa se pueda probar sola. El resultado: **608 pruebas automáticas, todas en verde**. El
detalle está en [Resultados](resultados.md), qué prueba cubre cada parte en el [Mapa de pruebas](mapa.md)
y cada prueba, una por una, en el [Catálogo](catalogo.md).

<div class="cifras" markdown>
<div class="cifra"><span class="cifra-valor">200</span><span class="cifra-nombre">pruebas del backend (JUnit), por capa</span></div>
<div class="cifra"><span class="cifra-valor">285</span><span class="cifra-nombre">pruebas de la web (Vitest), en unos 12 s</span></div>
<div class="cifra"><span class="cifra-valor">102</span><span class="cifra-nombre">pruebas de punta a punta (Playwright), en unos 3 min</span></div>
<div class="cifra"><span class="cifra-valor">21</span><span class="cifra-nombre">pruebas de la app móvil (JUnit)</span></div>
</div>

## TDD: primero la prueba, después el código

*Test Driven Development* es trabajar en ciclos cortos de tres pasos:

<figure class="figura-grafica">
<svg class="grafica" viewBox="0 0 760 200" role="img" aria-labelledby="tdd-t" xmlns="http://www.w3.org/2000/svg">
<title id="tdd-t">El ciclo de TDD: rojo, verde y refactor</title>
<defs><marker id="tdd-flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="flecha-punta" d="M0 0L10 5L0 10z"/></marker></defs>
<g class="paso paso-rojo"><rect x="24" y="40" width="210" height="110" rx="12"/>
<text class="t1" x="129" y="72" text-anchor="middle" font-size="15" font-weight="700">1 · Rojo</text>
<text class="t2" x="129" y="98" text-anchor="middle" font-size="12.5">Escribe una prueba de lo que</text>
<text class="t2" x="129" y="116" text-anchor="middle" font-size="12.5">debe pasar. Falla: aún no existe.</text></g>
<g class="paso paso-verde"><rect x="275" y="40" width="210" height="110" rx="12"/>
<text class="t1" x="380" y="72" text-anchor="middle" font-size="15" font-weight="700">2 · Verde</text>
<text class="t2" x="380" y="98" text-anchor="middle" font-size="12.5">Escribe el código mínimo</text>
<text class="t2" x="380" y="116" text-anchor="middle" font-size="12.5">para que la prueba pase.</text></g>
<g class="paso paso-refactor"><rect x="526" y="40" width="210" height="110" rx="12"/>
<text class="t1" x="631" y="72" text-anchor="middle" font-size="15" font-weight="700">3 · Refactor</text>
<text class="t2" x="631" y="98" text-anchor="middle" font-size="12.5">Mejora el código sin miedo:</text>
<text class="t2" x="631" y="116" text-anchor="middle" font-size="12.5">las pruebas te avisan.</text></g>
<g class="conector" fill="none"><path d="M234 95H271" marker-end="url(#tdd-flecha)"/><path d="M485 95H522" marker-end="url(#tdd-flecha)"/>
<path d="M631 150V178H129V154" marker-end="url(#tdd-flecha)"/></g>
<text class="t3" x="380" y="194" text-anchor="middle" font-size="12">y se repite con el siguiente caso</text>
</svg>
<figcaption>Cada vuelta dura minutos; al terminar, la función ya tiene su prueba.</figcaption>
</figure>

Un ejemplo real del proyecto: antes de escribir la gestión de cuentas se escribió la prueba
*«un administrador no puede desactivar su propia cuenta»*. Falló (rojo), se agregó la regla en el caso de
uso `GestionarCuentas` (verde) y luego se ordenó el código (refactor). Esa prueba sigue corriendo en cada
cambio: si alguien rompe la regla, el pipeline lo detiene antes de llegar a producción.

## Clean Architecture: capas que se prueban solas

El backend (b-sheet) está dividido en capas. La regla es que **las dependencias apuntan hacia adentro**: el
dominio no sabe nada de la base de datos ni de AWS; los casos de uso piden lo que necesitan a través de
*puertos* (interfaces) y los adaptadores de afuera los implementan.

<figure class="figura-grafica">
<svg class="grafica" viewBox="0 0 760 330" role="img" aria-labelledby="capas-t" xmlns="http://www.w3.org/2000/svg">
<title id="capas-t">Capas de b-sheet y cuántas pruebas tiene cada una</title>
<g class="capa capa-4"><rect x="24" y="16" width="712" height="300" rx="16"/>
<text class="t1" x="44" y="44" font-size="14" font-weight="700">API · controladores y handler de Lambda</text>
<text class="t2" x="716" y="44" text-anchor="end" font-size="12.5">94 pruebas · evento real de API Gateway</text></g>
<g class="capa capa-3"><rect x="56" y="62" width="648" height="230" rx="14"/>
<text class="t1" x="76" y="90" font-size="14" font-weight="700">Adaptadores · PostgreSQL (JDBC), S3, bcrypt</text>
<text class="t2" x="684" y="90" text-anchor="end" font-size="12.5">43 pruebas · Postgres real en Docker</text></g>
<g class="capa capa-2"><rect x="88" y="108" width="584" height="160" rx="12"/>
<text class="t1" x="108" y="136" font-size="14" font-weight="700">Casos de uso · GestionarCuentas…</text>
<text class="t2" x="652" y="136" text-anchor="end" font-size="12.5">27 pruebas · puertos falsos en memoria</text></g>
<g class="capa capa-1"><rect x="120" y="154" width="520" height="90" rx="10"/>
<text class="t1" x="380" y="190" text-anchor="middle" font-size="14" font-weight="700">Dominio · reglas del negocio</text>
<text class="t2" x="380" y="214" text-anchor="middle" font-size="12.5">23 pruebas · sin base de datos ni red, milisegundos</text></g>
</svg>
<figcaption>Las dependencias apuntan hacia el centro. Más 14 pruebas de configuración y esquema: 201 ejecuciones, 200 pasan y 1 se omite (la de Neon, que requiere sus credenciales).</figcaption>
</figure>

## Por qué encajan tan bien

| Sin Clean Architecture | Con Clean Architecture |
| --- | --- |
| Probar una regla obliga a levantar la base de datos, AWS y el servidor | La regla vive en el dominio o en un caso de uso: se prueba sola, en milisegundos |
| Una prueba lenta desanima a escribirla primero | Pruebas rápidas hacen natural el ciclo rojo → verde → refactor |
| Cambiar de base de datos rompe las pruebas del negocio | Se cambia el adaptador; las pruebas del dominio y de los casos de uso no se tocan |
| Un error aparece en producción | Cada capa tiene su red: dominio, casos de uso, adaptadores contra Postgres real y API con el handler real |

En otras palabras: **TDD pide pruebas rápidas y aisladas, y Clean Architecture es justo lo que las hace
posibles**. Los *puertos* son el punto de unión: en las pruebas de casos de uso se conectan versiones falsas
en memoria, y en producción, los adaptadores reales.

## Y en la web

La web (f-sheet) sigue la misma idea con su propia pirámide:

| Nivel | Qué prueba | Herramienta | Ejemplos |
| --- | --- | --- | --- |
| Lógica pura | Cálculos sin pantalla: filtros, fechas, gráficas, validaciones | Vitest | `graficos.ts`, `analisis.ts`, `cuentas.ts` |
| Componentes y pantallas | Lo que ve y hace el usuario, con un backend falso | Vitest + Testing Library | Cajas de Análisis, formulario de cuentas |
| Punta a punta | La app completa contra el backend real, en Chrome y en móvil | Playwright | Crear una cuenta y entrar con ella; ir del Resumen al seguimiento de un árbol |

Las pruebas de punta a punta dejan **evidencia**: capturas de cada paso, un reporte HTML y un resumen con el
resultado y la duración de cada prueba (`pnpm test:e2e:evidencia`).
