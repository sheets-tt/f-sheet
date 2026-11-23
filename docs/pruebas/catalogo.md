---
hide:
  - toc
---

# Catálogo de pruebas

Cada prueba automática de Desco, agrupada por proyecto y archivo, con su resultado en la última corrida.
Abre un archivo para ver sus pruebas. Los nombres del backend vienen del nombre del método de Java.

<div class="cifras" markdown>
<div class="cifra"><span class="cifra-valor">200</span><span class="cifra-nombre">backend (b-sheet)</span></div>
<div class="cifra"><span class="cifra-valor">285</span><span class="cifra-nombre">web (Vitest)</span></div>
<div class="cifra"><span class="cifra-valor">102</span><span class="cifra-nombre">punta a punta (Playwright)</span></div>
<div class="cifra"><span class="cifra-valor">21</span><span class="cifra-nombre">app móvil</span></div>
</div>

## Backend web · b-sheet

### Dominio

??? note "`analisis.domain.ClaveEvidenciaTest` · 19 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Tiene evidencia only checks for an actual path | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Regional s3 url from tt bkn | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Relative key is used as is | :material-check-circle:{ .ok } pasa | 1 ms |
    | Rejects anything outside the evidence folder of this bucket (String)[1] | :material-check-circle:{ .ok } pasa | 2 ms |
    | Rejects anything outside the evidence folder of this bucket (String)[2] | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Rejects anything outside the evidence folder of this bucket (String)[3] | :material-check-circle:{ .ok } pasa | 1 ms |
    | Rejects anything outside the evidence folder of this bucket (String)[4] | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Rejects anything outside the evidence folder of this bucket (String)[5] | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Rejects anything outside the evidence folder of this bucket (String)[6] | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Rejects anything outside the evidence folder of this bucket (String)[7] | :material-check-circle:{ .ok } pasa | 1 ms |
    | Rejects anything outside the evidence folder of this bucket (String)[8] | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Rejects anything outside the evidence folder of this bucket (String)[9] | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Rejects anything outside the evidence folder of this bucket (String)[10] | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Rejects anything outside the evidence folder of this bucket (String)[11] | :material-check-circle:{ .ok } pasa | < 1 ms |
    | No image (String)[1] | :material-check-circle:{ .ok } pasa | < 1 ms |
    | No image (String)[2] | :material-check-circle:{ .ok } pasa | 1 ms |
    | No image (String)[3] | :material-check-circle:{ .ok } pasa | < 1 ms |
    | No image (String)[4] | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Global s3 url and percent encoding | :material-check-circle:{ .ok } pasa | 1 ms |

??? note "`analisis.domain.ValoresAnalisisTest` · 4 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Unknown values are rejected with their name | :material-check-circle:{ .ok } pasa | 1 ms |
    | Tipo imagen maps database values | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Resultado maps database values | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Estado sincronizacion maps database values | :material-check-circle:{ .ok } pasa | < 1 ms |

### Casos de uso

??? note "`administracion.application.ConsultarAdministracionTest` · 2 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Cuentas returns every account | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Dispositivos returns every device | :material-check-circle:{ .ok } pasa | 1 ms |

??? note "`administracion.application.GestionarCuentasTest` · 9 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Crea una cuenta activa con el correo normalizado yla contrasena hasheada | :material-check-circle:{ .ok } pasa | 1 ms |
    | Valida la contrasena antes de tocar el repositorio | :material-check-circle:{ .ok } pasa | 1 ms |
    | Editar no permite el correo de otra cuenta | :material-check-circle:{ .ok } pasa | 3 ms |
    | Editar con contrasena la reemplaza | :material-check-circle:{ .ok } pasa | < 1 ms |
    | El administrador no puede quitarse el rol ni desactivarse | :material-check-circle:{ .ok } pasa | 1 ms |
    | Editar sin contrasena conserva la actual | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Un id inexistente es no encontrada | :material-check-circle:{ .ok } pasa | 1 ms |
    | No crea un correo repetido aunque cambien las mayusculas | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Desactiva yreactiva otra cuenta | :material-check-circle:{ .ok } pasa | < 1 ms |

??? note "`analisis.application.ConsultarAnalisisTest` · 4 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Buscar rejects limit out of range | :material-check-circle:{ .ok } pasa | 1 ms |
    | Buscar accepts same instant as range | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Buscar rejects reversed date range | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Buscar passes valid filter to repository | :material-check-circle:{ .ok } pasa | 1 ms |

??? note "`analisis.application.ObtenerEvidenciaTest` · 3 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Signs the key and reports expiry | :material-check-circle:{ .ok } pasa | 3 ms |
    | Analysis without image or forbidden key signs nothing | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Unknown analysis signs nothing | :material-check-circle:{ .ok } pasa | < 1 ms |

??? note "`arbol.application.ConsultarArbolesTest` · 3 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Obtener finds tree by id | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Obtener is empty for unknown id | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Listar returns every tree | :material-check-circle:{ .ok } pasa | < 1 ms |

??? note "`auth.application.AuthenticateUserTest` · 1 prueba"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Valid credentials return authenticated user | :material-check-circle:{ .ok } pasa | 1 ms |

??? note "`estadistica.application.ConsultarEstadisticasTest` · 2 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Empty database has zeros and no averages | :material-check-circle:{ .ok } pasa | 3 ms |
    | Fills missing categories with zero in declaration order | :material-check-circle:{ .ok } pasa | 1 ms |

??? note "`zona.application.ConsultarZonasTest` · 3 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Obtener finds zone by id | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Obtener is empty for unknown id | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Listar returns every zone | :material-check-circle:{ .ok } pasa | 1 ms |

### Adaptadores

??? note "`administracion.infrastructure.JdbcAdministracionRepositoryTest` · 2 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Lists devices with their current account | :material-check-circle:{ .ok } pasa | 3 ms |
    | Lists accounts by email with role and state | :material-check-circle:{ .ok } pasa | 1 ms |

??? note "`administracion.infrastructure.JdbcGestionCuentasRepositoryTest` · 9 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Cambia el estado con los valores de tt bkn | :material-check-circle:{ .ok } pasa | 12 ms |
    | El unique de correo se traduce acorreo en uso | :material-check-circle:{ .ok } pasa | 9 ms |
    | Crea una cuenta activa con fecha de creacion | :material-check-circle:{ .ok } pasa | 131 ms |
    | Un id inexistente no actualiza nada | :material-check-circle:{ .ok } pasa | 4 ms |
    | Dos administradores que se desactivan ala vez no dejan el sistema sin administradores | :material-check-circle:{ .ok } pasa | 69 ms |
    | Correo en uso ignora mayusculas ypuede excluir una cuenta | :material-check-circle:{ .ok } pasa | 2 ms |
    | No desactiva ni degrada al ultimo administrador activo | :material-check-circle:{ .ok } pasa | 11 ms |
    | Con otro administrador activo si se puede desactivar odegradar | :material-check-circle:{ .ok } pasa | 126 ms |
    | Actualiza datos ysolo cambia el hash si se da | :material-check-circle:{ .ok } pasa | 6 ms |

??? note "`analisis.infrastructure.JdbcAnalisisRepositoryTest` · 12 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Find by id returns every column | :material-check-circle:{ .ok } pasa | 7 ms |
    | Without filters returns most recent capture first | :material-check-circle:{ .ok } pasa | 1 ms |
    | Every analysis carries its author or null | :material-check-circle:{ .ok } pasa | 2 ms |
    | Find by id is empty for unknown id | :material-check-circle:{ .ok } pasa | 1 ms |
    | Date range is inclusive | :material-check-circle:{ .ok } pasa | 1 ms |
    | Filters by tree and zone | :material-check-circle:{ .ok } pasa | 1 ms |
    | Detects the column in the test database | :material-check-circle:{ .ok } pasa | 1 ms |
    | Every analysis carries its device or null and degrades without column | :material-check-circle:{ .ok } pasa | 2 ms |
    | Filters by type result and sync state | :material-check-circle:{ .ok } pasa | 3 ms |
    | Find by id includes chromatic when present | :material-check-circle:{ .ok } pasa | 1 ms |
    | Without the column every author is null and nothing fails | :material-check-circle:{ .ok } pasa | 3 ms |
    | Limit cuts the most recent | :material-check-circle:{ .ok } pasa | < 1 ms |

??? note "`analisis.infrastructure.JdbcSeguimientoRepositoryTest` · 4 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Without the column is empty | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Zone ordered by latest capture not by id | :material-check-circle:{ .ok } pasa | 6 ms |
    | Analyses without author are left out | :material-check-circle:{ .ok } pasa | 1 ms |
    | Tree followed by two people most recent first | :material-check-circle:{ .ok } pasa | 1 ms |

??? note "`analisis.infrastructure.S3FirmadorEvidenciasTest` · 1 prueba"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Presigns aget on the evidence bucket | :material-check-circle:{ .ok } pasa | 5 ms |

??? note "`arbol.infrastructure.JdbcArbolRepositoryTest` · 4 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Find all returns most recent first | :material-check-circle:{ .ok } pasa | 5 ms |
    | Find by id is empty for unknown id | :material-check-circle:{ .ok } pasa | 1 ms |
    | Last analysis is null without analyses | :material-check-circle:{ .ok } pasa | 1 ms |
    | Find by id returns tree | :material-check-circle:{ .ok } pasa | 1 ms |

??? note "`auth.infrastructure.CuentaUserAccountRepositoryTest` · 1 prueba"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Finds active account by email ignoring case | :material-check-circle:{ .ok } pasa | 9 ms |

??? note "`compartido.infrastructure.ColumnaAutorAnalisisTest` · 3 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Si la columna existe se recuerda yno se vuelve aconsultar | :material-check-circle:{ .ok } pasa | 1 ms |
    | Mientras falte solo consulta una vez por intervalo | :material-check-circle:{ .ok } pasa | 1 ms |
    | Si la columna aparece despues se detecta sin redesplegar | :material-check-circle:{ .ok } pasa | 1 ms |

??? note "`estadistica.infrastructure.JdbcEstadisticasRepositoryTest` · 4 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Last capture is the most recent analysis | :material-check-circle:{ .ok } pasa | 2 ms |
    | Chromatic average is rounded to two decimals | :material-check-circle:{ .ok } pasa | 1 ms |
    | Counts group by database value | :material-check-circle:{ .ok } pasa | 2 ms |
    | Totals count rows and infested trees and zones | :material-check-circle:{ .ok } pasa | 4 ms |

