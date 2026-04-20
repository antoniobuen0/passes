# passes

Dashboard de ranking con login previo y despliegue en GitHub Pages.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS + componentes base estilo shadcn/ui
- Framer Motion
- Three.js + React Three Fiber
- Shader GLSL (raymarching + caustics)
- WGSL/WebGPU opcional para capa visual del hero (si el navegador lo soporta)

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
