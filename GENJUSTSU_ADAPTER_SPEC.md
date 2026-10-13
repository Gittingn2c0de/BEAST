# Genjustsu Adapter — integration contract (not executable yet)

**Upstream:** https://github.com/sirioberati/Genjustsu-Open-Source-Workflow  
**Role:** Optional subject/object replacement workflow. Genjustsu is not the BEAST orchestrator and does not replace story, visual, audio or production intelligence.

## Proposed interface

`prepare(job) -> PreparedJob`
- validates source media and target brief;
- creates normalized clip, depth/mask/reference artifacts as configured;
- reports dependencies and whether the runtime is available;
- returns artifact paths, hashes, duration, frame rate, dimensions and review previews.

`approve(preparedJobId, artifactHashes, approvalRecord) -> Approval`
- rejects approval if any artifact hash has changed;
- records reviewer, timestamp, selected settings and maximum authorized spend.

`execute(approvedJobId) -> GenerationJob`
- verifies approval and spend cap again immediately before provider submission;
- returns provider job ID and status; never exposes API secrets to browser UI.

`collect(jobId) -> ResultManifest`
- records actual output paths, hashes, provider metadata, cost if available, errors and validation findings.

`validate(resultManifest) -> QAReport`
- checks file existence/readability, duration, dimensions, fps, audio policy, and required human mask review;
- does not claim perceptual quality is validated merely because the file decodes.

## Non-negotiable gates

1. Source clip remains untouched.
2. Human mask/segmentation review is required before paid generation.
3. Paid draft generation requires explicit approval; HD/final generation is a separate approval.
4. The final audio policy must be explicit. If preserving source audio, verify that it is actually restored.
5. Upload destinations and third-party processing are disclosed before the clip leaves the machine.
6. Provider credentials are local/server-side only; never put them in prompts, exports, or browser JS.
7. If dependency/runtime checks fail, return `unavailable` and explain how to fix it.

## Platform note

Upstream documentation describes a workflow with external dependencies and advises Windows users to use WSL2. The current BEAST app's one-command launcher does not install or configure these dependencies. A future installer can check prerequisites and offer a separate setup path, but must not silently install system packages or launch paid generations.

## Current state

Specification only. No Genjustsu code is vendored or invoked by this release. This is intentional until a pinned upstream revision can be reviewed and tested in an isolated environment.
