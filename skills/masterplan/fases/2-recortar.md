# Fase 2 · Recortar

Objetivo: que la primera versión sea pequeña, útil y terminable. Lo que NO entra vale tanto como lo
que entra.

## 1. Tres versiones
Lee la sección "Alcance típico" del archivo del tipo. Propón en una tabla:

| | Mínima | Recomendada | Soñada |
|---|---|---|---|
| Qué hace | 1 flujo principal | flujo + lo necesario para cobrar/usar | todo lo que imaginó |
| Pasos de construcción aprox. | 8–10 | 12–16 | 25+ |
| Tiempo con Claude Code | días | 1–2 semanas | meses |

Recomienda una (casi siempre la del medio) y di qué se cae de la soñada.

## 2. Non-Goals
Al menos **5** cosas que v1 NO hace, cada una con cuándo volvería. Ejemplos: "sin app móvil nativa
(v2 si hay 100 usuarios activos)", "sin multi-idioma", "sin roles personalizados".

## 3. Flujo principal
Escribe el recorrido feliz en 5–8 pasos desde los ojos del usuario ("entra, se registra, crea su
primer X, invita a Y, paga"). Ese flujo será la prueba de punta a punta de la fase 7.

## Puerta
- [ ] La persona eligió una versión
- [ ] `proyecto.json`: `alcance.version`, `alcance.flujoPrincipal[]`, `alcance.noGoals[]` (≥5), `fase: 3`
- [ ] Relevo escrito (`relevos/02-recortar.md`) y propuesta de sesión nueva para la fase 3
