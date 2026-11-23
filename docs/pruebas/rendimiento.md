---
hide:
  - toc
---

# Rendimiento

Con 20 usuarios a la vez y 20 006 análisis en la base, **el 95 % de las peticiones responde en 23 ms**.
Antes de agregar dos índices a la base de datos, ese mismo escenario tardaba 827 ms.

<div class="cifras" markdown>
<div class="cifra"><span class="cifra-valor">827 → 23 ms</span><span class="cifra-nombre">p95 con 20 usuarios, antes y después de los índices</span></div>
<div class="cifra"><span class="cifra-valor">0 %</span><span class="cifra-nombre">peticiones con error en los 5 escenarios</span></div>
<div class="cifra"><span class="cifra-valor">175 pet/s</span><span class="cifra-nombre">en el pico de 200 usuarios, con p95 de 15 ms</span></div>
</div>

## Un índice cambió todo

`GET /arboles` busca el análisis más reciente de cada árbol. Sin índice, PostgreSQL recorría unas 10 000
filas por árbol; con los índices `V6` (lugar + fecha) va directo a la última. Pasa el mouse sobre un punto
para ver los valores.

<figure class="figura-grafica" markdown>
<svg class="grafica" viewBox="0 0 760 470" role="img" aria-labelledby="g1-t g1-d" xmlns="http://www.w3.org/2000/svg"><title id="g1-t">p95 por endpoint antes y después de los índices V6</title><desc id="g1-d">Con 20 usuarios y 20 006 análisis, GET /arboles bajó de 2 106 ms a 18 ms; el resto ya estaba por debajo de 100 ms salvo el login.</desc><g class="leyenda" font-size="13"><circle class="m-antes" cx="214" cy="30" r="5"/><text class="t2" x="226" y="34">antes (sin índice)</text><circle class="m-despues" cx="370" cy="30" r="5"/><text class="t2" x="382" y="34">después (con índice)</text><text class="t3" x="724" y="34" text-anchor="end">escala logarítmica · ms</text></g><line class="rejilla" x1="214.0" x2="214.0" y1="60" y2="440"/><text class="t3" x="214.0" y="458" text-anchor="middle" font-size="12">1 ms</text><line class="rejilla" x1="360.7" x2="360.7" y1="60" y2="440"/><text class="t3" x="360.7" y="458" text-anchor="middle" font-size="12">10 ms</text><line class="rejilla" x1="507.3" x2="507.3" y1="60" y2="440"/><text class="t3" x="507.3" y="458" text-anchor="middle" font-size="12">100 ms</text><line class="rejilla" x1="654.0" x2="654.0" y1="60" y2="440"/><text class="t3" x="654.0" y="458" text-anchor="middle" font-size="12">1 000 ms</text><g class="fila fila-destacada"><title>GET /arboles: antes 2106 ms, después 18 ms</title><rect class="zona-hover" x="0" y="59.0" width="760" height="26"/><text class="t2" x="200" y="76" text-anchor="end" font-size="12.5" font-weight="600">GET /arboles</text><line class="tramo" x1="398.1" x2="701.5" y1="72" y2="72"/><circle class="m-antes" cx="701.5" cy="72" r="5"/><circle class="m-despues" cx="398.1" cy="72" r="5"/><text class="t1" x="705.5" y="63" text-anchor="end" font-size="12.5" font-weight="600">2 106 ms</text><text class="t1" x="388.1" y="63" text-anchor="end" font-size="12.5" font-weight="600">18 ms</text></g><g class="fila"><title>POST /auth/login: antes 405 ms, después 91 ms</title><rect class="zona-hover" x="0" y="85.0" width="760" height="26"/><text class="t2" x="200" y="102" text-anchor="end" font-size="12.5">POST /auth/login</text><line class="tramo" x1="501.3" x2="596.4" y1="98" y2="98"/><circle class="m-antes" cx="596.4" cy="98" r="5"/><circle class="m-despues" cx="501.3" cy="98" r="5"/></g><g class="fila"><title>GET /zonas: antes 89 ms, después 11 ms</title><rect class="zona-hover" x="0" y="111.0" width="760" height="26"/><text class="t2" x="200" y="128" text-anchor="end" font-size="12.5">GET /zonas</text><line class="tramo" x1="366.7" x2="499.9" y1="124" y2="124"/><circle class="m-antes" cx="499.9" cy="124" r="5"/><circle class="m-despues" cx="366.7" cy="124" r="5"/></g><g class="fila"><title>GET /estadisticas: antes 59 ms, después 31 ms</title><rect class="zona-hover" x="0" y="137.0" width="760" height="26"/><text class="t2" x="200" y="154" text-anchor="end" font-size="12.5">GET /estadisticas</text><line class="tramo" x1="432.7" x2="473.7" y1="150" y2="150"/><circle class="m-antes" cx="473.7" cy="150" r="5"/><circle class="m-despues" cx="432.7" cy="150" r="5"/></g><g class="fila"><title>GET /me: antes 42 ms, después 9 ms</title><rect class="zona-hover" x="0" y="163.0" width="760" height="26"/><text class="t2" x="200" y="180" text-anchor="end" font-size="12.5">GET /me</text><line class="tramo" x1="354.0" x2="452.1" y1="176" y2="176"/><circle class="m-antes" cx="452.1" cy="176" r="5"/><circle class="m-despues" cx="354.0" cy="176" r="5"/></g><g class="fila"><title>GET /arboles/{id}: antes 38 ms, después 10 ms</title><rect class="zona-hover" x="0" y="189.0" width="760" height="26"/><text class="t2" x="200" y="206" text-anchor="end" font-size="12.5">GET /arboles/{id}</text><line class="tramo" x1="360.7" x2="445.7" y1="202" y2="202"/><circle class="m-antes" cx="445.7" cy="202" r="5"/><circle class="m-despues" cx="360.7" cy="202" r="5"/></g><g class="fila"><title>GET /analisis?limite=100: antes 34 ms, después 12 ms</title><rect class="zona-hover" x="0" y="215.0" width="760" height="26"/><text class="t2" x="200" y="232" text-anchor="end" font-size="12.5">GET /analisis?limite=100</text><line class="tramo" x1="372.3" x2="438.6" y1="228" y2="228"/><circle class="m-antes" cx="438.6" cy="228" r="5"/><circle class="m-despues" cx="372.3" cy="228" r="5"/></g><g class="fila"><title>GET /analisis?limite=500: antes 27 ms, después 14 ms</title><rect class="zona-hover" x="0" y="241.0" width="760" height="26"/><text class="t2" x="200" y="258" text-anchor="end" font-size="12.5">GET /analisis?limite=500</text><line class="tramo" x1="382.1" x2="423.9" y1="254" y2="254"/><circle class="m-antes" cx="423.9" cy="254" r="5"/><circle class="m-despues" cx="382.1" cy="254" r="5"/></g><g class="fila"><title>GET /analisis (filtrado): antes 16 ms, después 11 ms</title><rect class="zona-hover" x="0" y="267.0" width="760" height="26"/><text class="t2" x="200" y="284" text-anchor="end" font-size="12.5">GET /analisis (filtrado)</text><line class="tramo" x1="366.7" x2="390.6" y1="280" y2="280"/><circle class="m-antes" cx="390.6" cy="280" r="5"/><circle class="m-despues" cx="366.7" cy="280" r="5"/></g><g class="fila"><title>GET /zonas/{id}: antes 14 ms, después 7 ms</title><rect class="zona-hover" x="0" y="293.0" width="760" height="26"/><text class="t2" x="200" y="310" text-anchor="end" font-size="12.5">GET /zonas/{id}</text><line class="tramo" x1="338.0" x2="382.1" y1="306" y2="306"/><circle class="m-antes" cx="382.1" cy="306" r="5"/><circle class="m-despues" cx="338.0" cy="306" r="5"/></g><g class="fila"><title>GET /analisis/{id}: antes 12 ms, después 5 ms</title><rect class="zona-hover" x="0" y="319.0" width="760" height="26"/><text class="t2" x="200" y="336" text-anchor="end" font-size="12.5">GET /analisis/{id}</text><line class="tramo" x1="316.5" x2="372.3" y1="332" y2="332"/><circle class="m-antes" cx="372.3" cy="332" r="5"/><circle class="m-despues" cx="316.5" cy="332" r="5"/></g><g class="fila"><title>GET /cuentas: antes 10 ms, después 5 ms</title><rect class="zona-hover" x="0" y="345.0" width="760" height="26"/><text class="t2" x="200" y="362" text-anchor="end" font-size="12.5">GET /cuentas</text><line class="tramo" x1="316.5" x2="360.7" y1="358" y2="358"/><circle class="m-antes" cx="360.7" cy="358" r="5"/><circle class="m-despues" cx="316.5" cy="358" r="5"/></g><g class="fila"><title>GET /dispositivos: antes 9 ms, después 4 ms</title><rect class="zona-hover" x="0" y="371.0" width="760" height="26"/><text class="t2" x="200" y="388" text-anchor="end" font-size="12.5">GET /dispositivos</text><line class="tramo" x1="302.3" x2="354.0" y1="384" y2="384"/><circle class="m-antes" cx="354.0" cy="384" r="5"/><circle class="m-despues" cx="302.3" cy="384" r="5"/></g><g class="fila"><title>GET /analisis/{id}/evidencia: antes 9 ms, después 5 ms</title><rect class="zona-hover" x="0" y="397.0" width="760" height="26"/><text class="t2" x="200" y="414" text-anchor="end" font-size="12.5">GET /analisis/{id}/evidencia</text><line class="tramo" x1="316.5" x2="354.0" y1="410" y2="410"/><circle class="m-antes" cx="354.0" cy="410" r="5"/><circle class="m-despues" cx="316.5" cy="410" r="5"/></g></svg>
<figcaption>p95 de cada endpoint con 20 usuarios (escenario «carga»). Escala logarítmica: cada línea vertical vale 10 veces la anterior.</figcaption>
</figure>

