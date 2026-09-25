const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WALK_STEP = 160;   // ms por item: sublinhado da navbar e contagem do número grande

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
  nav.innerHTML = `<div class="nav-in"><a class="brand" href="index.html">VIN Share <span>· SecOps</span></a><ul>${
    pages.map((p, i) => i === cur
      ? `<li><a href="${p[0]}" class="active" aria-current="page">${p[1]}</a></li>`
      : `<li><a href="${p[0]}">${p[1]}</a></li>`).join('')}</ul></div>`;
  nav.insertAdjacentHTML('beforeend', '<div class="progress"></div>');
  document.body.prepend(nav);
  // altura real da navbar (usada pelo índice sticky e pelo scroll-margin das âncoras)
  const setNavH = () => document.documentElement.style.setProperty('--navh', nav.offsetHeight + 'px');
  setNavH();
  addEventListener('resize', setNavH);
  // mobile: navbar em uma linha com rolagem; mantém o item ativo visível
  const navUl = nav.querySelector('ul'), navAct = nav.querySelector('a.active');
  const keepActiveVisible = smooth => {
    if (navAct && navUl.scrollWidth > navUl.clientWidth)
      navUl.scrollTo({ left: navAct.parentElement.offsetLeft - (navUl.clientWidth - navAct.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
  };

  // sublinhado do item ativo: na troca de página "caminha" do item anterior até o ativo, item a item
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
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    if (!navAct) return;
    if (!walk) { place(navAct); return; }
    place(links[from]);
    const dir = cur > from ? 1 : -1, dur = WALK_STEP;
    ind.style.setProperty('--step', dur + 'ms');
    ind.getBoundingClientRect();                     // aplica a posição inicial antes de ligar a transição
    ind.classList.add('walk');
    let i = from;
    const step = () => {
      i += dir;
      place(links[i]);
      document.dispatchEvent(new CustomEvent('vs:navstep', { detail: { i, dir, dur } }));
      if (i !== cur) setTimeout(step, dur);
      else setTimeout(() => { ind.classList.remove('walk'); walking = false; keepActiveVisible(true); }, dur);
    };
    requestAnimationFrame(step);
  });
  addEventListener('resize', () => { if (navAct && !walking) place(navAct); });
  // guarda o item atual para a próxima página (F5 cai no mesmo item: sem caminhada)
  addEventListener('pagehide', () => { try { if (cur >= 0) sessionStorage.setItem('vs-nav-from', cur); } catch (e) {} });
  addEventListener('pageshow', e => { if (e.persisted) try { sessionStorage.removeItem('vs-nav-from'); } catch (x) {} });

  const main = document.querySelector('main');
  if (cur >= 0 && main) {
    const pn = document.createElement('div');
    pn.className = 'pn';
    pn.innerHTML = (cur > 0 ? `<a class="btn ghost" href="${pages[cur - 1][0]}">← ${pages[cur - 1][1]}</a>` : '<span></span>') +
      (cur < pages.length - 1 ? `<a class="btn" href="${pages[cur + 1][0]}">${pages[cur + 1][1]} →</a>`
        : '<a class="btn" href="index.html#checklist">Voltar à visão geral →</a>');
    main.append(pn);
  }
  const f = document.createElement('footer');
  f.innerHTML = '<p>FIAP · Ford Challenge · Sprint 3 — Cybersecurity · Turma 3ESPV</p>';
  document.body.append(f);

  // barra de progresso de leitura
  const bar = nav.querySelector('.progress');
  const upd = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
  };
  addEventListener('scroll', upd, { passive: true });
  addEventListener('resize', upd);
  upd();

  // brilho que segue o cursor (só desktop, sem reduced-motion)
  if (matchMedia('(pointer:fine)').matches && !REDUCED) {
    const g = document.createElement('div');
    g.className = 'glow';
    document.body.prepend(g);
    addEventListener('pointermove', e => {
      g.style.setProperty('--mx', e.clientX + 'px');
      g.style.setProperty('--my', e.clientY + 'px');
      g.classList.add('on');
    }, { passive: true });
    document.addEventListener('pointerleave', () => g.classList.remove('on'));
  }
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
  const io = new IntersectionObserver(es => {
    const vis = es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (vis.length) setActive(vis[0].target.id);
  }, { rootMargin: '-80px 0px -65% 0px' });
  heads.forEach(h => io.observe(h));
  setActive(heads[0].id);
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
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => mermaid.run({ querySelector: '.mermaid' }));
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

