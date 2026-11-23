---
hide:
  - toc
---

# Resultados de las pruebas

Este es el estado de **todas** las pruebas automáticas de Desco en su última corrida completa. Cada número
sale de los reportes que generan las propias herramientas (JUnit, Vitest, Playwright y k6), no de un
conteo a mano. La lista de cada prueba, una por una, está en el [catálogo](catalogo.md).

<div class="cifras" markdown>
<div class="cifra"><span class="cifra-valor">608</span><span class="cifra-nombre">pruebas automáticas, todas pasan</span></div>
<div class="cifra"><span class="cifra-valor">0</span><span class="cifra-nombre">fallas en backend, web, E2E y app móvil</span></div>
<div class="cifra"><span class="cifra-valor">103 063</span><span class="cifra-nombre">verificaciones en las pruebas de carga, 0 fallidas</span></div>
<div class="cifra"><span class="cifra-valor">4</span><span class="cifra-nombre">proyectos probados: backend, web, E2E y app</span></div>
</div>

## Por proyecto

<figure class="figura-grafica" markdown>
<svg class="grafica" viewBox="0 0 760 210" role="img" aria-labelledby="suites-t suites-d" xmlns="http://www.w3.org/2000/svg"><title id="suites-t">Pruebas por proyecto</title><desc id="suites-d">608 pruebas automáticas en total; todas pasan.</desc><g class="fila"><title>Backend web · b-sheet: 200 pruebas, todas pasan, en 8 s</title><rect class="zona-hover" x="0" y="14" width="760" height="40"/><text class="t1" x="220" y="33" text-anchor="end" font-size="13" font-weight="600">Backend web · b-sheet</text><text class="t3" x="220" y="48" text-anchor="end" font-size="11.5">JUnit 5 + Micronaut Test</text><rect class="barra" x="234" y="22" width="313.0" height="18" rx="4"/><text class="t1" x="555.0" y="36" font-size="12.5" font-weight="600">200</text></g><g class="fila"><title>Web · f-sheet: 285 pruebas, todas pasan, en 4 s</title><rect class="zona-hover" x="0" y="54" width="760" height="40"/><text class="t1" x="220" y="73" text-anchor="end" font-size="13" font-weight="600">Web · f-sheet</text><text class="t3" x="220" y="88" text-anchor="end" font-size="11.5">Vitest + Testing Library</text><rect class="barra" x="234" y="62" width="446.0" height="18" rx="4"/><text class="t1" x="688.0" y="76" font-size="12.5" font-weight="600">285</text></g><g class="fila"><title>Punta a punta · f-sheet: 102 pruebas, todas pasan, en ≈ 3 min</title><rect class="zona-hover" x="0" y="94" width="760" height="40"/><text class="t1" x="220" y="113" text-anchor="end" font-size="13" font-weight="600">Punta a punta · f-sheet</text><text class="t3" x="220" y="128" text-anchor="end" font-size="11.5">Playwright (escritorio y móvil)</text><rect class="barra" x="234" y="102" width="159.6" height="18" rx="4"/><text class="t1" x="401.6" y="116" font-size="12.5" font-weight="600">102</text></g><g class="fila"><title>App móvil · mbl-sheet: 21 pruebas, todas pasan, en 0.4 s</title><rect class="zona-hover" x="0" y="134" width="760" height="40"/><text class="t1" x="220" y="153" text-anchor="end" font-size="13" font-weight="600">App móvil · mbl-sheet</text><text class="t3" x="220" y="168" text-anchor="end" font-size="11.5">JUnit 4</text><rect class="barra" x="234" y="142" width="32.9" height="18" rx="4"/><text class="t1" x="274.9" y="156" font-size="12.5" font-weight="600">21</text></g></svg>
<figcaption>Pruebas que pasan en cada proyecto y cuánto tarda la suite completa.</figcaption>
</figure>

??? info "Ver como tabla"
    | Proyecto | Herramienta | Pruebas | Pasan | Omitidas | Duración |
    | --- | --- | ---: | ---: | ---: | ---: |
    | Backend web · b-sheet | JUnit 5 + Micronaut Test | 201 | 200 | 1 | 8 s |
    | Web · f-sheet | Vitest + Testing Library | 285 | 285 | 0 | 4 s |
    | Punta a punta · f-sheet | Playwright (escritorio y móvil) | 102 | 102 | 0 | ≈ 3 min |
    | App móvil · mbl-sheet | JUnit 4 | 21 | 21 | 0 | 0.4 s |

!!! note "Las que no cuentan"
    - **1 omitida en el backend**: `NeonDatabaseTest` comprueba que todas las migraciones estén aplicadas en
      la base de Neon; solo corre cuando existe la variable `FLYWAY_URL`, así que en una corrida local se
      salta sola.
    - **5 pruebas instrumentadas de la app** (`EcoVerdeEndToEndTest`) necesitan un teléfono o emulador
      Android, así que no forman parte de la corrida automática. Están listadas en el catálogo.