??? note "`zona.infrastructure.JdbcZonaFollajeRepositoryTest` · 3 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Find all returns most recent first | :material-check-circle:{ .ok } pasa | 3 ms |
    | Find by id is empty for unknown id | :material-check-circle:{ .ok } pasa | 1 ms |
    | Find by id returns zone with nullable columns | :material-check-circle:{ .ok } pasa | 1 ms |

### API

??? note "`AdministracionApiTest` · 4 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Require token | :material-check-circle:{ .ok } pasa | 3 ms |
    | Admin lists devices without push token | :material-check-circle:{ .ok } pasa | 9 ms |
    | Admin lists accounts without password hashes | :material-check-circle:{ .ok } pasa | 3 ms |
    | Field expert is forbidden | :material-check-circle:{ .ok } pasa | 2 ms |

??? note "`AnalisisApiTest` · 16 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Repeated parameter is400 | :material-check-circle:{ .ok } pasa | 2 ms |
    | Invalid enum filter is400 with message | :material-check-circle:{ .ok } pasa | 8 ms |
    | Invalid ranges and limits are400 | :material-check-circle:{ .ok } pasa | 12 ms |
    | Administrator also sees authors and no email is leaked | :material-check-circle:{ .ok } pasa | 84 ms |
    | List without filters returns everything most recent first | :material-check-circle:{ .ok } pasa | 8 ms |
    | List requires token | :material-check-circle:{ .ok } pasa | 1 ms |
    | Detail unknown id is404 and invalid id is400 | :material-check-circle:{ .ok } pasa | 4 ms |
    | Non numeric or negative limit is400 | :material-check-circle:{ .ok } pasa | 6 ms |
    | Sql injection attempts are rejected and change nothing | :material-check-circle:{ .ok } pasa | 10 ms |
    | List applies query filters | :material-check-circle:{ .ok } pasa | 22 ms |
    | Analysis without author sends null author | :material-check-circle:{ .ok } pasa | 4 ms |
    | Detail returns contract payload with chromatic | :material-check-circle:{ .ok } pasa | 3 ms |
    | Unknown parameters are ignored | :material-check-circle:{ .ok } pasa | 7 ms |
    | Empty parameters count as not sent | :material-check-circle:{ .ok } pasa | 17 ms |
    | List and history carry the author of each analysis | :material-check-circle:{ .ok } pasa | 7 ms |
    | Detail without chromatic sends null | :material-check-circle:{ .ok } pasa | 3 ms |

??? note "`ArbolesApiTest` · 10 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Administrator sees the follow up without emails | :material-check-circle:{ .ok } pasa | 82 ms |
    | Detail unknown id is404 | :material-check-circle:{ .ok } pasa | 2 ms |
    | Detail returns contract payload | :material-check-circle:{ .ok } pasa | 2 ms |
    | Detail invalid id is400 | :material-check-circle:{ .ok } pasa | 2 ms |
    | List requires token | :material-check-circle:{ .ok } pasa | 1 ms |
    | List carries who registered but not the follow up | :material-check-circle:{ .ok } pasa | 3 ms |
    | Tree without analyses has empty follow up | :material-check-circle:{ .ok } pasa | 3 ms |
    | Tree without analyses has null last analysis | :material-check-circle:{ .ok } pasa | 3 ms |
    | List returns trees most recent first | :material-check-circle:{ .ok } pasa | 2 ms |
    | Detail keeps null description | :material-check-circle:{ .ok } pasa | 3 ms |

??? note "`AuthApiTest` · 16 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Login malformed json is400 not aserver error | :material-check-circle:{ .ok } pasa | 4 ms |
    | Login accepts fields up to the limit | :material-check-circle:{ .ok } pasa | 187 ms |
    | Login deactivated account is401 | :material-check-circle:{ .ok } pasa | 62 ms |
    | Login admin returns administrador role | :material-check-circle:{ .ok } pasa | 62 ms |
    | Login rejects oversized fields | :material-check-circle:{ .ok } pasa | 3 ms |
    | Login ok returns contract payload | :material-check-circle:{ .ok } pasa | 61 ms |
    | Cors preflight allows configured origin | :material-check-circle:{ .ok } pasa | 1 ms |
    | Cors rejects unknown origin | :material-check-circle:{ .ok } pasa | 1 ms |
    | Login blank fields is400 | :material-check-circle:{ .ok } pasa | 2 ms |
    | Health is up | :material-check-circle:{ .ok } pasa | 1 ms |
    | Login unknown user is401 | :material-check-circle:{ .ok } pasa | 61 ms |
    | Login is case insensitive on username | :material-check-circle:{ .ok } pasa | 64 ms |
    | Me with invalid token is401 | :material-check-circle:{ .ok } pasa | 3 ms |
    | Login wrong password is401 | :material-check-circle:{ .ok } pasa | 61 ms |
    | Me with token returns profile | :material-check-circle:{ .ok } pasa | 69 ms |
    | Me without token is401 | :material-check-circle:{ .ok } pasa | 1 ms |

??? note "`AutorSinColumnaApiTest` · 1 prueba"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Without the column authors are null and follow up is empty | :material-check-circle:{ .ok } pasa | 240 ms |

??? note "`EstadisticasApiTest` · 3 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Categories keep declaration order | :material-check-circle:{ .ok } pasa | 81 ms |
    | Returns contract payload | :material-check-circle:{ .ok } pasa | 67 ms |
    | Requires token | :material-check-circle:{ .ok } pasa | 2 ms |

??? note "`EvidenciaApiTest` · 5 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Analysis without image is404 with message | :material-check-circle:{ .ok } pasa | 20 ms |
    | Accepts the full s3 url stored by tt bkn | :material-check-circle:{ .ok } pasa | 51 ms |
    | Unknown or invalid ids | :material-check-circle:{ .ok } pasa | 6 ms |
    | Returns short lived signed url not cached | :material-check-circle:{ .ok } pasa | 5 ms |
    | Requires token | :material-check-circle:{ .ok } pasa | 1 ms |

??? note "`GestionCuentasApiTest` · 22 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Id inexistente es404 | :material-check-circle:{ .ok } pasa | 42 ms |
    | Un experto de campo no gestiona cuentas | :material-check-circle:{ .ok } pasa | 85 ms |
    | Reactiva una cuenta de tt bkn desactivada | :material-check-circle:{ .ok } pasa | 160 ms |
    | Un administrador no puede desactivarse ni quitarse el rol | :material-check-circle:{ .ok } pasa | 262 ms |
    | Datos invalidos son400 | :material-check-circle:{ .ok } pasa | 197 ms |
    | Cors permite put ypatch desde la web | :material-check-circle:{ .ok } pasa | 4 ms |
    | Correo repetido es409 sin importar mayusculas | :material-check-circle:{ .ok } pasa | 89 ms |
    | Un token viejo no vale por la cuenta que despues toma su correo | :material-check-circle:{ .ok } pasa | 727 ms |
    | Desactivar corta el login ylos tokens ya emitidos | :material-check-circle:{ .ok } pasa | 327 ms |
    | Editar con el correo de otra cuenta es409 | :material-check-circle:{ .ok } pasa | 105 ms |
    | Sin token es401 | :material-check-circle:{ .ok } pasa | 5 ms |
    | El login emite el id de la cuenta | :material-check-circle:{ .ok } pasa | 77 ms |
    | Crea un administrador con permisos de administrador | :material-check-circle:{ .ok } pasa | 143 ms |
    | Editar valida como al crear | :material-check-circle:{ .ok } pasa | 158 ms |
    | Cambiar la contrasena invalida la anterior | :material-check-circle:{ .ok } pasa | 262 ms |
    | Crea una cuenta que puede iniciar sesion | :material-check-circle:{ .ok } pasa | 137 ms |
    | Campos de mas no fijan estado ni hash ni id | :material-check-circle:{ .ok } pasa | 131 ms |
    | Los mensajes de409 distinguen el correo de la cuenta propia | :material-check-circle:{ .ok } pasa | 157 ms |
    | Un token viejo no impide iniciar sesion | :material-check-circle:{ .ok } pasa | 205 ms |
    | Edita datos yrol sin cambiar la contrasena | :material-check-circle:{ .ok } pasa | 198 ms |
    | Quitar el rol corta los permisos de administrador de sus tokens | :material-check-circle:{ .ok } pasa | 207 ms |
    | Acepta los limites | :material-check-circle:{ .ok } pasa | 194 ms |

??? note "`TokenManipuladoApiTest` · 9 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Un token bien firmado yvigente pasa | :material-check-circle:{ .ok } pasa | 8 ms |
    | Un token sin id de cuenta no pasa | :material-check-circle:{ .ok } pasa | 2 ms |
    | Un id de cuenta que no es uuid oque no existe no pasa | :material-check-circle:{ .ok } pasa | 2 ms |
    | Cambiar el rol dentro de un token real no da permisos de administrador | :material-check-circle:{ .ok } pasa | 67 ms |
    | Un token firmado con otra clave no pasa | :material-check-circle:{ .ok } pasa | 1 ms |
    | Un token vencido no pasa | :material-check-circle:{ .ok } pasa | 1 ms |
    | Un token sin firma con alg none no pasa | :material-check-circle:{ .ok } pasa | 3 ms |
    | Un token con el id de otra cuenta no pasa | :material-check-circle:{ .ok } pasa | 8 ms |
    | Basura en lugar de token no pasa | :material-check-circle:{ .ok } pasa | 2 ms |

??? note "`ZonasApiTest` · 8 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Detail keeps null columns | :material-check-circle:{ .ok } pasa | 20 ms |
    | Detail unknown id is404 | :material-check-circle:{ .ok } pasa | 3 ms |
    | Analyses without author do not count as follow up | :material-check-circle:{ .ok } pasa | 3 ms |
    | Detail returns contract payload | :material-check-circle:{ .ok } pasa | 3 ms |
    | Detail invalid id is400 | :material-check-circle:{ .ok } pasa | 5 ms |
    | List requires token | :material-check-circle:{ .ok } pasa | 1 ms |
    | List carries who registered but not the follow up | :material-check-circle:{ .ok } pasa | 4 ms |
    | List returns zones most recent first | :material-check-circle:{ .ok } pasa | 3 ms |

### Configuración y esquema

??? note "`ContextPathTest` · 1 prueba"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Routes are served under context path | :material-check-circle:{ .ok } pasa | 171 ms |

??? note "`NeonDatabaseTest` · 1 prueba"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Every migration in the repo is applied in neon | :material-minus-circle-outline:{ .omitida } omitida | < 1 ms |

??? note "`ProductionConfigTest` · 1 prueba"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Flyway is disabled by default | :material-check-circle:{ .ok } pasa | 8 ms |

