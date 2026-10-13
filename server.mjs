import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const KNOWLEDGE = path.join(ROOT, 'knowledge');
const WORKSPACE = path.join(ROOT, 'workspace');
const SETTINGS_FILE = path.join(WORKSPACE, 'settings.json');
const PROJECTS_FILE = path.join(WORKSPACE, 'projects.json');
const PORT = Number(process.env.PORT || 4317);
const HOST = '127.0.0.1';
const MODEL = 'mercury-2.5';
const BASE_URL = 'https://api.inceptionlabs.ai/v1';
fs.mkdirSync(WORKSPACE, { recursive: true });
for (const d of ['exports', 'assets']) fs.mkdirSync(path.join(WORKSPACE, d), { recursive: true });

function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 }); }
function settings() { return readJson(SETTINGS_FILE, { apiKey: '' }); }
function projects() { return readJson(PROJECTS_FILE, []); }
function saveProjects(items) { writeJson(PROJECTS_FILE, items); }
function safeText(v, max = 30000) { return String(v ?? '').trim().slice(0, max); }
function slug(s) { return safeText(s, 100).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55) || 'project'; }
function json(res, status, body) { const data = JSON.stringify(body); res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(data), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(data); }
function readBody(req, max = 2_000_000) { return new Promise((resolve, reject) => { let data = ''; req.on('data', chunk => { data += chunk; if (data.length > max) { reject(new Error('Request is too large.')); req.destroy(); } }); req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('Request body must be valid JSON.')); } }); req.on('error', reject); }); }
function knowledgeText() {
  const files = [
    ['BEAST — Software Design Intelligence', 'BEAST.md'],
    ['Cinematic Intelligence Bible', 'CINEMATIC_INTELLIGENCE_BIBLE.md'],
    ['CANVAS Visual Intelligence', 'CANVAS.md'],
    ['FORMA × STORYTELLER Narrative Rendering', 'FORMA_STORYTELLER.md']
  ];
  return files.map(([name, file]) => {
    try { return `\n\n===== GOVERNING SOURCE: ${name} =====\n${fs.readFileSync(path.join(KNOWLEDGE, file), 'utf8')}`; }
    catch { return ''; }
  }).join('');
}
const KNOWLEDGE_TEXT = knowledgeText();
const CHAPPY_TEXT = (() => { try { return fs.readFileSync(path.join(KNOWLEDGE, 'CHAPPY_SUPERMUSICIAN_FILE1.md'), 'utf8'); } catch { return ''; } })();
const CHAPPY_SYSTEM = `You are Chappy, a specialist sonic-intelligence collaborator for composition, production, sound design, music analysis and artist sonic identity. Stay in the music domain; when discussing film, focus on score, sound design, rhythm, mix, sonic motif, and music-to-picture integration. Use the supplied Chappy framework as the operating profile. Do not pretend a music tool or audio renderer is connected. Be concrete: diagnosis/solution/principle/reference for production; solution/logic/variation/next move for composition. Distinguish verified facts from musical interpretation.\n\nCHAPPY SOURCE PROFILE:\n${CHAPPY_TEXT}`;
const JOBS_FILE = path.join(WORKSPACE, 'jobs.json');
function allJobs() { return readJson(JOBS_FILE, []); }
function saveJob(job) { const jobs=allJobs(); const i=jobs.findIndex(x=>x.id===job.id); if(i>=0) jobs[i]=job; else jobs.unshift(job); writeJson(JOBS_FILE,jobs.slice(0,100)); }
function runProcess(command,args) { return new Promise((resolve,reject)=>{ const child=spawn(command,args,{stdio:['ignore','pipe','pipe'],windowsHide:true}); let out='',err=''; child.stdout.on('data',d=>out+=d); child.stderr.on('data',d=>err+=d); child.on('error',reject); child.on('close',code=>code===0?resolve({stdout:out,stderr:err}):reject(new Error(err.slice(-1800)||`${command} exited ${code}`))); }); }
const VISUAL_TASTE = `BEAST HOUSE VISUAL TASTE — distilled from the user's own paintings, not a generic photorealism preset. Treat this as an optional authored style grammar: psychologically charged outsider/neo-expressionist mark-making; raw hand-drawn black contours; distorted mask-like faces and oversized staring eyes; bodily/organic shapes merging with architecture and landscape; dense symbolic collage and overlapping forms; deliberate asymmetry and uneasy negative space; visible paint, pencil, dry-brush, canvas grain and imperfect edges; high-chroma vermilion, oxide red, ochre, yellow, acid green, cyan/ultramarine and chalk white; naïve, surreal, tactile, human, idiosyncratic rather than polished corporate illustration. Preserve the oddness and visual energy without copying any one painting literally. When photorealism is selected, translate these into production design, color grade, props, blocking, texture and surreal set dressing—not into cartoon faces or vector shapes.`;
const SYSTEM = `You are BEAST, the integrated creative director, story architect, visual systems designer, production planner, and adversarial QA partner inside BEAST Creative Studio. Use the provided source frameworks as actual governing constraints, not decoration. Keep intent, emotional effect, narrative, image grammar, production realities, accessibility, trust, and verification coherent. Be specific and original. State assumptions. Never claim that a film, image, video, audio, or other media asset was generated or rendered unless a connected media provider actually did it. The current application creates creative development artifacts and plans; video generation is deliberately not connected yet.\n\nSOURCE FRAMEWORKS:\n${KNOWLEDGE_TEXT}`;

async function mercury(messages, { maxTokens = 8500, jsonMode = false } = {}) {
  const key = settings().apiKey;
  if (!key) { const e = new Error('Add your Inception Labs API key in Settings to use Mercury 2.5.'); e.status = 401; throw e; }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 210000);
  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST', signal: controller.signal,
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, reasoning_effort: 'medium' })
    });
    const raw = await response.text();
    let data; try { data = JSON.parse(raw); } catch { data = { error: { message: raw.slice(0, 500) } }; }
    if (!response.ok) {
      const detail = data?.error?.message || `Inception API returned HTTP ${response.status}.`;
      const e = new Error(response.status === 401 ? 'That API key was rejected. Check the key and try again.' : detail);
      e.status = response.status === 401 ? 401 : 502; throw e;
    }
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('Mercury returned an empty response. Please retry.');
    return content.trim();
  } catch (e) {
    if (e.name === 'AbortError') { const x = new Error('The request took too long. Retry with a shorter brief.'); x.status = 504; throw x; }
    throw e;
  } finally { clearTimeout(timer); }
}
function extractJson(s) {
  const clean = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try { return JSON.parse(clean); } catch {}
  const a = clean.indexOf('{'), b = clean.lastIndexOf('}');
  if (a >= 0 && b > a) return JSON.parse(clean.slice(a, b + 1));
  throw new Error('Mercury responded, but the production package was not valid JSON. Retry the run.');
}
function projectContext(p) {
  return `PROJECT: ${p.title}\nFORMAT: ${p.format}\nAUDIENCE: ${p.audience}\nTONE: ${p.tone}\nCREATIVE BRIEF:\n${p.brief}\n\nCURRENT PACKAGE (if any):\n${p.output ? JSON.stringify(p.output).slice(0, 20000) : 'No package yet.'}`;
}
function markdownPackage(p, o) {
  const lines = [`# ${p.title}`, '', `**Format:** ${p.format}  `, `**Audience:** ${p.audience}  `, `**Tone:** ${p.tone}`, '', '## Creative thesis', o.creative_thesis || '', '', '## Logline', o.logline || '', '', '## Story', o.story?.premise || '', '', '### Characters'];
  for (const c of o.story?.characters || []) lines.push(`- **${c.name}:** Wants ${c.want}; flaw: ${c.flaw}; pressure: ${c.pressure}`);
  lines.push('', '### Story beats'); for (const b of o.story?.beats || []) lines.push(`- **${b.beat}:** ${b.purpose}`);
  lines.push('', '### Script', o.story?.script || '', '', '## Visual direction', o.visual_direction?.visual_argument || '', '', o.visual_direction?.composition || '', '', '### Palette');
  for (const c of o.visual_direction?.palette || []) lines.push(`- ${c.name} (${c.hex}): ${c.function}`);
  lines.push('', '### Camera language'); for (const x of o.visual_direction?.camera_language || []) lines.push(`- ${x}`);
  lines.push('', '### Shot list'); for (const s of o.shot_list || []) lines.push(`#### ${s.shot} — ${s.duration_seconds}s`, `- Framing: ${s.framing}`, `- Movement: ${s.movement}`, `- Action: ${s.action}`, `- Sound: ${s.sound}`, `- Story function: ${s.story_function}`, `- Low-budget method: ${s.low_budget_method}`, '');
  lines.push('## Production plan', '', '### Locations'); for (const x of o.production_plan?.locations || []) lines.push(`- ${x}`);
  lines.push('', '### Props and assets'); for (const x of o.production_plan?.props_and_assets || []) lines.push(`- ${x}`);
  lines.push('', '### Minimum crew'); for (const x of o.production_plan?.crew_minimum || []) lines.push(`- ${x}`);
  lines.push('', '### Schedule'); for (const s of o.production_plan?.schedule || []) lines.push(`- **${s.block}:** ${(s.tasks || []).join('; ')}`);
  lines.push('', '### Risks and mitigations'); for (const r of o.production_plan?.risks || []) lines.push(`- **${r.risk}:** ${r.mitigation}`);
  lines.push('', '## Post-production', o.post_plan?.edit_rhythm || '', '', o.post_plan?.sound_post || '', '', o.post_plan?.graphics_and_motion || '', '', '### Delivery specs'); for (const x of o.post_plan?.delivery_specs || []) lines.push(`- ${x}`);
  lines.push('', '## Quality assurance'); for (const q of o.qa_report?.checks || []) lines.push(`- **${String(q.status || 'review').toUpperCase()} — ${q.criterion}:** ${q.finding}`);
  lines.push('', `**Release gate:** ${o.qa_report?.release_gate || 'Human review required.'}`, '', '### Open questions'); for (const x of o.qa_report?.open_questions || []) lines.push(`- ${x}`);
  lines.push('', '## Next actions'); for (const x of o.next_actions || []) lines.push(`- ${x}`);
  lines.push('', '---', 'Generated with BEAST Creative Studio. Plans and text only; no media rendering is implied.');
  return lines.join('\n');
}
const OUTPUT_SCHEMA = `Return exactly one valid JSON object, no markdown fences, with every field present and matching this schema: {
"creative_thesis":"string", "logline":"string", "audience_and_intent":{"audience":"string","desired_effect":"string","format":"string"},
"story":{"premise":"string","characters":[{"name":"string","want":"string","flaw":"string","pressure":"string"}],"beats":[{"beat":"string","purpose":"string"}],"script":"string"},
"visual_direction":{"visual_argument":"string","composition":"string","palette":[{"name":"string","hex":"#RRGGBB","function":"string"}],"camera_language":["string"],"sound_language":["string"],"reference_cautions":["string"]},
"shot_list":[{"shot":"string","duration_seconds":5,"framing":"string","movement":"string","action":"string","sound":"string","story_function":"string","low_budget_method":"string"}],
"production_plan":{"locations":["string"],"props_and_assets":["string"],"crew_minimum":["string"],"schedule":[{"block":"string","tasks":["string"]}],"risks":[{"risk":"string","mitigation":"string"}]},
"post_plan":{"edit_rhythm":"string","sound_post":"string","graphics_and_motion":"string","delivery_specs":["string"]},
"qa_report":{"checks":[{"criterion":"string","status":"pass|review","finding":"string"}],"open_questions":["string"],"release_gate":"string"}, "next_actions":["string"] }`;