## Por tamaño de prueba

Arriba, pocas pruebas grandes y lentas (el navegador completo); abajo, pruebas de una sola pieza que corren
en milisegundos. El nivel más grande es el de integración porque las **pantallas** de la web se prueban con
un backend falso y la **API** con el handler real de Lambda: prueban varias piezas juntas, pero siguen
tardando segundos, no minutos, así que se pueden correr en cada cambio.

<figure class="figura-grafica" markdown>
<svg class="grafica" viewBox="0 0 760 250" role="img" aria-labelledby="pir-t pir-d" xmlns="http://www.w3.org/2000/svg"><title id="pir-t">Pruebas de Desco por tamaño</title><desc id="pir-d">101 de punta a punta, 304 de integración y 201 unitarias.</desc><g class="fila"><title>Punta a punta: 102 pruebas. La app completa en el navegador contra el backend real</title><rect class="nivel nivel-0" x="222.6" y="18" width="314.9" height="62" rx="8"/><text class="tn1 nivel-t-0" x="380" y="46" text-anchor="middle" font-size="15" font-weight="700">Punta a punta</text><text class="tn2 nivel-t-0" x="380" y="65" text-anchor="middle" font-size="12.5">Playwright · 102</text></g><g class="fila"><title>Integración: 303 pruebas. Varias piezas juntas: Postgres real, el handler de Lambda, pantallas con un backend falso</title><rect class="nivel nivel-1" x="70.0" y="92" width="620.0" height="62" rx="8"/><text class="tn1 nivel-t-1" x="380" y="120" text-anchor="middle" font-size="15" font-weight="700">Integración</text><text class="tn2 nivel-t-1" x="380" y="139" text-anchor="middle" font-size="12.5">adaptadores, API y pantallas · 303</text></g><g class="fila"><title>Unitarias: 203 pruebas. Una pieza sola, sin red ni base de datos: milisegundos</title><rect class="nivel nivel-2" x="145.9" y="166" width="468.2" height="62" rx="8"/><text class="tn1 nivel-t-2" x="380" y="194" text-anchor="middle" font-size="15" font-weight="700">Unitarias</text><text class="tn2 nivel-t-2" x="380" y="213" text-anchor="middle" font-size="12.5">dominio, casos de uso, lógica, componentes y app · 203</text></g></svg>
<figcaption>Todas las pruebas de los cuatro proyectos, agrupadas por tamaño.</figcaption>
</figure>


## Backend por capa

<figure class="figura-grafica" markdown>
<svg class="grafica" viewBox="0 0 760 210" role="img" aria-labelledby="capas-b-t capas-b-d" xmlns="http://www.w3.org/2000/svg"><title id="capas-b-t">Pruebas del backend por capa</title><desc id="capas-b-d">200 pruebas del backend repartidas por capa de Clean Architecture.</desc><g class="fila"><title>Dominio: 23 pruebas</title><rect class="zona-hover" x="0" y="14" width="760" height="32"/><text class="t1" x="220" y="33" text-anchor="end" font-size="13" font-weight="600">Dominio</text><rect class="barra" x="234" y="22" width="109.1" height="18" rx="4"/><text class="t1" x="351.1" y="36" font-size="12.5" font-weight="600">23</text></g><g class="fila"><title>Casos de uso: 27 pruebas</title><rect class="zona-hover" x="0" y="46" width="760" height="32"/><text class="t1" x="220" y="65" text-anchor="end" font-size="13" font-weight="600">Casos de uso</text><rect class="barra" x="234" y="54" width="128.1" height="18" rx="4"/><text class="t1" x="370.1" y="68" font-size="12.5" font-weight="600">27</text></g><g class="fila"><title>Adaptadores: 43 pruebas</title><rect class="zona-hover" x="0" y="78" width="760" height="32"/><text class="t1" x="220" y="97" text-anchor="end" font-size="13" font-weight="600">Adaptadores</text><rect class="barra" x="234" y="86" width="204.0" height="18" rx="4"/><text class="t1" x="446.0" y="100" font-size="12.5" font-weight="600">43</text></g><g class="fila"><title>API: 94 pruebas</title><rect class="zona-hover" x="0" y="110" width="760" height="32"/><text class="t1" x="220" y="129" text-anchor="end" font-size="13" font-weight="600">API</text><rect class="barra" x="234" y="118" width="446.0" height="18" rx="4"/><text class="t1" x="688.0" y="132" font-size="12.5" font-weight="600">94</text></g><g class="fila"><title>Configuración y esquema: 13 pruebas</title><rect class="zona-hover" x="0" y="142" width="760" height="32"/><text class="t1" x="220" y="161" text-anchor="end" font-size="13" font-weight="600">Configuración y esquema</text><rect class="barra" x="234" y="150" width="61.7" height="18" rx="4"/><text class="t1" x="303.7" y="164" font-size="12.5" font-weight="600">13</text></g></svg>
<figcaption>Cada capa se prueba con la herramienta que le corresponde: el dominio sin nada alrededor; los adaptadores contra un PostgreSQL real.</figcaption>
</figure>