??? note "`ProductionMigrationsTest` · 1 prueba"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Production migrations create no accounts | :material-check-circle:{ .ok } pasa | 2.4 s |

??? note "`cuenta.RolTest` · 3 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Rejects unknown values | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Exposes the database value for writes | :material-check-circle:{ .ok } pasa | < 1 ms |
    | Maps database values to codes | :material-check-circle:{ .ok } pasa | 1 ms |

??? note "`esquema.EsquemaBorradoTest` · 2 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Borrar un arbol borra sus analisis | :material-check-circle:{ .ok } pasa | 19 ms |
    | Borrar una zona borra sus analisis ycromaticos | :material-check-circle:{ .ok } pasa | 7 ms |

??? note "`secretos.SecretosAwsTest` · 5 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Lee las dos claves del json | :material-check-circle:{ .ok } pasa | 2 ms |
    | Rechaza secretos incompletos ocon claves desconocidas | :material-check-circle:{ .ok } pasa | 6 ms |
    | Sin secretos id no llama asecrets manager | :material-check-circle:{ .ok } pasa | 2 ms |
    | La imagen de lambda usa el handler que lee los secretos | :material-check-circle:{ .ok } pasa | 4 ms |
    | Con secretos id las propiedades salen de secrets manager | :material-check-circle:{ .ok } pasa | 10 ms |

## Web · f-sheet (Vitest)

### Lógica pura

??? note "`lib/analisis.test.ts` · 19 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | categorías › niveles de confianza | :material-check-circle:{ .ok } pasa | 1.1 ms |
    | categorías › "requieren atención" con sus motivos | :material-check-circle:{ .ok } pasa | < 1 ms |
    | categorías › conteos de las cajas | :material-check-circle:{ .ok } pasa | < 1 ms |
    | categorías › la certeza solo aplica a corteza; el follaje se diagnostica por su color | :material-check-circle:{ .ok } pasa | < 1 ms |
    | categorías › el respaldo del diagnóstico: certeza en corteza, porcentajes de color en follaje | :material-check-circle:{ .ok } pasa | < 1 ms |
    | categorías › dentro de un grupo suman; entre grupos se cruzan | :material-check-circle:{ .ok } pasa | < 1 ms |
    | estado en la URL › ida y vuelta con orden fijo | :material-check-circle:{ .ok } pasa | < 1 ms |
    | estado en la URL › ignora valores inválidos | :material-check-circle:{ .ok } pasa | < 1 ms |
    | agrupación y vecinos › por árbol o zona, de más a menos análisis | :material-check-circle:{ .ok } pasa | < 1 ms |
    | agrupación y vecinos › por resultado en su orden y por día del más reciente | :material-check-circle:{ .ok } pasa | < 1 ms |
    | agrupación y vecinos › anterior y siguiente del mismo lugar | :material-check-circle:{ .ok } pasa | < 1 ms |
    | fechas inválidas y bordes de confianza (A1–A3) › ignora desde/hasta = 2026-13-45 | :material-check-circle:{ .ok } pasa | < 1 ms |
    | fechas inválidas y bordes de confianza (A1–A3) › ignora desde/hasta = 2026-10-32 | :material-check-circle:{ .ok } pasa | < 1 ms |
    | fechas inválidas y bordes de confianza (A1–A3) › ignora desde/hasta = 9999-99-99 | :material-check-circle:{ .ok } pasa | < 1 ms |
    | fechas inválidas y bordes de confianza (A1–A3) › ignora desde/hasta = 2026-02-30 | :material-check-circle:{ .ok } pasa | < 1 ms |
    | fechas inválidas y bordes de confianza (A1–A3) › ignora desde/hasta = ayer | :material-check-circle:{ .ok } pasa | < 1 ms |
    | fechas inválidas y bordes de confianza (A1–A3) › clasifica la confianza como se muestra (redondeada a una décima) | :material-check-circle:{ .ok } pasa | < 1 ms |
    | cajas por quién subió la foto › filtran por autor, «sin» junta los análisis sin autor registrado | :material-check-circle:{ .ok } pasa | < 1 ms |
    | cajas por quién subió la foto › se guardan en la URL sin repetir y en orden fijo | :material-check-circle:{ .ok } pasa | < 1 ms |

??? note "`lib/api.test.ts` · 8 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | queryAnalisis › sin filtros no agrega query string | :material-check-circle:{ .ok } pasa | 1.2 ms |
    | queryAnalisis › omite vacíos y respeta un orden fijo de parámetros | :material-check-circle:{ .ok } pasa | < 1 ms |
    | queryAnalisis › codifica los instantes ISO | :material-check-circle:{ .ok } pasa | < 1 ms |
    | peticiones de consulta › buscarAnalisis llama a /analisis con el filtro y el token | :material-check-circle:{ .ok } pasa | 1.9 ms |
    | peticiones de consulta › 400 conserva el mensaje del backend | :material-check-circle:{ .ok } pasa | 1.2 ms |
    | peticiones de consulta › 403 explica que falta permiso y no cierra la sesión | :material-check-circle:{ .ok } pasa | 2 ms |
    | peticiones de consulta › getEstadisticas devuelve el cuerpo tal cual | :material-check-circle:{ .ok } pasa | 1.9 ms |
    | login › guarda los roles del token en la sesión | :material-check-circle:{ .ok } pasa | < 1 ms |

??? note "`lib/cuentas.test.ts` · 18 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | validarCuenta › acepta un alta completa | :material-check-circle:{ .ok } pasa | 2.4 ms |
    | validarCuenta › pide nombre, correo, rol y contraseña al crear | :material-check-circle:{ .ok } pasa | < 1 ms |
    | validarCuenta › rechaza el correo ana | :material-check-circle:{ .ok } pasa | < 1 ms |
    | validarCuenta › rechaza el correo ana@ | :material-check-circle:{ .ok } pasa | < 1 ms |
    | validarCuenta › rechaza el correo ana@sheets | :material-check-circle:{ .ok } pasa | < 1 ms |
    | validarCuenta › rechaza el correo ana pérez@sheets.tt | :material-check-circle:{ .ok } pasa | < 1 ms |
    | validarCuenta › rechaza el correo aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@sheets.tt | :material-check-circle:{ .ok } pasa | < 1 ms |
    | validarCuenta › limita el nombre a 255 caracteres después de recortar | :material-check-circle:{ .ok } pasa | < 1 ms |
    | validarCuenta › exige al menos 8 caracteres | :material-check-circle:{ .ok } pasa | < 1 ms |
    | validarCuenta › cuenta el máximo en bytes UTF-8, no en caracteres | :material-check-circle:{ .ok } pasa | < 1 ms |
    | validarCuenta › la confirmación tiene que coincidir | :material-check-circle:{ .ok } pasa | < 1 ms |
    | validarCuenta › al crear rechaza una contraseña de solo espacios | :material-check-circle:{ .ok } pasa | < 1 ms |
    | validarCuenta › al editar rechaza una contraseña de solo espacios | :material-check-circle:{ .ok } pasa | < 1 ms |
    | validarCuenta › acepta espacios dentro de una contraseña con más caracteres | :material-check-circle:{ .ok } pasa | < 1 ms |
    | validarCuenta › al editar, la contraseña vacía conserva la actual | :material-check-circle:{ .ok } pasa | < 1 ms |
    | datosDe › recorta textos y omite la contraseña vacía | :material-check-circle:{ .ok } pasa | < 1 ms |
    | filtros y cuenta propia › busca sin acentos ni mayúsculas, y filtra por rol y estado | :material-check-circle:{ .ok } pasa | < 1 ms |
    | filtros y cuenta propia › reconoce la cuenta de la sesión por el correo | :material-check-circle:{ .ok } pasa | < 1 ms |

??? note "`lib/format.test.ts` · 9 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | fechas (hora del centro de México, UTC−6 sin horario de verano) › formatFecha muestra fecha y hora locales | :material-check-circle:{ .ok } pasa | < 1 ms |
    | fechas (hora del centro de México, UTC−6 sin horario de verano) › formatFecha tolera null | :material-check-circle:{ .ok } pasa | < 1 ms |
    | fechas (hora del centro de México, UTC−6 sin horario de verano) › los filtros por día cubren el día completo en hora local | :material-check-circle:{ .ok } pasa | < 1 ms |
    | fechas (hora del centro de México, UTC−6 sin horario de verano) › un día vacío no filtra | :material-check-circle:{ .ok } pasa | < 1 ms |
    | números y etiquetas › formatPorcentaje redondea sin decimales innecesarios | :material-check-circle:{ .ok } pasa | < 1 ms |
    | números y etiquetas › etiquetas en lenguaje de campo | :material-check-circle:{ .ok } pasa | < 1 ms |
    | haceCuanto › dice el tiempo transcurrido en palabras | :material-check-circle:{ .ok } pasa | < 1 ms |
    | inicioDelDia / finDelDia con fechas inválidas › no lanzan: devuelven undefined | :material-check-circle:{ .ok } pasa | < 1 ms |
    | formatPromedio › redondea sin decimales (no se confunde con un valor exacto) | :material-check-circle:{ .ok } pasa | < 1 ms |

??? note "`lib/geo.test.ts` · 5 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | circulo › es un anillo cerrado con todos sus puntos al radio pedido | :material-check-circle:{ .ok } pasa | 3.9 ms |
    | limitesDe › sin puntos no hay encuadre | :material-check-circle:{ .ok } pasa | < 1 ms |
    | limitesDe › contiene todos los puntos y el radio completo de las zonas | :material-check-circle:{ .ok } pasa | < 1 ms |
    | limitesDe › un solo punto queda centrado en un encuadre mínimo de 120 m | :material-check-circle:{ .ok } pasa | < 1 ms |
    | formatCoordenadas › usa hemisferios en vez de signos | :material-check-circle:{ .ok } pasa | < 1 ms |

