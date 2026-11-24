# La base de datos

Primero una explicación completa y al final un speech corto (≈ 2 minutos) para presentarlo.

## Parte 1 · Explicación completa

### 1. Una sola fuente de verdad

Todo el sistema comparte **una base de datos PostgreSQL 16** (Amazon RDS en producción):

- **La app móvil** escribe ahí, a través del backend de la app (TT_BKN), los análisis que los brigadistas
  capturan en campo, aunque los hayan hecho sin señal.
- **La plataforma web** lee esos mismos datos a través de su propio backend (*b-sheet*) para mostrar
  resúmenes, mapas, gráficas y el seguimiento de cada árbol.

No hay copias ni sincronizaciones entre bases: lo que sincroniza el móvil aparece en la web en la siguiente
consulta. El dueño del esquema es TT_BKN; *b-sheet* es un **consumidor**, casi siempre de solo lectura.

### 2. El modelo relacional (7 tablas)

El modelo responde a una pregunta: **¿quién capturó qué, con qué equipo, sobre qué árbol o zona, y qué
resultado dio?** Cada tabla contesta una parte.

| Tabla | Papel | Columnas clave |
|---|---|---|
| `cuenta` | **Usuarios** | `id_cuenta` (PK), `correo` (único), `contrasena_hash` (bcrypt), `rol` (Administrador / Experto), `estado_cuenta`, `nombre_completo` |
| `dispositivo` | **Equipos** (teléfonos) | `id_dispositivo` (PK), `identificador_unico`, `nombre_dispositivo`, `estado` |
| `cuenta_dispositivo` | **Qué cuenta usa qué equipo** | `id_cuenta_dispositivo` (PK), FK `id_cuenta`, FK `id_dispositivo`, `estado_cuenta_dispositivo` |
| `arbol` | **Objetivo de corteza** | `id_arbol` (PK), `nombre_especifico`, `especie`, `latitud`/`longitud` (GPS), FK `id_cuenta`, FK `id_dispositivo` |
| `zona_follaje` | **Objetivo de follaje** (dosel, dron) | `id_zona` (PK), `nombre_zona`, `latitud_centro`/`longitud_centro`, `radio_metros`, FK `id_cuenta`, FK `id_dispositivo` |
| `analisis` | **Núcleo: cada captura clasificada** | `id_analisis` (PK), `tipo_imagen`, `resultado_clasificacion`, `confianza`, `ruta_evidencia`, `estado_sincronizacion`, `fecha_captura`, lat/lon, FK `id_arbol` / `id_zona`, FK `id_cuenta` |
| `analisis_cromatico` | **Detalle de color del follaje** (OpenCV, HSV) | `id_analisis_cromatico` (PK), FK `id_analisis` (CASCADE), `pct_sano`, `pct_regular`, `pct_danado`, `pct_incierto` |

#### Las relaciones, de izquierda a derecha

1. **`cuenta` → `arbol` y `zona_follaje` (1 : N).** Una cuenta registra muchos árboles y zonas; cada uno
   recuerda quién lo dio de alta.
2. **`cuenta` ↔ `dispositivo` (N : M) a través de `cuenta_dispositivo`.** Un teléfono puede pasar de un
   brigadista a otro y una persona puede usar varios equipos. La tabla intermedia guarda el **historial**: la
   asociación no se borra, se marca como desasociada.
3. **`dispositivo` → `arbol` y `zona_follaje` (1 : N).** Se sabe con qué equipo se registró cada objetivo.
4. **`arbol` → `analisis` (1 : N, corteza)** y **`zona_follaje` → `analisis` (1 : N, follaje).** Un árbol
   acumula muchos análisis en el tiempo: eso es el **seguimiento**, ver cómo evoluciona.
5. **`analisis` → `analisis_cromatico` (1 : 1).** Solo los análisis de follaje traen el desglose de color, y
   si se borra el análisis se borra su detalle (`ON DELETE CASCADE`).

#### La regla clave: corteza → árbol, follaje → zona

`analisis` tiene dos llaves foráneas, `id_arbol` e `id_zona`, pero **solo una puede estar llena**:

```sql
CONSTRAINT chk_arbol_o_zona CHECK (
    (tipo_imagen = 'corteza' AND id_arbol IS NOT NULL AND id_zona IS NULL) OR
    (tipo_imagen = 'follaje' AND id_zona  IS NOT NULL AND id_arbol IS NULL)
)
```

