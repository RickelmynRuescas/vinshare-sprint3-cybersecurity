const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WALK_STEP = 160;   // ms por item: sublinhado da navbar e contagem do número grande
const FONTS_READY = document.fonts ? document.fonts.ready : Promise.resolve();

// Nav + footer compartilhados
(function () {
  const pages = [
    ['index.html', 'Visão geral'],
    ['etapa1-devsecops.html', '1 · DevSecOps'],
    ['etapa2-codigo-infra.html', '2 · Código & Infra'],
    ['etapa3-logs-incidentes.html', '3 · Logs & Incidentes'],
    ['etapa4-owasp.html', '4 · OWASP & Riscos'],
  ];
  const here = location.pathname.split('/').pop() || 'index.html';
  const cur = pages.findIndex(p => p[0] === here || p[0].replace('.html', '') === here);
  const nav = document.createElement('header');
  nav.className = 'nav';
  nav.innerHTML = `<div class="nav-in"><a class="brand" href="index.html" aria-label="VIN Share · SecOps"><span class="b-long">VIN Share <span>· SecOps</span></span><span class="b-short" aria-hidden="true">V<i>S</i></span></a><ul>${
    pages.map((p, i) => i === cur
      ? `<li><a href="${p[0]}" class="active" aria-current="page">${p[1]}</a></li>`
      : `<li><a href="${p[0]}">${p[1]}</a></li>`).join('')}</ul></div>`;
  document.body.prepend(nav);
  // altura real da navbar (usada pelo índice sticky e pelo scroll-margin das âncoras)
  const setNavH = () => document.documentElement.style.setProperty('--navh', nav.offsetHeight + 'px');
  setNavH();
  // mobile: navbar em uma linha com rolagem; mantém o item ativo visível
  const navUl = nav.querySelector('ul'), navAct = nav.querySelector('a.active');
  const keepActiveVisible = smooth => {
    if (navAct && navUl.scrollWidth > navUl.clientWidth)
      navUl.scrollTo({ left: navAct.parentElement.offsetLeft - (navUl.clientWidth - navAct.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
  };

  // sublinhado do item ativo: na troca de página "caminha" do item anterior até o ativo, item a item
  // degradê só nas bordas onde há mais itens escondidos (mobile)
  const fades = () => {
    const max = navUl.scrollWidth - navUl.clientWidth;
    navUl.classList.toggle('fade-l', max > 1 && navUl.scrollLeft > 1);
    navUl.classList.toggle('fade-r', max > 1 && navUl.scrollLeft < max - 1);
  };
  navUl.addEventListener('scroll', fades, { passive: true });
  const links = [...navUl.querySelectorAll('a')];
  const ind = document.createElement('span');
  ind.className = 'ind';
  ind.setAttribute('aria-hidden', 'true');
  navUl.append(ind);
  const place = a => {
    const pad = parseFloat(getComputedStyle(a).paddingLeft) || 0;
    ind.style.transform = `translateX(${a.offsetLeft + pad}px)`;
    ind.style.width = (a.offsetWidth - pad * 2) + 'px';
  };
  let from = null;
  try { from = sessionStorage.getItem('vs-nav-from'); sessionStorage.removeItem('vs-nav-from'); } catch (e) {}
  from = from === null ? null : +from;
  const walk = from !== null && !REDUCED && cur >= 0 && from !== cur && links[from];
  let walking = !!walk;                            // enquanto caminha, o resize não reposiciona
  window.__vsWalk = walk ? { from, cur } : null;  // o número grande conta junto com o sublinhado
  if (!navAct) ind.hidden = true;
  else place(walk ? links[from] : navAct);           // antes do 1º render: já no ponto de partida
  if (!walk) keepActiveVisible(false);
  FONTS_READY.then(() => {
    if (!navAct) return;
    if (!walk) { place(navAct); return; }
    place(links[from]);
    const dir = cur > from ? 1 : -1;
    ind.style.setProperty('--step', WALK_STEP + 'ms');
    ind.getBoundingClientRect();                     // aplica a posição inicial antes de ligar a transição
    ind.classList.add('walk');
    let i = from;
    const step = () => {
      i += dir;
      place(links[i]);
      document.dispatchEvent(new CustomEvent('vs:navstep', { detail: { i, dir } }));
      if (i !== cur) setTimeout(step, WALK_STEP);
      else setTimeout(() => { ind.classList.remove('walk'); walking = false; keepActiveVisible(true); }, WALK_STEP);
    };
    requestAnimationFrame(step);
  });
  addEventListener('resize', () => { setNavH(); fades(); if (navAct && !walking) place(navAct); });
  fades();
  // guarda o item atual para a próxima página (F5 cai no mesmo item: sem caminhada)
  addEventListener('pagehide', () => { try { if (cur >= 0) sessionStorage.setItem('vs-nav-from', cur); } catch (e) {} });
  addEventListener('pageshow', e => { if (e.persisted) try { sessionStorage.removeItem('vs-nav-from'); } catch (x) {} });

  const main = document.querySelector('main');
  if (cur >= 0 && main) {
    const pn = document.createElement('div');
    pn.className = 'pn';
    pn.innerHTML = (cur > 0 ? `<a class="btn ghost" href="${pages[cur - 1][0]}">← ${pages[cur - 1][1]}</a>` : '<span></span>') +
      (cur < pages.length - 1 ? `<a class="btn" href="${pages[cur + 1][0]}">${pages[cur + 1][1]} →</a>`
        : document.getElementById('encerramento')
          ? '<a class="btn" href="#encerramento">Encerramento ↓</a>'
          : '<a class="btn" href="index.html#checklist">Voltar à visão geral →</a>');
    main.append(pn);
  }
  const f = document.createElement('footer');
  f.innerHTML = '<p>FIAP · Ford Challenge · Sprint 3 — Cybersecurity · Turma 3ESPV</p>';
  const closing = document.getElementById('encerramento');   // Etapa 4: o rodapé fica antes do encerramento
  if (closing) closing.before(f); else document.body.append(f);
})();

// Índice da página (etapas): lateral sticky no desktop, faixa de atalhos no mobile
(function () {
  const main = document.querySelector('main');
  const hero = main && main.querySelector(':scope > .hero');
  const heads = main ? [...main.querySelectorAll('h2[id]')] : [];
  if (!hero || !document.body.hasAttribute('data-toc') || heads.length < 3) return;
  const content = document.createElement('div');
  content.className = 'content';
  while (hero.nextSibling) content.append(hero.nextSibling);
  const toc = document.createElement('nav');
  toc.className = 'toc';
  toc.setAttribute('aria-label', 'Nesta página');
  toc.innerHTML = '<p class="toc-t">Nesta página</p><ol>' + heads.map((h, i) =>
    `<li><a href="#${h.id}"><span>${String(i + 1).padStart(2, '0')}</span>${h.textContent.trim()}</a></li>`).join('') + '</ol>';
  main.classList.add('has-toc');
  main.append(toc, content);
  const links = new Map([...toc.querySelectorAll('a')].map(a => [a.getAttribute('href').slice(1), a]));
  const ol = toc.querySelector('ol');
  const setActive = id => {
    const a = links.get(id);
    if (!a || a.classList.contains('on')) return;
    toc.querySelectorAll('a.on').forEach(x => { x.classList.remove('on'); x.removeAttribute('aria-current'); });
    a.classList.add('on');
    a.setAttribute('aria-current', 'location');
    // mobile (faixa horizontal): rola só a faixa, nunca a página
    if (ol.scrollWidth > ol.clientWidth) ol.scrollTo({ left: a.parentElement.offsetLeft - 16, behavior: REDUCED ? 'auto' : 'smooth' });
  };
  // Seção atual = a última cuja linha do título já passou do topo (navbar + faixa do índice no mobile,
  // o mesmo scroll-margin das âncoras). No fim da página vale o último título visível.
  const limit = () => (parseFloat(getComputedStyle(heads[0]).scrollMarginTop) || 80) + 4;
  let pinned = null;                                   // destino de um clique/âncora, até a rolagem terminar
  const compute = () => {
    if (pinned) return;
    const lim = limit();
    let cur = heads[0];
    for (const h of heads) { if (h.getBoundingClientRect().top <= lim) cur = h; else break; }
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2)
      for (const h of heads) if (h.getBoundingClientRect().top < innerHeight) cur = h;
    setActive(cur.id);
  };
  let last = null;                                     // último destino de clique/âncora (para realinhar)
  const realign = id => {
    const t = document.getElementById(id);
    const dy = t.getBoundingClientRect().top - (parseFloat(getComputedStyle(t).scrollMarginTop) || 0);
    const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
    // conteúdo acima mudou de altura durante/depois do salto: corrige a deriva (não mexe se o usuário já rolou)
    if (Math.abs(dy) > 4 && Math.abs(dy) < innerHeight && !(atBottom && dy > 0)) scrollBy({ top: dy, behavior: 'instant' });
    setActive(id);
  };
  const pin = id => {
    pinned = id;
    last = { id, t: performance.now(), user: false };
    setActive(id);
    let done = false;
    const release = () => { if (done) return; done = true; pinned = null; if (!last.user) realign(id); };
    addEventListener('scrollend', release, { once: true });
    setTimeout(release, 1200);                         // se não houver rolagem (já estava lá) ou sem scrollend
  };
  ['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, () => { if (last) last.user = true; }, { passive: true }));
  document.addEventListener('vs:layout', () => { if (last && !last.user && performance.now() - last.t < 6000) realign(last.id); });
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; compute(); }); } }, { passive: true });
  // clique em qualquer link interno desta página (índice, "Entrega esperada", links no texto): destino ativo na hora
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    const id = a && decodeURIComponent(a.getAttribute('href').slice(1));
    if (id && links.has(id)) pin(id);
  });
  // abrir a página com #âncora (ex.: vindo do checklist do index) ou trocar o hash
  const fromHash = () => { const id = decodeURIComponent(location.hash.slice(1)); if (links.has(id)) pin(id); else compute(); };
  addEventListener('hashchange', fromHash);
  addEventListener('load', fromHash);
  fromHash();
})();

