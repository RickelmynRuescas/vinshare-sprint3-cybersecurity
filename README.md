# VIN Share · Sprint 3 — Cybersecurity

Entrega de segurança do projeto **VIN Share / Ford Customer 360**: uma camada de inteligência sobre os sistemas existentes da Ford para aumentar a retenção pós-venda na rede de concessionárias autorizadas.

> **O que é o VIN Share:** a métrica que mede o percentual da frota circulante de veículos Ford (VINs) que continua fazendo manutenção e revisões na rede de concessionárias autorizadas. Após o fim da garantia (3º ao 5º ano), até 60–70% da frota migra para o mercado independente.

🔗 **Site publicado:** https://vinshare-sprint3-cybersecurity.vercel.app

## Contexto

| | |
|---|---|
| Desafio | Ford Challenge |
| Instituição | FIAP |
| Entrega | Sprint 3 — Cybersecurity |
| Turma | 3ESPV |

## Integrantes

| Nome | RM |
|---|---|
| Heloísa Fleury Jardim | RM556378 |
| Juan Fuentes Rufino | RM557673 |
| Rickelmyn de Souza Ruescas | RM556055 |
| Paulo Henrique Monteiro Golovanevsky | RM555300 |
| Pedro Henrique Silva Batista | RM558137 |

## O que foi entregue

| Etapa | Peso | Principais tópicos | Página |
|---|---|---|---|
| 1 · Pipeline DevSecOps & Análise de Código | 3,0 | SDLC × SSDLC (shift-left), diagrama CI/CD, Semgrep (regras e varreduras), Trufflehog (pre-commit + GitHub Actions), pesquisa de SCA e Container Security | [etapa1-devsecops.html](https://vinshare-sprint3-cybersecurity.vercel.app/etapa1-devsecops.html) |
| 2 · Segurança em Código e Infraestrutura | 2,5 | Criptografia local (Fernet, Argon2id), hardening de API (rate limit, validação, JWT), RBAC (Consultor de Serviço, Gestor, Administrador), MQTT/TLS para IoT, IaC Security, commits | [etapa2-codigo-infra.html](https://vinshare-sprint3-cybersecurity.vercel.app/etapa2-codigo-infra.html) |
| 3 · Logs, Alertas e Resposta a Incidentes | 2,0 | Plano de monitoramento, logs JSON estruturados, stack ELK, regras estilo Suricata, gatilhos de alerta (API, mobile, IoT, ML), SANS PICERL | [etapa3-logs-incidentes.html](https://vinshare-sprint3-cybersecurity.vercel.app/etapa3-logs-incidentes.html) |
| 4 · Pesquisa de Vulnerabilidades (OWASP) | 2,5 | OWASP Top 10, API Top 10, Mobile Top 10, ASVS, matriz de mapeamento, STRIDE, LGPD, heatmap de riscos, plano de mitigação e de segurança contínua | [etapa4-owasp.html](https://vinshare-sprint3-cybersecurity.vercel.app/etapa4-owasp.html) |

O `index.html` traz a visão geral do projeto, a arquitetura com a superfície de ataque e o checklist de conformidade, que liga cada entregável à seção onde ele está.

## Estrutura

```
vinshare-sprint3-cybersecurity/
├── index.html                   # visão geral + checklist de conformidade
├── etapa1-devsecops.html        # Etapa 1 — Pipeline DevSecOps
├── etapa2-codigo-infra.html     # Etapa 2 — Código e Infraestrutura
├── etapa3-logs-incidentes.html  # Etapa 3 — Logs, Alertas e Incidentes
├── etapa4-owasp.html            # Etapa 4 — OWASP, riscos e LGPD
├── assets/
│   ├── css/style.css            # tema, layout e animações
│   └── js/main.js               # nav, Mermaid, terminais, logs ao vivo, pipeline, timeline
├── escopo-projeto.md            # escopo e decisões da entrega
└── README.md
```

## Stack e como rodar

- **HTML, CSS e JavaScript puros**, sem framework e **sem build**.
- **Mermaid.js** (via CDN) para os diagramas.
- Fontes Inter e JetBrains Mono (Google Fonts).

Para rodar localmente, abra o `index.html` no navegador, ou sirva a pasta:

```bash
python -m http.server 8000
# acesse http://localhost:8000
```

Os diagramas e as fontes precisam de internet, porque vêm de CDN. O deploy é feito na Vercel como site estático: cada push na `main` publica automaticamente.

## Aviso

Todos os códigos, saídas de terminal, commits, logs, alertas e dashboards do site são **exemplos ilustrativos (mocados)** para fins acadêmicos. Eles foram construídos de forma coerente com a arquitetura do VIN Share para demonstrar o entendimento dos controles de segurança, e não representam um sistema em produção.

## Escopo

As etapas, os entregáveis esperados e as decisões de formato estão documentados em [`escopo-projeto.md`](escopo-projeto.md).
