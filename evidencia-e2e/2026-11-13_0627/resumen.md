# Evidencia E2E — 2026-11-13 0627

- Rama: `feat/test-end-to-end` · commit `8a48d66` (con cambios sin commit)
- Pruebas: **79** · pasaron 79 · fallaron 0 · inestables 0 · omitidas 0
- Duración total: 106 s · código de salida de Playwright: 0
- Reporte con capturas de cada paso y trazas: `pnpm exec playwright show-report evidencia-e2e/2026-11-13_0627/reporte-html`

| # | Proyecto | Archivo | Prueba | Resultado | Duración | Capturas |
|---:|---|---|---|---|---:|---:|
| 1 | escritorio | admin.e2e.ts | Administración › un administrador ve cuentas y dispositivos sin datos sensibles | ✅ pasó | 5.3 s | 2 |
| 2 | escritorio | admin.e2e.ts | Administración › el administrador crea, edita, desactiva y reactiva una cuenta de experto | ✅ pasó | 12.9 s | 3 |
| 3 | escritorio | admin.e2e.ts | Administración › un administrador que cambia su propio correo vuelve a entrar con el correo nuevo | ✅ pasó | 12.1 s | 3 |
| 4 | escritorio | analisis.e2e.ts | Análisis › las cajas cuentan y filtran; la tabla sigue como antes | ✅ pasó | 7.7 s | 3 |
| 5 | escritorio | analisis.e2e.ts | Análisis › tarjetas con miniatura, agrupadas por lugar, y el detalle con foto y enlace al seguimiento | ✅ pasó | 17.2 s | 6 |
| 6 | escritorio | analisis.e2e.ts | Análisis › el detalle se abre desde la tabla y Esc devuelve el foco | ✅ pasó | 4.9 s | 2 |
| 7 | escritorio | analisis.e2e.ts | Análisis › una fecha inválida en la URL no deja la app en blanco y se normaliza | ✅ pasó | 3.3 s | 2 |
| 8 | escritorio | experto.e2e.ts | Resumen › focos, totales y gráficas calculados por el backend | ✅ pasó | 2.8 s | 2 |
| 9 | escritorio | experto.e2e.ts | Permisos › un experto no ve Administración y no puede entrar por la URL | ✅ pasó | 3.3 s | 2 |
| 10 | escritorio | experto.e2e.ts | Permisos › el backend también le niega al experto los datos de administración (403) | ✅ pasó | 3.2 s | 2 |
| 11 | escritorio | experto.e2e.ts | Análisis › filtros y fotos › los filtros llegan al backend y se pueden quitar | ✅ pasó | 4.6 s | 2 |
| 12 | escritorio | experto.e2e.ts | Análisis › filtros y fotos › un rango invertido muestra el mensaje del backend | ✅ pasó | 4.1 s | 2 |
| 13 | escritorio | experto.e2e.ts | Análisis › filtros y fotos › la foto se abre con la URL que firmó el backend y Esc la cierra | ✅ pasó | 3.9 s | 2 |
| 14 | escritorio | experto.e2e.ts | Análisis › filtros y fotos › e2 guarda la URL completa de S3 (formato de TT_BKN) y también se firma | ✅ pasó | 5.5 s | 2 |
| 15 | escritorio | experto.e2e.ts | Mapa › último resultado por punto e historial al elegir uno | ✅ pasó | 4.9 s | 2 |
| 16 | escritorio | experto.e2e.ts | Mapa › filtros y búsqueda | ✅ pasó | 5.2 s | 2 |
| 17 | escritorio | experto.e2e.ts | Seguimiento › seguimiento: del mapa al historial completo de un árbol y de vuelta | ✅ pasó | 11.9 s | 2 |
| 18 | escritorio | experto.e2e.ts | Seguimiento › seguimiento de una zona: evolución del follaje | ✅ pasó | 5.8 s | 2 |
| 19 | escritorio | flujos.e2e.ts | Flujos completos › administrador: entra, crea un experto, le cambia nombre y rol, y sale | ✅ pasó | 11.8 s | 7 |
| 20 | escritorio | flujos.e2e.ts | Flujos completos › experto: atención en el Resumen → Análisis filtrado → detalle → seguimiento → Gráficos → Atrás → sale | ✅ pasó | 12.4 s | 7 |
| 21 | escritorio | flujos.e2e.ts | Flujos completos › el administrador desactiva a un experto con la sesión abierta: lo saca; al reactivarlo vuelve a entrar | ✅ pasó | 15.7 s | 7 |
| 22 | escritorio | flujos.e2e.ts | Flujos completos › un administrador cambia su propio correo y entra con el nuevo | ✅ pasó | 10.2 s | 4 |
| 23 | escritorio | funciones.e2e.ts | Sesión › campos vacíos: valida sin llamar al backend | ✅ pasó | 3.3 s | 3 |
| 24 | escritorio | funciones.e2e.ts | Resumen › indicadores › últimos 7 días con sus cifras | ✅ pasó | 3.6 s | 3 |
| 25 | escritorio | funciones.e2e.ts | Resumen › gráficas clave › "Ver la actividad en Gráficos" y una decena de confianza abren Gráficos filtrado | ✅ pasó | 6.5 s | 4 |
| 26 | escritorio | funciones.e2e.ts | Resumen › accesos › Gráficos y el seguimiento del último lugar infestado | ✅ pasó | 6.0 s | 3 |
| 27 | escritorio | funciones.e2e.ts | Resumen › fallos parciales › si /analisis falla, el hero y los accesos siguen y se puede reintentar | ✅ pasó | 6.7 s | 4 |
| 28 | escritorio | funciones.e2e.ts | Análisis › cajas › filtran por confianza baja | ✅ pasó | 4.1 s | 3 |
| 29 | escritorio | funciones.e2e.ts | Análisis › cajas › "Requieren atención" junta infestados, no determinados, confianza baja y errores | ✅ pasó | 4.1 s | 3 |
| 30 | escritorio | funciones.e2e.ts | Análisis › cajas › quitar un chip pasa el foco al siguiente | ✅ pasó | 4.1 s | 3 |
| 31 | escritorio | funciones.e2e.ts | Análisis › vista › "Tarjetas" se recuerda al volver a la sección | ✅ pasó | 5.5 s | 3 |
| 32 | escritorio | funciones.e2e.ts | Análisis › agrupar › por resultado y por día | ✅ pasó | 6.1 s | 4 |
| 33 | escritorio | funciones.e2e.ts | Análisis › detalle › enlace directo ?detalle= abre el análisis; Cerrar deja la URL limpia | ✅ pasó | 4.6 s | 3 |
| 34 | escritorio | funciones.e2e.ts | Análisis › detalle › un ?detalle= que no está entre los cargados avisa y se quita | ✅ pasó | 4.3 s | 3 |
| 35 | escritorio | funciones.e2e.ts | Análisis › detalle › "Ver en Gráficos" abre Gráficos filtrado por el lugar | ✅ pasó | 5.1 s | 3 |
| 36 | escritorio | funciones.e2e.ts | Gráficos › confianza › clic en una decena filtra las demás gráficas | ✅ pasó | 4.4 s | 3 |
| 37 | escritorio | funciones.e2e.ts | Gráficos › filtros › Tipo y Árbol o zona se combinan | ✅ pasó | 4.0 s | 3 |
| 38 | escritorio | funciones.e2e.ts | Gráficos › mapa de calor › se recorre con flechas y Enter filtra por el lugar | ✅ pasó | 3.6 s | 3 |
| 39 | escritorio | funciones.e2e.ts | Gráficos › tablas › cada gráfica tiene "Ver como tabla" | ✅ pasó | 5.0 s | 3 |
| 40 | escritorio | funciones.e2e.ts | Gráficos › rango › Anterior y Siguiente se deshabilitan en los bordes de los datos | ✅ pasó | 5.8 s | 3 |
| 41 | escritorio | funciones.e2e.ts | Administración › formulario › valida antes de enviar | ✅ pasó | 6.6 s | 3 |
| 42 | escritorio | funciones.e2e.ts | Administración › cuentas › buscar y filtrar por rol y estado | ✅ pasó | 2.8 s | 3 |
| 43 | escritorio | funciones.e2e.ts | Administración › cuenta propia › no se puede desactivar ni quitarse el rol | ✅ pasó | 6.5 s | 3 |
| 44 | escritorio | funciones.e2e.ts | Errores › una pantalla que falla muestra "Algo salió mal" sin dejar la app en blanco, y se recupera | ✅ pasó | 4.5 s | 3 |
| 45 | escritorio | graficos.e2e.ts | Gráficos › un experto ve Gráficos con los totales del backend en cada gráfica | ✅ pasó | 6.0 s | 4 |
| 46 | escritorio | graficos.e2e.ts | Gráficos › el tooltip sale con el foco y una barra de lugar abre el seguimiento del árbol | ✅ pasó | 5.4 s | 3 |
| 47 | escritorio | graficos.e2e.ts | Gráficos › acercar, crossfilter con chips, Atrás y Restablecer; la vista vive en la URL | ✅ pasó | 8.1 s | 2 |
| 48 | escritorio | graficos.e2e.ts | Gráficos › arrastrar en la vista general elige el rango (pincel) | ✅ pasó | 4.4 s | 3 |
| 49 | escritorio | graficos.e2e.ts | Gráficos › escribir el año en Desde no congela la pestaña ni llena el historial; un rango absurdo en la URL se acota | ✅ pasó | 3.5 s | 2 |
| 50 | escritorio | graficos.e2e.ts | Gráficos › fechas a medio confirmar + clic en otro control › escribir Desde y hacer clic en la leyenda: un solo paso y nada se pierde | ✅ pasó | 3.8 s | 2 |
| 51 | escritorio | graficos.e2e.ts | Gráficos › fechas a medio confirmar + clic en otro control › escribir Desde y hacer clic en Siguiente: se mueve desde la fecha escrita, en un paso | ✅ pasó | 3.3 s | 2 |
| 52 | escritorio | graficos.e2e.ts | Gráficos › fechas a medio confirmar + clic en otro control › Enter aplica sin sacar el foco; Restablecer deja el foco en el texto del rango | ✅ pasó | 3.5 s | 2 |
| 53 | escritorio | graficos.e2e.ts | Gráficos › fechas a medio confirmar + clic en otro control › intercambio y salir conserva el rango (Desde después de Hasta, clic en Hasta, clic fuera) | ✅ pasó | 3.4 s | 2 |
| 54 | escritorio | graficos.e2e.ts | Gráficos › fechas a medio confirmar + clic en otro control › Atrás con el foco en Desde y luego Tab no rehace el cambio (Adelante intacto) | ✅ pasó | 3.6 s | 2 |
| 55 | escritorio | resumen.e2e.ts | Resumen › la animación del login se conserva y el resumen entra con su misma coreografía | ✅ pasó | 4.9 s | 4 |
| 56 | escritorio | resumen.e2e.ts | Resumen › con movimiento reducido no hay desplazamientos | ✅ pasó | 2.3 s | 2 |
| 57 | escritorio | resumen.e2e.ts | Resumen › la atención lleva a Análisis filtrado y "Ver en Gráficos" conserva el filtro | ✅ pasó | 7.1 s | 2 |
| 58 | escritorio | resumen.e2e.ts | Resumen › accesos rápidos en orden; un experto no ve Administración; la actividad abre el detalle | ✅ pasó | 6.7 s | 2 |
| 59 | escritorio | resumen.e2e.ts | Resumen › un administrador ve Administración al final de los accesos | ✅ pasó | 2.6 s | 2 |
| 60 | escritorio | resumen.e2e.ts | Resumen › D1: la cifra de errores de sincronización coincide con lo que abre su enlace | ✅ pasó | 2.7 s | 2 |
| 61 | escritorio | sesion.e2e.ts | Sesión › sin sesión cualquier ruta lleva al login | ✅ pasó | 1.4 s | 2 |
| 62 | escritorio | sesion.e2e.ts | Sesión › contraseña incorrecta: mensaje accesible y sigue en login | ✅ pasó | 1.3 s | 2 |
| 63 | escritorio | sesion.e2e.ts | Sesión › una cuenta desactivada en la BD no puede entrar | ✅ pasó | 1.2 s | 2 |
| 64 | escritorio | sesion.e2e.ts | Sesión › el correo no distingue mayúsculas y el encabezado muestra el nombre de /me | ✅ pasó | 2.9 s | 2 |
| 65 | escritorio | sesion.e2e.ts | Sesión › un token rechazado por el backend devuelve al login con aviso | ✅ pasó | 3.1 s | 2 |
| 66 | escritorio | sesion.e2e.ts | Sesión › cerrar sesión borra el token | ✅ pasó | 1.9 s | 2 |
| 67 | movil | flujos-movil.e2e.ts | Flujos completos (móvil, 360 px) › experto: Resumen → Análisis filtrado en tarjetas → detalle → seguimiento → sale | ✅ pasó | 15.6 s | 6 |
| 68 | movil | movil.e2e.ts | Móvil (Pixel 7) › Resumen cabe a lo ancho | ✅ pasó | 5.7 s | 2 |
| 69 | movil | movil.e2e.ts | Móvil (Pixel 7) › Mapa cabe a lo ancho | ✅ pasó | 9.1 s | 2 |
| 70 | movil | movil.e2e.ts | Móvil (Pixel 7) › Análisis cabe a lo ancho | ✅ pasó | 5.0 s | 2 |
| 71 | movil | movil.e2e.ts | Móvil (Pixel 7) › Gráficos cabe a lo ancho | ✅ pasó | 5.0 s | 2 |
| 72 | movil | movil.e2e.ts | Móvil (Pixel 7) › Administración cabe a lo ancho | ✅ pasó | 3.1 s | 2 |
| 73 | movil | movil.e2e.ts | Móvil (Pixel 7) › la foto cabe en la pantalla | ✅ pasó | 7.1 s | 2 |
| 74 | movil | movil.e2e.ts | Móvil (Pixel 7) › las marcas del mapa se pueden ver y tocar | ✅ pasó | 8.4 s | 2 |
| 75 | movil | movil.e2e.ts | Móvil (Pixel 7) › el seguimiento de un árbol cabe a lo ancho | ✅ pasó | 5.4 s | 2 |
| 76 | movil | movil.e2e.ts | Móvil (Pixel 7) › el formulario de cuenta cabe en la pantalla y se cierra con Cancelar | ✅ pasó | 4.7 s | 2 |
| 77 | movil | movil.e2e.ts | Móvil (Pixel 7) › Gráficos a 360 px: sin desborde horizontal de la página | ✅ pasó | 3.8 s | 5 |
| 78 | movil | movil.e2e.ts | Móvil (Pixel 7) › Análisis a 360 px: cajas, tarjetas y detalle sin desborde horizontal | ✅ pasó | 5.1 s | 5 |
| 79 | movil | movil.e2e.ts | Móvil (Pixel 7) › Resumen a 360 px: atención, indicadores, gráficas y accesos sin desborde horizontal | ✅ pasó | 3.4 s | 5 |