// Botão "voltar ao topo"
(function () {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'totop';
  b.setAttribute('aria-label', 'Voltar ao topo');
  b.textContent = '↑';
  b.onclick = () => scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  document.body.append(b);
  const upd = () => b.classList.toggle('on', scrollY > 700);
  addEventListener('scroll', upd, { passive: true });
  upd();
  // some enquanto o rodapé ou a tela de encerramento estão visíveis; volta ao rolar para cima
  const ends = [document.querySelector('footer'), document.getElementById('encerramento')].filter(Boolean);
  const seen = new Set();
  const io = new IntersectionObserver(es => {
    es.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target));
    b.classList.toggle('away', seen.size > 0);
  });
  ends.forEach(el => io.observe(el));
})();

// Mermaid: renderiza depois das fontes carregarem (evita texto cortado nos nós).
// O script do Mermaid é "defer": se ainda não chegou, espera o DOMContentLoaded.
function initMermaid() {
  if (!window.mermaid) return;
  mermaid.initialize({
    startOnLoad: false, theme: 'base', securityLevel: 'strict', deterministicIds: true,
    themeVariables: {
      darkMode: true, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px',
      background: '#0c0f14', primaryColor: '#12161d', primaryTextColor: '#e6edf3', primaryBorderColor: '#3a4452',
      secondaryColor: '#1a2029', tertiaryColor: '#12161d', lineColor: '#5b6675', textColor: '#c9d1d9',
      clusterBkg: 'rgba(26,32,41,.35)', clusterBorder: '#262d38', edgeLabelBackground: '#0c0f14',
    },
    flowchart: { curve: 'basis', padding: 14, wrappingWidth: 260 },
  });
  FONTS_READY.then(() => mermaid.run({ querySelector: '.mermaid' }))
    .finally(() => document.dispatchEvent(new Event('vs:layout')));
}
if (window.mermaid) initMermaid(); else document.addEventListener('DOMContentLoaded', initMermaid, { once: true });

