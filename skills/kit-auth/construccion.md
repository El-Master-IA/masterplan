# Kit · auth · construcción

Segunda mitad del kit `masterplan:kit-auth`. Las decisiones y los candados están en `SKILL.md`.

## Archivos que produce
```
supabase/migrations/<ts>_auth_orgs.sql      orgs, memberships, invitations, trigger de registro
supabase/migrations/<ts>_auth_funciones.sql is_member, has_role, aceptar_invitacion
supabase/functions/invitar/index.ts         crea invitación y envía correo
supabase/functions/borrar-cuenta/index.ts   supresión de cuenta
src/features/auth/                          entrar, registro, recuperar, nueva-clave, mfa
src/features/auth/RutaProtegida.tsx
src/features/auth/useSesion.ts              suscripción a onAuthStateChange
src/features/orgs/                          selector de org, miembros, invitaciones
tests/auth/*.test.ts                        roles, invitaciones, registro
e2e/auth.spec.ts                            registro → entrar → salir → recuperar
```

## Pasos que agrega al plan
**Orgs, membresías y registro**
- Archivos: `supabase/migrations/*_auth_orgs.sql`, `*_auth_funciones.sql`, `tests/auth/registro.test.ts`
- CUANDO una persona se registra EL SISTEMA DEBE crear su org personal y su membresía como owner.
- CUANDO `is_member` se llama con una org ajena EL SISTEMA DEBE devolver falso.
- CUANDO se intenta quitar el último owner de una org EL SISTEMA DEBE rechazar el cambio.
- Verificar: `npx vitest run tests/auth`

**Pantallas de acceso y ruta protegida**
- Archivos: `src/features/auth/*`, `e2e/auth.spec.ts`
- CUANDO un anónimo abre una ruta privada EL SISTEMA DEBE llevarlo a `/entrar` y, al entrar, devolverlo a la ruta original.
- CUANDO la contraseña es incorrecta EL SISTEMA DEBE mostrar un error genérico sin revelar si el correo existe.
- CUANDO se pide recuperar contraseña con un correo inexistente EL SISTEMA DEBE mostrar el mismo mensaje que con uno real.
- Verificar: `npx playwright test e2e/auth.spec.ts`

**Invitaciones**
- Archivos: `supabase/functions/invitar/index.ts`, migración de `invitations`, `tests/auth/invitaciones.test.ts`
- CUANDO un member intenta invitar EL SISTEMA DEBE responder 403.
- CUANDO se usa un token vencido o ya usado EL SISTEMA DEBE rechazarlo sin crear membresía.
- CUANDO se acepta una invitación válida EL SISTEMA DEBE crear la membresía con el rol invitado y marcar `accepted_at`.
- Verificar: `npx vitest run tests/auth/invitaciones.test.ts`

**Borrado de cuenta** (antes de publicar)
- CUANDO una persona confirma el borrado tras reautenticarse EL SISTEMA DEBE eliminar sus datos personales y conservar facturas anonimizadas.
- CUANDO la persona es único owner de una org con más miembros EL SISTEMA DEBE pedir transferir la propiedad antes.
- Verificar: `npx vitest run tests/auth/borrado.test.ts`

**MFA** (si P3 = sí)
- CUANDO un admin sin segundo factor intenta una acción crítica EL SISTEMA DEBE pedir el código TOTP.
- Verificar: test con `aal1` rechazado y `aal2` aceptado.

## Pruebas obligatorias
1. Registro crea org + owner (unitaria contra base local).
2. Matriz de roles: owner, admin, member y anónimo contra cada acción sensible.
3. Invitación: válida, vencida, reutilizada, con correo distinto al invitado.
4. E2E del recorrido de acceso completo, incluido volver a la ruta original.
5. Recuperación con correo inexistente: respuesta idéntica.

## Lista de producción
- [ ] Site URL y Redirect URLs de Supabase Auth apuntan solo al dominio de producción y previews propias
- [ ] Plantillas de correo de Auth en el idioma del producto y remitente propio (SMTP verificado)
- [ ] Confirmación de correo activa
- [ ] CAPTCHA activo en registro y entrada
- [ ] Proveedores OAuth con credenciales de producción, no de prueba
- [ ] Política de privacidad enlazada desde el registro

## Trampas
- Leer `user_metadata` en políticas: el usuario lo puede escribir. Para datos de autorización usa
  tablas propias o `app_metadata` escrito solo por el servidor.
- `getSession()` en el servidor confía en lo que manda el cliente; en Edge Functions valida con
  `getUser(token)` o verificando la firma del JWT.
- Política de `memberships` que consulta `memberships`: recursión infinita. Para eso existe `is_member`.
- Mostrar u ocultar botones según rol no es seguridad; la política RLS es la que decide.
- Enlace de invitación que crea la cuenta y la membresía sin verificar que el correo coincide.
- SMTP por defecto de Supabase en producción: tiene tope bajo de envíos y cae en spam.
