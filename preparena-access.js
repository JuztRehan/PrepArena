/* =====================================================================
   PREPARENA ACCESS LAYER — auth + plans + tokens + feature gating
   Drop-in: place <script src="preparena-access.js"></script> as the LAST
   script before </body> in your existing PrepArena HTML. Nothing in the
   existing interview engine is rewritten; this file wraps it at the edges.

   PROTOTYPE ONLY: Replace with server-side authentication before production.
   Everything marked [BACKEND SWAP] is the boundary to replace with API calls.
   ===================================================================== */
(function () {
'use strict';

/* ------------------------------ 1. CONFIG ------------------------------ */
// Single place to edit plans, prices, token numbers and gates.
const PLANS = {
  free:        { name:'Free',     price:'₹0',     tokens:100,      unlimited:false, voiceRounds:3,   historyLimit:5,   libraryLimit:20,  features:[] },
  premium:     { name:'Premium',  price:'₹XXX',   tokens:5000,     unlimited:false, voiceRounds:Infinity, historyLimit:Infinity, libraryLimit:100,
                 features:['webcam','detailedReports','monthlyReports','advancedInsights','fullLibrary'] },
  premiumPlus: { name:'Premium+', price:'₹XXX',   tokens:Infinity, unlimited:true,  voiceRounds:Infinity, historyLimit:Infinity, libraryLimit:100,
                 features:['webcam','detailedReports','monthlyReports','advancedInsights','fullLibrary'] }
};
const TOKEN_COST = { answer: 10 };           // tokens per submitted answer
const UPGRADE_COPY = {
  feature: { t:'Unlock deeper interview intelligence.', b:'This feature is available on Premium. Get detailed reports, monthly performance insights, voice interviews and much higher AI usage.', cta:'Upgrade to Premium →', to:'premium' },
  tokens:  { t:"You've used your monthly AI allowance.", b:'Upgrade to Premium+ for unlimited interview tokens.', cta:'Go Unlimited →', to:'premiumPlus' }
};
const K = { users:'preparena_users', session:'preparena_session' };

/* ------------------------------ 2. AUTH --------------------------------
   [BACKEND SWAP] each function maps to one API endpoint.                  */
const read  = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
async function hashPassword(p) {
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('preparena:' + p));
        return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join(''); }
  catch (e) { return btoa(unescape(encodeURIComponent(p))); }
}
const monthKey = () => new Date().toISOString().slice(0,7);
function getCurrentUser() { const u = read(K.users, {}); return u[read(K.session, null)] || null; }
function saveUser(user) { const u = read(K.users, {}); u[user.email] = user; write(K.users, u); }
async function createAccount(name, email, password) {
  email = email.trim().toLowerCase();
  if (read(K.users, {})[email]) throw new Error('An account could not be created with these details.'); // non-revealing
  const user = { id:'u_' + Date.now().toString(36), name:name.trim(), email, passwordHash:await hashPassword(password),
                 plan:null, createdAt:new Date().toISOString(), usage:{ tokensUsed:0, interviews:0, voiceRounds:0, month:monthKey() } };
  saveUser(user); write(K.session, email); return user;
}
async function loginUser(email, password) {
  const user = read(K.users, {})[email.trim().toLowerCase()];
  if (!user || user.passwordHash !== await hashPassword(password)) throw new Error('Email or password is incorrect.');
  write(K.session, user.email); return user;
}
function logoutUser() { write(K.session, null); location.reload(); }

/* --------------------------- 3. PLANS & USAGE -------------------------- */
function getUserPlan() { const u = getCurrentUser(); return u && u.plan ? PLANS[u.plan] : null; }
function setUserPlan(key) { const u = getCurrentUser(); u.plan = key; saveUser(u); }
function usage() {
  const u = getCurrentUser();
  if (u.usage.month !== monthKey()) { u.usage = { tokensUsed:0, interviews:0, voiceRounds:0, month:monthKey() }; saveUser(u); }
  return u.usage;
}
function getRemainingTokens() { const p = getUserPlan(); return p.unlimited ? Infinity : Math.max(0, p.tokens - usage().tokensUsed); }
function hasEnoughTokens(n) { return getRemainingTokens() >= n; }
function consumeTokens(n) { const u = getCurrentUser(); usage(); u.usage.tokensUsed += n; saveUser(u); refreshChip(); }
function canUseFeature(f) { return getPlanFeatures().includes(f); }
function getPlanFeatures() { return getUserPlan() ? getUserPlan().features : []; }
const fmtTokens = n => n === Infinity ? '∞ tokens' : n.toLocaleString('en-IN') + ' tokens left';

