# passes

Dashboard de ranking con login previo y despliegue en GitHub Pages.

## Qué incluye

- Login previo
- Edición manual de km y pasos para cualquier miembro del equipo
- Ranking actual, simulador y proyección de cierre
- Despliegue automático en GitHub Pages

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy automático (GitHub Pages)

El workflow [deploy-pages.yml](.github/workflows/deploy-pages.yml) publica la carpeta `dist` en Pages al hacer push a `main`.

URL publicada:

- https://antoniobuen0.github.io/passes/
