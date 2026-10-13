# BEAST Creative Studio v0.8

## Fixes and changes
- Reworked CANVAS into a dark, high-contrast creative workstation with responsive panels, status states, visual hierarchy, and a dedicated prompt-injection observability panel.
- Prompt synthesis now returns an explicit stage trace showing STORYTELLER, FORMA, Cinematic Intelligence, CANVAS, Copyright & Synthesis, and adversarial prompt QA contributions.
- Added structural prompt checks for positive prompt specificity, negative prompt presence, continuity anchors, shot design, and style rationale.
- Added local prompt regression checks for camera/capture cues, negative prompt, continuity section, and avoiding an SVG-as-photoreal fallback.
- Generation errors are now explicit in the UI. Storyboard generation stops at the first failed frame, preserves successful earlier frames, and reports the exact completed count instead of silently appearing to finish.
- Improved Hugging Face provider errors with actionable advice about model availability, token access, and quota.
- Bumped app version to 0.8.0.

## Important
The prompt trace is an inspectable orchestration contract, not proof that each framework is a separate autonomous model. Image generation still requires a valid Hugging Face token and a model currently supported by the configured inference endpoint. No frame is fabricated when the provider fails.