??? note "`lib/graficos.test.ts` · 23 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | tiempo en CDMX › un análisis de las 23:00 en CDMX cuenta en su día, no en el siguiente (UTC) | :material-check-circle:{ .ok } pasa | 1.9 ms |
    | tiempo en CDMX › el dominio va del primer al último día con datos (incluido) | :material-check-circle:{ .ok } pasa | 3.4 ms |
    | tiempo en CDMX › elige días, semanas o meses según lo acercado | :material-check-circle:{ .ok } pasa | < 1 ms |
    | filtros en la URL › ida y vuelta con orden fijo | :material-check-circle:{ .ok } pasa | < 1 ms |
    | filtros en la URL › ignora valores inválidos e intercambia fechas al revés | :material-check-circle:{ .ok } pasa | 3.7 ms |
    | crossfilter › aplica todos los filtros | :material-check-circle:{ .ok } pasa | < 1 ms |
    | crossfilter › una gráfica ignora su propia dimensión | :material-check-circle:{ .ok } pasa | < 1 ms |
    | crossfilter › por lugar y por decena de confianza | :material-check-circle:{ .ok } pasa | < 1 ms |
    | agregados › serie por día con los días vacíos | :material-check-circle:{ .ok } pasa | < 1 ms |
    | agregados › serie por semana empieza en lunes | :material-check-circle:{ .ok } pasa | < 1 ms |
    | agregados › histograma de confianza en decenas | :material-check-circle:{ .ok } pasa | < 1 ms |
    | agregados › por lugar: todos los árboles y zonas, de más a menos análisis | :material-check-circle:{ .ok } pasa | < 1 ms |
    | agregados › mapa de calor lugar × día | :material-check-circle:{ .ok } pasa | < 1 ms |
    | agregados › indicadores de la selección | :material-check-circle:{ .ok } pasa | < 1 ms |
    | rango › el rango que cubre todos los datos es "sin rango" | :material-check-circle:{ .ok } pasa | < 1 ms |
    | rango › acercar, alejar y desplazar sin salir de los datos | :material-check-circle:{ .ok } pasa | < 1 ms |
    | rango acotado a los datos (G1) › solo acepta fechas reales | :material-check-circle:{ .ok } pasa | < 1 ms |
    | rango acotado a los datos (G1) › un rango enorme se acota a los días con datos | :material-check-circle:{ .ok } pasa | < 1 ms |
    | rango acotado a los datos (G1) › un rango entero fuera de los datos se ignora | :material-check-circle:{ .ok } pasa | < 1 ms |
    | rango acotado a los datos (G1) › normaliza la URL: rango acotado o quitado, sin lugares inexistentes | :material-check-circle:{ .ok } pasa | < 1 ms |
    | rango acotado a los datos (G1) › nunca genera más de MAX_PERIODOS periodos, aunque el dominio sea absurdo | :material-check-circle:{ .ok } pasa | < 1 ms |
    | textos por intervalo (G3) › usa la preposición de cada intervalo y meses en minúscula | :material-check-circle:{ .ok } pasa | < 1 ms |
    | zona horaria IANA (obs 1) › respeta el horario de verano que CDMX tuvo hasta 2022 | :material-check-circle:{ .ok } pasa | < 1 ms |

??? note "`lib/lenguaje.test.ts` · 8 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | lenguaje para agrónomos › ningún texto visible usa jerga técnica | :material-check-circle:{ .ok } pasa | 1.5 ms |
    | lenguaje para agrónomos › el resultado se dice con lo que significa | :material-check-circle:{ .ok } pasa | < 1 ms |
    | lenguaje para agrónomos › qué hacer según el resultado, la certeza y el lugar | :material-check-circle:{ .ok } pasa | 1.7 ms |
    | lenguaje para agrónomos › quién subió la foto y sus observaciones | :material-check-circle:{ .ok } pasa | < 1 ms |
    | lenguaje para agrónomos › cuántas personas le dan seguimiento | :material-check-circle:{ .ok } pasa | < 1 ms |
    | lenguaje para agrónomos › el color del follaje conserva los colores de estado | :material-check-circle:{ .ok } pasa | 3.7 ms |
    | quién le da seguimiento (sin el dato del backend) › usa la lista del backend si llega, aunque esté vacía | :material-check-circle:{ .ok } pasa | < 1 ms |
    | quién le da seguimiento (sin el dato del backend) › si no llega, la arma con los autores de los análisis cargados (el más reciente primero) | :material-check-circle:{ .ok } pasa | 1.9 ms |

??? note "`lib/resumen.test.ts` · 14 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | necesita tu atención › cuenta sobre los más recientes y enlaza a Análisis ya filtrado | :material-check-circle:{ .ok } pasa | 5.9 ms |
    | necesita tu atención › solo mira los 100 más recientes (lo que muestra Análisis por defecto) | :material-check-circle:{ .ok } pasa | < 1 ms |
    | necesita tu atención › árboles y zonas cuyo último análisis salió infestado, del más reciente al más antiguo | :material-check-circle:{ .ok } pasa | < 1 ms |
    | indicadores de los últimos 7 días › sin periodo previo no hay cambio que mostrar | :material-check-circle:{ .ok } pasa | < 1 ms |
    | indicadores de los últimos 7 días › compara con los 7 días anteriores | :material-check-circle:{ .ok } pasa | < 1 ms |
    | accesos y actividad › en orden de prioridad; Administración solo para administradores | :material-check-circle:{ .ok } pasa | < 1 ms |
    | accesos y actividad › sin datos todavía, descripciones sin cifras y sin seguimiento | :material-check-circle:{ .ok } pasa | < 1 ms |
    | accesos y actividad › los más recientes enlazan a su detalle en Análisis | :material-check-circle:{ .ok } pasa | < 1 ms |
    | QA del dashboard › D1: los errores de sincronización usan la cifra global (también fuera de los 100) | :material-check-circle:{ .ok } pasa | < 1 ms |
    | QA del dashboard › indicadores: con el límite alcanzado no se compara contra un periodo recortado | :material-check-circle:{ .ok } pasa | < 1 ms |
    | QA del dashboard › accesos: con más de 100 cargados, Análisis dice "los 100 más recientes" | :material-check-circle:{ .ok } pasa | < 1 ms |
    | re-QA del dashboard › T1: el día más antiguo cargado puede venir a medias (>=) | :material-check-circle:{ .ok } pasa | < 1 ms |
    | re-QA del dashboard › T1, el caso de QA: 301 en el periodo + 199 del primer día del previo (de 250) no dan "+102" | :material-check-circle:{ .ok } pasa | 1.8 ms |
    | re-QA del dashboard › T2: sin /estadisticas, los errores se cuentan sobre los recientes, se dice así y no se enlazan | :material-check-circle:{ .ok } pasa | < 1 ms |

??? note "`lib/router.test.ts` · 9 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | rutas por hash › reconoce cada pantalla | :material-check-circle:{ .ok } pasa | 1.6 ms |
    | rutas por hash › una ruta desconocida cae en el resumen | :material-check-circle:{ .ok } pasa | < 1 ms |
    | rutas por hash › hrefDe es el inverso de parseRoute | :material-check-circle:{ .ok } pasa | < 1 ms |
    | rutas por hash › el seguimiento de un árbol o zona lleva su identificador | :material-check-circle:{ .ok } pasa | < 1 ms |
    | rutas por hash › sin identificador, el seguimiento no existe | :material-check-circle:{ .ok } pasa | < 1 ms |
    | rutas por hash › el mapa puede abrir con un punto elegido | :material-check-circle:{ .ok } pasa | < 1 ms |
    | rutas por hash › codifica identificadores raros y no se rompe con uno mal codificado | :material-check-circle:{ .ok } pasa | < 1 ms |
    | rutas por hash › la consulta tras "?" no cambia la pantalla y se lee aparte | :material-check-circle:{ .ok } pasa | < 1 ms |
    | rutas por hash › fijarConsulta conserva la pantalla y deja un paso en el historial (o lo reemplaza) | :material-check-circle:{ .ok } pasa | 22 ms |

??? note "`lib/session.test.ts` · 2 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | sesión › una sesión guardada antes de existir roles se lee con roles vacíos | :material-check-circle:{ .ok } pasa | 1.2 ms |
    | sesión › esAdministrador depende del rol ADMINISTRADOR | :material-check-circle:{ .ok } pasa | < 1 ms |

### Componentes

??? note "`components/FotoEvidencia.test.tsx` · 2 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | FotoEvidencia en un navegador real › sigue abierto con StrictMode (montar, limpiar y volver a montar no lo cierra) | :material-check-circle:{ .ok } pasa | 88 ms |
    | FotoEvidencia en un navegador real › Esc (evento close del navegador) sí avisa que se cerró | :material-check-circle:{ .ok } pasa | 11 ms |

??? note "`components/Galeria.test.tsx` · 2 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Galeria › es determinista: misma semilla, mismo dibujo | :material-check-circle:{ .ok } pasa | 2.5 ms |
    | Galeria › dibuja una galería larvaria con su cámara por rama y no se anuncia | :material-check-circle:{ .ok } pasa | 25 ms |

??? note "`components/LimiteError.test.tsx` · 2 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | LimiteError › muestra un aviso en vez de dejar la app en blanco, y "Volver a intentar" reintenta | :material-check-circle:{ .ok } pasa | 93 ms |
    | LimiteError › "Ir a Resumen" navega, y cambiar de vista (clave) olvida el error | :material-check-circle:{ .ok } pasa | 21 ms |

??? note "`components/graficos/HistogramaConfianza.test.ts` · 7 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | eje x del histograma de confianza › con 120 px útiles las etiquetas no se enciman (≥ 10 px entre ellas) | :material-check-circle:{ .ok } pasa | 1.1 ms |
    | eje x del histograma de confianza › con 240 px útiles las etiquetas no se enciman (≥ 10 px entre ellas) | :material-check-circle:{ .ok } pasa | < 1 ms |
    | eje x del histograma de confianza › con 296 px útiles las etiquetas no se enciman (≥ 10 px entre ellas) | :material-check-circle:{ .ok } pasa | < 1 ms |
    | eje x del histograma de confianza › con 400 px útiles las etiquetas no se enciman (≥ 10 px entre ellas) | :material-check-circle:{ .ok } pasa | < 1 ms |
    | eje x del histograma de confianza › con 700 px útiles las etiquetas no se enciman (≥ 10 px entre ellas) | :material-check-circle:{ .ok } pasa | < 1 ms |
    | eje x del histograma de confianza › con 1200 px útiles las etiquetas no se enciman (≥ 10 px entre ellas) | :material-check-circle:{ .ok } pasa | < 1 ms |
    | eje x del histograma de confianza › cada 10 si caben, cada 20 si no | :material-check-circle:{ .ok } pasa | < 1 ms |

??? note "`components/graficos/comunes.test.ts` · 4 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | recortarAlAncho › no toca lo que cabe | :material-check-circle:{ .ok } pasa | 1.6 ms |
    | recortarAlAncho › recorta por el medio y conserva el final que distingue nombres parecidos | :material-check-circle:{ .ok } pasa | < 1 ms |
    | recortarAlAncho › conserva la última palabra si es corta | :material-check-circle:{ .ok } pasa | < 1 ms |
    | recortarAlAncho › nunca devuelve algo más ancho que el espacio | :material-check-circle:{ .ok } pasa | < 1 ms |

