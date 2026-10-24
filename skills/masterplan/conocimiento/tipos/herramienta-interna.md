# Tipo: Herramienta interna

Aplicación que usa **tu propio equipo** para operar el negocio: back-office, panel de
operaciones, CRM a la medida, aprobaciones, inventario, reportes. Pocos usuarios conocidos, mucha
información sensible y muchas tablas. Manda la velocidad de cambio y que cada rol vea solo lo que
le toca.

## Señales

| Frase típica | Lo que delata |
|---|---|
| "Un panel para que mi equipo gestione los pedidos" | Back-office |
| "Dejar de usar el Excel compartido" | Reemplazo de hoja de cálculo |
| "Que el supervisor apruebe antes de pagar" | Flujo de aprobación con roles |
| "Ver en un tablero cómo vamos" | Reportes internos |
| "Solo lo usamos nosotros, 5 a 30 personas" | Usuarios conocidos |

## No es este tipo si…

- Clientes externos inician sesión → `saas` (aunque también haya un panel interno).
- Nadie interactúa y todo es automático → `bot`.
- Es solo un tablero de lectura sobre datos existentes → considera una herramienta de BI antes de
  construir (se dice en la fase 2 como alternativa).

## Capacidades que exige

| Capacidad | ¿Siempre? | Kit |
|---|---|---|
| auth restringida al dominio o lista de la empresa | Sí | `masterplan:kit-auth` |
| datos con roles internos y auditoría | Sí | `masterplan:kit-datos` |
| frontend denso (tablas, filtros, formularios) | Sí | `masterplan:kit-frontend` |
| deploy (acceso protegido) | Sí | `masterplan:kit-deploy` |
| observabilidad | Sí | `masterplan:kit-observabilidad` |
| api (integración con sistemas existentes) | Frecuente | `masterplan:kit-api` |
| archivos (soportes, facturas) | Frecuente | `masterplan:kit-datos` |

## Decisión clave: de dónde salen los datos y quién entra

1. **Fuente de verdad.** ¿La herramienta es dueña de los datos o lee de otro sistema (ERP, tienda,
   hoja de cálculo)? Si lee, se decide sincronización (cada cuánto, en qué dirección, quién gana
   en un conflicto). Por defecto: una sola dirección, el sistema externo manda.
2. **Quién entra.** Solo cuentas del dominio de la empresa o lista blanca de correos. Registro
   público desactivado.

**Recomendación:** registro cerrado, login con el proveedor de la empresa (Google Workspace o
Microsoft) o enlace mágico a lista blanca; roles en tabla propia; bitácora de auditoría de toda
acción que cambie dinero, estado o permisos.

## Modelo de datos base

| Tabla | Columnas clave | Notas |
|---|---|---|
| `staff` | `user_id`, `nombre`, `rol` (`admin`/`supervisor`/`operador`/`lectura`), `activo` | Roles internos; desactivar en vez de borrar |
| `allowed_emails` | `email` o `dominio`, `rol_inicial` | Controla el acceso |
| `<entidad_operativa>` | `id`, `estado`, `asignado_a`, campos del negocio, `creado`, `actualizado` | Pedidos, casos, solicitudes |
| `approvals` | `entidad_id`, `solicitado_por`, `aprobado_por`, `decision`, `motivo`, `fecha` | Si hay flujo de aprobación |
| `audit_log` | `actor_id`, `accion`, `entidad`, `antes`, `despues`, `fecha` | Obligatoria; solo inserción |
| `sync_runs` (si sincroniza) | `fuente`, `inicio`, `fin`, `filas`, `errores` | Rastro de cada sincronización |

## Estructura de carpetas (perfil React + Vite + Supabase)

```
src/
  app/                 # router, layout con navegación lateral
  features/
    auth/              # login restringido, guard por rol
    <entidad>/         # tabla con filtros, detalle, formulario, acciones
    aprobaciones/
    reportes/
  components/
    ui/                # shadcn/ui
    data-table/        # tabla reutilizable: orden, filtros, paginación, exportar
  lib/  data/  env.ts
supabase/
  migrations/  functions/  tests/
tests/
```