async function awaitCommandExists(command='ffmpeg') { try { await runProcess(command,['-version']); return true; } catch { return false; } }

function localStoryboardSvg(prompt, shotIndex, look = 'expressionist cinematic illustration', palette = '') {
  const q = String(prompt || '').toLowerCase();
  const isCoastal = /coast|sea|ocean|village|fishing|dock|west african|ghana|kwame|ama|kofi|vacant throne|porch|net/.test(q);
  const isSurveillance = /sensor|surveillance|monitor|dashboard|protocol|stress event|alert|system|screen|care/.test(q);
  const photoreal = /photo|photoreal|realistic|live action|cinematic still/.test(String(look).toLowerCase());
  const colors = isCoastal
    ? (shotIndex === 1 ? ['#101d32','#263f52','#f2c5a2','#f4d6c4','#f0b94b'] : ['#152c42','#32758a','#f8c5b4','#f3d9b6','#ff6b61'])
    : ['#111827','#334155','#e8c9a8','#a7d9cf','#f3b45b'];
  const [night, sea, skin, house, accent] = colors;
  const interior = shotIndex === 1 || shotIndex === 2;
  const ending = shotIndex === 3;
  const detail = shotIndex === 1;
  const human = (x,y,scale,fill=skin,lean=0) => `<g transform="translate(${x} ${y}) scale(${scale}) rotate(${lean})"><ellipse cx="0" cy="3" rx="22" ry="7" fill="#07111d" opacity=".35"/><path d="M-13 24 Q-21 34 -20 61 L-29 112 L-10 112 L0 69 L10 112 L29 112 L19 34 Q10 20 -13 24Z" fill="#182a3a"/><path d="M-13 25 Q0 17 14 25 L18 57 L-17 57Z" fill="${fill}"/><ellipse cx="0" cy="5" rx="18" ry="23" fill="${fill}"/><path d="M-19 3 Q-18 -20 1 -19 Q22 -18 19 5 L12 -4 L-8 -7Z" fill="#171b24"/><path d="M-11 6 L-4 8 M5 8 L11 6" stroke="#26313b" stroke-width="2" stroke-linecap="round"/><path d="M-5 16 Q0 19 5 15" stroke="#693f39" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
  const wheelchair = (x,y,scale=1) => `<g transform="translate(${x} ${y}) scale(${scale})"><circle cx="-18" cy="54" r="28" fill="none" stroke="#111d2a" stroke-width="5"/><circle cx="-18" cy="54" r="4" fill="#d8c2a3"/><path d="M-18 54 L-8 17 L18 17 L30 52 L12 52 L-2 31 L-8 68 L22 68" fill="none" stroke="#1b2c3b" stroke-width="5" stroke-linecap="round"/><path d="M-7 12 L18 12 L14 35 L-3 35Z" fill="#283e50"/><path d="M-5 13 Q7 6 14 15 L16 27 L-3 27Z" fill="${skin}"/><ellipse cx="6" cy="3" rx="10" ry="12" fill="${skin}"/><path d="M-4 1 Q-4 -12 7 -11 Q17 -9 16 2 L10 -3 L0 -4Z" fill="#17202b"/><path d="M-1 39 L23 39" stroke="#f0b94b" stroke-width="3"/></g>`;
  const seaLayer = `<path d="M0 365 Q150 340 280 368 T560 365 T850 360 T1280 370 L1280 720 L0 720Z" fill="${sea}"/><path d="M0 416 Q130 390 260 414 T520 410 T780 415 T1040 407 T1280 414" stroke="#b8e0d9" stroke-width="3" opacity=".48" fill="none"/><path d="M0 470 Q120 448 250 470 T520 470 T800 462 T1080 472 T1280 460" stroke="#f8d5b8" stroke-width="2" opacity=".42" fill="none"/>`;
  const village = `<path d="M0 365 L80 274 L148 345 L234 246 L320 358 L424 288 L510 364 L610 300 L702 365 L800 278 L890 360 L1010 250 L1120 358 L1215 285 L1280 344 L1280 480 L0 480Z" fill="#243e4c" opacity=".72"/><g fill="${house}" stroke="#5d5051" stroke-width="4"><path d="M70 375 L70 302 L150 252 L230 302 L230 375Z"/><path d="M180 380 L180 320 L250 275 L320 320 L320 380Z"/><path d="M850 382 L850 300 L945 244 L1040 300 L1040 382Z"/><path d="M1020 390 L1020 326 L1090 286 L1160 326 L1160 390Z"/></g><g fill="#203345"><rect x="105" y="320" width="28" height="55"/><rect x="170" y="333" width="24" height="42"/><rect x="890" y="316" width="34" height="66"/><rect x="970" y="325" width="26" height="56"/></g>`;
  const interiorSet = `<rect x="0" y="0" width="1280" height="720" fill="#d8e2e8"/><rect x="70" y="80" width="1140" height="560" fill="#c2d0d8" stroke="#344658" stroke-width="9"/><path d="M80 100 H1200 V625 H80Z" fill="#e7edf0"/><rect x="790" y="112" width="340" height="235" rx="3" fill="#152638" stroke="#91a8b7" stroke-width="10"/><rect x="810" y="132" width="300" height="195" fill="#b6e2df"/><path d="M820 278 L865 238 L910 260 L955 196 L1010 244 L1060 180 L1100 210" fill="none" stroke="#32758a" stroke-width="7"/><g stroke="#ff6b61" stroke-width="5"><path d="M850 158 H890 M850 174 H930 M1000 293 H1070"/></g><rect x="0" y="570" width="1280" height="150" fill="#b2bfc8"/><path d="M0 610 L1280 580" stroke="#f6f8f9" stroke-width="10" opacity=".7"/>`;
  let scene='';
  if (interior) {
    scene = interiorSet + `<rect x="0" y="0" width="1280" height="720" fill="#122032" opacity=".13"/>` +
      (detail ? `<g transform="translate(430 280)"><rect x="-120" y="-90" width="240" height="180" rx="16" fill="#263b4c" stroke="#101c2b" stroke-width="8"/><rect x="-96" y="-66" width="192" height="130" fill="#b9e2df"/><path d="M-72 24 L-35 -10 L-5 2 L35 -37 L74 -5" fill="none" stroke="#32758a" stroke-width="7"/><circle cx="67" cy="-42" r="8" fill="#ff6b61"/></g>` : human(800,365,1.25,skin,-5) + wheelchair(450,465,1.45) + human(590,380,.9,'#8f6555',-10)) +
      `<path d="M0 0 L420 0 L180 720 L0 720Z" fill="#16283b" opacity=".16"/>`;
  } else {
    scene = `<rect width="1280" height="720" fill="#f2cbb7"/>` + seaLayer + village +
      (ending ? `<path d="M0 510 Q320 455 640 510 T1280 490 L1280 720 L0 720Z" fill="#172d3b"/>` : '') +
      (shotIndex===0 ? `<g>${human(320,345,1.0,skin,-2)}${wheelchair(465,450,1.3)}${human(890,340,.85,'#9b6c5a',3)}</g>` : '') +
      (shotIndex===1 ? `<g transform="translate(630 420)"><circle cx="0" cy="0" r="110" fill="#132536" opacity=".24"/><circle cx="0" cy="0" r="84" fill="none" stroke="#f5d9bf" stroke-width="7"/><path d="M-42 -18 Q0 -60 42 -18 L36 42 L-36 42Z" fill="#1b2e40"/><circle cx="0" cy="-34" r="28" fill="${skin}"/><path d="M-28 -36 Q-26 -72 0 -68 Q29 -64 28 -31 L10 -44 L-9 -45Z" fill="#18202b"/></g>` : '') +
      (shotIndex===2 ? `<g>${human(500,355,1.2,skin,-3)}${human(760,350,1.12,'#996a57',5)}<path d="M530 405 Q625 370 715 405" stroke="#f0b94b" stroke-width="4" opacity=".75" fill="none"/></g>` : '') +
      (ending ? `<g>${human(390,360,.72,skin,-5)}${human(515,355,.72,'#9b6c5a',6)}${human(640,365,.72,'#b07b64',-3)}${human(765,355,.72,'#d2a07f',4)}<path d="M360 352 Q385 380 408 350 M485 347 Q510 377 535 347 M610 357 Q635 385 660 357 M735 347 Q760 377 785 347" stroke="#f4d7b6" stroke-width="4" fill="none"/></g>` : '') +
      (isSurveillance ? `<g opacity=".72"><path d="M1020 0 L1280 0 L1280 340 L1100 270Z" fill="#f6f2eb" opacity=".18"/><path d="M1020 70 L1090 105 L1160 88 L1230 120" stroke="#ff6b61" stroke-width="2" stroke-dasharray="6 10" fill="none"/><circle cx="1100" cy="95" r="11" fill="#ff6b61"/><path d="M1100 110 V135 M1087 123 H1113" stroke="#ff6b61" stroke-width="3"/></g>` : '');
  }
  const grain = Array.from({length:34},(_,i)=>{const x=(i*173+31)%1280,y=(i*97+53)%720,r=(i%3)+1;return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff2db" opacity=".${i%4+1}"/>`}).join('');
  const frameNames=['THE HOUSE / DAWN','THE CARE PROTOCOL','THE REFUSAL','OUTSIDE THE SENSOR'];
  const title = frameNames[shotIndex] || `SHOT ${shotIndex+1}`;
  const overlay = `<defs><linearGradient id="vignette" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#08111d" stop-opacity=".35"/><stop offset=".45" stop-color="#08111d" stop-opacity="0"/><stop offset="1" stop-color="#08111d" stop-opacity=".48"/></linearGradient><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f7d8c5"/><stop offset="1" stop-color="#eaaea3"/></linearGradient></defs><rect width="1280" height="720" fill="url(#vignette)"/><rect x="0" y="0" width="1280" height="720" fill="none" stroke="#f2d5b6" stroke-width="20" opacity=".8"/><path d="M42 42 H150 M42 42 V120 M1238 600 V678 H1130" fill="none" stroke="#f6d7b7" stroke-width="3" opacity=".9"/><text x="66" y="76" fill="#fff1df" font-family="Arial,sans-serif" font-size="16" letter-spacing="5">BEAST / CANVAS</text><text x="66" y="650" fill="#fff1df" font-family="Arial,sans-serif" font-size="24" font-weight="700" letter-spacing="4">${title}</text><text x="68" y="679" fill="#fff1df" font-family="Arial,sans-serif" font-size="11" letter-spacing="2">${photoreal ? 'PRODUCTION DESIGN STUDY' : 'EXPRESSIONIST CINEMATIC STUDY'} · 2.39:1 COMPOSITION IN 16:9 FRAME</text>`;
  const expression = /expression|painting|surreal|collage|illustrat|stylized|graphic|cel/.test(String(look).toLowerCase());
  const abstractMarks = expression ? `<g fill="none" stroke="${accent}" stroke-width="7" opacity=".72"><path d="M65 240 Q180 190 260 245 T430 235"/><path d="M850 180 Q930 120 1010 180 T1200 160"/><path d="M75 540 Q170 500 245 548 T390 530"/></g><path d="M930 420 l75 -34 44 61 -80 33Z" fill="${accent}" opacity=".6"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-label="BEAST locally generated cinematic storyboard frame"><title>${title}</title>${scene}${abstractMarks}<g opacity=".08">${grain}</g>${overlay}</svg>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);
  if (req.method === 'GET' && pathname === '/api/health') { const st=settings(); return json(res, 200, { status: 'ok', app: 'BEAST Creative Studio', version: '1.2.0', provider: 'Inception Labs', model: MODEL, apiKeyConfigured: Boolean(st.apiKey), imageBackend: st.imageBackend || 'remote-worker', imageWorkerConfigured: Boolean(st.imageWorkerUrl), projects: projects().length, vectorCanvas: true, stillFirstFilmBuilder: true, backgroundJobs: true, videoGeneration: 'not-connected', brains: ['beast','chappy','canvas'], genjustsu: 'adapter-spec-only' }); }
  if (req.method === 'GET' && pathname === '/api/brains') return json(res, 200, { brains: [{ id: 'beast', name: 'BEAST', role: 'Creative director, story, visual design, production planning and QA', provider: 'Inception Labs Mercury 2.5', status: 'active' }, { id: 'chappy', name: 'Chappy / Supermusician', role: 'Composition, music production, sound design, track analysis and sonic identity', provider: 'Inception Labs Mercury 2.5 with specialist profile', status: CHAPPY_TEXT ? 'active-profile-only' : 'unavailable' }, { id: 'research', name: 'Research agent', role: 'Future source-backed web research and rights-aware asset discovery', status: 'planned-not-connected' }, { id: 'genjustsu', name: 'Genjustsu adapter', role: 'Future specialist subject/object replacement video workflow', status: 'adapter-spec-only' }, { id: 'framecraft', name: 'Framecraft animation', role: 'Future still-image / keyframe-to-motion pipeline', status: 'planned-not-connected' }] });
  if (req.method === 'GET' && pathname === '/api/settings') return json(res, 200, { apiKeyConfigured: Boolean(settings().apiKey), model: MODEL, baseUrl: BASE_URL });
  if (req.method === 'GET' && pathname === '/api/production/story-source') { const f=path.join(KNOWLEDGE,'story_sources','the-vacant-throne.md'); return json(res,200,{story:fs.existsSync(f)?fs.readFileSync(f,'utf8'):''}); }
  if (req.method === 'POST' && pathname === '/api/production/plan') {
    try {
      const b=await readBody(req,30000); const story=safeText(b.story,18000); const visualMode=safeText(b.visualMode||'photorealistic',40);
      if(story.length<20) return json(res,400,{error:'Provide a story or script to plan.'});
      const sys='You are BEAST autonomous pre-production: director, storyboard artist, production designer, continuity supervisor, animation planner. Convert the story into a production-ready still-first animation plan. Return ONLY JSON: {"title":"string","visual_bible":"string","continuity_rules":["string"],"shots":[{"number":1,"title":"string","duration_seconds":5,"story_function":"string","image_prompt":"string","motion_plan":"string","sound_plan":"string","transition":"cut"}],"sound_design_plan":["string"],"qa_gates":["string"]}. Produce 8-16 shots, respect story and pacing, each prompt a single visual moment, maintain character/location continuity, no text in image prompts, do not assume vector art. For each shot include photographic image_prompt and vector_fallback_prompt, material_and_lighting, continuity_anchors, and negative_prompt. Image prompts independently usable and specific to the selected visual language.';
      const raw=await mercury([{role:'system',content:sys},{role:'user',content:'Visual mode: '+visualMode+'\nCreate the production plan from this story:\n\n'+story}],{maxTokens:7500});
      const plan=extractJson(raw); plan.createdAt=new Date().toISOString(); writeJson(path.join(WORKSPACE,'production-plan.json'),plan); return json(res,200,{plan});
    } catch(e){return json(res,e.status||502,{error:e.message||'Could not plan production.'});}
  }
  if (req.method === 'GET' && pathname === '/api/production/plan') { const f=path.join(WORKSPACE,'production-plan.json'); return fs.existsSync(f)?json(res,200,readJson(f,{})):json(res,404,{error:'No production plan yet.'}); }
  if (req.method === 'GET' && pathname === '/api/jobs') return json(res,200,allJobs().map(({id,type,status,progress,message,createdAt,updatedAt,result,error})=>({id,type,status,progress,message,createdAt,updatedAt,result,error})));
  const jobMatch=pathname.match(/^\/api\/jobs\/([0-9a-f-]{36})$/i);
  if (req.method === 'GET' && jobMatch) { const job=allJobs().find(x=>x.id===jobMatch[1]); return job?json(res,200,job):json(res,404,{error:'Job not found.'}); }
  if (req.method === 'GET' && pathname.startsWith('/api/exports/')) { const name=path.basename(pathname); if(!/^[0-9a-f-]{36}\.mp4$/.test(name))return json(res,400,{error:'Invalid export.'}); const f=path.join(WORKSPACE,'exports',name); if(!fs.existsSync(f))return json(res,404,{error:'Export not ready.'}); res.writeHead(200,{'Content-Type':'video/mp4','Content-Disposition':`attachment; filename="beast-film-${name}"`,'Cache-Control':'no-store'}); return fs.createReadStream(f).pipe(res); }
  if (req.method === 'POST' && pathname === '/api/film/render') {
    try {
      const b=await readBody(req,1000000), clips=Array.isArray(b.clips)?b.clips.slice(0,250):[]; if(!clips.length)return json(res,400,{error:'Provide timeline clips.'});
      const assets=readJson(path.join(WORKSPACE,'assets','assets.json'),[]); const resolved=[];
      for(const c of clips){const a=assets.find(x=>x.id===c.assetId);if(!a)return json(res,400,{error:`Missing asset for shot ${safeText(c.title,100)}.`});let file=a.filename?path.join(WORKSPACE,'assets',path.basename(a.filename)):path.join(WORKSPACE,'assets',`${a.id}.svg`);if(!fs.existsSync(file))return json(res,400,{error:`Asset file is missing: ${a.title}`});if(a.type!=='image')return json(res,400,{error:`${a.title} is SVG. For unattended final rendering, use raster image frames; SVG animation remains a graphic fallback.`});resolved.push({file,duration:Math.max(1,Math.min(60,Number(c.duration_seconds)||5)),title:safeText(c.title||a.title,100)});}
      const id=randomUUID(), output=path.join(WORKSPACE,'exports',`${id}.mp4`), list=path.join(WORKSPACE,'exports',`${id}.txt`); const job={id,type:'film-render',status:'queued',progress:0,message:'Queued for server-side rendering. This continues if the browser tab closes.',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),result:null,error:null};saveJob(job); 
      (async()=>{try{job.status='running';job.message='FFmpeg is compiling raster frames into a constant-frame-rate film.';job.updatedAt=new Date().toISOString();saveJob(job);let txt='';for(const r of resolved)txt+=`file '${r.file.replace(/\\/g,'/').replace(/'/g,"'\\''")}'\nduration ${r.duration}\n`;txt+=`file '${resolved[resolved.length-1].file.replace(/\\/g,'/').replace(/'/g,"'\\''")}'\n`;fs.writeFileSync(list,txt,'utf8');await runProcess('ffmpeg',['-y','-f','concat','-safe','0','-i',list,'-vf','scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p','-r',String(Math.max(12,Math.min(60,Number(b.fps)||24))),'-c:v','libx264','-preset','medium','-crf','18','-movflags','+faststart',output]);job.status='completed';job.progress=100;job.message='Film render complete. This MP4 was rendered by the local server; you can close the browser during rendering.';job.result={url:`/api/exports/${id}.mp4`,filename:`${id}.mp4`,bytes:fs.statSync(output).size};}catch(e){job.status='failed';job.error=safeText(e.message,1800);job.message='Background render failed.';}finally{job.updatedAt=new Date().toISOString();saveJob(job);try{fs.unlinkSync(list)}catch{}}})();
      return json(res,202,{job});
    }catch(e){return json(res,400,{error:e.message||'Could not queue render.'});}
  }
  if (req.method === 'GET' && pathname === '/api/canvas/assets') { const f=path.join(WORKSPACE,'assets','assets.json'); return json(res,200,readJson(f,[])); }
  if (req.method === 'GET' && pathname === '/api/canvas/providers') { const st=settings(); return json(res,200,{svg:{available:Boolean(st.apiKey),label:'Mercury → SVG (graphic fallback)'},image:{backend:st.imageBackend||'remote-worker',available:Boolean(st.imageWorkerUrl),label:'BEAST Remote GPU Worker',endpointConfigured:Boolean(st.imageWorkerUrl),contract:'/api/generate/image'},localRenderer:{available:awaitCommandExists('ffmpeg'),label:'FFmpeg background renderer'},visualTaste:VISUAL_TASTE,visualLanguage:readJson(path.join(WORKSPACE,'visual-language.json'),{look:'photorealistic cinematic still',palette:'coastal pastel vs digital fluorescent',lens:'35mm spherical',grain:'subtle organic film grain',lighting:'motivated practical light',continuity:'preserve character identity and costume'})}); }
  if (req.method === 'POST' && pathname === '/api/canvas/visual-language') { try { const b=await readBody(req,12000); const v={look:safeText(b.look||'photorealistic cinematic still',120),palette:safeText(b.palette||'',300),lens:safeText(b.lens||'35mm spherical',120),lighting:safeText(b.lighting||'motivated natural/practical light',200),grain:safeText(b.grain||'subtle organic film grain',120),continuity:safeText(b.continuity||'preserve character identity, costume, age and geography',500),negative:safeText(b.negative||'illustration, vector, SVG, cartoon, plastic skin, extra fingers, text, watermark, oversharpening',700)}; writeJson(path.join(WORKSPACE,'visual-language.json'),v); return json(res,200,{ok:true,visualLanguage:v}); } catch(e){return json(res,400,{error:e.message});} }
  if (req.method === 'POST' && pathname === '/api/canvas/prompt-test') {
    try {
      const b=await readBody(req,180000); const prompt=safeText(b.prompt,100000); const compiled=b.compiled||{};
      const positive=safeText(compiled.positive_prompt||'',10000), negative=safeText(compiled.negative_prompt||'',4000);
      const continuity=Array.isArray(compiled.continuity_anchors)?compiled.continuity_anchors.join(' '):safeText(compiled.continuity_anchors||'',2000);
      const shot=typeof compiled.shot_design==='string'?compiled.shot_design:JSON.stringify(compiled.shot_design||{});
      const tests=[
        {id:'brief_present',label:'Source brief retained',pass:prompt.length>=12,detail:prompt.length>=12?'Original brief is available to the compiler.':'Brief is empty or too short.'},
        {id:'positive_specificity',label:'Positive prompt specificity',pass:positive.length>=220,detail:`${positive.length} characters; target at least 220.`},
        {id:'negative_prompt',label:'Negative prompt included',pass:negative.length>=30,detail:`${negative.length} characters; target at least 30.`},
        {id:'camera_language',label:'Capture / camera language',pass:/lens|camera|sensor|exposure|focus|shot|depth of field|shutter/i.test(positive),detail:'Look for concrete capture and composition instructions.'},
        {id:'material_response',label:'Material and light response',pass:/light|lighting|shadow|reflect|texture|skin|fabric|surface|material/i.test(positive),detail:'Prompt should describe how materials respond to light.'},
        {id:'continuity',label:'Continuity anchors',pass:continuity.length>=12,detail:continuity.length?'Continuity anchors exist.':'No explicit continuity anchors.'},
        {id:'shot_design',label:'Shot design present',pass:shot.length>=12,detail:shot.length>2?'Shot design exists.':'Shot design is missing.'},
        {id:'no_vector_for_photo',label:'No vector leakage in photo mode',pass:!(/photo|photoreal|cinematic still/i.test(String(b.look||'')) && /vector art|svg illustration|flat icon/i.test(positive)),detail:'Photographic requests should not silently become vector illustration.'},
        {id:'negative_not_in_positive',label:'Positive and negative separated',pass:!(/negative prompt:/i.test(positive)),detail:'Negative constraints should be sent in the provider-supported field, not mixed into positive prompt.'}
      ];
      const score=Math.round(tests.filter(t=>t.pass).length/tests.length*100);
      return json(res,200,{score,passed:tests.every(t=>t.pass),tests,summary:`${tests.filter(t=>t.pass).length}/${tests.length} checks passed`});
    } catch(e){return json(res,400,{error:e.message||'Could not run prompt tests.'});}
  }
  if (req.method === 'POST' && pathname === '/api/settings/image-provider') { try { const b=await readBody(req,12000); const st=settings(); const backend=safeText(b.backend||'remote-worker',40); if(backend!=='remote-worker'&&backend!=='disabled')return json(res,400,{error:'Unsupported image backend. Supported values: remote-worker, disabled.'}); let workerUrl=safeText(b.workerUrl||'',500).replace(/\/$/,''); if(workerUrl){let u;try{u=new URL(workerUrl)}catch{return json(res,400,{error:'Worker URL must be a valid HTTP(S) URL.'})}if(!['http:','https:'].includes(u.protocol))return json(res,400,{error:'Worker URL must use HTTP or HTTPS.'}); if(u.username||u.password)return json(res,400,{error:'Do not put credentials in the worker URL; use the token field.'});} st.imageBackend=backend; st.imageWorkerUrl=workerUrl; st.imageWorkerToken=safeText(b.workerToken,4000); writeJson(SETTINGS_FILE,st); return json(res,200,{ok:true,backend,configured:Boolean(workerUrl),message:workerUrl?'Remote worker endpoint saved. Connectivity has not yet been verified.':'No remote worker configured; raster generation will remain unavailable.'}); } catch(e){return json(res,400,{error:e.message});} }
  if (req.method === 'POST' && pathname === '/api/canvas/prompt-compile') {
    try {
      const b = await readBody(req, 180000);
      const brief = safeText(b.prompt, 100000);
      if (!brief) return json(res, 400, { error: 'Provide a visual brief.' });
      const vl = readJson(path.join(WORKSPACE, 'visual-language.json'), {});
      const look = safeText(b.look || vl.look || 'photorealistic cinematic still', 300);
      const storyContext = safeText(b.storyContext, 8000);
      // Deterministic local compiler: prompt preparation must not depend on Mercury or any cloud API.
      // For long raw blobs, retain the beginning and ending so premise/context and ending imagery survive.
      const source = brief.length <= 14000 ? brief : `${brief.slice(0, 10500)}\n\n[Middle of source omitted by local compiler; original source remains saved in the UI.]\n\n${brief.slice(-3000)}`;
      const photo = /photo|real|cinema|film still|photographic/i.test(look);
      const positive = [
        source,
        storyContext ? `Story and continuity context: ${storyContext}` : '',
        `Selected visual mode: ${look}.`,
        'Create one coherent 16:9 frame showing a single readable moment, with a clear subject, physical action, specific setting, intentional foreground/midground/background, and deliberate composition.',
        photo ? 'Photographic direction: plausible human anatomy and proportions, physically credible materials, motivated light sources, natural exposure roll-off, lens-consistent depth of field, realistic skin and fabric texture, subtle optical imperfections, believable shadow contact and restrained film grain. Translate any painterly references into production design, palette, set dressing, blocking and texture rather than vector shapes.' : 'Stylized direction: use a coherent visual grammar, purposeful silhouettes, deliberate shape language, material contrast and a readable focal hierarchy.',
        `Palette and production design: ${safeText(vl.palette || 'coastal pastel exteriors contrasted with cold digital fluorescent interiors', 500)}.`,
        `Camera and capture: ${safeText(vl.lens || '35mm spherical lens, natural depth of field, subtle film grain', 500)}.`,
        `Lighting: ${safeText(vl.lighting || 'motivated practical light with controlled contrast', 500)}.`,
        `Continuity: ${safeText(vl.continuity || 'preserve character identity, costume, props, location and screen direction', 700)}.`,
        'No typography, captions, logos, watermarks, borders, UI elements or collage of multiple unrelated shots.'
      ].filter(Boolean).join('\n\n');
      const negative = safeText(vl.negative || 'text, subtitles, watermark, logo, border, UI, extra fingers, malformed hands, duplicated people, inconsistent face, inconsistent costume, broken perspective, plastic skin, oversharpening, low resolution, blurry subject, incoherent shadows', 1500);
      const compiled = {
        positive_prompt: positive,
        negative_prompt: negative,
        shot_design: 'Single 16:9 cinematic frame; infer the strongest visually legible moment from the supplied source. Preserve source facts; avoid inventing named story details.',
        continuity_anchors: [safeText(vl.continuity || 'Preserve identity, age, face, skin tone, hair, costume, props and location continuity.', 700)],
        style_rationale: `Local deterministic compilation selected ${photo ? 'photographic realism' : 'stylized visual design'} from the requested look. No remote model was called; review the prompt before generation.`
      };
      const trace = [
        { stage: 'STORYTELLER', purpose: 'Preserve narrative intent and emotional beat', input: brief.slice(0, 700) },
        { stage: 'FORMA', purpose: 'Translate the moment into spatial relationships and staging', input: storyContext || 'Infer staging from the source without inventing facts' },
        { stage: 'CINEMATIC INTELLIGENCE', purpose: 'Specify camera, exposure, motivated light and material response', input: look },
        { stage: 'CANVAS', purpose: 'Prepare a renderer-neutral raster prompt', input: 'Raster image model; 16:9 still; local compiler' },
        { stage: 'COPYRIGHT & SYNTHESIS', purpose: 'Use general visual attributes rather than imitation', input: 'Use authorized references and generic descriptors' },
        { stage: 'QA / ADVERSARIAL TEST', purpose: 'Check specificity, continuity and negative constraints', input: 'Local structural checks; human review remains required' }
      ];
      const checks = {
        positivePromptSpecificity: compiled.positive_prompt.length >= 180,
        negativePromptPresent: compiled.negative_prompt.length >= 20,
        continuityAnchorsPresent: compiled.continuity_anchors.length > 0,
        shotDesignPresent: Boolean(compiled.shot_design),
        styleRationalePresent: Boolean(compiled.style_rationale)
      };
      return json(res, 200, { compiled, trace, checks, passed: Object.values(checks).every(Boolean), compiler: 'local-deterministic', sourcePreserved: true, note: 'Prompt compilation ran locally without Mercury. This prepares a prompt; it does not generate an image.' });
    } catch (e) { return json(res, 400, { error: e.message || 'Local prompt compilation failed.' }); }
  }
  if (req.method === 'POST' && pathname === '/api/canvas/generate-local-storyboard') {
    try {
      const b = await readBody(req, 180000);
      const prompt = safeText(b.prompt, 100000);
      if (!prompt) return json(res, 400, { error: 'Provide a story or scene brief first.' });
      const look = safeText(b.look || 'expressionist cinematic illustration', 200);
      const vl = readJson(path.join(WORKSPACE, 'visual-language.json'), {});
      const shots = [
        { title: '01 · The house at dawn', prompt: 'Wide establishing frame: pastel coastal house at dawn, sea and village beyond, invisible monitoring implied by a tiny surveillance drone shadow. Establish exterior warmth against a cold interior window.' },
        { title: '02 · The care protocol', prompt: 'Intimate close-up insert: a cold glowing care monitor and chair controls, sterile pale blue interface light spilling into a lived-in room. The technology feels politely invasive.' },
        { title: '03 · The refusal', prompt: 'Tense medium two-shot inside the living room: an older disabled patriarch in his wheelchair faces a younger man, a woman caught between them. Symmetry, blocked eyelines, rigid architecture and a small red alert accent.' },
        { title: '04 · Outside the sensor', prompt: 'Night exterior by the sea: the elder and several old fishing friends share a quiet laugh beyond the house and its surveillance field; deep blue ocean, distant warm lamps, human connection outside the system’s frame.' }
      ];
      const assets = [];
      const file = path.join(WORKSPACE, 'assets', 'assets.json');
      const all = readJson(file, []);
      for (let i = 0; i < shots.length; i++) {
        const shot = shots[i];
        const svg = localStoryboardSvg(`${prompt}\n${shot.prompt}`, i, look, vl.palette || '');
        const id = randomUUID();
        const asset = { id, title: shot.title, prompt: `${prompt}\n${shot.prompt}`, svg, createdAt: new Date().toISOString(), type: 'svg', engine: 'BEAST Local Storyboard Renderer · deterministic vector scene', shotNumber: i + 1, look, note: 'Locally composed SVG storyboard art; not a diffusion image or photoreal render.' };
        fs.writeFileSync(path.join(WORKSPACE, 'assets', `${id}.svg`), svg, 'utf8');
        all.unshift(asset); assets.push(asset);
      }
      writeJson(file, all.slice(0, 200));
      return json(res, 200, { ok: true, generated: true, mode: 'local-vector-storyboard', engine: 'BEAST Local Storyboard Renderer', count: assets.length, assets, note: 'Four distinct editable SVG storyboard frames were composed locally. This is actual visual output, but not photoreal AI generation.' });
    } catch (e) { return json(res, 400, { error: e.message || 'Could not render local storyboard.' }); }
  }
  if (req.method === 'POST' && pathname === '/api/canvas/shot-plan') {
    try {
      const b = await readBody(req, 180000);
      const brief = safeText(b.prompt, 100000);
      if (!brief) return json(res, 400, { error: 'Provide a story, scene, or visual brief.' });
      const requested = Number.parseInt(b.shotCount, 10);
      const count = Number.isFinite(requested) ? Math.max(4, Math.min(12, requested)) : 6;
      const look = safeText(b.look || 'photorealistic cinematic still', 200);
      const vl = readJson(path.join(WORKSPACE, 'visual-language.json'), {});
      const roles = [
        { role: 'Establishing geography', size: 'Wide / establishing', purpose: 'Orient the viewer in place, time, and spatial relationships.', action: 'Hold on the environment before emphasizing a specific action.', camera: 'Locked or very slow motivated drift; eye-level unless the scene requires otherwise.', composition: 'Layer foreground, subject zone, and background; reserve clean negative space.' },
        { role: 'Character orientation', size: 'Medium-wide', purpose: 'Make the protagonist’s position, physical condition, and relationship to the space legible.', action: 'Show a simple physical action that establishes the character without explanatory staging.', camera: 'Stable observational camera; preserve screen direction.', composition: 'Keep hands, mobility aids, important props, and eyelines spatially coherent.' },
        { role: 'Pressure / relationship', size: 'Medium two-shot or over-shoulder', purpose: 'Make the power relationship readable through blocking rather than exposition.', action: 'Stage a pause, withheld response, glance, or interrupted task appropriate to the brief.', camera: 'Restrained push or static frame; avoid arbitrary movement.', composition: 'Use distance, occlusion, and relative height to express tension.' },
        { role: 'Material / evidence insert', size: 'Close-up insert', purpose: 'Give one meaningful object, surface, gesture, or environmental signal visual specificity.', action: 'Isolate a detail already supported by the source; do not invent a plot-critical prop.', camera: 'Close focus with physically plausible depth of field.', composition: 'One focal detail, tactile material response, clean separation from background.' },
        { role: 'Turning point', size: 'Medium close-up or deliberate wide', purpose: 'Register a change in attention, decision, or power without overexplaining emotion.', action: 'Capture the smallest visible action that communicates the beat.', camera: 'Hold long enough for the action to register; motivated reframing only.', composition: 'Prioritize readable silhouette, eyeline, and relationship to the environment.' },
        { role: 'Consequence / release', size: 'Wide or intimate close-up', purpose: 'Show the consequence of the turning point and allow the scene to breathe.', action: 'Favor a quiet aftermath, changed arrangement, or sustained behavior grounded in the brief.', camera: 'Still frame or slow withdrawal; no unmotivated flourish.', composition: 'Echo an earlier composition where useful, while showing what has changed.' },
        { role: 'Counterpoint', size: 'Detail or observational medium', purpose: 'Introduce a visual counterpoint to the dominant emotional register.', action: 'Use an ordinary environmental or human detail only if supported by the story context.', camera: 'Observational and diegetic; avoid symbolic overstatement.', composition: 'Keep the detail legible without turning it into an unrelated insert.' },
        { role: 'Reaction / silence', size: 'Close-up', purpose: 'Give the audience time to read behavior without forcing a declared emotion.', action: 'Capture a small reaction, held breath, or stillness consistent with the source.', camera: 'Stable camera and restrained focus falloff.', composition: 'Protect facial and body-language readability; no melodramatic exaggeration.' },
        { role: 'Spatial reset', size: 'Wide master', purpose: 'Re-establish geography after closer coverage and preserve editability.', action: 'Let the scene continue in real time with clear entrances, exits, and positions.', camera: 'Tripod-like stability or a motivated track.', composition: 'Maintain consistent axis, geography, and background landmarks.' },
        { role: 'Closing image', size: 'Wide or carefully selected detail', purpose: 'End on a visual echo, unresolved image, or changed relationship rather than an explanatory caption.', action: 'Choose a restrained final state derived from the brief; avoid adding new story facts.', camera: 'Hold the frame; let diegetic atmosphere carry the ending.', composition: 'Strong silhouette and negative space; composition should feel related to the opening.' },
        { role: 'Transition / passage of time', size: 'Environmental wide or detail', purpose: 'Provide an edit point for a change in time, attention, or location.', action: 'Use environmental movement or a persistent object as a visual bridge.', camera: 'Static or simple motivated move.', composition: 'Retain at least one recognizable continuity anchor.' },
        { role: 'Coverage safety', size: 'Clean medium master', purpose: 'Create an unobtrusive coverage option for editing rhythm and continuity.', action: 'Stage the core interaction clearly without adding a new beat.', camera: 'Neutral, stable coverage; maintain axis and eyelines.', composition: 'Keep both action and environment readable.' }
      ];
      const source = brief.length <= 14000 ? brief : `${brief.slice(0, 10500)}\n[Middle omitted in planning payload; source preserved in the workspace input.]\n${brief.slice(-3000)}`;
      const shots = roles.slice(0, count).map((r, i) => ({
        id: `S${String(i + 1).padStart(2, '0')}`,
        role: r.role,
        shot_size: r.size,
        narrative_function: r.purpose,
        action: r.action,
        camera: r.camera,
        composition: r.composition,
        source_context: source,
        look,
        palette: safeText(vl.palette || 'coastal pastel exteriors contrasted with cold digital fluorescent interiors', 500),
        lens_and_capture: safeText(vl.lens || '35mm spherical lens, natural depth of field, subtle film grain', 500),
        lighting: safeText(vl.lighting || 'motivated practical light with controlled contrast', 500),
        continuity_anchors: safeText(vl.continuity || 'Preserve identity, age, face, skin tone, hair, costume, props, location, screen direction, and time-of-day continuity.', 800),
        renderer_payload: `${source}\n\nSHOT ${String(i + 1).padStart(2, '0')} — ${r.role}. ${r.size}. ${r.purpose} ${r.action} ${r.camera} ${r.composition} Look: ${look}. Palette: ${safeText(vl.palette || 'coastal pastel exteriors contrasted with cold digital fluorescent interiors', 500)}. Lens: ${safeText(vl.lens || '35mm spherical lens, natural depth of field, subtle film grain', 500)}. Lighting: ${safeText(vl.lighting || 'motivated practical light with controlled contrast', 500)}. Continuity: ${safeText(vl.continuity || 'preserve character, costume, props, geography and screen direction', 800)}. No captions, logos, watermarks, borders, or unrelated multi-panel collage.`
      }));
      return json(res, 200, {
        ok: true,
        engine: 'BEAST Shot Graph · local scaffold',
        mode: 'planning-only',
        sourcePreserved: true,
        shotCount: shots.length,
        stages: [
          { id: 'context', name: 'Context harvest', status: 'complete', note: 'Source brief captured; no remote model called.' },
          { id: 'story', name: 'Narrative coverage', status: 'scaffolded', note: 'Shot roles are structured templates, not semantic AI analysis.' },
          { id: 'forma', name: 'Spatial / camera design', status: 'scaffolded', note: 'Blocking and framing guidance generated per shot.' },
          { id: 'continuity', name: 'Continuity anchors', status: 'attached', note: 'Shared visual-language constraints attached to every shot.' },
          { id: 'renderer', name: 'Renderer-neutral payloads', status: 'ready', note: 'Each shot has a prompt payload for a future renderer/worker.' }
        ],
        shots,
        limitations: ['This is an executable planning scaffold, not a generative model.', 'It does not claim to infer story beats semantically; human review is required.', 'No raster images or video are generated by this endpoint.']
      });
    } catch (e) { return json(res, 400, { error: e.message || 'Could not build shot plan.' }); }
  }
  if (req.method === 'POST' && pathname === '/api/canvas/generate-image') { try { const b=await readBody(req,180000); const st=settings(); const prompt=safeText(b.prompt,16000); if(!prompt)return json(res,400,{error:'Provide an image prompt.'}); if((st.imageBackend||'remote-worker')==='disabled')return json(res,503,{error:'Raster image generation is disabled in settings. SVG/graphic generation remains available when Mercury is configured.'}); if(!st.imageWorkerUrl)return json(res,503,{error:'No remote GPU worker is configured. Hugging Face inference has been removed from this build. Set a self-managed BEAST worker URL in CANVAS → Generation backend. With your current laptop and zero compute budget, raster generation will remain unavailable until you have access to a GPU worker.'}); const vl=readJson(path.join(WORKSPACE,'visual-language.json'),{}); const taste=(b.useTaste===false?'':VISUAL_TASTE); const fullPrompt=[prompt,`Visual direction: ${b.look||vl.look||'photorealistic cinematic still'}`,vl.palette,vl.lens,vl.lighting,vl.grain,vl.continuity,taste].filter(Boolean).join('. '); const workerUrl=st.imageWorkerUrl.replace(/\/$/,''); const headers={'Content-Type':'application/json','Accept':'application/json'}; if(st.imageWorkerToken)headers.Authorization=`Bearer ${st.imageWorkerToken}`; const response=await fetch(`${workerUrl}/api/generate/image`,{method:'POST',headers,body:JSON.stringify({prompt:fullPrompt,negativePrompt:vl.negative||'text, watermark, malformed anatomy, low resolution',width:1024,height:576,format:'png',project:'BEAST Creative Studio'}),signal:AbortSignal.timeout(240000)}); const raw=await response.text(); let data;try{data=JSON.parse(raw)}catch{data={}} if(!response.ok)return json(res,502,{error:`Remote GPU worker returned HTTP ${response.status}. ${safeText(data.error||raw,700)||'No diagnostic message returned.'}`}); if(typeof data.imageBase64!=='string'||!data.imageBase64)return json(res,502,{error:'Remote worker response was not accepted. Contract requires JSON with imageBase64 and optional mimeType; no frame was saved.'}); const mime=safeText(data.mimeType||'image/png',100); if(!['image/png','image/jpeg','image/webp'].includes(mime))return json(res,502,{error:'Worker returned an unsupported image type. Expected image/png, image/jpeg or image/webp.'}); let buf;try{buf=Buffer.from(data.imageBase64,'base64')}catch{return json(res,502,{error:'Worker returned invalid base64 image bytes.'})} if(!buf.length||buf.length>35_000_000)return json(res,502,{error:'Worker image is empty or exceeds the 35 MB safety limit.'}); const id=randomUUID(), ext=mime==='image/jpeg'?'jpg':mime==='image/webp'?'webp':'png'; fs.writeFileSync(path.join(WORKSPACE,'assets',`${id}.${ext}`),buf); const asset={id,title:safeText(b.title||prompt.slice(0,70),100),prompt:fullPrompt,createdAt:new Date().toISOString(),type:'image',mime,filename:`${id}.${ext}`,url:`/api/canvas/image/${id}.${ext}`,engine:`BEAST Remote GPU Worker${data.model?` · ${safeText(data.model,80)}`:''}`}; const f=path.join(WORKSPACE,'assets','assets.json'),all=readJson(f,[]);all.unshift(asset);writeJson(f,all.slice(0,200));return json(res,200,{asset,generated:true,provider:'remote-worker'}); } catch(e){return json(res,e.name==='TimeoutError'?504:502,{error:e.name==='TimeoutError'?'Remote GPU worker timed out after four minutes. Check the worker logs; no asset was saved.':`Remote GPU worker request failed: ${safeText(e.message,500)}. Check its URL, authentication and network reachability.`});} }
  if (req.method === 'POST' && pathname === '/api/canvas/generate') {
    try { const b=await readBody(req,30000); const prompt=safeText(b.prompt,6000); if(!prompt) return json(res,400,{error:'Describe the image or shot you want to create.'});
      const system=`You are CANVAS, BEAST's SVG visual-art and storyboard engine. Create a polished cinematic illustration from scratch as self-contained SVG vector artwork. Return ONLY valid SVG markup with viewBox="0 0 1280 720", width="1280", height="720". Use rich composition, layered shapes, gradients, silhouettes, lighting, atmosphere, visual storytelling and careful color. No external images, no network resources, no scripts, no foreignObject, no embedded HTML. Build every visual from SVG primitives and gradients. Do not include markdown. Output must be complete and self-contained.`;
      const raw=await mercury([{role:'system',content:system},{role:'user',content:`Create a cinematic 16:9 frame for this brief. ${prompt}. Prioritize readable silhouette, foreground/midground/background depth, intentional negative space, and art-directable color.`}],{maxTokens:5000});
      let svg=raw.replace(/^```(?:svg|xml)?\s*/i,'').replace(/\s*```$/,'').trim(); svg=svg.slice(svg.indexOf('<svg')); if(!svg.startsWith('<svg')||!svg.includes('</svg>')) throw new Error('CANVAS did not return a complete SVG. Try a shorter, more concrete prompt.');
      if(/<script|foreignObject|<iframe|<object|<embed|javascript:|(?:href|src)\s*=\s*[\"']https?:/i.test(svg)) throw new Error('The SVG included disallowed active or external content. Retry with a simpler visual brief.');
      svg=svg.replace(/<svg\b/, '<svg role="img" aria-label="BEAST CANVAS generated artwork"');
      const id=randomUUID(), asset={id,title:safeText(b.title||prompt.slice(0,70),100),prompt,svg,createdAt:new Date().toISOString(),type:'svg',engine:'Mercury 2.5 → CANVAS SVG'}; const f=path.join(WORKSPACE,'assets','assets.json'); const assets=readJson(f,[]); assets.unshift(asset); writeJson(f,assets.slice(0,200)); fs.writeFileSync(path.join(WORKSPACE,'assets',`${id}.svg`),svg,'utf8'); return json(res,200,{asset});
    } catch(e){return json(res,e.status||502,{error:e.message||'CANVAS generation failed.'});}
  }
  if (req.method === 'GET' && pathname.startsWith('/api/canvas/asset/')) { const id=pathname.split('/').pop(); if(!/^[0-9a-f-]{36}$/i.test(id)) return json(res,400,{error:'Invalid asset id.'}); const f=path.join(WORKSPACE,'assets',`${id}.svg`); if(!fs.existsSync(f)) return json(res,404,{error:'Asset not found.'}); res.writeHead(200,{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'no-store','Content-Disposition':`attachment; filename="beast-${id}.svg"`,'X-Content-Type-Options':'nosniff'}); return res.end(fs.readFileSync(f)); }

  if (req.method === 'POST' && pathname === '/api/settings/key') {
    try {
      const body = await readBody(req, 10000); const key = safeText(body.apiKey, 500);
      if (!key || key.length < 10) return json(res, 400, { error: 'Paste a valid-looking Inception Labs API key.' });
      // Verify before persisting, so a typo cannot strand the first-run experience.
      const testResponse = await fetch(`${BASE_URL}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: 'Reply with only OK.' }], max_tokens: 5 }), signal: AbortSignal.timeout(25000) });
      const raw = await testResponse.text(); let testData = {}; try { testData = JSON.parse(raw); } catch {}
      if (!testResponse.ok) return json(res, testResponse.status === 401 ? 401 : 502, { error: testResponse.status === 401 ? 'That key was rejected by Inception Labs. Check it and try again.' : (testData?.error?.message || `Could not verify key (HTTP ${testResponse.status}).`) });
      writeJson(SETTINGS_FILE, { apiKey: key, savedAt: new Date().toISOString() });
      return json(res, 200, { ok: true, message: 'Mercury 2.5 is connected.' });
    } catch (e) { return json(res, e.name === 'TimeoutError' ? 504 : 502, { error: e.message || 'Could not reach Inception Labs. Check your internet connection and retry.' }); }
  }
  if (req.method === 'POST' && pathname === '/api/settings/key/remove') { writeJson(SETTINGS_FILE, { apiKey: '' }); return json(res, 200, { ok: true }); }
  if (req.method === 'GET' && pathname === '/api/projects') return json(res, 200, projects().sort((a,b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')));
  if (req.method === 'POST' && pathname === '/api/projects') {
    try { const b = await readBody(req); if (!safeText(b.title, 120) || safeText(b.brief, 100000).length < 10) return json(res, 400, { error: 'Add a project title and a brief of at least 10 characters.' });
      const now = new Date().toISOString(); const p = { id: randomUUID(), title: safeText(b.title,120), brief: safeText(b.brief,100000), format: safeText(b.format || 'Short film · 3–5 minutes',120), audience: safeText(b.audience || 'General audience',300), tone: safeText(b.tone || 'Specific, cinematic, emotionally precise',300), status: 'draft', createdAt: now, updatedAt: now, output: null, chat: [] };
      const all = projects(); all.push(p); saveProjects(all); return json(res, 201, p);
    } catch (e) { return json(res, 400, { error: e.message }); }
  }
  const match = pathname.match(/^\/api\/projects\/([\w-]+)(?:\/(produce|chat|action|export))?$/);
  if (match) {
    const [, id, action] = match; const all = projects(); const index = all.findIndex(p => p.id === id); if (index < 0) return json(res, 404, { error: 'Project not found.' }); const p = all[index];
    if (req.method === 'GET' && !action) return json(res, 200, p);
    if (req.method === 'PATCH' && !action) {
      try { const b = await readBody(req); for (const k of ['title','brief','format','audience','tone']) if (b[k] !== undefined) p[k] = safeText(b[k], k === 'brief' ? 100000 : 500); if (!p.title || p.brief.length < 10) return json(res,400,{error:'A title and a brief of at least 10 characters are required.'}); p.updatedAt = new Date().toISOString(); all[index] = p; saveProjects(all); return json(res,200,p); } catch(e) { return json(res,400,{error:e.message}); }
    }
    if (req.method === 'DELETE' && !action) { all.splice(index,1); saveProjects(all); return json(res,200,{ok:true}); }
    if (req.method === 'POST' && action === 'produce') {
      try {
        p.status = 'working'; p.updatedAt = new Date().toISOString(); saveProjects(all);
        let productionBrief=p.brief; if(p.brief.length>18000){productionBrief=await mercury([{role:'system',content:'You are BEAST Source Distillation. Condense the supplied long creative source into a faithful production context. Preserve names, relationships, events, locations, visual motifs, constraints and tone; do not invent facts. Output concise structured prose under 10,000 characters.'},{role:'user',content:p.brief}],{maxTokens:2600});} const context=projectContext({...p,brief:productionBrief}); const prompt = `${context}\n\nCreate a complete, specific, internally coherent development package. Make the story actionable rather than abstract; give the shot list dramatic purpose; include realistic low-budget alternatives; make the QA gate honest. Respect the user's intent without blindly accepting weak ideas: flag risks and provide stronger alternatives. Keep the script proportionate to the requested format.\n\n${OUTPUT_SCHEMA}`;
        const raw = await mercury([{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], { maxTokens: 9000, jsonMode: true });
        const output = extractJson(raw); output.generatedAt = new Date().toISOString(); output.model = MODEL; output.disclaimer = 'Creative development output only. No video, image, or audio was rendered.';
        p.output = output; p.status = 'developed'; p.updatedAt = new Date().toISOString(); p.lastRunAt = p.updatedAt; saveProjects(all);
        const base = `${slug(p.title)}-${p.id.slice(0,8)}`; const jsonPath = path.join(WORKSPACE,'exports',`${base}.json`); const mdPath = path.join(WORKSPACE,'exports',`${base}.md`);
        fs.writeFileSync(jsonPath, JSON.stringify(output,null,2),'utf8'); fs.writeFileSync(mdPath, markdownPackage(p,output),'utf8');
        return json(res,200,{ project:p, output, files:[path.basename(mdPath),path.basename(jsonPath)] });
      } catch(e) { const diagnosticId=randomUUID().slice(0,8); console.error(`[BEAST produce ${diagnosticId}]`, e?.stack||e); p.status = p.output ? 'developed' : 'draft'; p.updatedAt = new Date().toISOString(); p.lastError = safeText(e.message,1000); p.lastErrorAt = p.updatedAt; p.lastDiagnosticId=diagnosticId; saveProjects(all); const message=e.message||'Production run failed.'; const status=e.status || (message.includes('valid JSON')||message.includes('not valid JSON')?502:502); return json(res,status,{error:message,diagnosticId,stage:message.includes('Mercury')||message.includes('API')?'mercury-provider':message.includes('JSON')?'response-parsing':'production',hint:message.includes('valid JSON')?'Mercury replied, but the output did not match the required structured package. Retry; the source brief is preserved.':message.includes('API')?'Check Inception Labs key, quota, model access, and network connection.':'Check the terminal running npm run dv for the diagnostic trace.'}); }
    }
    if (req.method === 'POST' && action === 'chat') {
      try { const b = await readBody(req); const message = safeText(b.message,8000); if (!message) return json(res,400,{error:'Write a message first.'});
        const history = (p.chat || []).slice(-12).flatMap(m => [{role:'user',content:m.user},{role:'assistant',content:m.assistant}]);
        const brain = safeText(b.brain || 'beast', 30).toLowerCase() === 'chappy' ? 'chappy' : 'beast';
        const brainSystem = brain === 'chappy' ? CHAPPY_SYSTEM + '\n\nYou are responding inside a film/creative project. Use project context only where it helps musical work. If asked for non-musical production or narrative decisions, explain the boundary and offer a music-related angle.' : SYSTEM + '\n\nYou are also the in-studio collaborator. Answer directly, show your reasoning as concise rationale rather than hidden chain-of-thought, and finish with concrete next steps when useful. Do not rewrite the entire package unless asked.';
        const answer = await mercury([{role:'system',content:brainSystem},{role:'user',content:projectContext(p)},...history,{role:'user',content:message}],{maxTokens:3500});
        p.chat ||= []; p.chat.push({id:randomUUID(),user:message,assistant:answer,brain,createdAt:new Date().toISOString()}); p.chat = p.chat.slice(-40); p.updatedAt = new Date().toISOString(); saveProjects(all); return json(res,200,{answer,chat:p.chat});
      } catch(e) { return json(res,e.status || 502,{error:e.message}); }
    }
    if (req.method === 'POST' && action === 'action') {
      try { const b = await readBody(req); const instructions = safeText(b.instructions,8000); if (!instructions) return json(res,400,{error:'Describe the change or deliverable you want.'});
        const raw = await mercury([{role:'system',content:SYSTEM},{role:'user',content:`${projectContext(p)}\n\nMake this targeted revision to the current creative package. Return a complete updated package in the same schema; preserve strong existing decisions unless the requested change requires altering them.\nREQUEST: ${instructions}\n\n${OUTPUT_SCHEMA}`}],{maxTokens:9000,jsonMode:true});
        p.output = extractJson(raw); p.output.generatedAt = new Date().toISOString(); p.output.model = MODEL; p.status = 'developed'; p.updatedAt = new Date().toISOString(); saveProjects(all);
        const base = `${slug(p.title)}-${p.id.slice(0,8)}`; fs.writeFileSync(path.join(WORKSPACE,'exports',`${base}.json`),JSON.stringify(p.output,null,2),'utf8'); fs.writeFileSync(path.join(WORKSPACE,'exports',`${base}.md`),markdownPackage(p,p.output),'utf8'); return json(res,200,{project:p,output:p.output});
      } catch(e) { return json(res,e.status || 502,{error:e.message}); }
    }
    if (req.method === 'GET' && action === 'export') { const format = url.searchParams.get('format') === 'json' ? 'json' : 'md'; if (!p.output) return json(res,404,{error:'This project has no production package yet.'}); const data = format === 'json' ? JSON.stringify(p.output,null,2) : markdownPackage(p,p.output); res.writeHead(200,{'Content-Type':format==='json'?'application/json; charset=utf-8':'text/markdown; charset=utf-8','Content-Disposition':`attachment; filename="${slug(p.title)}.${format}"`,'Cache-Control':'no-store'}); return res.end(data); }
  }
  if (req.method === 'GET' && pathname.startsWith('/api/')) return json(res,404,{error:'API route not found.'});
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res,405,{error:'Method not allowed.'});
  const requested = pathname === '/' ? 'index.html' : pathname === '/canvas' ? 'canvas.html' : pathname === '/film' ? 'film.html' : pathname.replace(/^\/+/, ''); const target = path.resolve(PUBLIC, requested);
  if (!target.startsWith(path.resolve(PUBLIC) + path.sep) && target !== path.join(PUBLIC,'index.html')) return json(res,403,{error:'Forbidden.'});
  const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
  fs.readFile(target,(err,buf)=>{ if(err) return json(res,404,{error:'Not found.'}); res.writeHead(200,{'Content-Type':types[path.extname(target)] || 'application/octet-stream','Cache-Control':target.endsWith('.html')?'no-cache':'public, max-age=3600','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}); res.end(buf); });
});

server.listen(PORT, HOST, () => {
  const address = `http://${HOST}:${PORT}`;
  console.log(`\n  BEAST CREATIVE STUDIO 1.3.0\n  Local workspace: ${address}\n  AI brains: BEAST + Chappy / Inception Labs ${MODEL}\n  Data stays in: ${WORKSPACE}\n  Press Ctrl+C to stop.\n`);
  if (process.env.BEAST_NO_OPEN !== '1') {
    const command = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c','start','',address] : [address];
    try { const child = spawn(command,args,{detached:true,stdio:'ignore',windowsHide:true}); child.unref(); } catch {}
  }
});
