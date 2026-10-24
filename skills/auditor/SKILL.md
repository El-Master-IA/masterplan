---
name: auditor
description: >-
  Motor común de auditoría de Masterplan: dominios (seguridad, rls, dependencias, frontend-a11y,
  rendimiento, estetica-generica, seo-agentes), qué mide un script y qué juzga el modelo, tamaño de
  la auditoría según el repo, auditores de solo lectura en paralelo, verificador independiente,
  formato de hallazgo, tres notas separadas (Seguridad, Calidad de experiencia y Bases técnicas), severidad con
  CWE/OWASP y arreglos solo con aprobación. Úsala en las fases 6 y 7, en cualquier proyecto ya
  construido (aunque no se haya hecho con Masterplan) o cuando la persona pida "audita mi app",
  "revisa mi proyecto", "revisa la seguridad", "qué tan listo está para producción". EN: audit engine,
  security and UX audit, findings format, scoring.
---

# Auditor

Una auditoría vale por lo que se puede probar. Primero lo que mide una máquina, después lo que
juzga el modelo, y nada se reporta sin evidencia ni sin que otro lo haya mirado.

## Cuándo aplica
- Fase 6: tareas con `kit` de auth, datos o pagos (solo dominios `seguridad` y `rls` sobre el diff).
- Fase 7: auditoría completa antes de publicar.
- Fase 8: auditoría de mantenimiento (mensual o tras cambios grandes) y comparación con la anterior.
- Brownfield: diagnóstico inicial para saber de dónde se parte.
- **Modo auditor:** proyectos hechos con otra herramienta (Lovable, Bolt, v0, Cursor) o a mano, sin
  `masterplan/proyecto.json`. Lo conduce `/masterplan:auditar` (o la frase "audita mi proyecto"):
  explorador → tres auditores → informe con plan de arreglos. Los auditores infieren la matriz de
  permisos y usan presupuestos por defecto; nunca reportan "faltan los documentos de Masterplan".

## Dominios
| Dominio | Nota | Qué cubre | Candados que revisa |
|---|---|---|---|
| `seguridad` | Seguridad | secretos, authz en funciones, inyección, webhooks, headers, CORS, sesión | AUT-*, API-*, PAG-*, DEP-01/02/07, OBS-02/03 |
| `rls` | Seguridad | tablas sin RLS, políticas permisivas, `security definer`, Storage, tests de aislamiento | DAT-01..03, DAT-08..10, AUT-02/04 |
| `dependencias` | Seguridad | vulnerabilidades conocidas, paquetes abandonados o sospechosos, lockfile | CHK-DEP-* |
| `frontend-a11y` | Experiencia | axe, teclado, foco, etiquetas, contraste, movimiento reducido | FE-05..07, FE-04 |
| `rendimiento` | Experiencia | Lighthouse, Web Vitals, bundle, imágenes, consultas sin índice | FE-09..11, DAT-07 |
| `estetica-generica` | Experiencia | los 12 patrones prohibidos, tokens, estados de pantalla | FE-01..03, FE-12 |
| `seo-agentes` | Experiencia | títulos, meta, Open Graph, sitemap, robots, datos estructurados, contenido legible sin JS, `llms.txt` | CHK-SEO-* |
| `bases` | Bases técnicas | arquitectura y capas, migraciones e índices, manejo de errores, pruebas, CI, deploy, observabilidad, respaldos, stack desactualizado | BAS-ARQ, BAS-DAT, BAS-ERR, BAS-TEST, BAS-CI, BAS-OBS, BAS-BAK, BAS-DEPS |

Las tres notas **nunca se mezclan** en un solo número: una app bonita con datos expuestos no
"promedia" bien. Una nota cuyo auditor no corrió sale como "no auditado", nunca como 100.

## Script mide, modelo juzga
| Lo mide un script (determinista, ver `checks.md`) | Lo juzga el modelo (con evidencia) |
|---|---|
| Tablas sin RLS, políticas `using (true)` | Si la política es correcta para la matriz rol × recurso × acción de `seguridad.md` |
| `service_role` o secretos en `src/` y en `VITE_*` | Si una función con `service_role` verifica membresía antes de actuar |
| `npm audit`, lockfile presente | Si una dependencia sin vulnerabilidad conocida es riesgosa (abandonada, typosquatting) |
| Violaciones de axe, puntajes de Lighthouse, tamaño de bundle | Si el foco sigue un orden lógico, si los textos de error ayudan |
| Grep de `transition-all`, colores literales, `<img` sin tamaño | Si la interfaz cae en estética genérica (patrones 1–12 de `masterplan:kit-frontend`) |
| Headers con `curl -sI` | Si la CSP realmente protege o tiene `unsafe-*` innecesarios |

Todo hallazgo de script entra con `confianza: "establecida"`. El juicio del modelo entra como
`probable` (evidencia directa sin reproducir) o `especulativa` (sospecha); las especulativas se
reportan pero no restan nota.

## Tamaño de la auditoría
| Repo (archivos de código fuente) | Tier | Cómo |
|---|---|---|
| < 150 | ligero | 3 auditores: `masterplan:auditor-seguridad` (seguridad, rls, dependencias), `masterplan:auditor-frontend` (experiencia) y `masterplan:auditor-bases` (bases). Lectura completa |
| 150 – 1.000 | medio | Los mismos 3 auditores + checks completos; el modelo lee solo los archivos señalados por los checks y los de auth, datos, pagos y funciones |
| > 1.000 | grande | Un auditor por dominio en paralelo, cada uno con su lista de archivos; muestreo declarado en el informe ("revisadas 40 de 220 pantallas") |