// Terminais "digitados": <pre data-type> revela linha a linha
document.querySelectorAll('pre[data-type]').forEach(pre => {
  if (REDUCED) return;   // sem animação: conteúdo aparece completo
  const lines = pre.innerHTML.split('\n');
  const speed = +pre.dataset.type || 90;
  pre._full = pre.innerHTML;
  pre.innerHTML = '';
  pre.classList.add('cursor');
  onVisible(pre, () => {
    let i = 0;
    const tick = () => {
      if (pre._done || i >= lines.length) { pre.classList.remove('cursor'); return; }
      pre.innerHTML += (i ? '\n' : '') + lines[i++];
      pre.scrollTop = pre.scrollHeight;
      setTimeout(tick, lines[i - 1].startsWith('$') ? speed * 5 : speed);
    };
    tick();
  });
});

// Simulação do pipeline (Etapa 1)
document.querySelectorAll('[data-pipe]').forEach(box => {
  const stages = [...box.querySelectorAll('.stage')];
  const out = box.querySelector('.pipe-out');
  box.querySelectorAll('button[data-scn]').forEach(b => b.onclick = () => {
    const failAt = b.dataset.scn === 'leak' ? stages.findIndex(s => s.dataset.id === 'secrets') : -1;
    stages.forEach(s => s.className = 'stage');
    box.querySelectorAll('button').forEach(x => x.disabled = true);
    out.textContent = '';
    let i = 0;
    const next = () => {
      if (i > 0) stages[i - 1].className = 'stage ' + (i - 1 === failAt ? 'fail' : 'pass');
      if (i - 1 === failAt) {
        stages.slice(i).forEach(s => s.className = 'stage skip');
        out.innerHTML = '<span class="r">✖ Pipeline bloqueado:</span> Trufflehog encontrou segredo VERIFICADO (WhatsApp Cloud API token) em <code>engagement_hub/channels/whatsapp.py:14</code>. Deploy cancelado.';
        return box.querySelectorAll('button').forEach(x => x.disabled = false);
      }
      if (i >= stages.length) {
        out.innerHTML = '<span class="g">✔ Todos os gates passaram.</span> Imagem assinada e publicada em staging.';
        return box.querySelectorAll('button').forEach(x => x.disabled = false);
      }
      stages[i++].className = 'stage run';
      setTimeout(next, 900);
    };
    next();
  });
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

// Impressão: abre <details>, completa terminais; restaura depois
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

// Número grande do topo nunca sai da tela (garante >= 24px da borda direita em qualquer largura)
(function () {
  const n = document.querySelector('.hero .num');
  if (!n) return;
  const fit = () => {
    n.style.translate = '';
    const over = n.getBoundingClientRect().right - (document.documentElement.clientWidth - 24);
    if (over > 0) n.style.translate = `${-Math.ceil(over)}px 0`;
  };
  fit();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
  addEventListener('resize', fit);
})();

// Número grande: na troca de página conta do número anterior até o atual, junto com o sublinhado
(function () {
  const n = document.querySelector('.hero .num');
  if (!n) return;
  const pad = v => String(v).padStart(2, '0');
  const final = n.textContent.trim();
  const w = window.__vsWalk;
  n.innerHTML = `<span class="d">${w ? pad(w.from) : final}</span>`;
  if (!w) return;
  const ease = 'cubic-bezier(.2,.7,.2,1)';
  document.addEventListener('vs:navstep', e => {
    const { i, dir, dur } = e.detail;
    const old = n.querySelector('.d:last-child');
    const nw = document.createElement('span');
    nw.className = 'd';
    nw.textContent = pad(i);
    n.append(nw);
    // subindo: o atual sai por cima e o próximo entra de baixo; descendo, o contrário
    const off = dir > 0 ? 60 : -60, t = dur * .9;
    nw.animate([{ transform: `translateY(${off}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: t, easing: ease });
    if (old) {
      old.style.cssText = 'position:absolute;left:0;top:0';
      old.animate([{ transform: 'none', opacity: 1 }, { transform: `translateY(${-off}%)`, opacity: 0 }], { duration: t, easing: ease, fill: 'forwards' })
        .onfinish = () => old.remove();
    }
  });
})();
