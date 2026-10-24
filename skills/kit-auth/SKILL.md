---
name: kit-auth
description: >-
  Identidad y permisos con Supabase Auth: registro con org personal, membresías con roles
  owner/admin/member, invitaciones con token hasheado y vencimiento, funciones is_member/has_role,
  rutas protegidas en React, recuperación de contraseña, límite de intentos, MFA opcional y borrado
  de cuenta. Úsala cuando el alcance tenga login, equipos o roles, en fases 3, 5 y 6 (tareas con
  kit masterplan:kit-auth). EN: Supabase Auth, organizations, memberships, roles, invitations,
  protected routes, password reset, MFA, account deletion.
---

# Kit · Auth

Una sola fuente de verdad sobre quién es la persona (Supabase Auth) y una sola sobre qué puede
hacer (membresías en la base, leídas por RLS). La interfaz solo refleja; nunca decide.

## Cuándo aplica
- Cualquier producto donde alguien inicia sesión.
- Siempre junto con `masterplan:kit-datos`: los roles de aquí son los que usan las políticas de allá.
- En brownfield: si hay dos sistemas de sesión (por ejemplo Supabase + otro proveedor), roles
  guardados en el cliente o en `localStorage`, o invitaciones con token en texto plano.

## Preguntas de negocio (máx. 3)
| # | Pregunta | Default recomendado | Qué cambia |
|---|---|---|---|
| 1 | "¿Cómo prefieres que entren: correo y contraseña, enlace mágico o Google?" | Correo + contraseña y Google | Proveedores a activar y pantallas |
| 2 | "¿Alguien trabaja en equipo dentro de tu producto o cada quien solo?" | Equipo con roles owner/admin/member; cada registro crea su org personal | Invitaciones y pantalla de miembros en v1 o Non-Goal |
| 3 | "¿Manejas datos sensibles (salud, dinero, menores)?" | No: MFA opcional para owner | Sí: MFA obligatorio para owner y admin |

## Decisión
| Si… | Entonces… | Por qué |
|---|---|---|
| Hay login | Supabase Auth es el único dueño de la sesión; el cliente usa `supabase.auth` y nada más | Dos fuentes de sesión terminan desincronizadas |
| Alguien se registra | Trigger en `auth.users` crea `orgs` + `memberships(role='owner')` en la misma transacción | Nadie queda sin org; RLS siempre tiene contra qué comparar |
| Se necesita saber si alguien pertenece a una org | `public.is_member(org uuid)` y `public.has_role(org uuid, roles text[])`, `security definer`, `stable`, `set search_path = ''` | Evita recursión de RLS sobre `memberships` y se indexa una vez |
| Se invita a alguien | Token aleatorio de 32 bytes; en la base solo `sha256(token)`, `expires_at` (7 días), `accepted_at`, un solo uso | Si la tabla se filtra, los tokens no sirven |
| Rol de la persona en la UI | Se lee de `memberships` vía consulta; nunca de un estado editable por el cliente | El cliente puede mentir; la base no |
| Rutas privadas | Componente `RutaProtegida` que espera la sesión inicial y redirige a `/entrar?volver=` | Evita parpadeo y fuga de pantallas |
| Recuperar contraseña | `resetPasswordForEmail` con `redirectTo` a una URL de la lista blanca; mensaje igual exista o no la cuenta | No revela qué correos están registrados |
| Muchos intentos de entrar | Límites de Supabase Auth configurados + CAPTCHA de Supabase (Turnstile o hCaptcha) en registro y entrada | Frena relleno de credenciales |
| Datos sensibles o rol owner | MFA TOTP de Supabase; políticas críticas exigen `aal2` en el JWT | Segundo factor verificado por la base |
| Borrar cuenta | Edge Function con verificación de JWT y reautenticación reciente; transfiere o borra orgs donde es único owner; anonimiza lo contable | Derecho de supresión sin romper facturas |

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

## Candados
| Código | Regla | Cómo se verifica |
|---|---|---|
| AUT-01 | Ninguna otra librería de sesión ni JWT casero en el cliente | grep de dependencias y `jsonwebtoken`/`jose` en `src/` |
| AUT-02 | Funciones `security definer` tienen `set search_path` fijo y `revoke execute ... from public` cuando no son para todos | grep en migraciones |
| AUT-03 | Tokens de invitación se guardan solo como hash, con `expires_at` y uso único | grep columna `token` sin `_hash` |
| AUT-04 | Roles y permisos nunca se leen de `localStorage`, `user_metadata` ni parámetros de URL para decidir acceso | grep `user_metadata` en políticas y en `src/` |
| AUT-05 | Toda ruta con datos privados está envuelta en `RutaProtegida` | revisión del router |
| AUT-06 | Recuperación de contraseña no revela si el correo existe | test de UI con correo inexistente |
| AUT-07 | `redirectTo` y URLs de sitio en Supabase Auth limitadas a dominios propios | configuración revisada en `seguridad.md` |
| AUT-08 | Registro y entrada protegidos con CAPTCHA o límite de intentos activado | configuración + evidencia |
| AUT-09 | Una org nunca queda sin owner (trigger o check al cambiar roles) | test |
| AUT-10 | Borrado de cuenta exige reautenticación reciente y deja registro en auditoría | test de la función |

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