| Capa | Qué se prueba | Con qué |
| --- | --- | --- |
| Dominio | Reglas del negocio: valores válidos de estado, resultado, rol, tipo de imagen | Nada más que Java |
| Casos de uso | Gestionar cuentas, consultar análisis, árboles, zonas, seguimiento | Puertos falsos en memoria |
| Adaptadores | Consultas SQL, bcrypt, URL firmadas de S3 | PostgreSQL real en Docker |
| API | Cada endpoint: permisos por rol, errores, formato JSON | El handler real de Lambda con eventos de API Gateway |
| Configuración y esquema | Migraciones de producción, secretos, rutas, borrado en cascada | Micronaut + PostgreSQL |

## Web por nivel

<figure class="figura-grafica" markdown>
<svg class="grafica" viewBox="0 0 760 178" role="img" aria-labelledby="capas-w-t capas-w-d" xmlns="http://www.w3.org/2000/svg"><title id="capas-w-t">Pruebas de la web por nivel</title><desc id="capas-w-d">285 pruebas de Vitest; la lógica pura concentra la mayoría.</desc><g class="fila"><title>Lógica pura: 115 pruebas</title><rect class="zona-hover" x="0" y="14" width="760" height="32"/><text class="t1" x="220" y="33" text-anchor="end" font-size="13" font-weight="600">Lógica pura</text><rect class="barra" x="234" y="22" width="348.9" height="18" rx="4"/><text class="t1" x="590.9" y="36" font-size="12.5" font-weight="600">115</text></g><g class="fila"><title>Componentes: 17 pruebas</title><rect class="zona-hover" x="0" y="46" width="760" height="32"/><text class="t1" x="220" y="65" text-anchor="end" font-size="13" font-weight="600">Componentes</text><rect class="barra" x="234" y="54" width="51.6" height="18" rx="4"/><text class="t1" x="293.6" y="68" font-size="12.5" font-weight="600">17</text></g><g class="fila"><title>Pantallas: 147 pruebas</title><rect class="zona-hover" x="0" y="78" width="760" height="32"/><text class="t1" x="220" y="97" text-anchor="end" font-size="13" font-weight="600">Pantallas</text><rect class="barra" x="234" y="86" width="446.0" height="18" rx="4"/><text class="t1" x="688.0" y="100" font-size="12.5" font-weight="600">147</text></g><g class="fila"><title>Aplicación: 6 pruebas</title><rect class="zona-hover" x="0" y="110" width="760" height="32"/><text class="t1" x="220" y="129" text-anchor="end" font-size="13" font-weight="600">Aplicación</text><rect class="barra" x="234" y="118" width="18.2" height="18" rx="4"/><text class="t1" x="260.2" y="132" font-size="12.5" font-weight="600">6</text></g></svg>
<figcaption>Lógica pura = funciones que reciben datos y devuelven datos; se prueban sin navegador.</figcaption>
</figure>


## Punta a punta

Las 102 pruebas de Playwright recorren la plataforma como lo haría una persona: inician sesión, navegan,
filtran, abren fotos y administran cuentas, en **Chrome de escritorio y en un teléfono emulado**, contra el
backend real con su base de datos. Cada corrida deja capturas de cada paso y un reporte HTML.

## App móvil

Las 21 pruebas unitarias de la app se organizan por fases del desarrollo:

| Fase | Qué cubre | Pruebas |
| --- | --- | ---: |
| Phase1AuthAndSessionTest | Inicio de sesión contra el backend, sesión sin conexión, recuperación de contraseña y hash | 4 |
| Phase2DomainUseCaseTest | Análisis de color de la imagen, validación de formato y tamaño, árbol o zona (exclusión) | 4 |
| Phase3VisionEngineTest | Umbrales HSV de corteza y follaje, porcentajes e inferencia híbrida nube/local | 4 |
| Phase4PersistenceAndSyncTest | Entidades de Room y su conversión al dominio | 3 |
| Phase5PresentationUiStateTest | Historial, filtros y progresión por árbol y por zona | 6 |

## Cómo correrlas

| Proyecto | Comando | Requisito |
| --- | --- | --- |
| b-sheet | `./mvnw test` | Docker con PostgreSQL (`docker compose up -d db`) |
| f-sheet | `pnpm test` | Node y pnpm |
| f-sheet E2E | `pnpm test:e2e:evidencia` | b-sheet corriendo (`e2e/iniciar-backend.sh`) |
| mbl-sheet | `./gradlew testDebugUnitTest` | Android SDK |
| Carga (k6) | `./estres/correr.sh carga` | Docker; ver [Rendimiento](rendimiento.md) |

Las suites del backend, de la web (Vitest) y de la app móvil corren en GitHub Actions en cada *pull
request*: si una falla, el cambio no se puede integrar. Las de punta a punta necesitan el backend con su base
de datos, así que se corren antes de cada liberación y dejan su evidencia (capturas y reporte).