## Alcance típico

| | Mínima | Recomendada |
|---|---|---|
| Qué incluye | Login restringido, 1 entidad con tabla + detalle + edición, roles básicos | Mínima + aprobaciones, auditoría visible, importación/exportación CSV, 1 reporte |
| Pasos | 8–10 | 12–14 |
| Non-Goals frecuentes | App móvil, notificaciones push, permisos por campo, reportes personalizados, modo sin conexión | |

## Orden base de construcción

| # | Paso | Criterio EARS principal | Se verifica con |
|---|---|---|---|
| 1 | Proyecto, git, lint, typecheck, test | CUANDO se corren los scripts de calidad en un clon limpio EL SISTEMA DEBE salir con código 0 | Scripts |
| 2 | Supabase local, variables validadas, registro público desactivado | CUANDO alguien intenta registrarse desde fuera EL SISTEMA DEBE rechazarlo | Test de integración |
| 3 | Esquema `staff`, `allowed_emails`, `audit_log` con RLS | CUANDO un correo fuera de la lista inicia sesión EL SISTEMA DEBE negar el acceso y no crear `staff` | Test de integración |
| 4 | Roles y matriz de permisos en la base | CUANDO un `operador` intenta una acción reservada a `supervisor` EL SISTEMA DEBE rechazarla en la base | `npm run db:test` |
| 5 | Layout, navegación y guard por rol en la UI | CUANDO un rol abre una sección sin permiso EL SISTEMA DEBE mostrar el estado "sin permiso", no un error | Test de componente |
| 6 | Tabla reutilizable con orden, filtros y paginación en servidor | CUANDO hay más de 50 filas EL SISTEMA DEBE paginar en la base, no en el navegador | Test de la capa de datos |
| 7 | Entidad operativa: detalle y edición con validación | CUANDO se guarda un formulario inválido EL SISTEMA DEBE marcar los campos y no escribir | Tests |
| 8 | Bitácora de auditoría automática | CUANDO cambia el estado o un monto de una entidad EL SISTEMA DEBE insertar una fila en `audit_log` con antes y después | Test de trigger |
| 9 | Flujo de aprobación | CUANDO alguien intenta aprobar su propia solicitud EL SISTEMA DEBE rechazarlo | Test de RLS/función |
| 10 | Importar/exportar CSV | CUANDO un CSV trae filas inválidas EL SISTEMA DEBE reportar cada fila con su error y no importar parcialmente | Test con archivo de prueba |
| 11 | Sincronización con sistema externo (si aplica) | CUANDO la sincronización falla a la mitad EL SISTEMA DEBE registrar el error en `sync_runs` y no dejar datos a medias | Test de integración |
| 12 | Reporte principal | CUANDO se filtra por rango de fechas EL SISTEMA DEBE usar la zona horaria de la empresa | Test de la consulta |
| 13 | Observabilidad y flujo principal e2e | CUANDO un operador recorre el flujo principal EL SISTEMA DEBE completarlo sin errores de consola | `npm run test:e2e` |
| 14 | Deploy protegido | CUANDO un anónimo abre la URL de producción EL SISTEMA DEBE mostrar solo el login | Smoke en preview |

## Trampas típicas

| Trampa | Prevención |
|---|---|
| "Es interno, no necesita seguridad" | Los datos internos son los más sensibles; RLS y roles igual |
| Registro abierto por defecto en el proveedor de auth | Desactivarlo en el paso 2 |
| Borrar empleados que se van | Desactivar (`activo = false`) y revocar sesiones |
| Sincronización bidireccional sin regla de conflicto | Una dirección, el externo manda |
| Tablas que cargan todo en el navegador | Paginación y filtros en servidor |
| Sin auditoría y alguien cambia un monto | `audit_log` por trigger |

## Lista de lanzamiento

- [ ] Lista de correos o dominio autorizado cargada
- [ ] Un usuario por rol probó su flujo real
- [ ] Procedimiento de alta y baja de empleados escrito
- [ ] Backups y restauración probada
- [ ] Datos iniciales migrados desde la hoja de cálculo o sistema anterior, con conteo verificado
