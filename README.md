# Into The Mission

Into The Mission convierte tus objetivos personales en misiones con tiempo y recompensa. Cada misión completada construye un distrito de tu ciudad costera ilustrada, y los créditos se canjean por recompensas reales que tú eliges.

La identidad visual es original: una ciudad costera al atardecer (berenjena oscuro, crema, coral, rosa y turquesa), títulos condensados y escenas ilustradas en SVG. No usa logos, nombres, música, personajes ni recursos de franquicias existentes.

## Pantallas

- **Hoy**: misión en curso con temporizador, misión principal, dos o tres tareas secundarias, siguiente desbloqueo, ahorro para una recompensa, bonificación diaria y recuperación de racha.
- **Misiones**: búsqueda y filtros (estado, distrito, duración), menú de acciones táctil (editar, duplicar, reprogramar, principal, archivar, eliminar), deshacer, escáner por tiempo, energía y lugar, y campañas con pasos que se desbloquean en orden.
- **Ciudad**: panorámica de la costa; cada distrito crece con las misiones completadas y tiene un objetivo semanal («3 de 5 sesiones esta semana»). Cada rango añade un elemento nuevo a la ciudad.
- **Mercado**: recompensas reutilizables o de un solo uso, objetivo de ahorro e historial de canjes.
- **Perfil**: rango, rachas, actividad semanal, historial filtrable y ajustes (modo de juego, días de descanso, sonido, copias de seguridad, importación CSV con vista previa, demostración y reinicio).

## Reglas

- La racha cuenta **días** con al menos una misión completada; los días de descanso no la rompen.
- El temporizador guarda el inicio y el tiempo acumulado, así que sigue contando con la app cerrada.
- Eliminar o reorganizar misiones nunca penaliza. Los modos Relajado, Estándar y Exigente definen qué pasa al no lograr una misión.
- Los datos se guardan en el dispositivo (`localStorage`). El progreso de la versión anterior se migra automáticamente y se guarda una copia del original en `itm_state_v1_backup`.

## Ejecutar en local

**Requisitos:** Node.js 20 o superior.

```bash
npm install
npm run dev      # servidor de desarrollo
npm run lint     # comprobación de tipos
npm test         # pruebas de racha, temporizador, migración y CSV
npm run build    # build de producción (incluye service worker para uso sin conexión)
```

## Formato CSV

`NOMBRE, DIFICULTAD, UBICACION, DURACION_MINUTOS, RECOMPENSA_CASH, RECOMPENSA_RESPETO, CATEGORIA, RECURRENCIA`

Se aceptan comas o punto y coma y campos entre comillas. Si faltan las recompensas se calculan automáticamente. `RECURRENCIA` puede ser `DIARIA`, `SEMANAL` o vacía.