/* ------------------------------- 4. STYLES ----------------------------- */
// Reuses the existing design tokens (--text, --border, --cyan gold, etc.). Only new layout rules.
const css = `
body.pa-locked .topnav, body.pa-locked .wrap, body.pa-locked .bg-blob{display:none}
.pa-gate{position:relative;z-index:2;min-height:100vh;display:none;animation:fadeUp .4s ease}
.pa-gate.on{display:block}
.pa-brand{display:flex;align-items:center;gap:10px;font:700 19px 'Space Grotesk';letter-spacing:-.03em}
.pa-auth{display:grid;grid-template-columns:1.15fr 1fr;gap:64px;max-width:1120px;margin:0 auto;padding:36px 24px 60px;min-height:100vh;align-items:center}
.pa-auth .pa-brand{grid-column:1/-1;align-self:start}
.pa-left h1{font-size:clamp(2.4rem,5vw,3.9rem);line-height:1.03;letter-spacing:-.055em;margin:0 0 22px;background:linear-gradient(105deg,#fffaf0 12%,#ead7a8 78%);-webkit-background-clip:text;background-clip:text;color:transparent}
.pa-left .lead{font:600 1.05rem 'Space Grotesk';color:var(--text);margin:0 0 12px}
.pa-left p{color:var(--text-dim);line-height:1.75;max-width:460px;margin:0 0 30px}
.pa-points{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;max-width:460px;padding-top:22px;border-top:1px solid var(--border)}
.pa-points span{font:500 12px 'JetBrains Mono';color:var(--text-dim);letter-spacing:.04em;display:flex;gap:8px;align-items:center}
.pa-points span::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--cyan)}
.pa-card{background:linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025));border:1px solid var(--border);border-radius:14px;padding:34px;box-shadow:var(--shadow),inset 0 1px 0 rgba(255,255,255,.04);backdrop-filter:blur(10px)}
.pa-card h2{margin:0 0 4px;font-size:24px;letter-spacing:-.03em}.pa-card .sub{color:var(--text-dim);font-size:14px;margin:0 0 22px}
.pa-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border:1px solid var(--border);border-radius:10px;background:rgba(0,0,0,.18);margin-bottom:22px}
.pa-tab{padding:10px;border:0;border-radius:7px;background:transparent;color:var(--text-dim);font:600 13.5px Inter;transition:all .2s}
.pa-tab[aria-selected=true]{background:#f0dfb2;color:#17140d}
.pa-form{animation:fadeUp .25s ease}
.pa-field{margin-bottom:16px}.pa-field label{display:block;font-size:13px;font-weight:600;color:var(--text-dim);margin-bottom:7px}
.pa-field input{height:46px;transition:border-color .2s,box-shadow .2s}
.pa-field input[aria-invalid=true]{border-color:var(--advance)}
.pa-err{color:var(--advance);font-size:12.5px;margin-top:6px;min-height:0}
.pa-formerr{color:var(--advance);font-size:13px;margin:0 0 12px}
.pa-card .btn-primary{width:100%}.pa-legal{font-size:11.5px;color:#8f8778;margin:14px 0 0;text-align:center}
.pa-switch{font-size:13px;color:var(--text-dim);text-align:center;margin:16px 0 0}
.pa-link{background:none;border:0;color:var(--cyan);font:600 13px Inter;padding:0;text-decoration:underline}
.pa-plans{max-width:1120px;margin:0 auto;padding:36px 24px 80px}
.pa-plans .hero{margin:48px 0 44px}
.pa-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;align-items:center}
.pa-plan{background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.02));border:1px solid var(--border);border-radius:12px;padding:28px 24px;position:relative;transition:transform .25s,box-shadow .25s,border-color .25s;display:flex;flex-direction:column;height:100%}
.pa-plan:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(0,0,0,.3)}
.pa-plan.rec{border-color:var(--cyan);background:linear-gradient(145deg,rgba(214,182,111,.16),rgba(255,255,255,.04));box-shadow:0 26px 60px rgba(0,0,0,.4);padding:36px 26px;margin:-10px 0}
.pa-plan.cur{outline:2px solid var(--easy);outline-offset:2px}
.pa-badge{position:absolute;top:-11px;left:24px;background:#f0dfb2;color:#17140d;font:700 10.5px Inter;letter-spacing:.12em;padding:5px 11px;border-radius:5px}
.pa-pn{font:600 12px 'JetBrains Mono';letter-spacing:.16em;color:var(--cyan)}
.pa-price{font:700 38px 'Space Grotesk';letter-spacing:-.04em;margin:10px 0 2px}.pa-price small{font:500 14px Inter;color:var(--text-dim)}
.pa-tag{color:var(--text-dim);font-size:13.5px;margin:0 0 20px}
.pa-plan ul{list-style:none;margin:0 0 26px;padding:0;flex:1}.pa-plan li{font-size:13.5px;line-height:1.5;padding:5px 0 5px 22px;position:relative}
.pa-plan li::before{content:'✓';position:absolute;left:0;color:var(--cyan);font-weight:700}
.pa-plan .btn-primary,.pa-plan .btn-secondary{width:100%}
.pa-cmp{margin-top:72px}.pa-cmp h2{text-align:center;font-size:26px;letter-spacing:-.03em;margin-bottom:24px}
.pa-tablewrap{overflow-x:auto;border:1px solid var(--border);border-radius:12px}
.pa-table{width:100%;border-collapse:collapse;min-width:560px;font-size:13.5px}
.pa-table th,.pa-table td{padding:13px 16px;text-align:center;border-bottom:1px solid var(--border)}
.pa-table th:first-child,.pa-table td:first-child{text-align:left;color:var(--text-dim)}
.pa-table th{font:600 12px 'JetBrains Mono';letter-spacing:.1em;color:var(--cyan)}.pa-table tr:last-child td{border-bottom:0}
.pa-back{margin-bottom:-20px}
.pa-user{position:relative}
.pa-chip{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;padding:7px 14px;color:var(--text);text-align:left}
.pa-chip b{font-size:13.5px;display:block}.pa-chip small{font:500 11px 'JetBrains Mono';color:var(--text-dim)}
.pa-chip .pl{font:700 10px Inter;letter-spacing:.1em;color:#17140d;background:var(--violet);padding:3px 7px;border-radius:5px}
.pa-menu{position:absolute;right:0;top:calc(100% + 8px);min-width:190px;background:var(--panel-solid);border:1px solid var(--border);border-radius:10px;padding:6px;box-shadow:var(--shadow);display:none;z-index:80}
.pa-menu.on{display:block;animation:fadeUp .2s ease}
.pa-menu button{display:block;width:100%;text-align:left;background:none;border:0;color:var(--text);padding:10px 12px;border-radius:7px;font:500 13.5px Inter}
.pa-menu button:hover{background:rgba(214,182,111,.1)}
.pa-modal{position:fixed;inset:0;z-index:200;background:rgba(8,8,7,.72);display:none;align-items:center;justify-content:center;padding:20px}
.pa-modal.on{display:flex;animation:fadeUp .25s ease}
.pa-modal .pa-card{max-width:440px;background:var(--panel-solid)}
.pa-modal .row{display:flex;flex-direction:column;gap:10px;margin-top:20px}
.pa-lock{opacity:.45}.pa-note{font-size:13px;color:var(--text-dim);padding:14px 16px;border:1px dashed var(--border);border-radius:8px;margin-top:12px}
@media(max-width:900px){.pa-auth{grid-template-columns:1fr;gap:36px;padding-top:24px}.pa-grid{grid-template-columns:1fr}.pa-plan.rec{order:-1;margin:0}}
@media(max-width:720px){.pa-card{padding:24px}.pa-chip small{display:none}}`;
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css }));

