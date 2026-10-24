---
name: kit-datos
description: >-
  Modelo de datos, migraciones y aislamiento entre clientes en Postgres/Supabase: convenciones de
  tablas, dinero en enteros, índices por consulta, RLS en toda tabla con sus tests, seed,
  backups con restauración probada y retención de datos personales. Úsala en la fase 3 al
  escribir datos.md y seguridad.md, en la 5 al planear y en la 6 cuando una tarea tenga
  kit masterplan:kit-datos. EN: data model, Supabase migrations, multi-tenant RLS policies and
  isolation tests, seed, backups and data retention.
---

# Kit · Datos

La base es la última línea de defensa: si la app tiene un bug, la base no debe entregar datos de
otro cliente. Todo lo de este kit apunta a eso y a poder cambiar el esquema sin miedo.

## Cuándo aplica
- Siempre que el proyecto guarde algo más que archivos estáticos (casi todo SaaS, herramienta
  interna, bot con memoria, app de IA con historial).
- Al escribir `masterplan/datos.md` y la sección de políticas de `masterplan/seguridad.md`.
- En brownfield: cuando el Mapa del repo muestra tablas sin RLS, migraciones editadas a mano o
  dinero en `float`.

## Preguntas de negocio (máx. 3)
| # | Pregunta | Default recomendado | Qué cambia |
|---|---|---|---|
| 1 | "¿Tus clientes son empresas con equipo o personas solas?" | Empresas (org con miembros); una persona sola recibe su org personal | Con org: `org_id` en cada tabla de negocio. Sin org nunca: `user_id` como dueño |
| 2 | "Si alguien borra algo, ¿lo quieres poder recuperar?" | Sí, 30 días en papelera (`deleted_at`) y luego borrado real | Soft delete + job de purga vs. borrado directo |
| 3 | "¿Cuánto tiempo debes guardar datos de personas después de que se van?" | Lo mínimo legal; cuenta borrada = datos personales fuera en 30 días, facturas según ley | Job de retención y anonimización |

## Decisión
| Si… | Entonces… | Por qué |
|---|---|---|
| Hay más de un cliente usando la misma base | Columna `org_id uuid not null` en toda tabla de negocio + RLS por membresía | El aislamiento lo garantiza Postgres, no la memoria del programador |
| El dato es de una persona, no de una org (perfil, preferencias) | `user_id uuid references auth.users` + política `user_id = auth.uid()` | Dueño claro de cada fila |
| Hay montos de dinero | `bigint` en la unidad mínima (centavos) + `currency char(3)` | `float` pierde centavos; `numeric` invita a mezclar monedas |
| Una consulta aparece en una pantalla o en una política | Índice que la cubra, empezando por `org_id` | Las políticas RLS corren en cada fila: sin índice, se vuelven lentas a 10× |
| Hay que cambiar una migración ya aplicada | Nueva migración que corrige; nunca editar la vieja | Otros entornos ya la corrieron; editarla rompe la historia |
| Hay listas largas | Paginación por cursor (`created_at, id`) | `offset` se degrada con el volumen |
| El campo es un estado con pocos valores | `text` + `check (estado in (...))` | Cambiar un `enum` de Postgres en caliente es incómodo |
| Datos que se consultan juntos y nunca solos | `jsonb` solo para metadatos sin consultas por campo | Lo que se filtra va en columnas con tipo |
| Archivos de usuario | Supabase Storage con bucket privado y política por `org_id` en la ruta (`<org_id>/...`) | Mismo modelo de aislamiento que las tablas |

## Si la base no es Supabase
El proveedor sale de `proyecto.json.proveedores['base-de-datos']`. Lo que cambia:

| Base | Migraciones | Aislamiento entre clientes | Backups |
|---|---|---|---|
| Supabase | `supabase migration new` / `db push` | RLS en Postgres (este kit) | Automáticos + restauración probada |
| Neon o Railway Postgres | Drizzle, Prisma o SQL versionado en el repo | RLS en Postgres (mismas políticas) o autorización en la API con test | Ramas o snapshots del proveedor |
| Cloudflare D1 | `wrangler d1 migrations` | En el Worker: una sola función de autorización + test de aislamiento contra la API | Time Travel/exports de D1 |
| MongoDB Atlas | Scripts de migración versionados | En la API: filtro por `org_id` obligatorio en cada consulta + test | Backups del cluster |

Los candados DAT-* valen para todas: dueño de cada registro, dinero en enteros, borrado decidido,
test de aislamiento y restauración probada. Solo cambia cómo se cumplen.

## Archivos que produce
```
masterplan/datos.md                         entidades, dueño de cada fila, borrado, índices, retención
supabase/migrations/<timestamp>_<slug>.sql  generadas con `supabase migration new <slug>`
supabase/migrations/<timestamp>_<slug>.down.sql   reversa documentada (aplicación manual)
supabase/seed.sql                           datos de prueba coherentes (2 orgs, 3 usuarios, roles)
supabase/tests/rls_*.sql                    tests pgTAP opcionales
tests/rls/aislamiento.test.ts               test de aislamiento con dos clientes reales
src/lib/database.types.ts                   `supabase gen types typescript --local`
docs/restauracion.md                        procedimiento de restauración probado, con fecha
```
Referencias en esta carpeta: `ejemplo-tabla-multitenant.sql` y `ejemplo-aislamiento.test.ts`.