// Código longo (> 22 linhas): um único <pre> com o final oculto + botão na base do bloco
document.querySelectorAll('pre.code').forEach(pre => {
  const lines = pre.innerHTML.replace(/\n$/, '').split('\n');
  if (lines.length <= 22) return;
  const keep = 14;
  const wrap = document.createElement('div');
  wrap.className = 'codewrap';
  pre.before(wrap);
  pre.innerHTML = lines.slice(0, keep).join('\n') + `<span class="more">\n${lines.slice(keep).join('\n')}</span>`;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'code-toggle';
  btn.setAttribute('aria-expanded', 'false');
  const label = () => btn.textContent = wrap.classList.contains('open') ? '− recolher código' : `+ ver código completo (${lines.length} linhas)`;
  btn.onclick = () => {
    const open = wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    label();
    // ao recolher, volta ao topo do bloco se ele saiu da tela
    if (!open && wrap.getBoundingClientRect().top < 0) wrap.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  label();
  wrap.append(pre, btn);
});

// Executa fn quando o elemento entra na tela (uma vez)
function onVisible(el, fn) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); fn(); } }), { threshold: .3 });
  io.observe(el);
}

// Terminais "digitados": <pre data-type> revela linha a linha. Todas as linhas já ocupam espaço
// (ficam invisíveis até a vez delas), então o terminal não muda de altura e nada abaixo se desloca.
document.querySelectorAll('pre[data-type]').forEach(pre => {
  if (REDUCED) return;   // sem animação: conteúdo aparece completo
  const speed = +pre.dataset.type || 90;
  pre._full = pre.innerHTML;
  pre.innerHTML = pre._full.split('\n').map(l => `<span class="ln">${l}</span>`).join('\n');
  const lines = [...pre.querySelectorAll(':scope > .ln')];
  lines[0].classList.add('cur');
  onVisible(pre, () => {
    let i = 0;
    const tick = () => {
      if (pre._done || i >= lines.length) { lines.forEach(l => l.classList.remove('cur')); return; }
      const ln = lines[i++];
      lines.forEach(l => l.classList.remove('cur'));
      ln.classList.add('on', 'cur');
      const over = ln.getBoundingClientRect().bottom - pre.getBoundingClientRect().bottom + 14;
      if (over > 0) pre.scrollTop += over;           // terminais com rolagem interna acompanham a linha
      setTimeout(tick, ln.textContent.startsWith('$') ? speed * 5 : speed);
    };
    tick();
  });
});