/* ------------------------------- 5. UI --------------------------------- */
const esc = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
const $ = (s, r = document) => r.querySelector(s);
const wait = ms => new Promise(r => setTimeout(r, ms));
const brand = '<div class="pa-brand"><span class="logo-mark">🎯</span> PrepArena</div>';
const gate = Object.assign(document.createElement('div'), { id:'pa-gate' });
document.body.prepend(gate);
const modal = Object.assign(document.createElement('div'), { className:'pa-modal', role:'dialog', 'aria-modal':'true' });
document.body.appendChild(modal);

function show(name) {
  document.body.classList.toggle('pa-locked', name !== 'app');
  gate.innerHTML = '';
  if (name === 'auth') renderAuth(); else if (name === 'plans') renderPlans(false);
  gate.className = 'pa-gate' + (name === 'app' ? '' : ' on');
  window.scrollTo(0, 0);
}
function route() {
  const u = getCurrentUser();
  if (!u) show('auth'); else if (!u.plan) show('plans'); else enterApp();
}

/* ---- Auth screen ---- */
function renderAuth(mode = 'login') {
  gate.innerHTML = `<div class="pa-auth">${brand}
    <div class="pa-left"><h1>Walk in prepared.<br>Walk out confident.</h1>
      <div class="lead">Practice the interview before the interview happens.</div>
      <p>AI-powered interview practice built to help you think clearly, answer better, and perform under pressure.</p>
      <div class="pa-points"><span>AI Interview Practice</span><span>Live Voice Rounds</span><span>Instant Feedback</span><span>Progress Tracking</span></div></div>
    <div class="pa-card"><h2>Welcome to PrepArena</h2><p class="sub">Build your interview edge.</p>
      <div class="pa-tabs" role="tablist">
        <button class="pa-tab" role="tab" data-m="login">Log in</button>
        <button class="pa-tab" role="tab" data-m="signup">Create account</button></div>
      <div id="pa-formhost"></div></div></div>`;
  const setMode = m => {
    gate.querySelectorAll('.pa-tab').forEach(t => t.setAttribute('aria-selected', t.dataset.m === m));
    const su = m === 'signup';
    const f = (id, label, type, ac) => `<div class="pa-field"><label for="${id}">${label}</label>
      <input type="${type}" id="${id}" autocomplete="${ac}" aria-describedby="${id}-e"><div class="pa-err" id="${id}-e" role="alert"></div></div>`;
    $('#pa-formhost').innerHTML = `<form class="pa-form" novalidate><div class="pa-formerr" id="pa-fe" role="alert"></div>
      ${su ? f('pa-name','Full name','text','name') : ''}${f('pa-email','Email','email','email')}
      ${f('pa-pass','Password','password', su ? 'new-password' : 'current-password')}${su ? f('pa-pass2','Confirm password','password','new-password') : ''}
      <button class="btn-primary" type="submit">${su ? 'Create account →' : 'Log in →'}</button>
      ${su ? '<p class="pa-legal">By continuing, you agree to the PrepArena terms of use.</p>'
           : `<p class="pa-switch">Don't have an account? <button type="button" class="pa-link" data-m="signup">Create one</button></p>`}</form>`;
    $('#pa-formhost .pa-link')?.addEventListener('click', () => setMode('signup'));
    $('#pa-formhost form').addEventListener('submit', e => { e.preventDefault(); submitAuth(su); });
  };
  gate.querySelectorAll('.pa-tab').forEach(t => t.addEventListener('click', () => setMode(t.dataset.m)));
  setMode(mode);
}
function fieldError(id, msg) {
  const el = $('#' + id), er = $('#' + id + '-e'); er.textContent = msg || '';
  el.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !!msg;
}
async function submitAuth(signup) {
  const v = id => ($('#' + id)?.value || '');
  const email = v('pa-email').trim(), pass = v('pa-pass');
  $('#pa-fe').textContent = '';
  let bad = false;
  if (signup) bad = fieldError('pa-name', v('pa-name').trim() ? '' : 'Enter your full name.') || bad;
  bad = fieldError('pa-email', !email ? 'Enter your email address.' : /^\S+@\S+\.\S+$/.test(email) ? '' : 'Enter a valid email address.') || bad;
  bad = fieldError('pa-pass', pass.length >= 6 ? '' : 'Password must be at least 6 characters.') || bad;
  if (signup) bad = fieldError('pa-pass2', v('pa-pass2') === pass ? '' : "Passwords don't match.") || bad;
  if (bad) { gate.querySelector('[aria-invalid=true]').focus(); return; }
  const btn = $('#pa-formhost .btn-primary'); btn.disabled = true; btn.textContent = signup ? 'Creating your account…' : 'Signing in…';
  try {
    await wait(500); // [BACKEND SWAP] await fetch('/api/auth/...')
    if (signup) await createAccount(v('pa-name'), email, pass); else await loginUser(email, pass);
    gate.style.opacity = 0; gate.style.transition = 'opacity .3s'; await wait(300);
    gate.style.opacity = ''; route();
  } catch (err) {
    $('#pa-fe').textContent = err.message; btn.disabled = false; btn.textContent = signup ? 'Create account →' : 'Log in →';
  }
}

