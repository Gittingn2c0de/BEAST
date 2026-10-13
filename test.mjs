import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
test('package scripts expose the requested one-command launch', () => {
  const p = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.equal(p.scripts.dv, 'node server.mjs');
  assert.ok(p.engines.node.startsWith('>='));
});
test('all four supplied creative frameworks are bundled', () => {
  for (const f of ['BEAST.md','CANVAS.md','CINEMATIC_INTELLIGENCE_BIBLE.md','FORMA_STORYTELLER.md']) {
    const full = path.join(root,'knowledge',f); assert.ok(fs.existsSync(full), `${f} missing`); assert.ok(fs.statSync(full).size > 1000, `${f} unexpectedly small`);
  }
});
test('Chappy specialist profile and future engine contracts are bundled', () => {
  assert.ok(fs.existsSync(path.join(root,'knowledge','CHAPPY_SUPERMUSICIAN_FILE1.md')));
  assert.ok(fs.readFileSync(path.join(root,'server.mjs'),'utf8').includes("pathname === '/api/brains'"));
  for (const f of ['ARCHITECTURE.md','GENJUSTSU_ADAPTER_SPEC.md','ROADMAP.md']) assert.ok(fs.statSync(path.join(root,f)).size > 1000, `${f} missing or too small`);
  assert.ok(fs.readFileSync(path.join(root,'public','index.html'),'utf8').includes('Chappy · Music, score, sound design'));
});
test('studio UI includes core creative workspaces and API setup', () => {
  const html = fs.readFileSync(path.join(root,'public','index.html'),'utf8');
  for (const phrase of ['Story room','Visual lab','Production','QA & release','Mercury 2.5','Verify & connect','Targeted revision','Export .json']) assert.ok(html.includes(phrase), `${phrase} missing`);
});
test('CANVAS supports raster-first generation, SVG fallback, saved assets and taste-aware prompting', () => {
  const server = fs.readFileSync(path.join(root,'server.mjs'),'utf8');
  const canvas = fs.readFileSync(path.join(root,'public','canvas.html'),'utf8');
  assert.ok(server.includes("pathname === '/api/canvas/generate'"));
  assert.ok(server.includes("pathname === '/api/canvas/assets'"));
  for (const phrase of ['CANVAS SVG · stylized / graphic fallback','Generate 4 storyboard frames','Raster image model · recommended','My paintings · raw expressionist / surreal collage','Run prompt pipeline']) assert.ok(canvas.includes(phrase), `${phrase} missing`);
});

test('Film Assembly workbench supports story planning, timeline edits and unattended FFmpeg export', () => {
  const html = fs.readFileSync(path.join(root, 'public', 'film.html'), 'utf8');
  for (const marker of ['/api/production/plan', '/api/canvas/generate', 'data-duration', 'draggable="true"', 'accept="audio/*"', '/api/film/render', '/api/jobs/', 'FFmpeg render', 'beast-edit-decision-list.json']) assert.ok(html.includes(marker), `Missing film assembly capability: ${marker}`);
});

test('server exposes a story-to-production-plan endpoint and film route', () => {
  const source = fs.readFileSync(path.join(root, 'server.mjs'), 'utf8');
  assert.ok(source.includes("pathname === '/api/production/plan'"));
  assert.ok(source.includes("pathname === '/film' ? 'film.html'"));
});

test('v0.6 adds a multi-engine image pipeline and visual-language prompt synthesis', () => { const server=fs.readFileSync(path.join(root,'server.mjs'),'utf8'); const canvas=fs.readFileSync(path.join(root,'public','canvas.html'),'utf8'); for(const route of ["/api/canvas/generate-image","/api/canvas/prompt-compile","/api/canvas/visual-language","/api/settings/image-provider"]) assert.ok(server.includes(route), `Missing ${route}`); for(const marker of ['Raster image model · recommended','Run prompt pipeline','Generation backend & visual language','saveVisual']) assert.ok(canvas.includes(marker), `Missing UI ${marker}`); });

test('v0.8 exposes inspectable prompt injection stages and explicit generation failure states', () => { const server=fs.readFileSync(path.join(root,'server.mjs'),'utf8'); const canvas=fs.readFileSync(path.join(root,'public','canvas.html'),'utf8'); for(const stage of ['STORYTELLER','FORMA','CINEMATIC INTELLIGENCE','CANVAS','COPYRIGHT & SYNTHESIS','ADVERSARIAL TEST']) assert.ok(server.includes(stage),`Missing prompt stage ${stage}`); for(const marker of ['Prompt injection observability','Run prompt pipeline','Run prompt checks','FRAME NOT GENERATED','LOCAL STORYBOARD FAILED']) assert.ok(canvas.includes(marker),`Missing prompt QA UX: ${marker}`); assert.ok(server.includes('positivePromptSpecificity')); assert.ok(server.includes('negativePromptPresent')); });

