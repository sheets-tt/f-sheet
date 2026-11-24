# TDD y Clean Architecture: cómo se unen

Primero una explicación completa y al final un speech corto (≈ 2 minutos) para presentarlo.

## Parte 1 · Explicación completa

### 1. ¿Qué es Clean Architecture?

Clean Architecture (Robert C. Martin) organiza el software en **capas concéntricas**. Lo más importante, las
reglas del negocio, queda en el centro, y los detalles técnicos quedan en la orilla.

| Capa | Qué contiene | Ejemplo en el backend (*b-sheet*) |
|---|---|---|
| **Dominio** | Reglas y conceptos del negocio; **puertos** (interfaces) que dicen qué necesita el sistema | `DatosCuenta`, `GestionCuentasRepository`, `HashContrasenas`, `Contrasenas` |
| **Aplicación** | **Casos de uso**: orquestan las reglas para cumplir una intención del usuario | `GestionarCuentas` (crear, editar, desactivar, activar) |
| **Infraestructura** | **Adaptadores**: implementan los puertos con tecnología concreta | `JdbcAdministracionRepository` (SQL), `BCryptHashContrasenas` (bcrypt) |
| **Entrega** | Cómo entra el mundo exterior | `GestionCuentasController` (HTTP con Micronaut), Lambda |

**La regla de dependencia:** el código solo depende de capas **más internas**.

- El caso de uso no importa nada de Micronaut, JDBC ni AWS.
- Si mañana PostgreSQL se cambia por otra base de datos, solo cambia el adaptador.

**Puertos y adaptadores (arquitectura hexagonal):** el dominio define una interfaz, el *puerto*, y la
infraestructura la implementa, el *adaptador*. Así el centro **no conoce** los detalles: los detalles conocen
al centro.

### 2. ¿Qué es TDD?

*Test-Driven Development* (Kent Beck) es una **forma de trabajar** en ciclos cortos:

1. 🔴 **Rojo:** escribe una prueba que describa el comportamiento deseado. Falla porque aún no existe.
2. 🟢 **Verde:** escribe el código **mínimo** para que pase.
3. 🔵 **Refactor:** mejora el diseño sin cambiar el comportamiento. Las pruebas te avisan si rompes algo.

TDD no es «escribir pruebas». Es **diseñar desde el uso**: antes de implementar, te obliga a decidir qué
entra, qué sale y qué regla se cumple.

### 3. Por qué se necesitan mutuamente

#### Clean Architecture hace posible TDD

TDD necesita pruebas **rápidas, aisladas y deterministas**. Si una regla vive dentro de un controlador que
abre conexiones a la base de datos, probarla exige levantar todo el sistema y el ciclo rojo → verde se vuelve
lento.

Con Clean Architecture, el caso de uso depende solo de interfaces. En la prueba se le pasan
**implementaciones falsas en memoria** y se comprueba la regla en milisegundos:

> «Un administrador no puede quitarse su propio rol» → `GestionarCuentasTest`, sin BD, sin HTTP, sin Micronaut.

#### TDD empuja hacia Clean Architecture

Cuando escribir la prueba es difícil, el código te está diciendo algo:

| Síntoma al escribir la prueba | Problema de diseño | Solución arquitectónica |
|---|---|---|
| Necesito una BD real para probar una regla | La regla está pegada al SQL | Extraer un puerto (`GestionCuentasRepository`) |
| Necesito AWS para probar | El caso de uso llama a S3 directo | Puerto + adaptador (firmador de evidencias) |
| Necesito levantar el servidor HTTP | La lógica está en el controlador | Mover la lógica a un caso de uso |
| La prueba depende de la hora | Uso directo del reloj del sistema | Inyectar el tiempo como dependencia |

**La prueba es el primer cliente del código.** Si a ella le cuesta usarlo, a todos les costará.

### 4. La pirámide de pruebas sigue a las capas

```text
            ▲  E2E (Playwright, 102 pruebas): flujos completos en el navegador
           ▲▲  API (LambdaTestSupport): el sistema entero por HTTP
          ▲▲▲  Integración de adaptadores (JdbcGestionCuentasRepositoryTest, BD real)
         ▲▲▲▲  Unitarias de casos de uso y dominio (GestionarCuentasTest, en memoria)
```

- **Muchas pruebas abajo** (rápidas y baratas): validan las reglas.
- **Pocas arriba** (lentas y costosas): validan que las piezas encajan.
- Cada capa de la arquitectura tiene **su** tipo de prueba natural.

### 5. Casos reales del proyecto

