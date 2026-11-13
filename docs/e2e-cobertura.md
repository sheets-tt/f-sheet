# Cobertura E2E por función

Cada función de la web y la prueba de punta a punta (Playwright, contra b-sheet real y los datos de
`db/demo`) que la cubre. Las pruebas se nombran **Área › función** y adjuntan capturas de sus pasos
clave; `pnpm test:e2e:evidencia` deja todo en `evidencia-e2e/AAAA-MM-DD_HHMMSS/` (ver
[correr-en-local.md](correr-en-local.md#evidencia-de-las-pruebas-e2e)).

Archivos: `sesion`, `experto`, `resumen`, `analisis`, `graficos`, `admin`, `funciones` (una prueba
por función que no tenía la suya), `flujos` (recorridos completos), `movil` y `flujos-movil`
(Pixel 7). **90 pruebas en 10 archivos; 96 funciones, todas cubiertas** (las 85–96 se agregaron en la revisión de QA).

## Sesión

| # | Función | Prueba |
|---:|---|---|
| 1 | Sin sesión, cualquier ruta lleva al login | sesion › Sesión › sin sesión cualquier ruta lleva al login |
| 2 | Login correcto lleva al Resumen | (todas, vía `entrar()`) · flujos › Flujos completos › administrador: entra… |
| 3 | Campos vacíos: validación sin llamar al backend | funciones › Sesión › campos vacíos: valida sin llamar al backend |
| 4 | Contraseña incorrecta: mensaje accesible | sesion › Sesión › contraseña incorrecta: mensaje accesible y sigue en login |
| 5 | Cuenta desactivada no entra | sesion › Sesión › una cuenta desactivada en la BD no puede entrar |
| 6 | El correo no distingue mayúsculas; el encabezado muestra el nombre | sesion › Sesión › el correo no distingue mayúsculas… |
| 7 | Token rechazado (401) → login con «Tu sesión terminó» | sesion › Sesión › un token rechazado por el backend devuelve al login con aviso |
| 8 | Cerrar sesión borra el token | sesion › Sesión › cerrar sesión borra el token · flujos (todos salen con `salir()`) |
| 9 | Animación del login (galería que se excava) | resumen › Resumen › la animación del login se conserva… |

## Permisos

| # | Función | Prueba |
|---:|---|---|
| 10 | El experto no ve Administración ni entra por la URL | experto › Permisos › un experto no ve Administración y no puede entrar por la URL |
| 11 | La API niega los datos de administración al experto (403) | experto › Permisos › el backend también le niega al experto… (403) |
| 12 | Desactivar con la sesión abierta saca a la persona; reactivar le deja volver | flujos › Flujos completos › el administrador desactiva a un experto con la sesión abierta… |

## Resumen (dashboard)

| # | Función | Prueba |
|---:|---|---|
| 13 | Hero: focos de infestación y totales | experto › Resumen › focos, totales y gráficas calculados por el backend |
| 14 | Entrada escalonada con la misma animación | resumen › Resumen › la animación del login se conserva y el resumen entra… |
| 15 | Movimiento reducido | resumen › Resumen › con movimiento reducido no hay desplazamientos |
| 16 | «Necesita tu atención» → Análisis filtrado | resumen › Resumen › la atención lleva a Análisis filtrado… · flujos › …experto: atención en el Resumen… |
| 17 | Lugares con infestación → seguimiento | resumen › Resumen › la atención lleva a Análisis filtrado… |
| 18 | Errores de sincronización = lo que abre su enlace (cifra global aunque no esté entre los cargados) | resumen › Resumen › D1: la cifra de errores de sincronización… |
| 19 | Indicadores de los últimos 7 días | funciones › Resumen › indicadores › últimos 7 días con sus cifras |
| 20 | Gráficas clave con «Ver en Gráficos» y sus filtros | resumen › Resumen › …"Ver en Gráficos" conserva el filtro · funciones › Resumen › gráficas clave › … |
| 21 | Accesos rápidos en orden; experto sin Administración | resumen › Resumen › accesos rápidos en orden… |
| 22 | Administrador ve Administración en los accesos | resumen › Resumen › un administrador ve Administración al final de los accesos |
| 23 | Accesos a Gráficos y al seguimiento del último infestado | funciones › Resumen › accesos › Gráficos y el seguimiento del último lugar infestado |
| 24 | Actividad reciente → detalle en Análisis | resumen › Resumen › accesos rápidos en orden…; la actividad abre el detalle |
| 25 | Fallo parcial (/analisis) sin tumbar el resto; Reintentar | funciones › Resumen › fallos parciales › … |
| 85 | «Ver la actividad en Gráficos» lleva el rango de los últimos 30 días | funciones › Resumen › casos límite › gráficas clave › … |
| 86 | Periodo recortado por el límite: «500 o más» y sin comparar | funciones › Resumen › casos límite › indicadores › … |
| 87 | Sin /estadisticas: errores de sincronización sin enlace y «de los N más recientes» | funciones › Resumen › casos límite › atención › … |

## Mapa y seguimiento

| # | Función | Prueba |
|---:|---|---|
| 26 | Último resultado por punto e historial al elegir uno | experto › Mapa › último resultado por punto e historial al elegir uno |
| 27 | Filtros y búsqueda del mapa | experto › Mapa › filtros y búsqueda |
| 28 | Marcas visibles y tocables en móvil | movil › Móvil (Pixel 7) › las marcas del mapa se pueden ver y tocar |
| 29 | Seguimiento de un árbol (historial completo, ida y vuelta) | experto › Seguimiento › seguimiento: del mapa al historial completo de un árbol… |
| 30 | Seguimiento de una zona (evolución del follaje) | experto › Seguimiento › seguimiento de una zona: evolución del follaje |

## Análisis

| # | Función | Prueba |
|---:|---|---|
| 31 | Filtros del formulario llegan al backend y se quitan | experto › Análisis › filtros y fotos › los filtros llegan al backend y se pueden quitar |
| 32 | Mensaje del backend ante un rango inválido | experto › Análisis › filtros y fotos › un rango invertido muestra el mensaje del backend |
| 33 | Foto firmada en diálogo; Esc devuelve el foco | experto › Análisis › filtros y fotos › la foto se abre con la URL que firmó el backend… |
| 34 | URL completa de S3 (TT_BKN) también se firma | experto › Análisis › filtros y fotos › e2 guarda la URL completa de S3… |
| 35 | Cajas: cuentan; filtran por resultado y tipo; Atrás | analisis › Análisis › las cajas cuentan y filtran; la tabla sigue como antes |
| 36 | Cajas: confianza baja | funciones › Análisis › cajas › filtran por confianza baja |
| 37 | Cajas: «Requieren atención» | funciones › Análisis › cajas › "Requieren atención" junta… |
| 38 | Chips: quitar uno pasa el foco al siguiente | funciones › Análisis › cajas › quitar un chip pasa el foco al siguiente |
| 39 | «Quitar filtros» también quita las cajas | analisis › Análisis › las cajas cuentan y filtran… |
| 40 | Vista Tarjetas con miniaturas firmadas | analisis › Análisis › tarjetas con miniatura… |
| 41 | La vista elegida se recuerda | funciones › Análisis › vista › "Tarjetas" se recuerda al volver a la sección |
| 42 | Agrupar por árbol o zona | analisis › Análisis › tarjetas con miniatura, agrupadas por lugar… |
| 43 | Agrupar por resultado y por día; plegar un grupo | funciones › Análisis › agrupar › por resultado y por día |
| 44 | Detalle desde una tarjeta, foto y enlace al seguimiento | analisis › Análisis › tarjetas con miniatura… y el detalle con foto… |
| 45 | Detalle desde la tabla; anterior del mismo lugar; Esc devuelve el foco | analisis › Análisis › el detalle se abre desde la tabla y Esc devuelve el foco |
| 46 | Enlace directo `?detalle=`; Cerrar limpia la URL y deja el foco | funciones › Análisis › detalle › enlace directo ?detalle=… |
| 47 | `?detalle=` inexistente: aviso y se quita | funciones › Análisis › detalle › un ?detalle= que no está entre los cargados… |
| 48 | Detalle → «Ver en Gráficos» filtrado por el lugar | funciones › Análisis › detalle › "Ver en Gráficos" abre Gráficos filtrado por el lugar |
| 49 | Fecha inválida en la URL: no rompe y se normaliza | analisis › Análisis › una fecha inválida en la URL no deja la app en blanco… |
| 88 | Miniatura: reintenta la firma una vez y luego «Foto no disponible» | funciones › Análisis › miniatura › … |
| 89 | Con 100 análisis pide acotar por fechas | funciones › Análisis › límite › … |
| 90 | Anterior/siguiente con `?detalle=` cambian la URL sin paso nuevo | funciones › Análisis › detalle › anterior y siguiente con ?detalle=… |

## Gráficos

| # | Función | Prueba |
|---:|---|---|
| 50 | Cada gráfica resume sus totales (nombre accesible) | graficos › Gráficos › un experto ve Gráficos con los totales del backend en cada gráfica |
| 51 | Eje de confianza sin etiquetas encimadas (1280/760/360) | graficos › Gráficos › un experto ve Gráficos… · movil › …Gráficos a 360 px |
| 52 | Tooltip con el foco; flechas entre marcas | graficos › Gráficos › el tooltip sale con el foco y una barra de lugar abre el seguimiento… |
| 53 | Barra de lugar → seguimiento | graficos › Gráficos › el tooltip sale con el foco y una barra de lugar abre el seguimiento… |
| 54 | Clic en un periodo acerca (zoom) | graficos › Gráficos › acercar, crossfilter con chips, Atrás y Restablecer… |
| 55 | Acercar / Restablecer | graficos › Gráficos › acercar, crossfilter… |
| 56 | Anterior / Siguiente y sus bordes; foco al texto del rango | funciones › Gráficos › rango › Anterior y Siguiente se deshabilitan en los bordes… |
| 57 | Pincel en la vista general | graficos › Gráficos › arrastrar en la vista general elige el rango (pincel) |
| 58 | Crossfilter: leyenda + mapa de calor, chips | graficos › Gráficos › acercar, crossfilter con chips… |
| 59 | Crossfilter: decena de confianza | funciones › Gráficos › confianza › clic en una decena filtra las demás gráficas |
| 60 | Filtros Tipo y Árbol o zona | funciones › Gráficos › filtros › Tipo y Árbol o zona se combinan |
| 61 | Mapa de calor con flechas y Enter | funciones › Gráficos › mapa de calor › se recorre con flechas y Enter filtra por el lugar |
| 62 | Esc quita la selección | graficos › Gráficos › acercar, crossfilter… |
| 63 | La vista vive en la URL; Atrás; se comparte | graficos › Gráficos › acercar, crossfilter con chips, Atrás y Restablecer; la vista vive en la URL |
| 64 | «Ver como tabla» en cada gráfica | funciones › Gráficos › tablas › cada gráfica tiene "Ver como tabla" |
| 65 | Fechas: se aplican al confirmar; rango absurdo se acota | graficos › Gráficos › escribir el año en Desde no congela la pestaña… |
| 66 | Fecha a medio confirmar + clic en otro control (leyenda, Siguiente) | graficos › Gráficos › fechas a medio confirmar… › escribir Desde y hacer clic en la leyenda / en Siguiente |
| 67 | Enter conserva el foco; intercambio de extremos; Atrás con el foco | graficos › Gráficos › fechas a medio confirmar… (3 pruebas) |
| 91 | Alejar vuelve a todo el rango | funciones › Gráficos › rango › Alejar vuelve a todo el rango |
| 92 | Rango pedido sin análisis: aviso y se muestra todo | funciones › Gráficos › URL y avisos › rango sin análisis › … |
| 93 | Parámetros inválidos en la URL (lugar inexistente, fechas absurdas) se normalizan | funciones › Gráficos › URL y avisos › URL › … |
| 94 | Quitar un chip pasa el foco al siguiente (o al texto del rango) | funciones › Gráficos › URL y avisos › chips › … |
| 95 | Con 500 análisis avisa que solo entran los más recientes | funciones › Gráficos › URL y avisos › límite › … |
| 96 | El tooltip sigue a la última interacción (teclado sobre puntero) | graficos › Gráficos › el tooltip sale con el foco… (y Vitest: graficos.test.tsx › tooltip) |

## Administración

| # | Función | Prueba |
|---:|---|---|
| 68 | Lista de cuentas y dispositivos sin datos sensibles | admin › Administración › un administrador ve cuentas y dispositivos sin datos sensibles |
| 69 | Crear, editar, desactivar y reactivar; 409 por correo repetido | admin › Administración › el administrador crea, edita, desactiva y reactiva… |
| 70 | Validación del formulario antes de enviar | funciones › Administración › formulario › valida antes de enviar |
| 71 | Buscar y filtrar cuentas por rol y estado | funciones › Administración › cuentas › buscar y filtrar por rol y estado |
| 72 | La cuenta propia no se desactiva ni pierde el rol | funciones › Administración › cuenta propia › … |
| 73 | Asignar rol (experto → administrador) | flujos › Flujos completos › administrador: entra, crea un experto, le cambia nombre y rol… |
| 74 | Cambiar el propio correo → login con el nuevo | admin › Administración › un administrador que cambia su propio correo… · flujos › …cambia su propio correo… |
| 75 | La cuenta nueva entra y no ve Administración | admin › Administración › el administrador crea…; flujos › …experto: atención… |

## Errores y estados

| # | Función | Prueba |
|---:|---|---|
| 76 | Límite de error: «Algo salió mal» sin dejar la app en blanco, y se recupera | funciones › Errores › una pantalla que falla muestra "Algo salió mal"… |

## Móvil (Pixel 7, 360 px)

| # | Función | Prueba |
|---:|---|---|
| 77 | Cada sección cabe a lo ancho (Resumen, Mapa, Análisis, Gráficos, Administración) | movil › Móvil (Pixel 7) › … cabe a lo ancho (5 pruebas) |
| 78 | La foto cabe en la pantalla | movil › Móvil (Pixel 7) › la foto cabe en la pantalla |
| 79 | El seguimiento de un árbol cabe a lo ancho | movil › Móvil (Pixel 7) › el seguimiento de un árbol cabe a lo ancho |
| 80 | El formulario de cuenta cabe y se cierra | movil › Móvil (Pixel 7) › el formulario de cuenta cabe en la pantalla… |
| 81 | Gráficos a 360 px | movil › Móvil (Pixel 7) › Gráficos a 360 px… |
| 82 | Análisis a 360 px: cajas, tarjetas y detalle | movil › Móvil (Pixel 7) › Análisis a 360 px… |
| 83 | Resumen a 360 px | movil › Móvil (Pixel 7) › Resumen a 360 px… |
| 84 | Flujo principal del experto en el teléfono | flujos-movil › Flujos completos (móvil, 360 px) › experto: Resumen → Análisis filtrado en tarjetas → detalle → seguimiento → sale |

## Flujos completos

1. **Administrador**: entra → Resumen → Administración → crea un experto → le cambia nombre y rol → sale.
2. **Experto**: entra con una cuenta nueva → «Necesita tu atención» → Análisis filtrado → detalle con foto → seguimiento del árbol → Atrás (la caja sigue elegida) → Gráficos con filtros → Atrás → sale.
3. **Desactivación con sesión abierta**: el administrador desactiva al experto → su siguiente petición recibe 401 y vuelve al login con «Tu sesión terminó. Vuelve a iniciar sesión.» → no puede entrar → se reactiva → entra.
4. **Cambio del propio correo**: el administrador cambia su correo → login con el correo nuevo ya escrito → entra.
5. **Móvil**: el flujo del experto a 360 px.

## Cómo se mantienen independientes

- La BD `sheets_e2e` se crea desde cero en cada corrida (Flyway + `db/demo`).
- Las pruebas que escriben usan **cuentas propias con correo único** (`crearCuenta()` / `correoUnico()` en `e2e/ayuda.ts`) y nunca modifican las cuentas de `db/demo`.
- Sin pausas fijas: las capturas esperan a que terminen las animaciones (`animacionesTerminadas()`), y las aserciones usan las esperas de Playwright.
- Los casos que `db/demo` no tiene (100 o 500 análisis, uno antiguo, uno con error fuera de los cargados, estadísticas caídas, firma rechazada por S3) se arman interceptando la respuesta real de b-sheet con `page.route` (`cambiarAnalisis()` en `funciones.e2e.ts`).
- Las fotos de S3 se sirven con una imagen de prueba visible (corteza estilizada con la clave pedida) para que se reconozca en las capturas.
- Un **candado** en `e2e/iniciar-backend.sh` impide dos corridas a la vez (comparten `:8082` y la BD).