// Simulação do pipeline (Etapa 1)
// Cada clique reinicia do zero: cancela os timers da execução anterior, zera cards e mensagem.
document.querySelectorAll('[data-pipe]').forEach(box => {
  const stages = [...box.querySelectorAll('.stage')];
  const out = box.querySelector('.pipe-out');
  const btns = [...box.querySelectorAll('button[data-scn]')];
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const reset = () => {
    timers.forEach(clearTimeout);
    timers = [];
    stages.forEach(s => s.className = 'stage');
    out.innerHTML = '';
    btns.forEach(x => { x.classList.remove('running'); x.setAttribute('aria-pressed', 'false'); });
  };
  const resetBtn = box.querySelector('[data-reset]');
  if (resetBtn) resetBtn.addEventListener('click', reset);   // volta ao estado inicial, cancelando a execução em andamento
  btns.forEach(b => b.addEventListener('click', () => {
    reset();
    b.classList.add('running');
    b.setAttribute('aria-pressed', 'true');
    const failAt = b.dataset.scn === 'leak' ? stages.findIndex(s => s.dataset.id === 'secrets') : -1;
    const done = html => { out.innerHTML = html; b.classList.remove('running'); };
    let i = 0;
    const next = () => {
      if (i > 0) stages[i - 1].className = 'stage ' + (i - 1 === failAt ? 'fail' : 'pass');
      if (i > 0 && i - 1 === failAt) {
        stages.slice(i).forEach(s => s.className = 'stage skip');     // só os seguintes, depois do bloqueio
        return done('<span class="r">✖ Pipeline bloqueado:</span> Trufflehog encontrou segredo VERIFICADO (WhatsApp Cloud API token) em <code>engagement_hub/channels/whatsapp.py:14</code>. Deploy cancelado.');
      }
      if (i >= stages.length) return done('<span class="g">✔ Todos os gates passaram.</span> Imagem assinada e publicada em staging.');
      stages[i++].className = 'stage run';
      later(next, 900);
    };
    later(next, 120);                                                 // o estado neutro aparece antes de recomeçar
  }));
});

