# BEAST Creative Studio v1.2.0

## New: offline BEAST Shot Graph

- Adds `POST /api/canvas/shot-plan`, a local planning endpoint that turns a brief into a structured multi-shot coverage scaffold.
- Each shot includes narrative function, action guidance, camera, composition, shared visual language, continuity anchors, and a renderer-neutral prompt payload.
- Adds a CANVAS control to inspect the shot graph and export it as JSON.
- The route does not call Mercury, Hugging Face, a GPU worker, or any paid inference API.
- The implementation is explicitly a deterministic planning scaffold, not semantic AI story analysis and not image/video generation. Human review is required.

## Existing behavior

- Local deterministic prompt compilation remains available without Mercury.
- Raster generation remains unconnected unless a renderer/worker is configured; no placeholder image is fabricated.
- AI video generation is not connected. FFmpeg assembly remains a still-frame preview workflow.

## Verification

- `node --check server.mjs`
- `node --test`
- Live HTTP smoke test for shot-plan endpoint: see delivery notes.


## v1.3 implementation note

Added `POST /api/canvas/generate-local-storyboard`, a deterministic local SVG scene renderer. It persists four editable frames to the asset library and updates CANVAS to use that path for offline storyboard creation. This produces actual vector visuals, not just a shot plan; it does not claim photorealism or learned semantic understanding.