## Candados
| Código | Regla | Cómo se verifica |
|---|---|---|
| DAT-01 | Toda tabla en `public` tiene `enable row level security` | SQL a `pg_tables.rowsecurity`; `masterplan.mjs deriva` |
| DAT-02 | Toda tabla con RLS tiene al menos una política por operación usada (select/insert/update/delete) | SQL a `pg_policies` |
| DAT-03 | Ninguna política usa `using (true)` en tablas con `org_id` o `user_id` | grep en migraciones |
| DAT-04 | Toda tabla de negocio tiene `id uuid`, `created_at`, `updated_at` (con trigger) y su dueño (`org_id` o `user_id`) | grep en migraciones |
| DAT-05 | Dinero nunca en `float`, `real`, `double precision` ni `money` | grep de columnas `*amount*`, `*price*`, `*total*` |
| DAT-06 | Migraciones aplicadas son inmutables: un archivo con hash registrado no cambia | `masterplan.mjs deriva` compara hashes |
| DAT-07 | Toda columna usada en una política RLS o en un `where` frecuente tiene índice | revisión del modelo + `pg_indexes` |
| DAT-08 | Existe test de aislamiento con usuario A, usuario B y anónimo, y corre en CI | archivo presente + resultado en evidencia |
| DAT-09 | Funciones `security definer` fijan `search_path` y no se exponen sin necesidad | grep `security definer` sin `set search_path` |
| DAT-10 | Buckets de Storage con datos de usuario son privados y tienen política | SQL a `storage.buckets` y `storage.objects` |
| DAT-11 | Hay un procedimiento de restauración probado con fecha de la última prueba ≤ 30 días antes del lanzamiento | `docs/restauracion.md` |
| DAT-12 | Datos personales tienen regla de retención escrita en `datos.md` | `masterplan.mjs validar` |

## Pasos que agrega al plan
Cada paso va a `plan/tareas.json` con `kit: "masterplan:kit-datos"`.

**Esquema base y convenciones**
- Archivos: `supabase/migrations/*_base.sql`, `supabase/seed.sql`
- CUANDO se corre `supabase db reset` EL SISTEMA DEBE crear todas las tablas sin error y cargar el seed.
- CUANDO se actualiza una fila EL SISTEMA DEBE cambiar `updated_at` automáticamente.
- CUANDO se intenta guardar un monto con decimales EL SISTEMA DEBE rechazarlo por tipo.
- Verificar: `npx supabase db reset && npx supabase db lint --level warning`

**RLS y test de aislamiento** (antes de cualquier pantalla con datos)
- Archivos: `supabase/migrations/*_rls.sql`, `tests/rls/aislamiento.test.ts`
- CUANDO el usuario de la org A consulta registros de la org B EL SISTEMA DEBE devolver 0 filas.
- CUANDO el usuario de la org A intenta insertar con `org_id` de la org B EL SISTEMA DEBE rechazar la escritura.
- CUANDO un anónimo consulta cualquier tabla de negocio EL SISTEMA DEBE devolver 0 filas.
- CUANDO un `member` intenta borrar un registro que solo `admin` puede borrar EL SISTEMA DEBE rechazarlo.
- Verificar: `npx vitest run tests/rls`

**Tipos generados**
- CUANDO cambia una migración EL SISTEMA DEBE regenerar `database.types.ts` sin diferencias pendientes.
- Verificar: `npx supabase gen types typescript --local > /tmp/t.ts && diff -q /tmp/t.ts src/lib/database.types.ts`

**Retención y papelera** (si P2 o P3 lo piden)
- CUANDO pasan 30 días desde `deleted_at` EL SISTEMA DEBE borrar la fila definitivamente (job `pg_cron`).
- Verificar: test SQL que simula fecha vieja y corre la función de purga.

**Backup y restauración** (antes de publicar)
- CUANDO se restaura el último backup en un proyecto de prueba EL SISTEMA DEBE pasar el test de aislamiento y el conteo de filas esperado.
- Verificar: ejecución documentada en `docs/restauracion.md` con fecha y salida en `masterplan/evidencia/`.

## Pruebas obligatorias
1. Aislamiento con dos usuarios reales de orgs distintas y un cliente anónimo (ver referencia).
2. Escritura cruzada: insert y update con `org_id` ajeno fallan.
3. Rol: cada fila de la matriz rol × recurso × acción de `seguridad.md` tiene al menos un caso.
4. `supabase db reset` desde cero en CI: las migraciones aplican en orden limpio.
5. Restauración real una vez antes del lanzamiento.

## Lista de producción
- [ ] Todas las migraciones aplicadas en producción antes de promover el deploy
- [ ] Ninguna tabla sin RLS (consulta de `checks.md` del auditor en 0 filas)
- [ ] Backups automáticos activos y plan que los incluye (verificar el plan contratado)
- [ ] Point-in-time recovery evaluado si los datos cambian mucho por hora
- [ ] Restauración probada con fecha
- [ ] Seed nunca corre contra producción (no está en el script de deploy)
- [ ] Job de retención activo y registrado en `datos.md`

## Trampas
- Probar RLS desde el SQL editor del panel: corre como superusuario y salta las políticas. Prueba
  siempre con un cliente autenticado real.
- `service_role` en tests "para que pase": el test deja de probar algo.
- Política de `select` correcta y de `insert` olvidada: lectura aislada, escritura abierta.
- `update` sin `with check`: el usuario puede mover una fila a otra org.
- Vistas que saltan RLS: crea vistas con `security_invoker = true`.
- Subconsultas a `memberships` dentro de cada política sin índice: lentitud a escala. Usa la
  función `is_member` de `masterplan:kit-auth`.
- Borrar en cascada desde `auth.users` sin pensar en facturas: lo contable se anonimiza, no se borra.
