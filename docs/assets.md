# Recursos visuales

## Fondo original

Archivo: `public/art/coastal-sunset.webp` (1024 × 1536; aproximadamente 233 KiB).

Creado con la herramienta integrada de generación de imágenes (`image_gen`); después convertido a WebP para incluirlo en el proyecto. El fondo se carga localmente. No se han añadido imágenes, personajes, música ni logotipos del juego de referencia.

Prompt utilizado:

> Use case: stylized-concept. Create a premium original background artwork for a mobile personal-missions app inspired by GTA VI's tropical coastal atmosphere. Portrait 1024x1536. Cinematic illustrated realism, lush palm silhouettes in foreground left and right, an oceanfront boulevard receding toward a small distant Miami-inspired skyline, sunset peach coral sky with dusty pink clouds and deep plum shadows, turquoise ocean and tiny warm building lights. Atmospheric, sophisticated, very rich color and painterly detail like a high-end videogame key art environment. Strong depth with dark foreground and radiant horizon. Upper 40 percent mostly open sky for interface text, lower 25 percent dark palms/road for interface controls. No people, no characters, no guns, no cars as main subject. No text, no letters, no logos, no watermark, no UI. The entire image is one continuous environment, not a collage.

## Fuentes

Anton para titulares y DM Sans (400, 500, 600, 700 y 800) para controles y lectura. Archivos locales en `public/fonts/`. Licencias OFL adjuntas en ese mismo directorio, procedentes del repositorio de Google Fonts. La app no solicita fuentes a terceros al abrirse.

## Animaciones

`src/animations.css` contiene únicamente la base y `fadeInDown`, `fadeInRight`, `fadeInUp` y `zoomIn` de Animate.css 4.1.1, con su atribución MIT. Las transiciones de vistas usan la dependencia Motion ya presente en el proyecto. Los movimientos ambientales, radar, temporizador y confeti están en CSS y se pueden desactivar desde Ajustes o mediante la preferencia de reducción de movimiento del dispositivo.

Se conserva el sistema Lucide y los iconos instalables originales de la aplicación.
