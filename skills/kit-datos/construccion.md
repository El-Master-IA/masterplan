# Kit · datos · construcción

Segunda mitad del kit `masterplan:kit-datos`. Las decisiones y los candados están en `SKILL.md`.

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