/* ---- Plans screen ---- */
const PLAN_COPY = {
  free: { tag:'For getting started.', cta:'Continue with Free', items:['Limited AI interview tokens (limited monthly usage)','Practice mock interviews','Technical interviews','HR / behavioural interviews','Situational interviews','Basic interview score','Basic feedback','Access to selected interview questions'] },
  premium: { tag:'For serious interview preparation.', cta:'Start Premium →', items:['Much higher AI token allowance','More mock interviews','Technical + HR + Situational rounds','Voice interview mode','Webcam introduction analysis','Detailed interview reports','Full answer-by-answer feedback','Interview history','Progress dashboard','Monthly performance reports','Advanced performance insights','Access to the full question library'] },
  premiumPlus: { tag:'For unlimited preparation.', cta:'Go Unlimited →', items:['Unlimited AI interview tokens','Unlimited mock interviews','Technical, HR and Situational interviews','Unlimited voice interviews','Webcam confidence analysis','Detailed interview reports','Monthly performance reports','Advanced analytics','Full interview history','Deep performance insights','Complete question library','Priority access to new PrepArena features'] }
};
const CMP = [['AI interview practice','Limited','High usage','Unlimited'],['AI tokens','Limited','Large allowance','Unlimited'],['Technical rounds','✓','✓','✓'],['HR rounds','✓','✓','✓'],['Situational rounds','✓','✓','✓'],['Voice interviews','Limited','✓','Unlimited'],['Webcam analysis','—','✓','✓'],['Detailed reports','Basic','✓','✓'],['Monthly reports','—','✓','✓'],['Progress dashboard','Basic','Advanced','Advanced'],['Interview history','Limited','✓','Unlimited'],['Question library','Selected','Full','Full'],['Advanced insights','—','✓','✓']];
function renderPlans(fromApp) {
  const cur = getCurrentUser()?.plan;
  document.body.classList.add('pa-locked'); gate.className = 'pa-gate on';
  gate.innerHTML = `<div class="pa-plans">${brand}${fromApp ? '<button class="btn-secondary pa-back" id="pa-back" style="margin-top:20px">← Back to app</button>' : ''}
    <div class="hero"><span class="kicker">Plans</span><h1>Choose how you want to prepare.</h1>
    <p>Start free, build consistency, and unlock deeper interview intelligence when you're ready.</p></div>
    <div class="pa-grid">${['free','premium','premiumPlus'].map(k => { const p = PLANS[k], c = PLAN_COPY[k];
      return `<div class="pa-plan${k === 'premium' ? ' rec' : ''}${cur === k ? ' cur' : ''}">${k === 'premium' ? '<span class="pa-badge">MOST POPULAR</span>' : ''}
        <div class="pa-pn">${p.name.toUpperCase()}</div><div class="pa-price">${esc(p.price)}${k === 'free' ? '' : '<small> / month</small>'}</div>
        <p class="pa-tag">${c.tag}</p><ul>${c.items.map(i => `<li>${i}</li>`).join('')}</ul>
        <button class="${k === 'free' ? 'btn-secondary' : 'btn-primary'}" data-plan="${k}">${cur === k ? 'Current plan' : c.cta}</button></div>`; }).join('')}</div>
    <section class="pa-cmp"><h2>Everything you need to prepare better.</h2><div class="pa-tablewrap"><table class="pa-table">
      <thead><tr><th scope="col">FEATURE</th><th scope="col">FREE</th><th scope="col">PREMIUM</th><th scope="col">PREMIUM+</th></tr></thead>
      <tbody>${CMP.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div></section></div>`;
  $('#pa-back')?.addEventListener('click', enterApp);
  gate.querySelectorAll('[data-plan]').forEach(b => b.addEventListener('click', async () => {
    b.disabled = true; b.textContent = 'Saving your plan…';
    await wait(450); // [BACKEND SWAP] payment + subscription call goes here for paid plans
    setUserPlan(b.dataset.plan); enterApp();
  }));
}