Siempre se declara qué no se revisó.

## Proceso
1. **Checks deterministas.** Corre `checks.md` (lo que aplique al perfil). Guarda salidas en
   `masterplan/evidencia/auditoria/`. Un check que no pudo correr (no hay base local, no hay
   preview) se registra como "no verificado", nunca como aprobado.
2. **Auditores en paralelo, solo lectura.** Despacha en un solo mensaje los auditores del tier.
   Reciben rutas absolutas, `seguridad.md`, `DESIGN.md`, `EXPERIENCE.md` y las salidas de los checks.
   No editan archivos del proyecto. Cada uno escribe su array de hallazgos en
   `masterplan/auditoria/pendientes/<agente>.json` (formato `hallazgo.schema.json`).
3. **Verificador independiente.** Por cada hallazgo `critica` o `alta`, un agente distinto al que
   lo encontró intenta confirmarlo con su propia lectura o comando (reproducir la consulta,
   abrir el archivo en la línea, correr el test). Resultado: `verificado: true`, o
   `verificado: false` con la razón en `evidencia`, o se baja la confianza a `especulativa`.
   Medias y bajas se verifican por muestreo.
4. **Fusionar.** `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" auditoria fusionar`:
   - valida campos obligatorios y severidad; lo inválido va a "Descartados por formato";
   - deduplica por `regla + archivo + linea`; si se repite, gana la severidad mayor;
   - calcula las notas y escribe `masterplan/auditoria/<fecha-hora>.json` y `.md`;
   - mueve los pendientes a `masterplan/auditoria/procesados/`;
   - sale 1 si queda alguna crítica o alta, 0 si no.
5. **Reportar.** Muestra a la persona el `.md`: las notas auditadas, conteo por severidad, no verificados y
   los hallazgos críticos y altos con su arreglo propuesto.
6. **Arreglar con permiso.** Pregunta cuáles arreglar. Los arreglos los aplica **un solo**
   `masterplan:constructor` por vez, un hallazgo por commit, explicando el cambio. Luego se
   re-audita el dominio y `masterplan.mjs auditoria comparar` muestra cerrados, nuevos y los que siguen.

## Notas
Cada nota parte de 100 y resta por hallazgo no especulativo de su grupo:

| Severidad | Resta | Criterio |
|---|---|---|
| critica | 25 | Explotable hoy sin credenciales especiales o con cualquier cuenta: datos de otra org, secreto expuesto, cobro sin pago, tabla abierta |
| alta | 10 | Explotable con condiciones o daño serio a la experiencia: webhook sin dedupe, flujo principal no operable con teclado, LCP > 4 s |
| media | 3 | Debilidad que suma riesgo o fricción: header faltante, estado vacío pobre, imagen sin tamaño |
| baja | 1 | Higiene: texto genérico, dependencia desactualizada sin vulnerabilidad |

- **Seguridad** = dominios `seguridad`, `rls`, `dependencias`.
- **Calidad de experiencia** = `frontend-a11y`, `rendimiento`, `estetica-generica`, `seo-agentes`.
- **Bases técnicas** = `bases`.
- Si hay al menos una crítica en el grupo, la nota queda en **máximo 49**, sin importar el resto.
- Mínimo 0. Puerta de la fase 7: 0 críticas y 0 altas abiertas (no especulativas).

## Severidad con CWE y OWASP
Cuando aplique, el hallazgo lleva `cwe` y `owasp`. Referencias frecuentes:
| Hallazgo típico | cwe | owasp |
|---|---|---|
| Tabla sin RLS / acceso a datos de otra org | CWE-284 / CWE-639 | A01:2021 |
| Secreto en el bundle o en git | CWE-798 / CWE-200 | A02:2021 |
| SQL o filtro armado con texto del usuario | CWE-89 | A03:2021 |
| Webhook sin verificar firma | CWE-345 | A08:2021 |
| Función sin verificar JWT | CWE-306 | A07:2021 |
| Headers de seguridad faltantes | CWE-693 | A05:2021 |
| Dependencia con vulnerabilidad conocida | CWE-1395 | A06:2021 |
| Sin límite de uso en operación costosa | CWE-770 | API4:2023 |
| PII en logs | CWE-532 | A09:2021 |

## Honestidad
- "No verificado" es una respuesta válida y obligatoria cuando no hubo forma de probar.
- Nunca se declara "seguro"; se declara "sin hallazgos críticos ni altos en lo revisado", con la
  lista de lo revisado.
- Los secretos encontrados se enmascaran en la evidencia y se recomienda rotarlos, aunque se
  borren del código.

## Archivos que produce
```
masterplan/auditoria/pendientes/<agente>.json   arrays de hallazgos (entrada)
masterplan/auditoria/<fecha-hora>.json          informe fusionado con notas
masterplan/auditoria/<fecha-hora>.md            notas, "Qué arreglar primero" y todos los hallazgos
masterplan/auditoria/mapa.md                    Mapa del repo (modo auditor)
masterplan/auditoria/INFORME.md                 veredicto, riesgos en lenguaje de negocio y plan en olas
masterplan/auditoria/procesados/                pendientes ya fusionados
masterplan/evidencia/auditoria/                 salidas de los checks
```

## Trampas
- Auditar el código y no la base: las políticas viven en la base remota; corre los checks SQL contra ella.
- Contar dos veces el mismo problema con reglas distintas: elige el candado más específico.
- Subir la severidad por estilo. Crítica es explotable, no "feo".
- Dejar que el auditor arregle "de paso": rompe la regla de un solo escritor y la trazabilidad.
- Promediar las notas en un número para el cliente.
