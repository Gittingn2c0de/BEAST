UHHHH Don't Peak the porject is a mess, check the repo in March 2027.


# BEAST Creative Studio v1.1.0

Local-first creative studio for story development and still-first film production. Windows launch remains `npm run dv`.

## v1.1 replaceable image backend
- Removed the mandatory Hugging Face Inference API path and Hugging Face token fields.
- Added a configurable self-managed remote GPU worker adapter. The adapter accepts actual image bytes through a documented JSON contract and does not report success for text/error responses.
- Default image backend is unconfigured; no third-party image generation is called and no paid image inference is enabled by default.
- Your current laptop cannot realistically run modern photorealistic image/video diffusion locally. With zero budget and no accessible GPU worker, raster generation remains unavailable by design.
- Remote worker URL/token settings are stored locally. Saving a URL is not a connectivity test. AI video generation is still not connected; FFmpeg only assembles existing raster frames. See `GENERATION_BACKENDS_v1.1.md`.

## v1.0 interface + prompt pipeline
- Main studio UI restyled as a luminous sci-fi command deck with responsive navigation, cyan/ice/violet accents, instrument-like status and glass-dark panels.
- CANVAS accepts one unstructured raw source blob up to 100,000 characters; no separate title/section schema is required for prompt synthesis.
- Long sources above 18,000 characters are distilled into a compact faithful production context before prompt synthesis; the original text remains in the editor.
- Production 502 responses now include a diagnostic ID, stage and hint; the server terminal logs the correlated error. Check the terminal for the exact upstream failure.
- The browser `unload` permissions warning is not the cause of a server-side HTTP 502.

## Start
1. Install Node.js 18 or newer.
2. Extract this folder to a writable location.
3. Open Command Prompt in the folder and run `npm run dv`.
4. Add your Inception Labs API key in the local setup screen. The key is verified and stored locally in `workspace/settings.json`; do not share that file.
5. Open the studio. CANVAS is at `/canvas`; the new production workbench is at `/film`.

## What is implemented
- BEAST creative development, persistent projects, project chat, structured production package, Markdown/JSON export.
- Four original BEAST creative framework documents bundled as knowledge sources, plus the supplied Chappy/Supermusician profile.
- CANVAS prompt-to-SVG generation using Mercury 2.5, local SVG asset library, individual SVG export.
- Story-to-production planning endpoint that produces a structured shot list, continuity rules, image prompts, motion notes, sound plan, and QA gates.
- Film Assembly workbench: generate all planned frames sequentially, edit/reorder/remove timeline shots, set shot durations, load an optional soundtrack, render a WebM review video in-browser with gentle camera movement, export a JSON edit decision list and production plan.
- Local project data, no external video-generation jobs or paid media generation by default.

## Important scope boundaries
This remains a production MVP, not a complete autonomous feature-film studio. CANVAS raster generation now targets a configurable self-managed BEAST GPU worker. The worker is not bundled or tested; configure one only when you have a machine you control to run it. SVG remains for graphics and stylized fallback work. FFmpeg rendering runs as a persistent local-server job and creates an MP4 from raster frames; it does not animate character performances. The server must remain running while jobs execute. Character rigs, lip sync, image-reference conditioning, local diffusion runtime, Gaussian-splat/3D world engine, autonomous web research/rights verification, and executable Genjustsu integration are not yet implemented.

## API key and cost controls
Mercury calls require the user's own Inception Labs API key and may incur provider charges. The app does not automatically submit paid image/video generation jobs. Never commit or distribute `workspace/settings.json`.

## v0.7 unattended rendering and visual taste
- Film Assembly queues MP4 rendering on the local server through FFmpeg. The job continues if you close the browser tab, and its state is persisted in `workspace/jobs.json`. The server itself must remain running; closing the tab is safe, stopping the server or shutting down the PC is not.
- Server-side MP4 render currently requires raster image assets. SVG-only timelines are not silently misrepresented as photorealistic.
- CANVAS exposes the painting-derived taste profile and lets you choose direct expressionist output or photographic cinema with expressionist production design.
- See `VISUAL_LANGUAGE.md` for the format strategy and each creative framework's concrete responsibilities.