Es un **o exclusivo** (⊕) que la propia base hace cumplir: ninguna aplicación puede guardar una corteza
sin árbol o un follaje colgado de un árbol.

#### Almacenamiento híbrido: sin imágenes en la base

Las fotos **no** se guardan como BLOB en la base, solo su ruta (`ruta_evidencia`):

| Dónde | Qué guarda |
|---|---|
| **Móvil Android (offline-first)** | **SQLite (Room):** árboles, zonas y análisis con su estado (pendiente / sincronizado) y solo la ruta local de la foto. **Memoria interna:** las fotos JPG, el modelo TFLite (21.5 MB) y el mapa vectorial (`.pmtiles`) para trabajar sin señal. |
| **Sincronización ascendente** | **WorkManager** envía al recuperar conexión. Los ids son **UUID** generados en el teléfono, así no chocan con los de otros equipos ni se duplican si un envío se repite. |
| **Amazon RDS (PostgreSQL)** | Las 7 tablas consolidadas: TT_BKN escribe los lotes que llegan del móvil y *b-sheet* los consulta para la web. |
| **Amazon S3 (privado)** | Las evidencias (`/evidencias/*`). La web las ve con **URLs firmadas (SigV4) que vencen en 5 minutos**; el bucket nunca es público. |

Así la base se mantiene ligera y rápida, y las fotos viven donde son más baratas y escalan solas.

### 3. Integridad: que los datos no puedan quedar mal

La base no confía en que las aplicaciones siempre hagan lo correcto; las reglas críticas viven en ella:

- **Llaves primarias UUID:** los ids se pueden generar en el teléfono sin conexión sin chocar con otros.
- **Llaves foráneas:** un análisis no puede apuntar a un árbol que no existe.
- **CHECK:** solo valores válidos de rol, estado, tipo y resultado, y la regla del árbol o la zona.
- **Borrados coherentes:**
  - borrar un árbol o una zona borra sus análisis (`ON DELETE CASCADE`, migración V3), porque un análisis
    de corteza sin árbol violaría la regla;
  - borrar una cuenta **no** borra los análisis que subió: su autor queda en nulo (`id_cuenta`, V4).
- **Las cuentas no se borran, se desactivan.** Así no se pierde quién hizo cada cosa.

### 4. Seguridad

| Capa | Medida |
|---|---|
| **Red** | La base está en una VPC; su grupo de seguridad solo acepta conexiones de las Lambdas del sistema y de la IP del administrador. Ya no está abierta a internet (`0.0.0.0/0` se quitó). |
| **Cifrado en tránsito** | Las conexiones usan SSL (`sslmode=require`). |
| **Credenciales** | La contraseña del administrador de la base se rotó; las del backend web viven en AWS Secrets Manager, no en el código ni en variables visibles. |
| **Mínimo privilegio** | *b-sheet* entra con su propio usuario, `sheets_lectura`: `SELECT` en lo que consulta y, solo sobre `cuenta`, `INSERT`/`UPDATE` **por columna** para la gestión de cuentas. No puede borrar nada ni escribir en otras tablas. |
| **Contraseñas de usuarios** | Nunca se guardan: solo su hash **bcrypt** (costo 10), el mismo formato en el backend móvil y en el web. |
| **Consultas** | Siempre con parámetros enlazados (sin SQL armado con texto del usuario) y nombrando columna por columna: el hash nunca sale en una respuesta. |

### 5. Migraciones y ambientes

El esquema evoluciona con **migraciones versionadas** de Flyway (`V1`, `V3`, `V4`, `V6`…), archivos SQL que
se aplican en orden y quedan registrados:

| Ambiente | Base de datos | ¿Corre migraciones? |
|---|---|---|
| **Producción** | RDS PostgreSQL 16.3, dueña TT_BKN | **No** desde *b-sheet*: los cambios se aplican a mano, coordinados con TT_BKN |
| **Pruebas (Raspberry Pi)** | Postgres 16 propio con datos de demostración | Sí, réplica del esquema + datos demo |
| **Desarrollo local** | Postgres en Docker | Sí |
| **Pruebas automáticas** | Una base nueva por corrida (`sheets_test`, `sheets_e2e`, `sheets_estres`) | Sí, desde cero |