// Stream de logs estruturados (Etapa 3)
const stream = document.getElementById('logstream');
if (stream) {
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const ip = () => `189.${10 + Math.floor(Math.random() * 90)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  const gens = [
    () => ({ event: 'auth.login.success', service: 'api-gateway', user_id: 'u-' + (1000 + Math.floor(Math.random() * 8999)), role: rnd(['consultor', 'gestor']), dealer_id: 'DLR-' + (100 + Math.floor(Math.random() * 335)), ip: ip(), severity: 'INFO' }),
    () => ({ event: 'auth.login.failure', service: 'api-gateway', username: rnd(['consultor.sp045', 'gestor.rj', 'admin']), reason: 'invalid_password', attempt: 1 + Math.floor(Math.random() * 4), ip: ip(), severity: 'WARN' }),
    () => ({ event: 'iot.telemetry.ingest', service: 'iot-ingestor', device_id: 'TCU-' + Math.random().toString(16).slice(2, 8).toUpperCase(), vin_hash: 'sha256:' + Math.random().toString(16).slice(2, 10), msgs: 1 + Math.floor(Math.random() * 20), severity: 'INFO' }),
    () => ({ event: 'ml.prediction', service: 'prediction-hub', model: 'churn_rf_v3.2', latency_ms: 20 + Math.floor(Math.random() * 60), customer_health_score: Math.floor(Math.random() * 1000), severity: 'INFO' }),
    () => ({ event: 'engagement.message.sent', service: 'engagement-hub', channel: rnd(['whatsapp', 'sms', 'email']), segment: rnd(['cliente-urbano-leve', 'motorista-de-aplicativo', 'usuario-off-road', 'premium-baixa-km', 'cliente-economico', 'profissional-autonomo']), status: 'delivered', severity: 'INFO' }),
    () => ({ event: 'mobile.session.start', service: 'mobile-bff', app_version: '2.4.1', os: rnd(['android', 'ios']), root_detected: false, severity: 'INFO' }),
  ];
  const specials = [
    { event: 'authz.access.denied', service: 'customer360-api', user_id: 'u-4471', role: 'consultor', resource: '/v1/customers?dealer_id=DLR-212', reason: 'dealer_scope_violation', severity: 'HIGH' },
    { event: 'config.critical.changed', service: 'admin-console', user_id: 'u-0007', role: 'admin', change: 'rate_limit.login=10/min→5/min', severity: 'NOTICE' },
  ];
  const col = { INFO: 'b', WARN: 'y', NOTICE: 'f', HIGH: 'r' };
  let n = 0;
  const push = () => {
    const e = (++n % 7 === 0) ? specials[(n / 7) % specials.length] : rnd(gens)();
    // formato compacto: hora  SEV  evento  serviço  k=v (JSON completo nos exemplos de referência)
    const { event, service, severity, ...rest } = e;
    const kv = Object.entries(rest).slice(0, 3).map(([k, v]) => `${k}=${v}`).join(' ');
    const line = document.createElement('div');
    line.innerHTML = `<span class="muted">${new Date().toTimeString().slice(0, 8)}</span>  <span class="${col[severity]}">${severity.padEnd(6)}</span> ${event.padEnd(24)} <span class="muted">${service.padEnd(16)}</span> ${kv}`;
    stream.append(line);
    while (stream.children.length > 40) stream.firstChild.remove();
    stream.scrollTop = stream.scrollHeight;
  };
  if (REDUCED) for (let i = 0; i < 14; i++) push();
  else setInterval(push, 1100);
}

// Dashboard / alerta (Etapa 3)
const dash = document.getElementById('dash');
if (dash) {
  const bars = dash.querySelector('.bars');
  const vals = Array.from({ length: 30 }, () => 20 + Math.random() * 25);
  const render = hot => bars.innerHTML = vals.map((v, i) => `<span style="height:${Math.min(v, 100)}%"${hot && i >= vals.length - 3 ? ' class="hot"' : ''}></span>`).join('');
  render();
  if (!REDUCED) setInterval(() => { vals.shift(); vals.push(20 + Math.random() * 25); render(); }, 1500);
  dash.querySelector('#fire').onclick = () => {
    vals.splice(-3, 3, 88, 95, 100);
    render(true);
    dash.querySelector('#rps').textContent = '4.812';
    const a = dash.querySelector('.alert');
    a.classList.remove('on'); void a.offsetWidth; a.classList.add('on');
  };
}

// Timeline PICERL (Etapa 3)
document.querySelectorAll('.tl').forEach(tl => {
  const steps = [...tl.querySelectorAll('.step')];
  const btn = document.getElementById(tl.dataset.replay);
  let timers = [];
  const play = () => {
    timers.forEach(clearTimeout);
    steps.forEach(s => s.classList.remove('on'));
    if (btn) btn.disabled = true;
    timers = steps.map((s, i) => setTimeout(() => {
      s.classList.add('on');
      if (i === steps.length - 1 && btn) btn.disabled = false;
    }, 700 * (i + 1)));
  };
  onVisible(tl, play);
  if (btn) btn.onclick = play;
});

// Intro de abertura (páginas com body[data-intro]); o script do <head> decide quando mostrar
(function () {
  const html = document.documentElement;
  if (!document.body.hasAttribute('data-intro') || !html.classList.contains('intro-pending')) return;

  const total = REDUCED ? 600 : 2800;          // tempo em tela antes do fade-out (~3,3s com o fade)
  const intro = document.createElement('div');
  intro.className = 'intro';
  intro.setAttribute('role', 'presentation');
  intro.style.setProperty('--dur', total + 'ms');
  intro.innerHTML = `
    <div class="intro-grid"></div>
    <picture>
      <source srcset="assets/img/hero-ford.webp" type="image/webp">
      <img src="assets/img/hero-ford-900.jpg" width="900" height="1350" alt="" decoding="async" fetchpriority="high">
    </picture>
    <div class="intro-txt"><b>VIN Share <span>·</span> SecOps</b><small>FIAP · Ford Challenge · Sprint 3 — Cybersecurity</small></div>
    <div class="intro-bar"></div>
    <button type="button" class="intro-skip">pular ⏎</button>`;
  document.body.append(intro);
  html.classList.add('intro-lock');            // página travada (sem scrollbar) durante a intro
  html.classList.remove('intro-pending');      // a intro assume a capa preta

  const img = intro.querySelector('img');
  let shown = false;
  const show = () => {
    if (shown) return;
    shown = true;
    requestAnimationFrame(() => intro.classList.add('show'));
  };
  if (img.complete) show(); else { img.addEventListener('load', show, { once: true }); img.addEventListener('error', show, { once: true }); setTimeout(show, 400); }

  let done = false;
  const t0 = performance.now();
  const end = e => {
    if (done) return;
    if (e) {
      // ignora "ruído" do próprio recarregamento: eventos nos primeiros 350ms,
      // tecla segurada (repeat), F5 e atalhos com Ctrl/Cmd (Ctrl+R)
      if (performance.now() - t0 < 350) return;
      if (e.type === 'keydown' && (e.repeat || e.key === 'F5' || e.ctrlKey || e.metaKey ||
          ['Control', 'Meta', 'Shift', 'Alt'].includes(e.key))) return;
    }
    done = true;
    intro.classList.add('out');
    html.classList.remove('intro-lock');
    ['click', 'keydown', 'wheel', 'touchstart'].forEach(ev => removeEventListener(ev, end, true));
    setTimeout(() => intro.remove(), REDUCED ? 50 : 500);
  };
  ['click', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, end, { capture: true, passive: true }));
  setTimeout(end, total);
})();

// Impressão: abre os <details> (tabelas da Etapa 4) e completa os terminais animados; restaura depois
(function () {
  let opened = [];
  addEventListener('beforeprint', () => {
    opened = [...document.querySelectorAll('details:not([open])')];
    opened.forEach(d => d.open = true);
    document.querySelectorAll('pre[data-type]').forEach(p => {
      if (p._full) { p._done = true; p.innerHTML = p._full; p.classList.remove('cursor'); }
    });
  });
  addEventListener('afterprint', () => { opened.forEach(d => d.open = false); opened = []; });
})();

// Index: popover com os integrantes (fecha com clique fora, Esc ou no próprio botão)
(function () {
  const btn = document.querySelector('.team-btn'), pop = document.getElementById('team-pop');
  if (!btn || !pop) return;
  const close = (focusBtn = true) => {
    if (pop.hidden) return;
    pop.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (focusBtn) btn.focus();
  };
  btn.addEventListener('click', () => {
    if (!pop.hidden) return close();
    pop.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    pop.focus();
  });
  document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target) && e.target !== btn) close(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) close(); });
  pop.addEventListener('focusout', e => { if (!pop.contains(e.relatedTarget) && e.relatedTarget !== btn) close(false); });
})();

// Número grande do topo: nunca sai da tela (>= 24px da borda direita) e, na troca de página,
// conta do número anterior até o atual, junto com o sublinhado da navbar (estilo odômetro)
(function () {
  const n = document.querySelector('.hero .num');
  if (!n) return;
  const fit = () => {
    n.style.translate = '';
    const over = n.getBoundingClientRect().right - (document.documentElement.clientWidth - 24);
    if (over > 0) n.style.translate = `${-Math.ceil(over)}px 0`;
  };
  fit();
  FONTS_READY.then(fit);
  addEventListener('resize', fit);

  const pad = v => String(v).padStart(2, '0');
  const w = window.__vsWalk;
  n.innerHTML = `<span class="d">${w ? pad(w.from) : n.textContent.trim()}</span>`;
  if (!w) return;
  const ease = 'cubic-bezier(.2,.7,.2,1)', t = WALK_STEP * .9;
  document.addEventListener('vs:navstep', e => {
    const { i, dir } = e.detail;
    const old = n.querySelector('.d:last-child');
    const nw = document.createElement('span');
    nw.className = 'd';
    nw.textContent = pad(i);
    n.append(nw);
    // subindo: o atual sai por cima e o próximo entra de baixo; descendo, o contrário
    const off = dir > 0 ? 60 : -60;
    nw.animate([{ transform: `translateY(${off}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: t, easing: ease });
    if (old) {
      old.style.cssText = 'position:absolute;left:0;top:0';
      old.animate([{ transform: 'none', opacity: 1 }, { transform: `translateY(${-off}%)`, opacity: 0 }], { duration: t, easing: ease, fill: 'forwards' })
        .onfinish = () => old.remove();
    }
  });
})();

