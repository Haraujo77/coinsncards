# Disks Composer (three.js)

Aplicativo web interativo para gerar composições 3D usando apenas **discos finos (tipo moedas)** com `three.js` + `InstancedMesh`.

## Rodar

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal.

## Recursos

- `InstancedMesh` (sólido e outline/wireframe) para muitas instâncias
- Distribuições: grid, círculo, anel, losango, cubo, esfera, casca esférica, espiral, cilindro/helix, toro
- Stagger / rotação progressiva por: índice, linha/coluna/camada, distância ao centro, gradientes XYZ, radial, noise, seno
- Colisão (aproximação por esfera): `off`, `prevent` (auto spacing por escala), `resolve` (relaxation)
- Presets em JSON (`src/app/presets.js`)
- Export PNG em alta resolução (multiplicador)

## Estrutura

- `src/app/distributions.js`: geração das distribuições
- `src/app/stagger.js`: peso do stagger (gradientes/ruído/curvas)
- `src/app/collision.js`: prevenção/resolução de overlaps (broadphase via spatial hash)
- `src/app/instancing.js`: criação/atualização de matrizes do `InstancedMesh`
- `src/app/exportPng.js`: export PNG hi-res
- `src/app/ui.js`: UI (`lil-gui`)