/* ---- App header chip + menu ---- */
function refreshChip() {
  const u = getCurrentUser(), p = getUserPlan(); const host = $('#pa-user'); if (!u || !p || !host) return;
  $('#pa-chip-name', host).textContent = u.name.split(' ')[0];
  $('#pa-chip-pl', host).textContent = p.name.toUpperCase();
  $('#pa-chip-tok', host).textContent = fmtTokens(getRemainingTokens());
}
function mountChip() {
  if ($('#pa-user')) return refreshChip();
  const host = Object.assign(document.createElement('div'), { id:'pa-user', className:'pa-user' });
  host.innerHTML = `<button class="pa-chip" aria-haspopup="true" aria-expanded="false"><span><b id="pa-chip-name"></b><small id="pa-chip-tok"></small></span><span class="pl" id="pa-chip-pl"></span></button>
    <div class="pa-menu" role="menu"><button data-a="profile">Profile</button><button data-a="plan">My Plan</button><button data-a="usage">Usage</button><button data-a="dash">Dashboard</button><button data-a="out">Log out</button></div>`;
  $('.topnav').appendChild(host);
  const chip = $('.pa-chip', host), menu = $('.pa-menu', host);
  const close = () => { menu.classList.remove('on'); chip.setAttribute('aria-expanded', 'false'); };
  chip.addEventListener('click', e => { e.stopPropagation(); const o = menu.classList.toggle('on'); chip.setAttribute('aria-expanded', o); });
  document.addEventListener('click', close); document.addEventListener('keydown', e => e.key === 'Escape' && (close(), closeModal()));
  menu.addEventListener('click', e => { const a = e.target.dataset.a; if (!a) return; close();
    if (a === 'out') logoutUser(); else if (a === 'plan') renderPlans(true);
    else if (a === 'dash') document.querySelector('.step-pill[data-view="dashboard"]').click();
    else infoModal(a); });
  refreshChip();
}

