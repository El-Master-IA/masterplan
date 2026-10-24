# Fase 6 · Construir (el conductor)

Objetivo: ejecutar `plan/tareas.json` hasta que todas las tareas estén en verde, sin que la persona
tenga que ser el pegamento entre herramientas.

## Antes de empezar
- Lee `proyecto.json`, `plan/tareas.json` y el último relevo. Nada más: los documentos de diseño
  los leen los agentes cuando su tarea los cita.
- Confirma que el árbol de git está limpio y que el último tag `mp-T*` corresponde a la última
  tarea `hecha`. Si no, reporta y pregunta antes de seguir.
- Mod activo: `mcp__masterplan__registrar` con `fase: 6` y la ola que tomas.

## El bucle (una tarea a la vez, o una ola en paralelo)
1. **Elige** la primera tarea `pendiente` cuyas dependencias están `hecha`. Márcala `en-curso` con
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" tarea <id> en-curso` (así otra sesión no la toma).
2. **Despacha** `masterplan:constructor` con: la tarea completa (JSON), rutas absolutas del proyecto,
   las specs que cita (texto), el kit que indica la tarea y el perfil. Un constructor nuevo por
   tarea: contexto limpio.
   - En una ola con varias tareas independientes, despacha varios constructores en el mismo
     mensaje; cada uno solo toca los archivos de su tarea.
3. **Revisa**: despacha `masterplan:revisor-codigo` con el diff de la tarea y sus criterios.
   - Tarea con `kit` de auth, datos o pagos: también `masterplan:auditor-seguridad` sobre el diff.
4. **Verifica tú**: corre cada comando de `verificar` y los de las tareas anteriores que tocan los
   mismos archivos. Guarda la salida en `masterplan/evidencia/<id>.txt`.
5. **Cierra**: si todo sale 0 y el revisor no tiene BLOCKER, corre el `checkpoint` y
   `masterplan.mjs tarea <id> hecha`. Una línea a la persona: "T05 lista: aislamiento entre
   organizaciones probado (2/2 tests)."
6. **Si falla**: el constructor corrige (máx. 2 intentos). Al tercer fallo, vuelve al tag anterior
   (`git reset --hard mp-T<anterior>`), marca la tarea `bloqueada` con la razón y pregunta. Nunca
   saltes a la siguiente tarea "mientras tanto".

## Políticas activas
Los hooks del plugin vigilan cada escritura (secretos en el frontend, `service_role` en el cliente,
tablas sin RLS, webhooks sin firma, `.env` en git). Si una política bloquea, se corrige el código;
la excepción solo se usa con motivo escrito (`// masterplan-permitir: <regla> -- <motivo>`) y queda
registrada en `masterplan/evidencia/excepciones.log`.

## Sesiones
- Al terminar una ola, escribe `relevos/06-ola-<n>.md` y propone seguir en sesión nueva si el
  contexto pasa de la mitad.
- Mod activo: avisa con `mcp__masterplan__enviar` a las sesiones registradas del proyecto cuando
  una tarea de la que dependen pasa a `hecha`.

## Puerta
- [ ] Todas las tareas `hecha`, cada una con su tag `mp-T*` y su evidencia
- [ ] `proyecto.json`: `fase: 7`
- [ ] Relevo `relevos/06-construir.md`
