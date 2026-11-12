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

## Preguntas de negocio (se asume el default)
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

## Candados
| Código | Regla | Cómo se verifica |
|---|---|---|
| DAT-01 | Toda tabla en `public` tiene `enable row level security` | SQL a `pg_tables.rowsecurity`; `masterplan.mjs deriva` |
| DAT-02 | Toda tabla con RLS tiene al menos una política por operación usada (select/insert/update/delete) | SQL a `pg_policies` |
| DAT-03 | Ninguna política usa `using (true)` en tablas con `org_id` o `user_id` | grep en migraciones |
| DAT-04 | Toda tabla de negocio tiene `id uuid`, `created_at`, `updated_at` (con trigger) y su dueño (`org_id` o `user_id`) | grep en migraciones |
| DAT-05 | Dinero nunca en `float`, `real`, `double precision` ni `money` | grep de columnas `*amount*`, `*price*`, `*total*` |
| DAT-06 | Migraciones aplicadas son inmutables: un archivo con hash registrado no cambia | La política `MP-DAT-02` avisa al editar una migración existente; en revisión, `git log --diff-filter=M -- supabase/migrations` |
| DAT-07 | Toda columna usada en una política RLS o en un `where` frecuente tiene índice | revisión del modelo + `pg_indexes` |
| DAT-08 | Existe test de aislamiento con usuario A, usuario B y anónimo, y corre en CI | archivo presente + resultado en evidencia |
| DAT-09 | Funciones `security definer` fijan `search_path` y no se exponen sin necesidad | grep `security definer` sin `set search_path` |
| DAT-10 | Buckets de Storage con datos de usuario son privados y tienen política | SQL a `storage.buckets` y `storage.objects` |
| DAT-11 | Hay un procedimiento de restauración probado con fecha de la última prueba ≤ 30 días antes del lanzamiento | `docs/restauracion.md` |
| DAT-12 | Datos personales tienen regla de retención escrita en `datos.md` | `masterplan.mjs validar` |

## Construcción
Archivos, pasos del plan, pruebas obligatorias, lista de producción y trampas están en
`construccion.md` (junto a este archivo). Lo lee quien planea (fase 5) y quien construye (fase 6);
para decidir en la fase 3 basta este archivo.