### Pantallas

??? note "`screens/analisis.test.tsx` · 25 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Análisis: cajas por categoría › cuentan los análisis cargados por resultado, tipo, confianza y atención | :material-check-circle:{ .ok } pasa | 798 ms |
    | Análisis: cajas por categoría › un clic filtra; dentro de un grupo suman y entre grupos se cruzan; queda en la URL y en chips | :material-check-circle:{ .ok } pasa | 297 ms |
    | Análisis: cajas por categoría › "Requieren atención" y certeza alta desde la URL; sin coincidencias ofrece quitar la selección | :material-check-circle:{ .ok } pasa | 98 ms |
    | Análisis: cajas por categoría › «Hasta» antes que «Desde»: aviso en el campo y no se consulta; el calendario no deja elegirlo | :material-check-circle:{ .ok } pasa | 113 ms |
    | Análisis: cajas por categoría › los filtros del formulario siguen consultando al backend y se leen de la URL | :material-check-circle:{ .ok } pasa | 112 ms |
    | Análisis: vista de tarjetas, agrupación y detalle › Tarjetas \| Tabla: se recuerda en la URL y en el navegador | :material-check-circle:{ .ok } pasa | 121 ms |
    | Análisis: vista de tarjetas, agrupación y detalle › sin vista en la URL usa la guardada | :material-check-circle:{ .ok } pasa | 69 ms |
    | Análisis: vista de tarjetas, agrupación y detalle › agrupar por árbol o zona: secciones plegables con su resumen y enlace al seguimiento | :material-check-circle:{ .ok } pasa | 131 ms |
    | Análisis: vista de tarjetas, agrupación y detalle › agrupar por día | :material-check-circle:{ .ok } pasa | 75 ms |
    | Análisis: vista de tarjetas, agrupación y detalle › el detalle muestra todo, la foto, enlaces y el anterior/siguiente del mismo lugar | :material-check-circle:{ .ok } pasa | 213 ms |
    | Análisis: vista de tarjetas, agrupación y detalle › una tarjeta abre el detalle con el teclado; sin foto lo dice | :material-check-circle:{ .ok } pasa | 64 ms |
    | Análisis: URL inválida (A1, obs 4) › #/analisis?desde=2026-13-45 no rompe la pantalla y se normaliza | :material-check-circle:{ .ok } pasa | 33 ms |
    | Análisis: URL inválida (A1, obs 4) › #/analisis?hasta=2026-10-32 no rompe la pantalla y se normaliza | :material-check-circle:{ .ok } pasa | 82 ms |
    | Análisis: URL inválida (A1, obs 4) › #/analisis?desde=9999-99-99 no rompe la pantalla y se normaliza | :material-check-circle:{ .ok } pasa | 68 ms |
    | Análisis: URL inválida (A1, obs 4) › #/analisis?desde=2026-02-30&hasta=2026-02-31 no rompe la pantalla y se normaliza | :material-check-circle:{ .ok } pasa | 111 ms |
    | Análisis: URL inválida (A1, obs 4) › cajas repetidas o desconocidas se normalizan sin paso nuevo en el historial | :material-check-circle:{ .ok } pasa | 43 ms |
    | Análisis: miniaturas (obs 1) › si la imagen falla (firma caducada), pide una firma nueva una sola vez | :material-check-circle:{ .ok } pasa | 60 ms |
    | Análisis: quién subió la foto, observaciones de campo y lenguaje › la tabla dice quién subió cada foto y sus observaciones completas | :material-check-circle:{ .ok } pasa | 51 ms |
    | Análisis: quién subió la foto, observaciones de campo y lenguaje › las cajas por quién subió la foto filtran y dejan su chip | :material-check-circle:{ .ok } pasa | 101 ms |
    | Análisis: quién subió la foto, observaciones de campo y lenguaje › con una sola persona (o un backend sin autores) no aparecen las cajas por autor | :material-check-circle:{ .ok } pasa | 77 ms |
    | Análisis: quién subió la foto, observaciones de campo y lenguaje › las observaciones largas de una tarjeta se recortan y se pueden leer completas | :material-check-circle:{ .ok } pasa | 120 ms |
    | Análisis: quién subió la foto, observaciones de campo y lenguaje › el detalle de un infestado dice qué hacer y muestra las observaciones de campo de quien la subió | :material-check-circle:{ .ok } pasa | 104 ms |
    | Análisis: quién subió la foto, observaciones de campo y lenguaje › la pantalla principal no usa jerga técnica | :material-check-circle:{ .ok } pasa | 78 ms |
    | Análisis: caja_autor con personas que no existen › ya con los datos, se quitan de la URL sin dejar un chip vacío | :material-check-circle:{ .ok } pasa | 29 ms |
    | Análisis: caja_autor con personas que no existen › si ninguna existe, la caja se quita y se ven todos | :material-check-circle:{ .ok } pasa | 37 ms |

??? note "`screens/consulta.test.tsx` · 25 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | navegación por rol › un experto de campo ve Resumen, Mapa y Análisis, pero no Administración | :material-check-circle:{ .ok } pasa | 111 ms |
    | navegación por rol › el encabezado muestra el nombre de la cuenta | :material-check-circle:{ .ok } pasa | 21 ms |
    | navegación por rol › un experto que abre #/admin vuelve al resumen | :material-check-circle:{ .ok } pasa | 425 ms |
    | resumen › abre con los focos de infestación y los totales | :material-check-circle:{ .ok } pasa | 64 ms |
    | resumen › pluraliza y dice cuando no hay infestación | :material-check-circle:{ .ok } pasa | 104 ms |
    | resumen › cada barra segmentada se puede leer como texto y como tabla | :material-check-circle:{ .ok } pasa | 55 ms |
    | resumen › un error deja reintentar | :material-check-circle:{ .ok } pasa | 197 ms |
    | análisis › lista los análisis con resultado, confianza y sincronización | :material-check-circle:{ .ok } pasa | 353 ms |
    | análisis › aplica los filtros en la consulta al backend | :material-check-circle:{ .ok } pasa | 303 ms |
    | análisis › muestra el mensaje del backend si rechaza el filtro | :material-check-circle:{ .ok } pasa | 98 ms |
    | análisis › sin resultados ofrece quitar los filtros | :material-check-circle:{ .ok } pasa | 111 ms |
    | mapa › pide árboles y zonas una sola vez, sin descargar todos los análisis | :material-check-circle:{ .ok } pasa | 313 ms |
    | mapa › cada árbol y zona del mapa dice su último resultado | :material-check-circle:{ .ok } pasa | 28 ms |
    | mapa › al elegir un punto pide y muestra su historial de análisis | :material-check-circle:{ .ok } pasa | 103 ms |
    | mapa › un punto sin análisis lo dice sin pedir nada | :material-check-circle:{ .ok } pasa | 100 ms |
    | mapa › la lista de puntos es la alternativa accesible al mapa | :material-check-circle:{ .ok } pasa | 12 ms |
    | fotos de evidencia › solo los análisis con foto ofrecen verla | :material-check-circle:{ .ok } pasa | 35 ms |
    | fotos de evidencia › abre la foto firmada en un diálogo y se puede cerrar | :material-check-circle:{ .ok } pasa | 174 ms |
    | fotos de evidencia › si la foto no está disponible lo explica en el diálogo | :material-check-circle:{ .ok } pasa | 107 ms |
    | fotos de evidencia › el historial del mapa también ofrece la foto | :material-check-circle:{ .ok } pasa | 137 ms |
    | administración › lista cuentas y dispositivos para un administrador | :material-check-circle:{ .ok } pasa | 325 ms |
    | administración › si el backend responde 403 lo explica sin cerrar la sesión | :material-check-circle:{ .ok } pasa | 16 ms |
    | carga › #/ muestra un esqueleto con su forma y lo anuncia | :material-check-circle:{ .ok } pasa | 8.5 ms |
    | carga › #/mapa muestra un esqueleto con su forma y lo anuncia | :material-check-circle:{ .ok } pasa | 5.5 ms |
    | carga › #/analisis muestra un esqueleto con su forma y lo anuncia | :material-check-circle:{ .ok } pasa | 8.7 ms |

??? note "`screens/cuentas.test.tsx` · 17 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | gestión de cuentas › no hay registro público: el login no ofrece crear cuenta | :material-check-circle:{ .ok } pasa | 596 ms |
    | gestión de cuentas › un experto no ve Administración ni llega a pedir cuentas | :material-check-circle:{ .ok } pasa | 379 ms |
    | gestión de cuentas › valida en el navegador antes de enviar y marca cada campo | :material-check-circle:{ .ok } pasa | 477 ms |
    | gestión de cuentas › crea una cuenta, la muestra en la tabla y lo confirma | :material-check-circle:{ .ok } pasa | 364 ms |
    | gestión de cuentas › 409 por correo repetido: el error aparece en el campo Correo | :material-check-circle:{ .ok } pasa | 441 ms |
    | gestión de cuentas › otros errores del servidor se muestran como alerta en el formulario | :material-check-circle:{ .ok } pasa | 85 ms |
    | gestión de cuentas › el botón de guardar se desactiva mientras se envía | :material-check-circle:{ .ok } pasa | 65 ms |
    | gestión de cuentas › edita una cuenta sin cambiar la contraseña (no la envía) | :material-check-circle:{ .ok } pasa | 183 ms |
    | gestión de cuentas › desactiva y vuelve a activar con un paso de confirmación | :material-check-circle:{ .ok } pasa | 173 ms |
    | gestión de cuentas › Esc cierra el diálogo sin guardar | :material-check-circle:{ .ok } pasa | 49 ms |
    | gestión de cuentas › la cuenta propia no se puede desactivar ni perder el rol | :material-check-circle:{ .ok } pasa | 127 ms |
    | gestión de cuentas › si el servidor rechaza desactivar (409) lo explica en la confirmación | :material-check-circle:{ .ok } pasa | 63 ms |
    | gestión de cuentas › filtra por nombre, rol y estado | :material-check-circle:{ .ok } pasa | 114 ms |
    | gestión de cuentas › una contraseña de solo espacios no se envía al editar | :material-check-circle:{ .ok } pasa | 182 ms |
    | gestión de cuentas › cambiar el correo propio avisa antes y, al guardar, vuelve al login con el correo nuevo | :material-check-circle:{ .ok } pasa | 222 ms |
    | gestión de cuentas › editar la cuenta propia sin cambiar el correo mantiene la sesión | :material-check-circle:{ .ok } pasa | 141 ms |
    | gestión de cuentas › el 409 por último administrador activo se muestra como alerta | :material-check-circle:{ .ok } pasa | 58 ms |

