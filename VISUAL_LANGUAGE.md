# BEAST Visual Language v0.7

## The core correction
SVG is a format, not a universal image-making engine. It is excellent for typography, masks, diagrams, interface elements, titles, vector characters, graphic overlays, and deliberately stylized work. It is not a credible default for photorealistic feature-film frames. BEAST therefore uses **raster image generation as the default** and keeps SVG as an explicit fallback/specialist medium.

## Visual taste profile — based on the user's paintings
The provided paintings suggest a highly individual, expressionist/surreal visual grammar:

- Dense, energetic, imperfect black contour lines; visible pencil, brush, canvas and dry-media texture.
- Mask-like faces, oversized/staring eyes, distorted anatomy, open mouths, teeth, and expressive bodily forms.
- Hybrid symbolic imagery where people, houses, landscapes, instruments, anatomy and invented symbols collide.
- Deliberate asymmetry, crowded layered composition, interruptions, scribbles, unfinished areas and uneasy negative space.
- Pigment family: vermilion and oxide reds, ochre, dirty yellow, acid green, cyan/ultramarine, brown, chalk white and black.
- Emotional tone: psychologically charged, strange, human, raw, irreverent, tactile; not polished stock concept art.

This is a reusable **taste profile**, not a claim that the image model has learned the paintings or receives pixel-level image conditioning. In v0.7, the profile is expressed as prompt guidance. Reference-image conditioning requires a compatible image-to-image/reference adapter and is a separate next step.

## Two translation modes

### 1. Direct expressionist mode
Use the taste profile literally as an art direction: hand-painted marks, symbolic collage, distortion, mixed media, saturated pigment and naïve/surreal forms. The aim is not photorealism.

### 2. Photographic cinema with expressionist production design
Keep photographed people, believable anatomy, real materials and physical lighting. Translate the paintings into palette, set dressing, masks/props, production design, blocking, practical textures, framing and color grade. Do not accidentally instruct the model to draw cartoon faces if the selected goal is live-action realism.

## Prompt compiler responsibilities
- STORYTELLER: identify what the image must make the audience feel/understand and the dramatic beat it serves.
- FORMA: translate meaning into spatial hierarchy, silhouette, geometry, material, light, color, motion and negative space.
- Cinematic Intelligence Bible: specify shot size, lens behavior, exposure, motivated light, camera placement, depth and continuity.
- CANVAS: choose the renderer based on output properties: raster diffusion for photographic/painted images; SVG for editable vector graphics; later 3D/scene rendering for controllable spatial motion.
- Copyright & synthesis: preserve provenance, distinguish references from licensed source assets, avoid unlicensed asset reuse and living-artist imitation requests; describe visual attributes rather than copying a creator.
- BEAST QA: check story function, composition, character continuity, image quality, model/provider limits, cost approval and rights status.
- Chappy: author sound motifs and sound-to-picture intentions; does not pretend to render audio unless an audio backend is connected.

## Format strategy
- **Raster images (PNG/WebP):** photographic or painterly keyframes and generated visual assets.
- **SVG:** vector overlays, titles, masks, interface/graphic elements and intentionally stylized animation.
- **FFmpeg video (MP4/H.264):** deterministic assembly of still frames into a standard video; server-side rendering runs as a background job so the browser tab can close.
- **Future 3D scene / Gaussian splatting:** appropriate when BEAST needs camera freedom, spatial continuity and persistent environments. Gaussian splats are appearance representations, not automatically riggable, editable or physically simulated worlds.
- **Future image-to-video / Genjustsu:** specialist route for motion or replacement shots, behind explicit cost and review gates.

## Current limitation
v0.7 can produce genuine raster images only when the configured Hugging Face endpoint/model is compatible and credentials are present. It does not yet include an embedded local diffusion runtime, pixel-level painting reference conditioning, character LoRA/identity management, 3D character rigs, lip sync or a full NLE. A textual taste profile improves direction but cannot guarantee a specific visual result.