??? info "Ver como tabla"
    | Endpoint | Antes (ms) | Después (ms) |
    | --- | ---: | ---: |
    | `GET /arboles` | 2 106 | 18 |
    | `POST /auth/login` | 405 | 91 |
    | `GET /zonas` | 89 | 11 |
    | `GET /estadisticas` | 59 | 31 |
    | `GET /me` | 42 | 9 |
    | `GET /arboles/{id}` | 38 | 10 |
    | `GET /analisis?limite=100` | 34 | 12 |
    | `GET /analisis?limite=500` | 27 | 14 |
    | `GET /analisis (filtrado)` | 16 | 11 |
    | `GET /zonas/{id}` | 14 | 7 |
    | `GET /analisis/{id}` | 12 | 5 |
    | `GET /cuentas` | 10 | 5 |
    | `GET /dispositivos` | 9 | 4 |
    | `GET /analisis/{id}/evidencia` | 9 | 5 |

## Tiempo de respuesta por escenario

Ya con los índices. El p50 es lo que tarda la mitad de las peticiones; el p99, la más lenta de cada 100.
El login es el más lento a propósito: bcrypt hace costoso adivinar contraseñas.

<figure class="figura-grafica" markdown>
<svg class="grafica" viewBox="0 0 760 322" role="img" aria-labelledby="g2-t g2-d" xmlns="http://www.w3.org/2000/svg"><title id="g2-t">Tiempo de respuesta por escenario: p50, p95 y p99</title><desc id="g2-d">Con los índices, hasta 200 usuarios a la vez el p95 se queda por debajo de 25 ms; el login es el más lento (p95 208 ms) porque bcrypt cuesta a propósito.</desc><g class="leyenda" font-size="13"><circle class="p50" cx="214" cy="30" r="5"/><text class="t2" x="226" y="34">p50 (la mitad tarda menos)</text><circle class="p95" cx="420" cy="30" r="5"/><text class="t2" x="432" y="34">p95</text><circle class="p99" cx="490" cy="30" r="5"/><text class="t2" x="502" y="34">p99</text></g><line class="rejilla" x1="214.0" x2="214.0" y1="58" y2="296"/><text class="t3" x="214.0" y="314" text-anchor="middle" font-size="12">0 ms</text><line class="rejilla" x1="299.0" x2="299.0" y1="58" y2="296"/><text class="t3" x="299.0" y="314" text-anchor="middle" font-size="12">100 ms</text><line class="rejilla" x1="384.0" x2="384.0" y1="58" y2="296"/><text class="t3" x="384.0" y="314" text-anchor="middle" font-size="12">200 ms</text><line class="rejilla" x1="469.0" x2="469.0" y1="58" y2="296"/><text class="t3" x="469.0" y="314" text-anchor="middle" font-size="12">300 ms</text><line class="rejilla" x1="554.0" x2="554.0" y1="58" y2="296"/><text class="t3" x="554.0" y="314" text-anchor="middle" font-size="12">400 ms</text><line class="rejilla" x1="639.0" x2="639.0" y1="58" y2="296"/><text class="t3" x="639.0" y="314" text-anchor="middle" font-size="12">500 ms</text><line class="rejilla" x1="724.0" x2="724.0" y1="58" y2="296"/><text class="t3" x="724.0" y="314" text-anchor="middle" font-size="12">600 ms</text><g class="fila"><title>Humo (1 usuario · 2.5 pet/s): p50 7.7 ms · p95 15.0 ms · p99 67.9 ms</title><rect class="zona-hover" x="0" y="49.0" width="760" height="46"/><text class="t1" x="200" y="70" text-anchor="end" font-size="13" font-weight="600">Humo</text><text class="t3" x="200" y="85" text-anchor="end" font-size="11.5">1 usuario · 2.5 pet/s</text><line class="tramo" x1="220.5" x2="271.7" y1="72" y2="72"/><circle class="p50" cx="220.5" cy="72" r="5"/><circle class="p95" cx="226.8" cy="72" r="5"/><circle class="p99" cx="271.7" cy="72" r="5"/><text class="t2" x="281.7" y="76" font-size="12">p95 15 · p99 67.9 ms</text></g><g class="fila"><title>Carga (20 usuarios · 38 pet/s): p50 5.0 ms · p95 22.6 ms · p99 30.6 ms</title><rect class="zona-hover" x="0" y="95.0" width="760" height="46"/><text class="t1" x="200" y="116" text-anchor="end" font-size="13" font-weight="600">Carga</text><text class="t3" x="200" y="131" text-anchor="end" font-size="11.5">20 usuarios · 38 pet/s</text><line class="tramo" x1="218.2" x2="240.0" y1="118" y2="118"/><circle class="p50" cx="218.2" cy="118" r="5"/><circle class="p95" cx="233.2" cy="118" r="5"/><circle class="p99" cx="240.0" cy="118" r="5"/><text class="t2" x="250.0" y="122" font-size="12">p95 22.6 · p99 30.6 ms</text></g><g class="fila"><title>Estrés (hasta 150 usuarios · 96 pet/s): p50 3.0 ms · p95 24.5 ms · p99 256.1 ms</title><rect class="zona-hover" x="0" y="141.0" width="760" height="46"/><text class="t1" x="200" y="162" text-anchor="end" font-size="13" font-weight="600">Estrés</text><text class="t3" x="200" y="177" text-anchor="end" font-size="11.5">hasta 150 usuarios · 96 pet/s</text><line class="tramo" x1="216.6" x2="431.7" y1="164" y2="164"/><circle class="p50" cx="216.6" cy="164" r="5"/><circle class="p95" cx="234.8" cy="164" r="5"/><circle class="p99" cx="431.7" cy="164" r="5"/><text class="t2" x="441.7" y="168" font-size="12">p95 24.5 · p99 256.1 ms</text></g><g class="fila"><title>Pico (5 → 200 usuarios · 175 pet/s): p50 2.2 ms · p95 14.6 ms · p99 60.8 ms</title><rect class="zona-hover" x="0" y="187.0" width="760" height="46"/><text class="t1" x="200" y="208" text-anchor="end" font-size="13" font-weight="600">Pico</text><text class="t3" x="200" y="223" text-anchor="end" font-size="11.5">5 → 200 usuarios · 175 pet/s</text><line class="tramo" x1="215.9" x2="265.7" y1="210" y2="210"/><circle class="p50" cx="215.9" cy="210" r="5"/><circle class="p95" cx="226.4" cy="210" r="5"/><circle class="p99" cx="265.7" cy="210" r="5"/><text class="t2" x="275.7" y="214" font-size="12">p95 14.6 · p99 60.8 ms</text></g><g class="fila"><title>Login (20 inicios de sesión/s (bcrypt)): p50 72.8 ms · p95 208.1 ms · p99 464.5 ms</title><rect class="zona-hover" x="0" y="233.0" width="760" height="46"/><text class="t1" x="200" y="254" text-anchor="end" font-size="13" font-weight="600">Login</text><text class="t3" x="200" y="269" text-anchor="end" font-size="11.5">20 inicios de sesión/s (bcrypt)</text><line class="tramo" x1="275.9" x2="608.8" y1="256" y2="256"/><circle class="p50" cx="275.9" cy="256" r="5"/><circle class="p95" cx="390.9" cy="256" r="5"/><circle class="p99" cx="608.8" cy="256" r="5"/><text class="t2" x="618.8" y="260" font-size="12">p95 208.1 · p99 464.5 ms</text></g></svg>
<figcaption>p50, p95 y p99 por escenario de k6, en milisegundos.</figcaption>
</figure>