/* ---- Modals ---- */
function closeModal() { modal.classList.remove('on'); modal.innerHTML = ''; }
function openModal(html) { modal.innerHTML = `<div class="pa-card">${html}</div>`; modal.classList.add('on'); $('button', modal)?.focus(); }
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
function showUpgradeModal(kind = 'feature') {
  const c = UPGRADE_COPY[kind];
  openModal(`<h2>${c.t}</h2><p class="sub" style="margin-top:10px">${c.b}</p><div class="row">
    <button class="btn-primary" id="pa-up">${c.cta}</button><button class="btn-secondary" id="pa-later">Maybe later</button></div>`);
  $('#pa-up').onclick = () => { closeModal(); renderPlans(true); }; $('#pa-later').onclick = closeModal;
}
function infoModal(kind) {
  const u = getCurrentUser(), p = getUserPlan(), us = usage();
  const rows = kind === 'profile' ? [['Name', u.name], ['Email', u.email], ['Member since', new Date(u.createdAt).toLocaleDateString('en-IN')]]
    : [['Plan', p.name], ['Tokens used', us.tokensUsed], ['Tokens left', p.unlimited ? '∞' : getRemainingTokens()], ['Interviews this month', us.interviews], ['Voice rounds', us.voiceRounds]];
  openModal(`<h2>${kind === 'profile' ? 'Profile' : 'Usage'}</h2><div style="margin-top:14px">${rows.map(r =>
    `<div class="live-metric" style="margin-bottom:8px"><span class="lm-label">${r[0]}</span><span class="lm-value">${esc(String(r[1]))}</span></div>`).join('')}</div>
    <div class="row"><button class="btn-secondary" id="pa-x">Close</button></div>`);
  $('#pa-x').onclick = closeModal;
}