Cada prueba de punta a punta **recrea su base**, así los resultados no dependen de lo que dejó la corrida
anterior. Una prueba (`ProductionMigrationsTest`) impide que una migración de producción meta cuentas o datos
de demostración.

### 6. Rendimiento: lo que encontraron las pruebas de estrés

Con 20 000 análisis de prueba y 20 usuarios simultáneos, el mapa (`GET /arboles`) tardaba **2.1 s** en el
percentil 95, mientras todo lo demás respondía en menos de 100 ms.

- **Causa:** para mostrar el último análisis de cada árbol, PostgreSQL recorría el índice por fecha y
  descartaba unas 10 000 filas por árbol.
- **Arreglo:** dos **índices compuestos** por lugar y fecha (migración `V6`):
  `(id_arbol, fecha_captura DESC, id_analisis)` y lo mismo para zonas.
- **Resultado:** la consulta pasó de ~630 ms a **~3 ms**, y la carga completa de p95 827 ms a **23 ms**.
- En producción se crean con `CREATE INDEX CONCURRENTLY`, que no bloquea a la app móvil mientras se construyen.

**Pool de conexiones:** cada Lambda atiende una petición a la vez con un pool de 2 conexiones, y el sistema
escala agregando instancias, no conexiones. Así no se agota el límite de conexiones de la base.

### 7. Decisiones de diseño y por qué

- **Una base compartida en vez de una por aplicación:** los datos del móvil están en la web al instante y
  sin procesos de copia que puedan fallar.
- **Reglas en la base, no solo en el código:** aunque dos backends escriban, ninguno puede dejar datos
  inválidos.
- **UUID en vez de números consecutivos:** permiten crear registros sin conexión y no revelan cuántos hay.
- **Fotos en S3 y no en la base:** la base se mantiene ligera y rápida; S3 es más barato y escala solo.
- **Usuario de solo lectura para la web:** si alguien vulnerara la web, no podría modificar árboles ni
  análisis.

---

## Parte 2 · Speech corto (≈ 2 minutos)

> **Nuestro modelo responde una pregunta: quién capturó qué, con qué equipo, sobre qué árbol o zona, y qué
> resultado dio.** Para eso usamos siete tablas.
>
> A la izquierda están **las personas y los equipos**. `cuenta` guarda a los usuarios, con su contraseña
> cifrada con bcrypt y su rol: administrador o experto. `dispositivo` guarda los teléfonos. Como un teléfono
> puede pasar de un brigadista a otro, la relación es de muchos a muchos y vive en `cuenta_dispositivo`, que
> además conserva el historial de quién usó qué equipo.
>
> Al centro están **los objetivos que se monitorean**: `arbol`, para la corteza, con su especie y coordenadas
> GPS, y `zona_follaje`, para el dosel, con un centro y un radio. Cada uno sabe qué cuenta y qué equipo lo
> registró.
>
> A la derecha está **el núcleo: `analisis`**. Cada captura guarda si es de corteza o de follaje, el resultado
> (sano, infestado o no determinado), la confianza del modelo, la fecha, la ubicación y su estado de
> sincronización. Un árbol o una zona acumulan muchos análisis en el tiempo: eso es el seguimiento. Y la regla
> más importante la cumple la propia base con un **CHECK: una corteza siempre apunta a un árbol y un follaje
> siempre a una zona, nunca a los dos**. Cuando es follaje, `analisis_cromatico` agrega el porcentaje de sano,
> regular, dañado e incierto que calcula OpenCV, en una relación uno a uno.
>
> Por último, **el almacenamiento es híbrido: las fotos no se guardan en la base**. En el teléfono, Room
> guarda los datos y la ruta local de la foto, así se trabaja sin señal. Cuando vuelve la conexión, WorkManager
> sincroniza con identificadores UUID que no chocan entre equipos. En la nube, PostgreSQL en RDS consolida las
> siete tablas y las fotos van a un bucket privado de S3, que la web muestra con enlaces firmados que vencen en
> cinco minutos.
>
> **En una frase:** un modelo pequeño y claro, donde las reglas importantes las garantiza la base, los datos
> funcionan sin conexión y las imágenes viven donde conviene.