??? note "`screens/graficos.test.tsx` · 39 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Gráficos › un experto la ve en el menú; pide los análisis (máx. 500), árboles y zonas | :material-check-circle:{ .ok } pasa | 742 ms |
    | Gráficos › cada gráfica resume sus datos en su nombre accesible | :material-check-circle:{ .ok } pasa | 251 ms |
    | Gráficos › las flechas recorren las barras (una sola parada de Tab) y Enter acerca a ese día | :material-check-circle:{ .ok } pasa | 241 ms |
    | Gráficos › el foco en una marca muestra el tooltip con el detalle | :material-check-circle:{ .ok } pasa | 45 ms |
    | Gráficos › elegir un resultado en la leyenda filtra las demás gráficas; Esc lo quita | :material-check-circle:{ .ok } pasa | 162 ms |
    | Gráficos › una barra de lugar abre su seguimiento | :material-check-circle:{ .ok } pasa | 82 ms |
    | Gráficos › una celda del mapa de calor filtra por su lugar y el chip lo quita | :material-check-circle:{ .ok } pasa | 177 ms |
    | Gráficos › el mapa de calor se recorre como rejilla | :material-check-circle:{ .ok } pasa | 80 ms |
    | Gráficos › una barra de confianza filtra por su decena | :material-check-circle:{ .ok } pasa | 95 ms |
    | Gráficos › la vista se puede abrir desde la URL | :material-check-circle:{ .ok } pasa | 90 ms |
    | Gráficos › las fechas y los botones mueven el rango | :material-check-circle:{ .ok } pasa | 165 ms |
    | Gráficos › "Ver como tabla" da la misma información en texto | :material-check-circle:{ .ok } pasa | 95 ms |
    | Gráficos › sin análisis lo dice; un error se puede reintentar | :material-check-circle:{ .ok } pasa | 7.3 ms |
    | Gráficos › error al cargar → mensaje y Reintentar | :material-check-circle:{ .ok } pasa | 14 ms |
    | Gráficos: rango y URL acotados › #/graficos?desde=0001-01-01&hasta=9999-12-31 se normaliza a #/graficos sin paso nuevo en el historial | :material-check-circle:{ .ok } pasa | 122 ms |
    | Gráficos: rango y URL acotados › #/graficos?hasta=2025-05-31 se normaliza a #/graficos sin paso nuevo en el historial | :material-check-circle:{ .ok } pasa | 88 ms |
    | Gráficos: rango y URL acotados › #/graficos?desde=2026-02-30 se normaliza a #/graficos sin paso nuevo en el historial | :material-check-circle:{ .ok } pasa | 75 ms |
    | Gráficos: rango y URL acotados › #/graficos?zona=no-existe&resultado=x&tipo=y&confianza=12&otro=1 se normaliza a #/graficos sin paso nuevo en el historial | :material-check-circle:{ .ok } pasa | 120 ms |
    | Gráficos: rango y URL acotados › un rango que se sale por un lado se acota y se reescribe | :material-check-circle:{ .ok } pasa | 44 ms |
    | Gráficos: rango y URL acotados › en el teléfono: la fecha elegida en el calendario se aplica al momento, sin salir del campo | :material-check-circle:{ .ok } pasa | 131 ms |
    | Gráficos: rango y URL acotados › las fechas se aplican al confirmar, no en cada tecla, y solo dentro de los datos | :material-check-circle:{ .ok } pasa | 114 ms |
    | Gráficos: fecha a medio confirmar + clic en otro control (R1, R2) › la fecha escrita y el clic en la leyenda salen juntos, en un solo paso del historial | :material-check-circle:{ .ok } pasa | 37 ms |
    | Gráficos: fecha a medio confirmar + clic en otro control (R1, R2) › con Siguiente: el rango se mueve desde la fecha escrita | :material-check-circle:{ .ok } pasa | 64 ms |
    | Gráficos: fecha a medio confirmar + clic en otro control (R1, R2) › si el clic no lo consume ningún control, la fecha sale sola | :material-check-circle:{ .ok } pasa | 119 ms |
    | Gráficos: fecha a medio confirmar + clic en otro control (R1, R2) › Enter aplica la fecha sin sacar el foco del campo | :material-check-circle:{ .ok } pasa | 123 ms |
    | Gráficos: fecha a medio confirmar + clic en otro control (R1, R2) › una fecha que intercambia el rango no saca el foco ni deja Hasta desfasado | :material-check-circle:{ .ok } pasa | 67 ms |
    | Gráficos: fecha a medio confirmar + clic en otro control (R1, R2) › si el botón usado queda deshabilitado, el foco pasa al texto del rango | :material-check-circle:{ .ok } pasa | 85 ms |
    | Gráficos: fecha a medio confirmar + clic en otro control (R1, R2) › el aviso de fecha inválida es de su campo y se va al corregirlo | :material-check-circle:{ .ok } pasa | 93 ms |
    | Gráficos: fecha a medio confirmar + clic en otro control (R1, R2) › si el rango pedido no tiene análisis, lo avisa y muestra todo | :material-check-circle:{ .ok } pasa | 60 ms |
    | Gráficos: fecha a medio confirmar + clic en otro control (R1, R2) › un rango que abarca todos los datos no es "sin análisis" | :material-check-circle:{ .ok } pasa | 18 ms |
    | Gráficos: campos de fecha "sucios" (N1), aviso de rango (N2) y foco de los chips › intercambio con clic en Hasta: Hasta (con foco) muestra el valor nuevo y salir no lo vuelve a aplicar | :material-check-circle:{ .ok } pasa | 104 ms |
    | Gráficos: campos de fecha "sucios" (N1), aviso de rango (N2) y foco de los chips › intercambio con Enter: Desde (con foco) muestra el extremo real y salir no lo colapsa | :material-check-circle:{ .ok } pasa | 86 ms |
    | Gráficos: campos de fecha "sucios" (N1), aviso de rango (N2) y foco de los chips › Atrás con el foco en Desde: el campo se sincroniza y salir no rehace el cambio | :material-check-circle:{ .ok } pasa | 79 ms |
    | Gráficos: campos de fecha "sucios" (N1), aviso de rango (N2) y foco de los chips › el aviso de rango sin análisis no vuelve tras Restablecer | :material-check-circle:{ .ok } pasa | 38 ms |
    | Gráficos: campos de fecha "sucios" (N1), aviso de rango (N2) y foco de los chips › el aviso de rango sin análisis no vuelve tras Acercar → Alejar | :material-check-circle:{ .ok } pasa | 33 ms |
    | Gráficos: campos de fecha "sucios" (N1), aviso de rango (N2) y foco de los chips › al quitar un chip el foco pasa al siguiente y, sin chips, al texto del rango | :material-check-circle:{ .ok } pasa | 34 ms |
    | Gráficos: campos de fecha "sucios" (N1), aviso de rango (N2) y foco de los chips › "Quitar todo" deja el foco en el texto del rango | :material-check-circle:{ .ok } pasa | 23 ms |
    | Gráficos: campos de fecha "sucios" (N1), aviso de rango (N2) y foco de los chips › dos cambios de hash seguidos (Enter y enseguida Atrás) también sincronizan el campo | :material-check-circle:{ .ok } pasa | 67 ms |
    | Gráficos: tooltip (E2) › gana la última interacción: el foco con el teclado manda sobre la marca bajo el puntero | :material-check-circle:{ .ok } pasa | 29 ms |

??? note "`screens/mapa.test.tsx` · 9 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | mapa interactivo › dibuja el radio real de las zonas que lo tienen | :material-check-circle:{ .ok } pasa | 619 ms |
    | mapa interactivo › elegir un punto lo deja en la URL y lleva la cámara hacia él | :material-check-circle:{ .ok } pasa | 211 ms |
    | mapa interactivo › abre directo con un punto elegido desde la URL | :material-check-circle:{ .ok } pasa | 77 ms |
    | mapa interactivo › el detalle lleva al seguimiento del árbol | :material-check-circle:{ .ok } pasa | 36 ms |
    | mapa interactivo › Esc y el botón de cerrar vuelven a la lista | :material-check-circle:{ .ok } pasa | 74 ms |
    | mapa interactivo › los filtros por estado y por tipo quitan puntos del mapa y de la lista | :material-check-circle:{ .ok } pasa | 80 ms |
    | mapa interactivo › la búsqueda ignora acentos y Enter elige el primer resultado | :material-check-circle:{ .ok } pasa | 134 ms |
    | mapa interactivo › pasar por la lista resalta la zona en el mapa | :material-check-circle:{ .ok } pasa | 43 ms |
    | mapa interactivo › el panel muestra solo los 5 análisis más recientes | :material-check-circle:{ .ok } pasa | 135 ms |

??? note "`screens/resumen.test.tsx` · 18 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Resumen (dashboard) › las secciones van en orden de prioridad, después del hero de siempre | :material-check-circle:{ .ok } pasa | 925 ms |
    | Resumen (dashboard) › "Necesita tu atención" enlaza a Análisis ya filtrado y a los lugares infestados | :material-check-circle:{ .ok } pasa | 95 ms |
    | Resumen (dashboard) › un enlace de atención abre Análisis con las cajas aplicadas | :material-check-circle:{ .ok } pasa | 547 ms |
    | Resumen (dashboard) › indicadores de los últimos 7 días (sin periodo previo para comparar) | :material-check-circle:{ .ok } pasa | 46 ms |
    | Resumen (dashboard) › las gráficas clave (perezosas) llevan a Gráficos con los mismos filtros | :material-check-circle:{ .ok } pasa | 69 ms |
    | Resumen (dashboard) › accesos rápidos: un experto no ve Administración; un administrador sí, al final | :material-check-circle:{ .ok } pasa | 41 ms |
    | Resumen (dashboard) › un administrador ve Administración en los accesos | :material-check-circle:{ .ok } pasa | 59 ms |
    | Resumen (dashboard) › actividad reciente: cada análisis abre su detalle en Análisis | :material-check-circle:{ .ok } pasa | 201 ms |
    | Resumen (dashboard) › si /analisis falla, el hero y los accesos siguen; la atención lo dice y deja reintentar | :material-check-circle:{ .ok } pasa | 79 ms |
    | Resumen (dashboard) › si /estadisticas falla, lo demás se muestra igual | :material-check-circle:{ .ok } pasa | 48 ms |
    | Resumen (dashboard) › si /arboles falla, la atención por análisis sigue y los lugares avisan | :material-check-circle:{ .ok } pasa | 67 ms |
    | Resumen (dashboard) › los errores de sincronización usan la cifra global, la misma que abre ?estado=error | :material-check-circle:{ .ok } pasa | 74 ms |
    | Resumen (dashboard) › con un solo análisis que requiere atención, el botón va en singular | :material-check-circle:{ .ok } pasa | 32 ms |
    | enlace directo al detalle en Análisis (?detalle=) › anterior/siguiente actualiza el parámetro; al cerrar el foco va al conteo | :material-check-circle:{ .ok } pasa | 197 ms |
    | enlace directo al detalle en Análisis (?detalle=) › un id que no está entre los cargados: avisa y quita el parámetro | :material-check-circle:{ .ok } pasa | 101 ms |
    | Resumen: re-QA › T2: si /estadisticas falla, "Errores de sincronización" dice de cuántos y no enlaza | :material-check-circle:{ .ok } pasa | 42 ms |
    | Resumen: re-QA › con el periodo actual recortado por el límite: "500 o más" y "periodo actual incompleto" | :material-check-circle:{ .ok } pasa | 199 ms |
    | Resumen: re-QA › muestra el resumen de observaciones en Actividad reciente cuando existen | :material-check-circle:{ .ok } pasa | 94 ms |

