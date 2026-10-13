# BEAST Creative Studio — Updated Architecture (0.3)

## Current executable architecture (0.4)

- **BEAST / Mercury 2.5** — default creative director and orchestrator for story, visual grammar, production planning, continuity, and adversarial QA. The four supplied frameworks remain the governing creative sources.
- **Chappy / Supermusician (File 1 only)** — a selectable specialist prompt profile routed through the same Mercury 2.5 connection. Use it for composition, score, sound design, sonic identity, production analysis, and music-to-picture questions. This is not a second model/provider, and the uploaded source explicitly says File 2 is needed for its continuous-learning layer; File 2 has not been supplied or implemented.
- **Project store** — local JSON persistence for project briefs, outputs, chat history and generated SVG assets.
- **CANVAS / SVG sculptor (active)** — Mercury 2.5 authors self-contained 1280×720 SVG frames from prompts; server validates basic active/external-content hazards, persists SVG source, and exposes a local frame library. The browser artboard previews and exports SVG.
- **Still-film preview (active, limited)** — browser `MediaRecorder` assembles saved SVG stills into a WebM sequence with slow camera movement. This is an animatic/still-film workflow, not character animation, audio post, or a cinema master.
- **Media engines** — no image/audio/video renderer is connected in this release. The app must never claim that a planned or prompted asset has actually been generated.

## Specialist-agent contract

Agents are capabilities behind a common interface, not independent authorities. Each should declare: `id`, `purpose`, `input schema`, `output schema`, `provider`, `cost class`, `network/data permissions`, `status`, `timeout`, and `validation rules`. BEAST remains responsible for routing, shared project context, dependency order, conflict resolution, user approvals, and final QA. Specialist output is a proposal until validated.

Recommended future execution pattern:

1. **Plan** — BEAST decomposes the brief into typed tasks and dependencies.
2. **Dispatch** — route each task to the narrowest suitable specialist; run independent research tasks in parallel only when safe.
3. **Validate** — schema-check outputs, provenance-check sourced claims/assets, run continuity checks, and mark uncertainty.
4. **Review** — user approves creative direction, rights-sensitive material, and any paid generation.
5. **Execute** — invoke a media adapter only after required inputs and approvals are present.
6. **Inspect** — validate actual output files, frame continuity, audio sync, technical specs, and requested creative intent.
7. **Commit** — preserve source assets and approved deliverables separately, with a manifest and hashes.

## Proposed future brains and engines

| Capability | Status | Responsibility |
|---|---|---|
| BEAST / Mercury 2.5 | Active | Main creative orchestration and film-production planning |
| Chappy / Supermusician | Active profile, limited | Musical composition, production, score and sound design; File 1 only |
| Research & asset scout | Planned | Search the web, gather references and candidate assets, record source/license/attribution, and prepare prompts/briefs; cannot autonomously publish or use accounts by default |
| Genjustsu adapter | Specification only | Optional specialist subject/object replacement workflow; not the whole studio and not wired to execute jobs yet |
| Framecraft / image-to-motion | Planned | Turn approved stills into motion using keyframes, camera moves, interpolation, compositing, and edit assembly |
| CANVAS SVG sculptor | Active, vector-only | Prompt-to-SVG frame authoring, local asset library and storyboard batch; not diffusion/photoreal generation |
| Diffusion image generation adapter | Planned | Optional image-model provider for painterly/photoreal frames and references |
| Video generation adapter | Planned | Provider-neutral API for short motion shots, with explicit cost/permission gates |
| Audio generation / DAW bridge | Planned | Score stems, ambience, SFX and mix workflows; must preserve music licensing and project stems |

## Coordination and safety principles

- **One coordinator, specialist workers.** Do not create a swarm of agents that all independently rewrite the same package. BEAST owns task state and merge decisions.
- **Typed artifacts, not chat-only handoffs.** Store briefs, shot specs, prompts, source URLs, mask approvals, generation IDs, and QA results as structured project artifacts.
- **Human approval at irreversible boundaries.** Explicit approval is required before paid jobs, HD/final jobs, uploads to third-party services, account actions, public posting, or overwriting source media.
- **Budget enforcement before provider calls.** Show provider, estimated cost when available, resolution, duration, and job count. Hard-stop if estimates exceed the user-set cap. Never infer that “draft” means free.
- **Least-privilege credentials.** Store keys locally outside browser code, redact logs, and scope account tokens to the minimum needed. Never request secrets in chat.
- **Provenance and rights.** Every researched or generated asset should carry source URL/provider, retrieval/generation time, license/permission notes, attribution, and intended use. Do not bypass paywalls, access controls, or site terms.
- **Reproducibility.** Record input hashes, prompts, model/provider versions, settings, and output hashes for every generation.
- **No false completion.** A task is complete only after the resulting artifact exists and passes validation, not when a model returns a plausible description.

## Future web research and asset scout

The planned browser/research brain should work in two phases. First it creates a source-backed research packet (reference links, visual motifs, period/cultural details, candidate public-domain/appropriately licensed media, rights confidence, and an asset gap list). Second, after review, it may create generation prompts or download only assets whose source and license terms permit the intended use. It should not silently scrape arbitrary footage, impersonate users, log into accounts, or upload project materials to unknown services. Keep browsing separate from asset acquisition and separate again from paid generation.