// Etapa 4: tela de encerramento depois do rodapé, com efeito "cortina" (rolagem normal, nada é interceptado).
// O fim da página (conteúdo + rodapé) fica preso embaixo (sticky) e o encerramento sobe por cima dele.
(function () {
  const closing = document.getElementById('encerramento');
  const main = document.querySelector('main'), foot = document.querySelector('footer');
  if (!closing || !main || !foot) return;
  const wrap = document.createElement('div');
  wrap.className = 'page-end';
  const hint = document.createElement('p');
  hint.className = 'scroll-hint';
  hint.innerHTML = '<span aria-hidden="true">↓</span> continue rolando';
  main.before(wrap);
  wrap.append(main, hint, foot);
  if (!REDUCED) {
    // preso quando a base do bloco encosta na base da tela: top = altura da tela − altura do bloco
    const fit = () => wrap.style.setProperty('--end-top', (innerHeight - wrap.offsetHeight) + 'px');
    fit();
    new ResizeObserver(fit).observe(wrap);
    addEventListener('resize', fit);
    document.documentElement.classList.add('has-curtain');
  }
  // foto/texto entram em cena; o índice "Nesta página" some enquanto o encerramento está na tela
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) closing.classList.add('in');
    document.body.classList.toggle('closing-on', e.intersectionRatio > .25);
  }), { threshold: [0, .25, .5] }).observe(closing);
})();
