# BEAST Roadmap — staged, cost-aware

## Stage 0 — Local creative studio (current)
- One-command launch after Node.js installation: `npm run dv`.
- Mercury 2.5 connection wizard.
- Four film/visual/narrative source frameworks.
- Selectable BEAST and Chappy specialist chat profiles.
- Local projects and Markdown/JSON exports.
- No media provider calls and no paid generation.

## Stage 1 — Agent runtime and job ledger
- Replace ad-hoc calls with typed task records and a persistent job state machine.
- Add retries, cancellation, timeouts, structured logs with secrets redacted, and crash recovery.
- Keep a manifest for every artifact, including source hash, provider/model, prompt, timestamps, cost estimate/actual and QA state.
- Add project-level budgets and explicit approval tokens before any billable or external operation.

## Stage 2 — Research and asset scouting
- Add a source-backed research tool with citations and an asset registry.
- Prioritize public-domain, permissively licensed, user-owned, or specifically licensed sources.
- Save attribution and license notes; distinguish facts, interpretation and unverified leads.
- No autonomous account login, posting, or bulk scraping. Search and download remain separate permissions.

## Stage 3 — Still-first animation pipeline
- Shot cards and storyboard grids.
- Reference sheets and continuity constraints for characters, props and locations.
- Keyframe/still generation adapter selected by user.
- Timeline assembly using pans, zooms, parallax, compositing, limited animation and interpolation.
- Audio beds and original score workflow via Chappy's planning profile; actual audio rendering remains a separate adapter.
- Render low-resolution previews locally before expensive operations.

## Stage 4 — Provider-neutral video generation
- Adapter contract for one or more image-to-video/video generation providers.
- Show duration, resolution, provider, estimated cost and data destination before dispatch.
- Separate draft and final/HD approvals; no automatic spend escalation.
- Validate outputs and record provenance. Add a free/open-weight model only if hardware and license make it practical.

## Stage 5 — Genjustsu specialist integration
- Pin an upstream commit/version and inspect its scripts, dependencies and license boundaries.
- Run in an isolated process/container/WSL2 environment; don't assume native Windows support.
- Build media preparation and mask-review screens; approvals must be hash-bound to exact inputs.
- Add paid-provider gate, audio restoration policy, cancellation and export validation.
- Keep feature disabled until setup and an end-to-end test succeed. Test in dry-run mode first.

## Stage 6 — Supervised agentic coordination
- BEAST decomposes tasks; specialist agents return structured artifacts.
- Parallelize independent research/storyboard tasks, serialize dependent media operations.
- Add conflict resolution, citation checks, continuity QA and human review queue.
- Browser access begins read-only. Any account access is opt-in, narrowly scoped, revocable and logged.

## Acceptance criteria before calling it autonomous
- Can resume after a crash without duplicating paid jobs.
- Never spends beyond a configured budget.
- Never treats a prompt as proof that media exists.
- Every output is inspectable, traceable to inputs and independently validated.
- All paid generation, third-party uploads and final delivery have explicit approval gates.


## Hosting / cost note for future video models
Hugging Face is a useful discovery and experimentation surface, but do not plan on unlimited free video generation. Its current Inference Providers pricing page lists a small monthly free-user credit (currently $0.10, subject to change); other usage can be pay-as-you-go. Some ZeroGPU Spaces provide limited daily GPU quotas, but queueing, availability, quotas and model-specific terms vary. Open-weight models can avoid per-generation provider fees when run locally, but still require suitable GPU memory, storage, power and setup time. Treat any “free” hosted model as a capped experiment until its live quota, license, privacy terms and output rights are verified.

## v0.6 implementation update

Implemented in the application: visual-language fields (look, palette, lens, lighting/grain/continuity), prompt synthesis endpoint, selectable SVG versus Hugging Face image rendering, local raster asset persistence, and mixed SVG/raster frame display and WebM preview assembly. Image provider credentials are stored in the local workspace settings file and are never sent to Mercury. This is an opt-in provider adapter, not a bundled image model.

Next production-critical work: test and support a local ComfyUI adapter for in-house GPU generation; use reference-image conditioning/IP-Adapter or equivalent for character identity; store per-character reference sheets and locked seeds; add layer extraction/alpha mattes; move film rendering from browser MediaRecorder to an FFmpeg-backed deterministic renderer with audio mixing; add job queue/retry/progress and cost confirmation; add a real copyright/provenance ledger and human release gate. Keep vector animation and raster-frame cinematography as complementary paths.