/* ------------------- 6. HOOKS INTO THE EXISTING APP -------------------- */
function wrap(name, after) { const orig = window[name]; if (typeof orig !== 'function') return;
  window[name] = function () { const r = orig.apply(this, arguments); after.apply(this, arguments); return r; }; }
function enterApp() {
  show('app'); mountChip();
  const nm = $('#candidateName'); if (nm && !nm.value) nm.value = getCurrentUser().name;
}

// Start round: needs tokens (and voice allowance) — capture phase runs before the app's own handler.
$('#startBtn').addEventListener('click', e => {
  const need = state.count * TOKEN_COST.answer;
  if (!hasEnoughTokens(need)) { e.stopImmediatePropagation(); return showUpgradeModal('tokens'); }
  if (state.voiceMode && usage().voiceRounds >= getUserPlan().voiceRounds) {
    e.stopImmediatePropagation(); return showUpgradeModal('feature'); }
  const u = getCurrentUser(); usage(); u.usage.interviews++; if (state.voiceMode) u.usage.voiceRounds++; saveUser(u);
}, true);

// Webcam analysis is a Premium feature (Skip still works for everyone).
$('#camStartBtn').addEventListener('click', e => {
  if (!canUseFeature('webcam')) { e.stopImmediatePropagation(); showUpgradeModal('feature'); }
}, true);

// Each submitted answer costs tokens.
const _submit = window.handleSubmit;
window.handleSubmit = function (auto) { if (!state.submitting) consumeTokens(TOKEN_COST.answer); return _submit.apply(this, arguments); };

// Free: basic report (no sample answers / improvement path).
wrap('finishRound', () => {
  if (canUseFeature('detailedReports')) return;
  document.querySelectorAll('#feedbackList .path-steps').forEach(el => {
    const prev = el.previousElementSibling, sample = prev && prev.previousElementSibling, h = prev;
    [sample, h, el].forEach(n => n && n.remove()); });
  document.querySelectorAll('#feedbackList .feedback-answer > p:nth-last-child(1)').forEach(n => n.remove());
  const note = document.createElement('div'); note.className = 'pa-note';
  note.innerHTML = 'Free plan shows a basic report. <button class="pa-link" type="button">Upgrade for sample answers and your improvement path</button>';
  note.querySelector('button').onclick = () => showUpgradeModal('feature'); $('#feedbackList').appendChild(note);
});

// Free: limited history on the dashboard.
wrap('renderDashboard', () => {
  const lim = getUserPlan()?.historyLimit; const rows = document.querySelectorAll('#historyList .history-row');
  if (lim === Infinity || rows.length <= lim) return;
  [...rows].slice(lim).forEach(r => r.remove());
  const note = document.createElement('div'); note.className = 'pa-note'; note.textContent = `Free plan shows your latest ${lim} rounds. Upgrade for full history.`;
  $('#historyList').appendChild(note);
});

// Free: only selected questions in the library.
wrap('renderLibrary', () => {
  const lim = getUserPlan()?.libraryLimit; if (!lim || lim >= 100) return;
  document.querySelectorAll('#libraryList .library-item').forEach(row => {
    if (parseInt($('.library-number', row).textContent, 10) <= lim) return;
    row.classList.add('pa-lock'); const b = $('.library-question', row);
    const nb = b.cloneNode(true); b.replaceWith(nb); nb.addEventListener('click', () => showUpgradeModal('feature')); });
});

/* -------------------------------- 7. BOOT ------------------------------ */
window.PrepArena = { PLANS, getCurrentUser, getUserPlan, setUserPlan, canUseFeature, hasEnoughTokens,
  getRemainingTokens, consumeTokens, getPlanFeatures, showUpgradeModal, logoutUser };
route();
})();