**a) Un bug de seguridad, resuelto con TDD sin tocar el dominio**

- **Problema:** un token viejo podía autenticarse como otra persona si su correo se reutilizaba.
- 🔴 Primero, la prueba `unTokenViejoNoValePorLaCuentaQueDespuesTomaSuCorreo`, que fallaba.
- 🟢 Luego el arreglo: el token lleva el id de la cuenta (`cid`) y el adaptador
  `CuentaVigenteJwtAuthenticationFactory` lo valida.
- 🔵 El dominio y los casos de uso **no cambiaron**: el arreglo vivió solo en infraestructura.
- La prueba quedó como **protección permanente** contra la regresión.

**b) Reglas que se prueban en memoria**

- «Debe quedar al menos un administrador activo» y «no puedes desactivarte a ti mismo» se prueban en el caso de
  uso.
- La garantía ante dos peticiones simultáneas se prueba en el adaptador SQL, contra una BD real.
- Es la misma regla, cubierta en dos capas, cada una con lo que le corresponde.

**c) Las pruebas de estrés encontraron un problema de infraestructura**

- `GET /arboles` tardaba 2.1 s con 20 000 análisis.
- La causa era un índice faltante. El arreglo (migración `V6`) **no tocó ninguna regla de negocio**.
- Gracias a la separación de capas, el cambio fue **local y seguro**: las pruebas del backend lo confirmaron.

**d) El frontend también lo aplica**

- En la web (*f-sheet*), la lógica vive en funciones puras (`src/lib/analisis.ts`, `src/lib/graficos.ts`)
  separadas de los componentes React.
- Por eso se prueban con Vitest sin navegador (285 pruebas, en unos 12 s), y las E2E solo verifican los
  flujos completos.

### 6. Beneficios de combinarlos

- **Cambiar sin miedo:** las reglas están aisladas y protegidas por pruebas.
- **Retroalimentación rápida:** el ciclo de TDD dura segundos porque las reglas se prueban sin infraestructura.
- **Documentación viva:** los nombres de las pruebas describen el negocio («una cuenta desactivada no puede
  entrar»).
- **Independencia tecnológica:** framework, BD o nube son detalles reemplazables.
- **Menos bugs en producción:** cada bug corregido deja una prueba que impide que regrese.

### 7. Errores comunes

- Hacer «TDD» escribiendo las pruebas **después**: se pierde el beneficio de diseño.
- Probar solo por la interfaz (E2E): pruebas lentas, frágiles y que no señalan dónde está el error.
- Crear capas e interfaces **sin necesidad real**: la arquitectura debe servir al negocio, no al revés.
- Usar *mocks* que repiten la implementación: hay que probar **comportamiento**, no detalles internos.

---

## Parte 2 · Speech corto (≈ 2 minutos)

> **TDD y Clean Architecture persiguen lo mismo: proteger lo importante de los detalles.**
>
> Clean Architecture pone las **reglas del negocio en el centro** y deja afuera la base de datos, el framework
> y la nube. En nuestro backend, el caso de uso `GestionarCuentas` sabe que «un administrador no puede
> desactivarse a sí mismo», pero no sabe que existe PostgreSQL. Solo conoce interfaces.
>
> TDD es un ciclo corto: **rojo, verde, refactor**. Primero escribo una prueba que falla, luego el código mínimo
> para que pase, y después mejoro el diseño con la prueba como red de seguridad.
>
> **¿Por qué van unidos?** Porque TDD necesita probar reglas **rápido y sin levantar todo el sistema**, y Clean
> Architecture lo hace posible: a cada caso de uso le paso implementaciones falsas y compruebo la regla en
> milisegundos. Y al revés: cuando una prueba es difícil de escribir, es una señal de que la regla está pegada
> a un detalle. TDD me empuja hacia una mejor arquitectura.
>
> Lo vivimos en el proyecto. QA encontró que un token viejo podía entrar como otra persona. **Primero escribimos
> la prueba que lo reproducía**; luego corregimos solo el adaptador de seguridad, **sin tocar el dominio**, y la
> prueba quedó protegiéndonos para siempre. Y cuando las pruebas de estrés mostraron que el mapa tardaba dos
> segundos, el arreglo fue un índice en la base de datos: ninguna regla de negocio cambió.
>
> **En una frase:** Clean Architecture separa *qué* hace el sistema de *con qué* lo hace, y TDD comprueba en
> cada paso que ese *qué* funciona. Juntas nos permiten cambiar la tecnología sin miedo, porque el corazón del
> sistema está aislado y probado.