??? note "`screens/seguimiento.test.tsx` · 14 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | seguimiento de un árbol › pide el árbol y todo su historial en paralelo | :material-check-circle:{ .ok } pasa | 651 ms |
    | seguimiento de un árbol › muestra el estado actual, la línea de tiempo y el cambio de resultado | :material-check-circle:{ .ok } pasa | 81 ms |
    | seguimiento de un árbol › la gráfica resume los análisis para lectores de pantalla | :material-check-circle:{ .ok } pasa | 23 ms |
    | seguimiento de un árbol › el mapa pequeño marca el árbol y dónde se tomó cada foto | :material-check-circle:{ .ok } pasa | 137 ms |
    | seguimiento de un árbol › tocar una captura en el mapa la marca en la línea de tiempo | :material-check-circle:{ .ok } pasa | 87 ms |
    | seguimiento de un árbol › ofrece la foto de cada análisis que la tiene | :material-check-circle:{ .ok } pasa | 47 ms |
    | seguimiento de un árbol › sin análisis lo dice y no dibuja la gráfica | :material-check-circle:{ .ok } pasa | 15 ms |
    | seguimiento de un árbol › un árbol que no existe lo explica y deja volver al mapa | :material-check-circle:{ .ok } pasa | 24 ms |
    | seguimiento de un árbol › el menú marca Mapa como la sección actual | :material-check-circle:{ .ok } pasa | 103 ms |
    | seguimiento de una zona › muestra la evolución del follaje captura por captura | :material-check-circle:{ .ok } pasa | 18 ms |
    | quién le da seguimiento › con dos personas se destaca, con cuántos análisis y su última foto | :material-check-circle:{ .ok } pasa | 24 ms |
    | quién le da seguimiento › con una sola persona no se destaca; un análisis sin autor lo dice | :material-check-circle:{ .ok } pasa | 20 ms |
    | quién le da seguimiento › un backend sin el dato: sin sección vacía, lo dice | :material-check-circle:{ .ok } pasa | 11 ms |
    | quién le da seguimiento › si el backend no manda la lista, se arma con los autores de los análisis | :material-check-circle:{ .ok } pasa | 22 ms |

### Aplicación

??? note "`App.test.tsx` · 6 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | flujo de login › sin sesión redirige a #/login | :material-check-circle:{ .ok } pasa | 521 ms |
    | flujo de login › login OK → abre el resumen con el displayName de /me en el encabezado | :material-check-circle:{ .ok } pasa | 644 ms |
    | flujo de login › 401 en login → mensaje de error accesible y sigue en login | :material-check-circle:{ .ok } pasa | 153 ms |
    | flujo de login › campos vacíos → error de validación sin llamar a la API | :material-check-circle:{ .ok } pasa | 41 ms |
    | flujo de login › token expirado (401 en /me) → vuelve a login con aviso | :material-check-circle:{ .ok } pasa | 20 ms |
    | flujo de login › cerrar sesión borra el token y vuelve a login | :material-check-circle:{ .ok } pasa | 128 ms |

## Punta a punta · f-sheet (Playwright)

Cada prueba corre en uno o en los dos navegadores: **escritorio** (Chrome) y **móvil** (teléfono emulado).

??? note "`admin.e2e.ts` · 3 pruebas"
    | Prueba | Navegadores |
    | --- | --- |
    | Administración › un administrador ve cuentas y dispositivos sin datos sensibles | escritorio |
    | Administración › el administrador crea, edita, desactiva y reactiva una cuenta de experto | escritorio |
    | Administración › un administrador que cambia su propio correo vuelve a entrar con el correo nuevo | escritorio |

??? note "`analisis.e2e.ts` · 4 pruebas"
    | Prueba | Navegadores |
    | --- | --- |
    | Análisis › las cajas cuentan y filtran; la tabla sigue como antes | escritorio |
    | Análisis › tarjetas con miniatura, agrupadas por lugar, y el detalle con foto y enlace al seguimiento | escritorio |
    | Análisis › el detalle se abre desde la tabla y Esc devuelve el foco | escritorio |
    | Análisis › una fecha inválida en la URL no deja la app en blanco y se normaliza | escritorio |

??? note "`campo.e2e.ts` · 8 pruebas"
    | Prueba | Navegadores |
    | --- | --- |
    | Campo y lenguaje › autor › "Subido por" en tabla, tarjetas, detalle y actividad reciente | escritorio |
    | Campo y lenguaje › autor › las cajas por quién subió la foto filtran | escritorio |
    | Campo y lenguaje › observaciones › completas en el detalle, marcadas como escritas en campo | escritorio |
    | Campo y lenguaje › seguimiento › quién le da seguimiento al Oyamel (2 personas) y sus observaciones | escritorio |
    | Campo y lenguaje › seguimiento › la Zona lago menor también tiene 2 personas y las observaciones de la experta | escritorio |
    | Campo y lenguaje › lenguaje › sin jerga técnica en Resumen, Análisis, Gráficos, Mapa y Seguimiento | escritorio |
    | Campo y lenguaje › lenguaje › el detalle dice el diagnóstico, qué hacer y deja lo técnico plegado | escritorio |
    | Campo y lenguaje › 360 px › tarjetas, tabla apilada, detalle y seguimiento sin desbordar | escritorio |

??? note "`experto.e2e.ts` · 12 pruebas"
    | Prueba | Navegadores |
    | --- | --- |
    | Resumen › focos, totales y gráficas calculados por el backend | escritorio |
    | Permisos › un experto no ve Administración y no puede entrar por la URL | escritorio |
    | Permisos › el backend también le niega al experto los datos de administración (403) | escritorio |
    | Análisis › filtros y fotos › los filtros llegan al backend y se pueden quitar | escritorio |
    | Análisis › filtros y fotos › un rango invertido se avisa en «Hasta» sin llegar al backend | escritorio |
    | Análisis › filtros y fotos › la foto se abre con la URL que firmó el backend y Esc la cierra | escritorio |
    | Análisis › filtros y fotos › e2 guarda la URL completa de S3 (formato de TT_BKN) y también se firma | escritorio |
    | Mapa › último resultado por punto e historial al elegir uno | escritorio |
    | Mapa › filtros y búsqueda | escritorio |
    | Seguimiento › seguimiento: del mapa al historial completo de un árbol y de vuelta | escritorio |
    | Seguimiento › seguimiento de una zona: evolución del follaje | escritorio |
    | Mapa › pantalla completa: el mapa llena toda la pantalla, no solo su altura normal | escritorio |

??? note "`flujos.e2e.ts` · 4 pruebas"
    | Prueba | Navegadores |
    | --- | --- |
    | Flujos completos › administrador: entra, crea un experto, le cambia nombre y rol, y sale | escritorio |
    | Flujos completos › experto: atención en el Resumen → Análisis filtrado → detalle → seguimiento → Gráficos → Atrás → sale | escritorio |
    | Flujos completos › el administrador desactiva a un experto con la sesión abierta: lo saca; al reactivarlo vuelve a entrar | escritorio |
    | Flujos completos › un administrador cambia su propio correo y entra con el nuevo | escritorio |

??? note "`funciones.e2e.ts` · 33 pruebas"
    | Prueba | Navegadores |
    | --- | --- |
    | Sesión › campos vacíos: valida sin llamar al backend | escritorio |
    | Resumen › indicadores › últimos 7 días con sus cifras | escritorio |
    | Resumen › gráficas clave › "Ver la actividad en Gráficos" y una decena de certeza abren Gráficos filtrado | escritorio |
    | Resumen › accesos › Gráficos y el seguimiento del último lugar infestado | escritorio |
    | Resumen › fallos parciales › si /analisis falla, el hero y los accesos siguen y se puede reintentar | escritorio |
    | Resumen › casos límite › gráficas clave › "Ver la actividad en Gráficos" lleva el rango de los últimos 30 días | escritorio |
    | Resumen › casos límite › indicadores › con el periodo recortado por el límite: "500 o más" y sin comparar | escritorio |
    | Resumen › casos límite › atención › sin /estadisticas, los errores al enviar se cuentan sobre los recientes y no se enlazan | escritorio |
    | Análisis › miniatura › si la imagen falla, pide otra firma una vez y luego dice "Foto no disponible" | escritorio |
    | Análisis › límite › con 100 análisis pide acotar por fechas | escritorio |
    | Análisis › detalle › anterior y siguiente con ?detalle= cambian la URL sin paso nuevo en el historial | escritorio |
    | Análisis › cajas › filtran por certeza, solo con la corteza | escritorio |
    | Análisis › cajas › "Requieren atención" junta infestados, sin diagnóstico claro, certeza baja y errores | escritorio |
    | Análisis › cajas › quitar un chip pasa el foco al siguiente | escritorio |
    | Análisis › vista › "Tarjetas" se recuerda al volver a la sección | escritorio |
    | Análisis › agrupar › por resultado y por día | escritorio |
    | Análisis › detalle › enlace directo ?detalle= abre el análisis; Cerrar deja la URL limpia | escritorio |
    | Análisis › detalle › un ?detalle= que no está entre los cargados avisa y se quita | escritorio |
    | Análisis › detalle › "Ver en Gráficos" abre Gráficos filtrado por el lugar | escritorio |
    | Gráficos › certeza › clic en una decena filtra las demás gráficas | escritorio |
    | Gráficos › filtros › Tipo y Árbol o zona se combinan | escritorio |
    | Gráficos › mapa de calor › se recorre con flechas y Enter filtra por el lugar | escritorio |
    | Gráficos › tablas › cada gráfica tiene "Ver como tabla" | escritorio |
    | Gráficos › rango › Alejar vuelve a todo el rango | escritorio |
    | Gráficos › rango › Anterior y Siguiente se deshabilitan en los bordes de los datos | escritorio |
    | Gráficos › URL y avisos › rango sin análisis › lo avisa y muestra todo | escritorio |
    | Gráficos › URL y avisos › URL › parámetros inválidos (lugar inexistente, fechas absurdas) se normalizan | escritorio |
    | Gráficos › URL y avisos › chips › quitar uno pasa el foco al siguiente y, sin chips, al texto del rango | escritorio |
    | Gráficos › URL y avisos › límite › con 500 análisis avisa que solo entran los más recientes | escritorio |
    | Administración › formulario › valida antes de enviar | escritorio |
    | Administración › cuentas › buscar y filtrar por rol y estado | escritorio |
    | Administración › cuenta propia › no se puede desactivar ni quitarse el rol | escritorio |
    | Errores › una pantalla que falla muestra "Algo salió mal" sin dejar la app en blanco, y se recupera | escritorio |