test('v0.7 provides persistent jobs and server-side FFmpeg rendering', () => { const server=fs.readFileSync(path.join(root,'server.mjs'),'utf8'); for(const marker of ["pathname === '/api/film/render'","pathname === '/api/jobs'",'jobs.json','VISUAL_TASTE',"videoGeneration: 'not-connected'"]) assert.ok(server.includes(marker),`Missing background rendering feature: ${marker}`); assert.ok(fs.readFileSync(path.join(root,'VISUAL_LANGUAGE.md'),'utf8').includes('painting')); });

test('v0.9 exposes server-side prompt regression testing with nine explicit checks', async () => {
  const server = fs.readFileSync(path.join(root,'server.mjs'),'utf8');
  assert.match(server, /\/api\/canvas\/prompt-test/);
  for (const check of ['brief_present','positive_specificity','negative_prompt','camera_language','material_response','continuity','shot_design','no_vector_for_photo','negative_not_in_positive']) assert.ok(server.includes(check), `missing prompt test ${check}`);
});

test('v0.9 preserves the original brief and uses compiled prompts without silently changing source text', () => {
  const ui = fs.readFileSync(path.join(root,'public','canvas.html'),'utf8');
  assert.match(ui, /Original brief preserved/);
  assert.match(ui, /window\.__beastCompiled=d/);
  assert.match(ui, /Run prompt checks/);
  assert.match(ui, /useTaste:taste==='own'/);
});

test('v1.0 accepts long unstructured creative blobs and ships futuristic interface overrides with actionable production diagnostics', () => { const server=fs.readFileSync(path.join(root,'server.mjs'),'utf8'); const canvas=fs.readFileSync(path.join(root,'public','canvas.html'),'utf8'); const index=fs.readFileSync(path.join(root,'public','index.html'),'utf8'); assert.match(server,/safeText\(b\.prompt,100000\)/); assert.match(server,/brief\.length>18000/); assert.match(server,/diagnosticId/); assert.match(canvas,/maxlength="100000"/); assert.match(canvas,/sourceCount/); assert.match(index,/beast-neon-interface-v1/); });

test('v1.1 removes Hugging Face inference and defines an unconfigured remote-worker adapter', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf8');
  const canvas = fs.readFileSync(path.join(root, 'public', 'canvas.html'), 'utf8');
  const readme = fs.readFileSync(path.join(root, 'GENERATION_BACKENDS_v1.1.md'), 'utf8');
  assert.match(server, /imageWorkerUrl/);
  assert.match(server, /\/api\/generate\/image/);
  assert.match(server, /imageBase64/);
  assert.match(server, /No remote GPU worker is configured/);
  assert.doesNotMatch(server, /router\.huggingface\.co|hfToken|hfModel/);
  assert.doesNotMatch(canvas, /Hugging Face token|hfToken|hfModel/);
  assert.match(canvas, /Self-managed BEAST GPU worker URL/);
  assert.match(readme, /zero budget/i);
  assert.match(readme, /AI video generation is not connected/i);
});


test('v1.1.1 prompt compilation has a deterministic local path independent of Mercury', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf8');
  assert.match(server, /compiler: 'local-deterministic'/);
  assert.match(server, /Prompt compilation ran locally without Mercury/);
  const route = server.slice(server.indexOf("pathname === '/api/canvas/prompt-compile'"), server.indexOf("pathname === '/api/canvas/generate-image'"));
  assert.doesNotMatch(route, /await mercury\(/);
});

test('image generation returns an explicit unavailable state when no GPU worker is configured', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf8');
  assert.match(server, /No remote GPU worker is configured/);
  assert.match(server, /raster generation will remain unavailable/);
});


test('v1.2 exposes the offline BEAST Shot Graph and is explicit that it is planning-only', () => {
  const server = fs.readFileSync(path.join(root, 'server.mjs'), 'utf8');
  const canvas = fs.readFileSync(path.join(root, 'public', 'canvas.html'), 'utf8');
  assert.match(server, /pathname === '\/api\/canvas\/shot-plan'/);
  assert.match(server, /BEAST Shot Graph · local scaffold/);
  assert.match(server, /No raster images or video are generated by this endpoint/);
  assert.match(canvas, /Build offline shot graph/);
  assert.match(canvas, /Export JSON/);
  assert.match(canvas, /renderer_payload/);
});

test('v1.3 provides an offline local vector storyboard renderer with four distinct frames', () => { const server=fs.readFileSync(path.join(root,'server.mjs'),'utf8'); const canvas=fs.readFileSync(path.join(root,'public','canvas.html'),'utf8'); assert.ok(server.includes("pathname === '/api/canvas/generate-local-storyboard'")); assert.ok(server.includes('localStoryboardSvg')); for(const label of ['THE HOUSE / DAWN','THE CARE PROTOCOL','THE REFUSAL','OUTSIDE THE SENSOR']) assert.ok(server.includes(label)); assert.ok(canvas.includes('offline renderer')); assert.ok(canvas.includes('/api/canvas/generate-local-storyboard')); });