## Test
Run `npm test`.


## v0.7 raster-first production update

Earlier versions used the Hugging Face Inference API. In v1.1 this path is removed; editable SVG is retained as a graphic/stylized fallback and raster generation targets a configurable remote worker. Use **Synthesize prompt** to combine your brief and selected visual language into a detailed prompt, then select the image engine and generate. Under **Generation backend & visual language**, configure your self-managed worker URL and optional bearer token, then set palette/lens/continuity anchors and save. The token is stored in the local workspace settings file. The prompt system includes a reusable taste profile derived from the supplied paintings (expressionist linework, surreal symbolic collage, distorted mask-like faces, tactile marks, and saturated pigments). This is prompt-level direction, not pixel-level reference conditioning. Model access, availability, and charges depend on your Hugging Face account and selected model; test with a single frame before batch generation.

SVG remains valuable for UI, title cards, overlays, masks, stylized animation and compositing, but is not a photorealism engine. Raster and SVG frames can coexist in the asset library and still-film preview. Read `VISUAL_LANGUAGE.md` for the visual grammar and specialist hand-off rules.

**Note:** Hugging Face inference is not used by v1.1. The remote-worker adapter is replaceable; see `GENERATION_BACKENDS_v1.1.md`.


## v0.9 prompt QA and generation diagnostics

- CANVAS no longer overwrites the user's source brief when a prompt is compiled. The compiled prompt is retained separately for inspection and use.
- `POST /api/canvas/prompt-test` runs nine explicit regression checks against the compiled prompt: source brief, specificity, negative prompt, camera language, material/light response, continuity, shot design, photographic-vs-vector leakage, and positive/negative separation.
- The UI shows pass/fail chips with per-test detail. Failed checks recommend fixing the prompt before spending image-generation quota.
- Visual taste is now only injected as the full painting-derived grammar in the direct expressionist mode; photographic mode translates taste into production design without forcing a cartoon/illustration look.
- Raster generation requires an accessible self-managed GPU worker implementing the contract in `GENERATION_BACKENDS_v1.1.md`. A real image response must be saved before the UI reports success.

### First-frame troubleshooting

1. Open CANVAS → Image provider & visual language settings.
2. Enter a Hugging Face token with inference permissions and save it.
3. Confirm the model ID is currently served by the configured inference provider.
4. Run the prompt pipeline, then Run prompt checks, then Generate raster frame.
5. If generation fails, copy the complete `FRAME NOT GENERATED` message. HTTP 401/403 usually means token/access, 404 often means endpoint/model mismatch, 429 indicates quota/rate limit, and 503 can mean a model is loading or unavailable.


## CANVAS reliability patch (v1.1.1)

Prompt compilation now has a deterministic local fallback and does not require Mercury. This prepares prompts only; raster image generation still requires a configured self-managed GPU worker. SVG generation and other Mercury-backed creative features still require an Inception Labs API key. See `CHANGELOG_v1.1.1.md`.


## v1.2 — Offline Shot Graph

CANVAS now includes **Build offline shot graph**. This creates an inspectable, renderer-neutral coverage plan without calling a cloud model or requiring a GPU. Each shot carries its function, action, camera, composition, continuity anchors, visual-language settings, and a renderer payload; export the graph as JSON. This is a deterministic planning scaffold, not semantic AI analysis and not image/video generation. Review the plan before using it. See `CHANGELOG_v1.2.md`.


## v1.3 — Offline visual output

CANVAS now includes a local vector storyboard renderer that creates and saves four distinct editable 16:9 SVG frames from a supplied story brief without Mercury, Hugging Face, a GPU, or a paid inference service. The initial scene family is art-directed around coastal drama, domestic surveillance, interpersonal tension, and a human release beat; it is a visual prototype, not a photoreal diffusion model. Use **Generate 4 storyboard frames · offline renderer** in CANVAS.
