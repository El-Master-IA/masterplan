# Fase 6 · Construir (el conductor)

Objetivo: ejecutar `plan/tareas.json` hasta que todas las tareas estén en verde, sin que la persona
tenga que ser el pegamento entre herramientas, y lo más rápido que permitan las dependencias:
**las tareas independientes de una ola corren al mismo tiempo, cada una en su propia sesión.**

## Antes de empezar
- Lee `proyecto.json` (incluye `rigor` y `paralelo_max`), `plan/tareas.json` y el último relevo.
  Nada más: los documentos de diseño los leen los agentes cuando su tarea los cita.
- Confirma que el árbol de git está limpio y que el último tag `mp-T*` corresponde a la última
  tarea `hecha`. Si no, reporta y pregunta antes de seguir.
- Mod activo: `mcp__masterplan__registrar` con `fase: 6` y la ola que tomas.

## Rigor: cuánta revisión lleva cada ola (`proyecto.json.rigor`, por defecto `medio`)
| Rigor | `revisor-codigo` | `auditor-seguridad` | Quién bloquea |
|---|---|---|---|
| `bajo` | una vez por ola, sobre el diff acumulado | una vez por ola, solo si hubo tareas de auth, datos, pagos o secretos | solo BLOCKER |
| `medio` | una vez por ola, sobre el diff acumulado | por tarea de auth, datos o pagos | BLOCKER y MAJOR |
| `alto` | por tarea | por tarea de auth, datos o pagos, y de ola entera | BLOCKER y MAJOR |

- Los hallazgos que no bloquean (MINOR, "bajas", los marcados `ESPECULATIVO`) **no se arreglan en
  caliente**: van a `masterplan/backlog.md` con una línea (archivo:línea, qué, severidad). Máximo una
  tarea de endurecimiento por ola, y solo con lo que el backlog tenga de MAJOR o más. Lo
  especulativo para el tamaño y la etapa del proyecto se descarta con una línea de motivo.
- No se abre una migración, tarea o ola extra para "limpiar bajas".

## El bucle: una ola a la vez
1. **Calcula la ola:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" ola [n] --escribir`.
   Devuelve las tareas libres (dependencias en `hecha`, sin archivos compartidos), respeta
   `paralelo_max` (por defecto 5) y deja un **brief autocontenido** por tarea en
   `masterplan/olas/ola-<n>/<id>.brief.md`.
2. **Confirma con la persona** el número de sesiones (cada una gasta cuota de uso en paralelo) salvo
   que ya lo haya autorizado para el proyecto.
3. **Lanza una sesión nueva por tarea** (modo `paralelo`, por defecto con ≥2 tareas libres):
   - Cliente con herramienta de sesiones (Claude Desktop: `start_session`): una sesión por tarea,
     con `use_worktree: true`, contexto `fresh` y como prompt el contenido del brief. Marca cada
     tarea: `masterplan.mjs tarea <id> en-curso --sesion=<id de la sesión>`.
   - Claude Code por terminal: `claude --worktree mp-<id> -p "<brief>"` en segundo plano, una por
     tarea.
   - Sin ninguna de las dos: subagentes `masterplan:constructor` en segundo plano con
     `isolation: worktree`, uno por tarea, en el mismo mensaje.
   - Último recurso: imprime los briefs y dile a la persona cómo abrir un chat nuevo por cada uno.
   - Con 1 sola tarea libre, impleméntala tú con un `masterplan:constructor` normal.
4. **No hagas polling.** Cada sesión avisa al terminar (nota de sesión o buzón del mod). Mientras
   esperas, prepara la siguiente ola (`ola <n+1>` en seco) o responde a la persona.
5. **Integra** cuando todas reportaron (tú, en una sola sesión, en orden de id):
   a. Trae la rama `mp-<id>` (`git merge --no-ff mp-<id>`); si choca, resuelve y deja el motivo en
      `decisiones.log`.
   b. Corre cada comando de `verificar` de la tarea y los de las anteriores que tocan los mismos
      archivos. La salida real queda en `masterplan/evidencia/<id>.txt` (**un solo archivo por
      tarea**: el de la sesión; tú lo completas, no creas otro).
   c. Pruebas de base de datos: `masterplan.mjs pgtap-resumen <salida>` para ver qué aserto falla.
   d. Revisión según el rigor (tabla de arriba), sobre el diff acumulado de la ola.
   e. Con todo en 0 y sin bloqueos: corre el `checkpoint` de cada tarea y
      `masterplan.mjs tarea <id> hecha`. Una línea a la persona por tarea: "T05 lista: aislamiento
      probado (2/2 tests)."
6. **Si falla:** la sesión corrige (máx. 2 intentos). Al tercer fallo, la tarea queda `bloqueada`
   con la razón (`tarea <id> bloqueada <motivo>`), su rama no se integra y **las demás siguen**.
   Si una tarea posterior depende de la bloqueada, espera; las que no dependen no se detienen.
7. **Cierra la ola:** `masterplan.mjs relevo 06-ola-<n>` (el estado se autocompleta; añade 3–5
   líneas de contexto), borra las ramas y worktrees integrados, y pasa a la ola siguiente.

## Entorno de pruebas
Sigue lo decidido en la fase 3 (`proyecto.json.entorno`). Con base **local**, cada worktree usa su
propio puerto o base, así las pruebas de varias tareas no se pisan. Con base **hospedada**, las
tareas que tocan la base corren de a una; el resto sigue en paralelo.

## Políticas activas
Los hooks del plugin vigilan cada escritura (secretos en el frontend, `service_role` en el cliente,
tablas sin RLS, webhooks sin firma, `.env` en git). Si una política bloquea, se corrige el código;
la excepción solo se usa con motivo escrito (`// masterplan-permitir: <regla> -- <motivo>`) y queda
registrada en `masterplan/evidencia/excepciones.log`.

## Sesiones
- Al terminar una ola, el relevo lo genera el script (una página). Propón seguir en sesión nueva si
  el contexto pasa de la mitad.
- Mod activo: avisa con `mcp__masterplan__enviar` a las sesiones registradas del proyecto cuando
  una tarea de la que dependen pasa a `hecha`.

## Puerta
- [ ] Todas las tareas `hecha`, cada una con su tag `mp-T*` y su evidencia
- [ ] `masterplan/backlog.md` revisado: lo MAJOR+ resuelto o aceptado por escrito
- [ ] `proyecto.json`: `fase: 7`
- [ ] Relevo `relevos/06-construir.md`