??? info "Ver como tabla"
    | Escenario | Carga | p50 (ms) | p95 (ms) | p99 (ms) |
    | --- | --- | ---: | ---: | ---: |
    | Humo | 1 usuario · 2.5 pet/s | 7.7 | 15 | 67.9 |
    | Carga | 20 usuarios · 38 pet/s | 5 | 22.6 | 30.6 |
    | Estrés | hasta 150 usuarios · 96 pet/s | 3 | 24.5 | 256.1 |
    | Pico | 5 → 200 usuarios · 175 pet/s | 2.2 | 14.6 | 60.8 |
    | Login | 20 inicios de sesión/s (bcrypt) | 72.8 | 208.1 | 464.5 |

## Arranque en frío de Lambda

La primera petición a una Lambda recién creada espera a que arranquen la JVM y Micronaut. Las siguientes
reutilizan esa instancia.

<div class="cifras" markdown>
<div class="cifra"><span class="cifra-valor">4.2 s</span><span class="cifra-nombre">arranque en frío (mediana, 1024 MB)</span></div>
<div class="cifra"><span class="cifra-valor">4.3 s</span><span class="cifra-nombre">con 2048 MB: más memoria no lo acorta</span></div>
<div class="cifra"><span class="cifra-valor">0.3 s</span><span class="cifra-nombre">la misma petición con la instancia ya caliente</span></div>
</div>

Por eso b-sheet tiene un *warmer*: EventBridge manda un `GET /health` cada 5 minutos para que casi siempre
haya una instancia lista. La solución de fondo es SnapStart, que restaura la JVM ya iniciada en menos de 1 s.

## Cómo se midió

| | |
| --- | --- |
| Herramienta | [k6](https://k6.io) en Docker, escenarios en `b-sheet/estres/escenarios.js` |
| Dónde | b-sheet local con su propia base `sheets_estres` (no producción), pool de 10 conexiones |
| Datos | 20 006 análisis, 413 árboles y 207 zonas generados con `estres/sembrar.sql` |
| Qué hace cada usuario | Lo que haría una persona: Resumen, mapa, seguimiento, análisis con foto y, 1 de cada 4, administración |
| Cuándo | 18 de noviembre de 2026; arranque en frío medido en AWS con `ops/lambda-frio.sh` |
