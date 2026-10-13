# BEAST Creative Studio v1.1.1 — CANVAS reliability patch

## Fixed
- `POST /api/canvas/prompt-compile` no longer depends on Mercury 2.5 or a configured Inception Labs API key. It uses a deterministic local compiler that emits positive/negative prompts, shot design, continuity anchors, a rationale, and prompt QA flags.
- Long raw source blobs are handled without a remote summarization call. The local compiler uses the beginning and ending of very long input and explicitly marks the omitted middle; the original source remains in the browser UI.
- Prompt compile failures are returned as client-side input errors instead of being mislabeled as upstream 502 failures.

## Clarifications
- Local prompt compilation is not generative AI and does not create an image. It is a dependency-free prompt preparation fallback.
- `POST /api/canvas/generate-image` correctly returns HTTP 503 while no self-managed GPU worker is configured. This is an expected unavailable state, not proof of a worker failure.
- SVG generation still calls Mercury 2.5 and therefore still requires its API key; this patch does not claim to make every creative-model route offline.
- The browser `unload` permissions-policy warning is unrelated to these API errors and is not changed by this patch.

## Verification
- Node syntax check passed.
- Automated tests: 16/16 passed.
- HTTP smoke test: local prompt compile returned 200 without an API key; image generation returned the expected 503 with a clear no-worker diagnostic.
- No real image generation was performed.
