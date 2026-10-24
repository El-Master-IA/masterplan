# Spec · <capacidad>

<!-- masterplan/specs/<capacidad>.md · Fase 3. Describe cómo funciona el sistema HOY.
     Prefijos de ID: AUTH, DATA, API, UI, PAY, DEPLOY, OBS, MAIL, FILE, RT, IA (o uno propio en
     mayúsculas). Formato de ID: PREFIJO-NNN, nunca se reutiliza un ID eliminado.
     Los tests citan el ID en su nombre para que masterplan.mjs deriva los encuentre. -->

**Capacidad:** <capacidad> · **Kit:** `masterplan:kit-<kit>` · **Actualizado:** AAAA-MM-DD

## Propósito
_Una o dos líneas: qué resuelve esta capacidad para el usuario._

## Fuera de alcance
_Lo que esta capacidad no hace en v1 (enlaza a los Non-Goals)._

## Requisitos
_Patrones EARS. Uno por fila, verificable, con al menos un requisito de error por capacidad._

| Patrón | Forma |
|---|---|
| Siempre | EL SISTEMA DEBE … |
| Evento | CUANDO … EL SISTEMA DEBE … |
| Estado | MIENTRAS … EL SISTEMA DEBE … |
| No deseado | SI … ENTONCES EL SISTEMA DEBE … |
| Opcional | DONDE … EL SISTEMA DEBE … |

| ID | Requisito | Prioridad | Verificación |
|---|---|---|---|
| <PRE>-001 | CUANDO … EL SISTEMA DEBE … | debe | `tests/…` |
| <PRE>-002 | SI … ENTONCES EL SISTEMA DEBE … | debe | `supabase/tests/…` |

Prioridad: `debe` (v1) · `debería` (v1 si cabe) · `podría` (después).

## Preguntas abiertas
_[ABIERTA: pregunta — bloquea <ID>] o "Ninguna"._

## Historial
_Cambios aplicados desde cambios/archivo/: fecha, carpeta del cambio, IDs agregados, modificados o eliminados._