??? note "`graficos.e2e.ts` · 10 pruebas"
    | Prueba | Navegadores |
    | --- | --- |
    | Gráficos › un experto ve Gráficos con los totales del backend en cada gráfica | escritorio |
    | Gráficos › el tooltip sale con el foco y una barra de lugar abre el seguimiento del árbol | escritorio |
    | Gráficos › acercar, crossfilter con chips, Atrás y Restablecer; la vista vive en la URL | escritorio |
    | Gráficos › arrastrar en la vista general elige el rango (pincel) | escritorio |
    | Gráficos › escribir el año en Desde no congela la pestaña ni llena el historial; un rango absurdo en la URL se acota | escritorio |
    | Gráficos › fechas a medio confirmar + clic en otro control › escribir Desde y hacer clic en la leyenda: un solo paso y nada se pierde | escritorio |
    | Gráficos › fechas a medio confirmar + clic en otro control › escribir Desde y hacer clic en Siguiente: se mueve desde la fecha escrita, en un paso | escritorio |
    | Gráficos › fechas a medio confirmar + clic en otro control › Enter aplica sin sacar el foco; Restablecer deja el foco en el texto del rango | escritorio |
    | Gráficos › fechas a medio confirmar + clic en otro control › intercambio y salir conserva el rango (Desde después de Hasta, clic en Hasta, clic fuera) | escritorio |
    | Gráficos › fechas a medio confirmar + clic en otro control › Atrás con el foco en Desde y luego Tab no rehace el cambio (Adelante intacto) | escritorio |

??? note "`resumen.e2e.ts` · 6 pruebas"
    | Prueba | Navegadores |
    | --- | --- |
    | Resumen › la animación del login se conserva y el resumen entra con su misma coreografía | escritorio |
    | Resumen › con movimiento reducido no hay desplazamientos | escritorio |
    | Resumen › la atención lleva a Análisis filtrado y "Ver en Gráficos" conserva el filtro | escritorio |
    | Resumen › accesos rápidos en orden; un experto no ve Administración; la actividad abre el detalle | escritorio |
    | Resumen › un administrador ve Administración al final de los accesos | escritorio |
    | Resumen › D1: la cifra de errores al enviar coincide con lo que abre su enlace | escritorio |

??? note "`sesion.e2e.ts` · 6 pruebas"
    | Prueba | Navegadores |
    | --- | --- |
    | Sesión › sin sesión cualquier ruta lleva al login | escritorio |
    | Sesión › contraseña incorrecta: mensaje accesible y sigue en login | escritorio |
    | Sesión › una cuenta desactivada en la BD no puede entrar | escritorio |
    | Sesión › el correo no distingue mayúsculas y el encabezado muestra el nombre de /me | escritorio |
    | Sesión › un token rechazado por el backend devuelve al login con aviso | escritorio |
    | Sesión › cerrar sesión borra el token | escritorio |

??? note "`flujos-movil.e2e.ts` · 1 prueba"
    | Prueba | Navegadores |
    | --- | --- |
    | Flujos completos (móvil, 360 px) › experto: Resumen → Análisis filtrado en tarjetas → detalle → seguimiento → sale | movil |

??? note "`movil.e2e.ts` · 15 pruebas"
    | Prueba | Navegadores |
    | --- | --- |
    | Móvil (Pixel 7) › Resumen cabe a lo ancho | movil |
    | Móvil (Pixel 7) › Mapa cabe a lo ancho | movil |
    | Móvil (Pixel 7) › Análisis cabe a lo ancho | movil |
    | Móvil (Pixel 7) › Gráficos cabe a lo ancho | movil |
    | Móvil (Pixel 7) › Administración cabe a lo ancho | movil |
    | Móvil (Pixel 7) › la foto cabe en la pantalla | movil |
    | Móvil (Pixel 7) › las marcas del mapa se pueden ver y tocar | movil |
    | Móvil (Pixel 7) › el seguimiento de un árbol cabe a lo ancho | movil |
    | Móvil (Pixel 7) › el formulario de cuenta cabe en la pantalla y se cierra con Cancelar | movil |
    | Móvil (Pixel 7) › Gráficos a 360 px: sin desborde horizontal de la página | movil |
    | Móvil (Pixel 7) › Análisis a 360 px: cajas, tarjetas y detalle sin desborde horizontal | movil |
    | Móvil (Pixel 7) › Resumen a 360 px: atención, indicadores, gráficas y accesos sin desborde horizontal | movil |
    | Móvil (Pixel 7) › las tablas se apilan: Rol, Resultado y las acciones caben sin deslizar | movil |
    | Móvil (Pixel 7) › actividad reciente: el resultado no se encima con el lugar y la pestaña dice «Admin» | movil |
    | Móvil (Pixel 7) › Desde y Hasta: la fecha del calendario se aplica al momento y un rango al revés avisa en el campo | movil |

## App móvil · mbl-sheet

??? note "`Phase1AuthAndSessionTest` · 4 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | RNF-06 hash de contrasena SHA-256 es deterministico y sensible a correo y contrasena | :material-check-circle:{ .ok } pasa | 44 ms |
    | PT-01 login contra backend fija brigadistaId y permite reanudar offline despues | :material-check-circle:{ .ok } pasa | 283 ms |
    | PT-02 login fallido retorna mensajes de error y rechaza rol Administrador en movil (RN-02) | :material-check-circle:{ .ok } pasa | 5 ms |
    | CU-G02 y CU-G03 recuperacion de contrasena contra backend valida RN-05 y RN-06 | :material-check-circle:{ .ok } pasa | 19 ms |

??? note "`Phase2DomainUseCaseTest` · 4 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | RN-47 RN-48 AnalyzeImageColorsUseCase calcula severidad biologica ALTA y categoria dominante DANADO | :material-check-circle:{ .ok } pasa | 3 ms |
    | TargetAssociation garantiza exclusion mutua chk_arbol_o_zona entre Corteza y Follaje | :material-check-circle:{ .ok } pasa | < 1 ms |
    | RN-07 RN-08 RN-09 AnalyzeImageColorsUseCase rechaza formato invalido, tamano mayor a 10MB o resolucion menor a 300x300 | :material-check-circle:{ .ok } pasa | 5 ms |
    | RN-23 y RN-24 ClassificationOutcome soporta paridad con evaluar_test y modo estricto RN-24 | :material-check-circle:{ .ok } pasa | < 1 ms |

??? note "`Phase3VisionEngineTest` · 4 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | Inferencia hibrida mapea correctamente modelo Nube y badges NUBE y LOCAL | :material-check-circle:{ .ok } pasa | 1 ms |
    | RN-51 normalizeRatios calcula porcentajes con margen de error menor a 0_5 porciento | :material-check-circle:{ .ok } pasa | 2 ms |
    | RN-48 ColorThresholdsConfig clasifica correctamente rangos HSV de Corteza | :material-check-circle:{ .ok } pasa | 1 ms |
    | RN-47 ColorThresholdsConfig clasifica correctamente rangos HSV de Follaje incluyendo bifurcacion roja | :material-check-circle:{ .ok } pasa | < 1 ms |

??? note "`Phase4PersistenceAndSyncTest` · 3 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | AnalisisCromaticoEntity preserves HSV percentages and image paths on round-trip (RN-50) | :material-check-circle:{ .ok } pasa | 3 ms |
    | ArbolEntity and FocoInfestacionEntity map accurately between Room and Domain | :material-check-circle:{ .ok } pasa | 2 ms |
    | AnalisisEntity enforces mutual exclusion chk_arbol_o_zona | :material-check-circle:{ .ok } pasa | 1 ms |

??? note "`Phase5PresentationUiStateTest` · 6 pruebas"
    | Prueba | Resultado | Tiempo |
    | --- | --- | ---: |
    | treeProgressionList agrupa capturas por arbol (ej Fresno95) y calcula porcentaje historico Sano vs Infestado | :material-check-circle:{ .ok } pasa | 4 ms |
    | filteredHistoryRecords filtra correctamente por Infestados, Sanos y Pendientes Sync | :material-check-circle:{ .ok } pasa | < 1 ms |
    | computeTreeProgressions preserva observaciones independientes por captura y separadas del arbol | :material-check-circle:{ .ok } pasa | < 1 ms |
    | computeZoneProgressions reporta dano foliar cuando dano es relevante vs sano y RN24 estricto exige certeza | :material-check-circle:{ .ok } pasa | 1 ms |
    | AnalysisResultUiState inicia en pestana Clasificacion y destino Inicio (Tus arboles) | :material-check-circle:{ .ok } pasa | < 1 ms |
    | zoneProgressionList agrupa capturas por zona y calcula porcentaje promedio de salud foliar | :material-check-circle:{ .ok } pasa | < 1 ms |

??? note "`EcoVerdeEndToEndTest` (instrumentadas, requieren emulador) · 5 pruebas"
    | Prueba | Resultado |
    | --- | --- |
    | e2e01 · login sin conexión y navegación por los destinos principales | no se corren en la suite automática |
    | e2e02 · captura de corteza con inferencia sin conexión (LiteRT) y guardado en Room | no se corren en la suite automática |
    | e2e03 · análisis de follaje sin conexión y detalle de la zona | no se corren en la suite automática |
    | e2e04 · el mapa sin conexión carga con el árbol registrado y el catálogo | no se corren en la suite automática |
    | e2e05 · alertas: filtros, observaciones del árbol, editar y borrar | no se corren en la suite automática |
