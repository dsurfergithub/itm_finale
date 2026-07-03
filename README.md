# Into The Mission

Into The Mission es una app gamificada para transformar objetivos personales en misiones con tiempo, recompensas, progreso, rachas y un mercado de recompensas.

Esta iteración propone una dirección visual de ciudad costera nocturna, neón, HUD de misión, mapas de distrito y estética arcade, sin usar logos, nombres, música, personajes ni recursos protegidos de franquicias existentes.

## Funcionalidades actuales

- Gestión de misiones con dificultad, ubicación, duración, recompensa en créditos y respeto.
- Activación, verificación, finalización y fallo de misiones.
- Ruleta/escáner para seleccionar misiones aleatorias.
- Progreso por categorías.
- Sistema de respeto, créditos y estrellas de penalización.
- Tienda de recompensas y bonus diario.
- Registro de actividad.
- Backup y restauración local.
- Importación CSV de misiones.

## Ejecutar en local

**Requisitos:** Node.js 20 o superior recomendado.

```bash
npm install
npm run dev
```

Para comprobar tipos:

```bash
npm run lint
```

Para generar build de producción:

```bash
npm run build
```

## Variables de entorno

El proyecto incluye dependencias preparadas para futuras funciones con IA. Si se añade generación de misiones con Gemini, configura `GEMINI_API_KEY` en `.env.local`.

## Dirección de producto

Próximas mejoras sugeridas:

1. Vista de mapa con distritos por categoría.
2. Generador de misiones con IA a partir de objetivos reales.
3. Cadenas de misiones y mini-campañas.
4. Sistema de penalización más dinámico.
5. Feed de eventos tipo archivo, rumor o noticia interna.
6. Modo PWA/offline y sonidos originales adicionales.
