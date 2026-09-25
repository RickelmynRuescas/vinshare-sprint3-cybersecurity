# Escopo — Sprint 3 Cybersecurity · VIN Share / Ford Customer 360

**Turma:** 3ESPV · **Entrega:** site estático publicado na Vercel (link enviado como entrega)

**Alunos:** Heloísa Fleury Jardim (RM556378) · Juan Fuentes Rufino (RM557673) · Rickelmyn de Souza Ruescas (RM556055) · Paulo Henrique Monteiro Golovanevsky (RM555300) · Pedro Henrique Silva Batista (RM558137)

## Projeto base
VIN Share / Ford Customer 360: camada de inteligência para retenção pós-venda na rede autorizada.
Hubs: Customer 360, Behavior Intelligence, Prediction, Engagement & Recommendation. Canais: WhatsApp, SMS, E-mail.
Métricas: Vehicle Health Score e Customer Health Score (0–1000). Base: ~602.788 serviços, 175.554 veículos, 435 concessionárias.
Stack: Python/pandas, Jupyter, SQLite, scikit-learn, Streamlit, FastAPI.

## Etapas e entregáveis
| # | Etapa | Peso | Entregáveis |
|---|-------|------|-------------|
| 1 | Pipeline DevSecOps & Análise de Código | 3,0 | SDLC×SSDLC; diagrama CI/CD com pontos Semgrep/Trufflehog; `.pre-commit-config.yaml` + bloqueio simulado; workflow GitHub Actions; regras + resultados Semgrep; resultados Trufflehog; pesquisa SCA e Container Security |
| 2 | Segurança em Código e Infraestrutura | 2,5 | Criptografia local; hardening de API (rate limit, validação, JWT seguro); RBAC; trechos antes/depois; commits; explicações |
| 3 | Logs, Alertas e Resposta a Incidentes | 2,0 | Plano de monitoramento (API, mobile, IoT, ML); logs JSON; ELK; regras estilo Suricata; PICERL sem Lições Aprendidas |
| 4 | Pesquisa OWASP | 2,5 | OWASP Top 10, API Top 10, Mobile Top 10, ASVS; matriz de mapeamento; análise de riscos; plano de mitigação |

## Perfis RBAC (adaptados ao contexto Ford)
- **Consultor de Serviço** (Brigadista) — opera a própria concessionária
- **Gestor** (Gestor) — visão regional/da concessionária, relatórios
- **Administrador** (Administrador) — Ford, configuração global

Nomes originais do professor aparecem entre parênteses na primeira menção.

## Decisões
- Site multi-página HTML/CSS/JS puro: `index.html` + 1 página por etapa, nav fixa em todas.
- Diagramas em Mermaid.js (CDN), embutidos no HTML.
- Animações apenas onde reforçam o conteúdo: pipeline rodando, logs em streaming, indicador pulsante, alerta piscando, timeline PICERL.
- Todo conteúdo (código, prints, commits, logs, alertas) é **mocado/ilustrativo**, amarrado ao VIN Share.
- Deploy: Vercel como site estático (sem build).
