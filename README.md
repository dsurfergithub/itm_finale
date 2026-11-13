# Into The Mission · Coastal Edition

Una app de misiones personales diseñada exclusivamente para móvil. Atardeceres, costa, tipografía expresiva y una interacción más libre: elige una misión deslizando y entra en una vista de concentración.

## Qué incluye

- Inicio con una misión protagonista, navegación por gestos y botones alternativos.
- Misiones de inicio listas para usar; creación y edición individual, filtros, búsqueda y archivo.
- Misiones puntuales o recurrentes: diarias, de lunes a viernes o semanales. La repetición se programa al completar o fallar la misión, sin generar una pila de tareas atrasadas.
- Temporizador con fecha de finalización persistida. Al volver de otra app o recargar, se recalcula el tiempo real. Pausar conserva los segundos pendientes. La aplicación no emite avisos en segundo plano ni necesita ejecutarse mientras está cerrada.
- Créditos, respeto, rangos, recompensas personales, bonus diario y reducción de estrellas.
- Reglas de penalización independientes: activar, desactivar, editar o añadir tareas reales que se activan cada cierto número de fallos o estrellas ganadas. Una tarea ya activada conserva su nombre aunque se edite o elimine la regla.
- Consecuencias pendientes con confirmación manual de cumplimiento. Cumplir una consecuencia no otorga créditos ni permite evitar otra consecuencia pendiente.
- Penalización por borrar/rechazar, estrellas por fallo, pérdida de respeto, límite y confiscación configurables. Por defecto, borrar o rechazar no penaliza.
- Rachas por días locales con misiones completadas; actividad semanal registrada por fecha. Varias misiones el mismo día no multiplican la racha.
- Historial con tipos distintos para misiones, compras, bonus y consecuencias.
- CSV con campos entrecomillados, comas, punto y coma y validación completa antes de importar.
- Copia y restauración JSON con validación de los datos incluidos.
- Fuentes y arte locales, transiciones, paneles inferiores, radar, números animados y celebración. Movimiento y sonido configurables; se respeta la reducción de movimiento del sistema.
- Manifest y caché offline de producción, sin dependencias de red para fuentes o imágenes. Tras la primera carga e instalación de la caché se puede volver a abrir sin conexión. Se requiere HTTPS o localhost para instalar el service worker.

## Ejecutar

Node.js 20 o superior.

```bash
npm ci
npm run dev
```

```bash
npm test       # Casos de temporizadores, reglas, rachas, migración y CSV
npm run lint   # TypeScript
npm run build  # Build y precaché offline con versión por contenido
npm run preview
```

El despliegue conserva la ruta raíz `/`, como la versión anterior. Se puede publicar `dist/` en un alojamiento estático. La pantalla se mantiene en un ancho máximo de 520 px si se abre en un ordenador.

## Guardado y actualización

El estado sigue en `localStorage.itm_state`. La migración conserva misiones, recompensas, categorías, saldos, historial y totales de la versión anterior. La copia previa a la migración se conserva también en `itm_pre_v2_backup` y se puede descargar desde Ajustes. Los datos ilegibles se conservan en `itm_recovery_backup` para recuperarlos, sin intentar modificarlos.

La antigua “racha” contaba misiones y no días: se conserva en `legacyStats`. La racha diaria y el gráfico por fecha comienzan con esta versión; no se inventan fechas para los eventos antiguos. Un temporizador antiguo sin fecha de finalización se retoma con los segundos que había guardado: no se puede reconstruir el tiempo transcurrido antes de la actualización. Los nuevos temporizadores sí tienen fecha persistida.

Las reglas usan totales acumulados de fallos o estrellas ganadas desde la actualización; reducir las estrellas pendientes no reduce ese total. Una regla de “cada 3 fallos” se activa en 3, 6, 9… Las reglas nuevas no añaden consecuencias retroactivas.

El bonus se incluye en las copias nuevas y solo se puede reclamar una vez por fecha local. Todo el sistema funciona en este dispositivo: no hay cuentas, sincronización entre dispositivos ni comprobación externa del cumplimiento de tareas.

## Verificación y recursos

- [Pruebas y revisión móvil](docs/verification.md)
- [Procedencia del arte, fuentes y animaciones](docs/assets.md)
