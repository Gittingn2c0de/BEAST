# v1.1.0 — Replaceable generation backend

- Removed the Hugging Face Inference API dependency and settings controls.
- Added a configurable self-managed remote GPU worker adapter with a documented JSON/image-byte contract.
- Added explicit HTTP 503 when raster generation is requested without a configured worker.
- Added worker URL validation, optional bearer authentication, bounded payload size, accepted MIME checks and honest error handling.
- Updated Film Assembly to check the new worker capability rather than the retired Hugging Face provider.
- Documented the zero-budget limitation: no GPU worker is provisioned by this package, and AI video generation remains disconnected.
- Validation: 14/14 Node tests pass; server syntax check passes; HTTP smoke test confirmed health/provider endpoints and expected HTTP 503 for image generation with no worker configured.
- Not validated: live generation against a remote GPU worker (none was available/configured).
