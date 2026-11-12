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

## Preguntas de negocio (se asume el default)
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

## Si el login no es Supabase Auth
El proveedor sale de `proyecto.json.proveedores.auth`. Regla de oro: **un solo dueño de la sesión**.

| Proveedor | Cuándo gana | Cómo se conecta con la base |
|---|---|---|
| Supabase Auth | La base es Supabase y quieres RLS con `auth.uid()` | Directo (este kit) |
| Clerk | Organizaciones, invitaciones y UI de cuenta listas; B2B con prisa | Webhook que replica usuarios/orgs en tu base; la API valida el JWT de Clerk (o integración nativa de Clerk con Supabase) |
| Better Auth | Quieres el login dentro de tu código y tu base, sin servicio externo | Tablas propias en tu base; sesiones en tu servidor |
| WorkOS / Auth0 | Clientes empresa que exigen SSO (SAML) y SCIM | El JWT del proveedor se valida en la API; la membresía vive en tu base |
| Firebase Auth | El proyecto ya vive en Firebase o es móvil-primero | Reglas de seguridad de Firebase o validación del token en la API |

Los candados AUT-* aplican igual: roles en el servidor, invitaciones con vencimiento, límite de
intentos y borrado de cuenta.

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

## Construcción
Archivos, pasos del plan, pruebas obligatorias, lista de producción y trampas están en
`construccion.md` (junto a este archivo). Lo lee quien planea (fase 5) y quien construye (fase 6);
para decidir en la fase 3 basta este archivo.