## Still-image / traditional animation strategy

This is a credible cost-control path, not a compromise by definition. Use an animation-first pipeline where motion generation is expensive or unpredictable:

1. Lock the script, shot duration, blocking and camera plan.
2. Create a storyboard and visual bible; generate a small number of approved keyframes per shot.
3. Keep character/prop/location references and seed/prompt metadata to improve continuity.
4. Create motion with 2D pans/zooms, parallax layers, masks, puppet/rig deformation, limited animation, pose-to-pose keyframes, or optical-flow/interpolation tools as appropriate.
5. Use short image-to-video generations only for shots where genuine motion materially improves the result.
6. Assemble the shots on a timeline; add original score, licensed/created SFX, dialogue, and transitions.
7. Run continuity and technical QA, then render the final film.

A practical hybrid target is **still-first, motion-selective**: most shots are designed as illustrated/animated compositions, with expensive generative video reserved for hero moments. This yields repeatable framing and easier continuity, but requires deliberate motion design and can look static if timing, staging, parallax, and sound are weak.

## Genjustsu integration decision

Treat [Genjustsu Open-Source Workflow](https://github.com/sirioberati/Genjustsu-Open-Source-Workflow) as an optional **specialist adapter** for subject/object replacement, not as BEAST's central orchestration layer. Its documented workflow involves depth estimation, segmentation masks, visual mask review/approval, an external generation service, and restoration of original audio in the final export. It has separate dependencies and external service credentials; it is not a one-command native Windows engine today. The integration must remain disabled until dependencies, provider access, privacy, cost and output-validation requirements are configured.

Adapter boundary:

- Input: approved source clip, target replacement brief/reference, audio policy, output settings, and user-approved spend limit.
- Preparation: normalize media, derive depth/masks/references, create a reviewable preview, and bind approval to the exact artifact hashes.
- Gate: do not submit any paid remote generation until a human approves the prepared artifacts and cost.
- Execute: invoke Genjustsu using a documented, version-pinned integration (prefer a separate process/service rather than importing its internals into BEAST).
- Verify: confirm output exists, duration/frame rate/resolution are valid, mask review is approved, original audio policy was applied, and the result can be opened.
- Deliver: retain original clip, prepared intermediates, generated draft, final export, and manifest separately.

If the upstream project changes, credentials are missing, or its dependencies cannot be installed, the adapter should report `unavailable` rather than pretending the job ran.

## Release status

This release activates two prompt profiles over one Mercury provider (BEAST and Chappy) and documents future engines. The Research agent, Genjustsu execution adapter, image generation, image-to-video, audio rendering, timeline editor, account automation and autonomous job orchestration are **not implemented**.


## Hugging Face and “free” video generation
Use Hugging Face as a model catalog and optional inference route, not as a promise of unlimited free generation. Its published pricing currently lists a small free-user monthly credit for Inference Providers and pay-as-you-go beyond that; some ZeroGPU Spaces have limited daily quotas and queues. Those limits and provider availability can change. A self-hosted open-weight model removes the per-call provider bill only if the user already has or supplies suitable compute; it does not make compute cost, setup, licensing, or storage disappear. Before adding any model, verify current task support, license, commercial-use terms, VRAM needs, privacy/data routing, and the actual cost/quotas.

## v0.6 — Multi-engine visual language and synthesis

### Visual authority and specialist hand-off

- **STORYTELLER** owns narrative truth, character want/obstacle/choice/consequence, subtext, cultural context, and the emotional reason for a shot.
- **FORMA** translates narrative state into composition, material, light, motion, and layered render logic; SVG is one renderer, not the universal image format.
- **CANVAS** owns visual-language presets, shot prompt compilation, asset metadata, and renderer selection. It may target SVG, diffusion image providers, layered compositing, or later video models.
- **Copyright / provenance review** (required gate) checks reference provenance, likeness permissions, source licenses, model terms, and whether a generated asset is cleared for the intended distribution. It should not invent legal clearance; unresolved items remain review-gated.
- **Synthesis** resolves disagreements among STORYTELLER, FORMA, CANVAS, and cinematic direction. Narrative meaning and approved cultural facts outrank decorative style; visual continuity outranks one-off prompt flourish; provider-specific prompt syntax is generated only after the visual brief is locked.
- **BEAST** orchestrates the hand-offs and preserves approvals, project memory, continuity anchors, cost limits, and final QA.

### Renderer strategy: both vector and raster

Do not force the whole production into SVG. SVG is appropriate for graphic design, interface overlays, titles, set extensions, simple rigs, masks, and stylized animation. Photographic raster frames should come from a genuine diffusion/image model. The film timeline should be renderer-agnostic: each shot references an asset, duration, motion instructions, sound cues, continuity anchors, and review state. SVG and raster assets can coexist in the same sequence.

### v0.6 implementation boundary

The visual lab now exposes: (1) Mercury-based prompt synthesis, (2) saved project visual-language parameters, (3) SVG renderer, and (4) optional Hugging Face Inference image adapter with locally stored token/model configuration. Image-provider availability and pricing depend on the selected model/account. The adapter is not proof that a particular model is enabled; users must test it. No paid image generation is triggered by installing or launching BEAST. Photographic character consistency remains an art-direction/review problem, not something guaranteed by a prompt alone.
