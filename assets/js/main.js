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
    pages.map((p, i) => `<li><a href="${p[0]}"${i === cur ? ' class="active"' : ''}>${p[1]}</a></li>`).join('')}</ul></div>`;
  document.body.prepend(nav);

  const main = document.querySelector('main');
  if (cur >= 0 && main) {
    const pn = document.createElement('div');
    pn.className = 'pn';
    pn.innerHTML = (cur > 0 ? `<a class="btn ghost" href="${pages[cur - 1][0]}">← ${pages[cur - 1][1]}</a>` : '<span></span>') +
      (cur < pages.length - 1 ? `<a class="btn" href="${pages[cur + 1][0]}">${pages[cur + 1][1]} →</a>` : '');
    main.append(pn);
  }
  const f = document.createElement('footer');
  f.innerHTML = 'FIAP · Ford Challenge · Sprint 3 — Cybersecurity · Turma 3ESPV · Conteúdo técnico ilustrativo (mocado) para fins acadêmicos';
  document.body.append(f);
})();

// Mermaid
if (window.mermaid) {
  mermaid.initialize({ startOnLoad: true, theme: 'dark', securityLevel: 'strict', themeVariables: { fontFamily: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif', fontSize: '15px' }, flowchart: { curve: 'basis', padding: 14, wrappingWidth: 260 } });
}

// Executa fn quando o elemento entra na tela (uma vez)
function onVisible(el, fn) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); fn(); } }), { threshold: .3 });
  io.observe(el);
}

// Terminais "digitados": <pre data-type> revela linha a linha
document.querySelectorAll('pre[data-type]').forEach(pre => {
  const lines = pre.innerHTML.split('\n');
  const speed = +pre.dataset.type || 90;
  pre.innerHTML = '';
  pre.classList.add('cursor');
  onVisible(pre, () => {
    let i = 0;
    const tick = () => {
      if (i >= lines.length) { pre.classList.remove('cursor'); return; }
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
  setInterval(() => {
    const e = (++n % 7 === 0) ? specials[(n / 7) % specials.length] : rnd(gens)();
    // formato compacto: hora  SEV  evento  serviço  k=v (JSON completo nos exemplos de referência)
    const { event, service, severity, ...rest } = e;
    const kv = Object.entries(rest).slice(0, 3).map(([k, v]) => `${k}=${v}`).join(' ');
    const line = document.createElement('div');
    line.innerHTML = `<span class="muted">${new Date().toTimeString().slice(0, 8)}</span>  <span class="${col[severity]}">${severity.padEnd(6)}</span> ${event.padEnd(24)} <span class="muted">${service.padEnd(16)}</span> ${kv}`;
    stream.append(line);
    while (stream.children.length > 40) stream.firstChild.remove();
    stream.scrollTop = stream.scrollHeight;
  }, 1100);
}

// Dashboard / alerta (Etapa 3)
const dash = document.getElementById('dash');
if (dash) {
  const bars = dash.querySelector('.bars');
  const vals = Array.from({ length: 30 }, () => 20 + Math.random() * 25);
  const render = hot => bars.innerHTML = vals.map((v, i) => `<span style="height:${Math.min(v, 100)}%"${hot && i >= vals.length - 3 ? ' class="hot"' : ''}></span>`).join('');
  render();
  setInterval(() => { vals.shift(); vals.push(20 + Math.random() * 25); render(); }, 1500);
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
