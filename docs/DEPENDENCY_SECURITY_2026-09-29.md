# Atualização controlada de dependências — 29/09/2026

## Escopo e commits

Sprint preservada no commit local `e305631cbd60a8dc5cb07c19f7df3a48cb1f1594`. Este relatório pertence ao segundo commit, exclusivo de segurança de dependências e sua verificação. O relatório anterior de estabilização descreve o estado anterior ao primeiro commit.

Sem push, merge, deploy, aplicação de SQL ou alteração de migrations, fontes da aplicação, regras comerciais, integrações ou modelo de dados nesta atualização. Testes de banco executam em PGlite local. O site publicado ainda não recebeu estas correções.

## Escolha da versão

Next.js e eslint-config-next: **16.2.4 → 16.3.6**, fixados exatamente no package.json. A versão 16.3.6 é a estável indicada pelo registro npm nesta conferência. Além das correções identificadas pelo audit, ela contempla o [advisory oficial GHSA-vcvr-r3jv-pc5j](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j), cuja correção na linha 16.x é 16.3.6. [Release oficial](https://github.com/vercel/next.js/releases/tag/v16.3.6).

Esse último advisory não apareceu no JSON inicial do npm audit: a consulta às fontes oficiais complementou o audit. Não foram encontrados usos de ImageResponse/next/og nos fontes do aplicativo; isso não dispensa atualizar o pacote afetado.

React e React DOM permanecem **19.2.4**. Os peers do Next 16.3.6 aceitam `^19.0.0`; eslint-config-next aceita ESLint `>=9.0.0` e TypeScript `>=3.3.1`. Não houve motivo de compatibilidade para atualizar React. Node requerido pelo Next: `>=20.9.0`.

Únicas mudanças no package.json:

```diff
- "next": "16.2.4",
+ "next": "16.3.6",
- "eslint-config-next": "16.2.4",
+ "eslint-config-next": "16.3.6",
```

Demais dependências diretas, scripts e versões do aplicativo mobile preservados. O lockfile atualiza a árvore do Next (SWC, sharp/libvips, PostCSS, nanoid), do eslint-config-next e os oito transitivos que continuaram vulneráveis: `@babel/core`, `baseline-browser-mapping`, `brace-expansion`, `browserslist`, `dompurify`, `fflate`, `js-yaml`, `ws`. Helpers e dados associados dessas árvores foram resolvidos pelo npm. Sem overrides, atualização geral ou `npm audit fix --force`.

Comandos de alteração:

```sh
npm install --save-exact next@16.3.6 eslint-config-next@16.3.6
npm update @babel/core baseline-browser-mapping brace-expansion browserslist dompurify fflate js-yaml ws
npm install
```

## Auditoria e limites

Antes: **12 pacotes vulneráveis: 1 crítico, 7 altos, 3 moderados e 1 baixo**, abrangendo 58 IDs de advisory distintos. Contagem de pacotes do npm não é contagem de CVEs nem prova de exploração de todos os caminhos na aplicação.

Depois: **zero vulnerabilidades** no `npm audit` completo e no `npm audit --omit=dev`. Não há dependência vulnerável remanescente reportada nesta consulta. Depois apenas do upgrade de Next restavam oito pacotes; a atualização direcionada desses transitivos zerou o resultado. O audit depende da base publicada naquele momento e não substitui uma auditoria do código.

JSONs completos, árvore inicial e logs locais em `medinexus-web/artifacts/security-update/` (ignorados pelo Git). Abaixo são preservados no repositório os advisories, severidades, caminhos e versões conferidos.

## Verificação executada

- `npm install`: sucesso. Avisos do npm 12 sobre scripts opcionais não autorizados de core-js/unrs-resolver; não foi habilitada execução ampla de scripts. Build/lint/resolução de módulos passaram.
- `npm run typecheck`: sucesso.
- `npm run lint`: sucesso, **0 erros e 18 avisos preexistentes**. Primeira execução percorreu cópias de build em `artifacts`; acrescentada exclusão apenas dessa pasta gerada ao ESLint. Não foram desativadas regras de fontes.
- `npm test`: **71/71**, incluindo permissões, cadastro, recuperação e migrations em banco local.
- `npm run build`: sucesso, **45 páginas geradas**, Next 16.3.6, com `VERCEL=1` para verificar os headers condicionais.
- Mobile: TypeScript aprovado, **16/16 testes**. Sem alteração de Expo, React Native ou suas dependências; sem builds assinados/lojas/aparelhos reais nesta etapa.
- `scripts/check-stabilization.mjs`: aprovado; login dos três perfis, senhas legadas, RoleGuard, cadastro bloqueado por tipo, cadastro novo aguardando e-mail, recuperação comum/expirada/válida e headers.
- `scripts/check-new-journeys.mjs`: aprovado; navegação mobile/paciente/médico, alternativas de agendamento, rede, filtros de documentos, histórico, avaliações e PDFs curtos em uma A4/longos paginados.
- `scripts/check-security-runtime.mjs`: aprovado; CSP de produção sem unsafe-eval, HSTS, anti-framing, permissões, manifesto/ícones PWA, imagem PNG otimizada pelo next/image, rejeição de URL local não autorizada e rejeição de acesso anônimo a APIs/cron/webhook. Checkout permanece indisponível.

Testes de navegador usam build local de produção e fixtures de Auth/REST, sem gravar no Supabase nem enviar e-mails. Teste PWA cobre o manifesto existente, ícones e navegação; não afirma funcionamento offline de service worker inexistente. APIs foram verificadas quanto às barreiras sem credenciais, não quanto a entregas reais de fornecedores.

Ambiente executado: Windows, Node **24.15.0**, npm **12.0.2**. O workflow da Vercel/GitHub não foi disparado; GitHub CI usa Node 22/Ubuntu e deverá executar quando houver autorização de push. O build local não comprova as variáveis, domínio ou permissões do ambiente remoto.

**Nenhuma breaking change encontrada nos fluxos testados.** Não houve necessidade de modificar o código da aplicação ou os headers/CSP para compatibilidade. A exclusão de artefatos do lint e o novo script de regressão são mudanças de verificação, sem efeito nos fluxos do produto.

## Pacotes afetados, origem e versoes

| Pacote | Severidade inicial | Caminho/uso | Versoes antes | Versoes depois |
| --- | --- | --- | --- | --- |
| `@babel/core` | low | Desenvolvimento: eslint-config-next > eslint-plugin-react-hooks > Babel | 7.29.0 | 7.29.7 |
| `baseline-browser-mapping` | moderate | Arvore de producao do Next (ferramentas de build) e Browserslist | 2.10.20 | 2.11.26 |
| `brace-expansion` | high | Desenvolvimento: ESLint / typescript-eslint > minimatch | 1.1.14, 5.0.5 | 1.1.21, 5.0.12 |
| `browserslist` | high | Desenvolvimento: Babel > helper-compilation-targets | 4.28.2 | 4.29.2 |
| `dompurify` | moderate | Runtime/browser: jspdf > dompurify | 3.4.1 | 3.4.16 |
| `fflate` | moderate | Runtime/browser: jspdf > fflate | 0.8.2 | 0.8.3 |
| `js-yaml` | high | Desenvolvimento: eslint > @eslint/eslintrc | 4.1.1 | 4.3.2 |
| `nanoid` | high | Arvore de producao: Next > PostCSS; tambem pipeline Tailwind | 3.3.11 | 3.3.19 |
| `next` | critical | Dependencia direta de runtime e build | 16.2.4 | 16.3.6 |
| `postcss` | high | Next > PostCSS (producao/build) e Tailwind (desenvolvimento) | 8.4.31, 8.5.10 | 8.5.23 |
| `sharp` | high | Runtime: Next > sharp (otimizacao de imagens) | 0.34.5 | 0.35.5 |
| `ws` | high | Runtime: Supabase > realtime-js > ws | 8.20.0 | 8.22.0 |

## Advisories exatos do audit inicial

Todos os IDs abaixo deixaram de afetar a arvore instalada apos a correcao. A classificacao runtime/desenvolvimento esta na tabela anterior; explorabilidade depende do uso descrito no advisory.

| Pacote | Advisory | Severidade | Titulo |
| --- | --- | --- | --- |
| `@babel/core` | [GHSA-4x5r-pxfx-6jf8](https://github.com/advisories/GHSA-4x5r-pxfx-6jf8) | low | @babel/core: Arbitrary File Read via sourceMappingURL Comment |
| `baseline-browser-mapping` | [GHSA-w5vr-8v7q-w6rv](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv) | moderate | baseline-browser-mapping process termination on invalid input causes denial of service |
| `brace-expansion` | [GHSA-jxxr-4gwj-5jf2](https://github.com/advisories/GHSA-jxxr-4gwj-5jf2) | moderate | brace-expansion: Large numeric range defeats documented `max` DoS protection |
| `brace-expansion` | [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) | high | brace-expansion: DoS via exponential-time expansion of consecutive non-expanding {} groups |
| `brace-expansion` | [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | high | brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash |
| `brace-expansion` | [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | high | brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation |
| `browserslist` | [GHSA-c83g-rgw3-j3cx](https://github.com/advisories/GHSA-c83g-rgw3-j3cx) | high | Browserslist: Unbounded memory growth (no cache eviction) via distinct query results, leading to eventual OOM |
| `browserslist` | [GHSA-73wf-gq98-2v4g](https://github.com/advisories/GHSA-73wf-gq98-2v4g) | high | Browserslist: Uncaught crash / prototype write via untrusted browserslist-stats.json custom stats (normalizeStats) |
| `dompurify` | [GHSA-hpcv-96wg-7vj8](https://github.com/advisories/GHSA-hpcv-96wg-7vj8) | moderate | DOMPurify: Cross-realm IN_PLACE sanitization leaves executable markup intact via realm-bound `instanceof` checks |
| `dompurify` | [GHSA-r47g-fvhr-h676](https://github.com/advisories/GHSA-r47g-fvhr-h676) | moderate | DOMPurify: IN_PLACE mode preserves attributes of a clobbered root element, allowing XSS via attacker-controlled root DOM |
| `dompurify` | [GHSA-rp9w-3fw7-7cwq](https://github.com/advisories/GHSA-rp9w-3fw7-7cwq) | moderate | DOMPurify IN_PLACE Sanitization Bypass via Attached Shadow Root Inside <template>.content |
| `dompurify` | [GHSA-c2j3-45gr-mqc4](https://github.com/advisories/GHSA-c2j3-45gr-mqc4) | low | DOMPurify: `CUSTOM_ELEMENT_HANDLING` bypasses `afterSanitizeElements` for allowed custom elements. |
| `dompurify` | [GHSA-cmwh-pvxp-8882](https://github.com/advisories/GHSA-cmwh-pvxp-8882) | moderate | DOMPurify: Permanent `ALLOWED_ATTR` pollution via `setConfig()` bypassing the hook clone-guard (incomplete fix of the 3.4.7 hook-pollution patch) |
| `dompurify` | [GHSA-vxr8-fq34-vvx9](https://github.com/advisories/GHSA-vxr8-fq34-vvx9) | low | DOMPurify: Trusted Types policy survives `clearConfig()` and can poison later `RETURN_TRUSTED_TYPE` output |
| `dompurify` | [GHSA-gvmj-g25r-r7wr](https://github.com/advisories/GHSA-gvmj-g25r-r7wr) | low | DOMPurify: SAFE_FOR_TEMPLATES bypass - template expressions survive sanitization inside <template> content when using DOM output modes |
| `dompurify` | [GHSA-x4vx-rjvf-j5p4](https://github.com/advisories/GHSA-x4vx-rjvf-j5p4) | low | DOMPurify: `IN_PLACE` mode trusts attacker-controlled `nodeName` on live non-form nodes, allowing script retention and XSS via attacker-supplied DOM objects |
| `dompurify` | [GHSA-76mc-f452-cxcm](https://github.com/advisories/GHSA-76mc-f452-cxcm) | moderate | DOMPurify: Hook mutation of `data.allowedTags` / `data.allowedAttributes` permanently pollutes `DEFAULT_ALLOWED_TAGS` / `DEFAULT_ALLOWED_ATTR` |
| `dompurify` | [GHSA-55q2-fjhq-7xh7](https://github.com/advisories/GHSA-55q2-fjhq-7xh7) | moderate | DOMPurify: IN_PLACE hook removal leaves a detached subtree executable, causing XSS |
| `fflate` | [GHSA-px8p-9vwx-vf98](https://github.com/advisories/GHSA-px8p-9vwx-vf98) | moderate | fflate unzipSync can enter an infinite loop when parsing malformed ZIP64 archives |
| `js-yaml` | [GHSA-h67p-54hq-rp68](https://github.com/advisories/GHSA-h67p-54hq-rp68) | moderate | JS-YAML: Quadratic-complexity DoS in merge key handling via repeated aliases |
| `js-yaml` | [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m) | high | js-yaml: YAML merge-key chains can force quadratic CPU consumption |
| `js-yaml` | [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) | high | JS-YAML: Quadratic CPU consumption in !!omap resolution (3.x and 4.x) — CVE-2026-59870 fix not backported |
| `js-yaml` | [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) | high | js-yaml: maxTotalMergeKeys does not limit CPU use for empty merge sources |
| `nanoid` | [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) | high | nanoid: non-secure generators can loop indefinitely with negative size |
| `nanoid` | [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) | high | nanoid: custom generators can loop indefinitely when size is zero |
| `nanoid` | [GHSA-xwg4-73v4-xw9w](https://github.com/advisories/GHSA-xwg4-73v4-xw9w) | high | nanoid: Integer Overflow or Wraparound |
| `next` | [GHSA-8h8q-6873-q5fj](https://github.com/advisories/GHSA-8h8q-6873-q5fj) | high | Next.js Vulnerable to Denial of Service with Server Components |
| `next` | [GHSA-26hh-7cqf-hhc6](https://github.com/advisories/GHSA-26hh-7cqf-hhc6) | high | Next.js has a Middleware / Proxy bypass in App Router applications via segment-prefetch routes - Incomplete Fix Follow-Up |
| `next` | [GHSA-3g8h-86w9-wvmq](https://github.com/advisories/GHSA-3g8h-86w9-wvmq) | low | Next.js's Middleware / Proxy redirects can be cache-poisoned |
| `next` | [GHSA-ffhc-5mcf-pf4q](https://github.com/advisories/GHSA-ffhc-5mcf-pf4q) | moderate | Next.js vulnerable to cross-site scripting in App Router applications using CSP nonces |
| `next` | [GHSA-vfv6-92ff-j949](https://github.com/advisories/GHSA-vfv6-92ff-j949) | low | Next.js vulnerable to cache poisoning via collisions in React Server Component cache-busting |
| `next` | [GHSA-gx5p-jg67-6x7h](https://github.com/advisories/GHSA-gx5p-jg67-6x7h) | moderate | Next.js has cross-site scripting in beforeInteractive scripts with untrusted input |
| `next` | [GHSA-mg66-mrh9-m8jx](https://github.com/advisories/GHSA-mg66-mrh9-m8jx) | high | Next.js vulnerable to Denial of Service via connection exhaustion in applications using Cache Components |
| `next` | [GHSA-h64f-5h5j-jqjh](https://github.com/advisories/GHSA-h64f-5h5j-jqjh) | moderate | Next.js has a Denial of Service in the Image Optimization API |
| `next` | [GHSA-c4j6-fc7j-m34r](https://github.com/advisories/GHSA-c4j6-fc7j-m34r) | high | Next.js vulnerable to server-side request forgery in applications using WebSocket upgrades |
| `next` | [GHSA-492v-c6pp-mqqv](https://github.com/advisories/GHSA-492v-c6pp-mqqv) | high | Next.js has a Middleware / Proxy bypass through dynamic route parameter injection |
| `next` | [GHSA-wfc6-r584-vfw7](https://github.com/advisories/GHSA-wfc6-r584-vfw7) | moderate | Next.js vulnerable to cache poisoning in React Server Component responses |
| `next` | [GHSA-267c-6grr-h53f](https://github.com/advisories/GHSA-267c-6grr-h53f) | high | Next.js has a Middleware / Proxy bypass in App Router applications via segment-prefetch routes |
| `next` | [GHSA-36qx-fr4f-26g5](https://github.com/advisories/GHSA-36qx-fr4f-26g5) | high | Next.js has a Middleware / Proxy bypass in Pages Router applications using i18n |
| `next` | [GHSA-6gpp-xcg3-4w24](https://github.com/advisories/GHSA-6gpp-xcg3-4w24) | high | Next.js: Middleware / Proxy bypass in App Router applications using Turbopack and single locale |
| `next` | [GHSA-m99w-x7hq-7vfj](https://github.com/advisories/GHSA-m99w-x7hq-7vfj) | high | Next.js: Denial of Service in App Router using Server Actions |
| `next` | [GHSA-89xv-2m56-2m9x](https://github.com/advisories/GHSA-89xv-2m56-2m9x) | high | Next.js: Server-Side Request Forgery in Server Actions on custom servers |
| `next` | [GHSA-68g3-v927-f742](https://github.com/advisories/GHSA-68g3-v927-f742) | moderate | Next.js: Cache confusion of response bodies for requests with bodies |
| `next` | [GHSA-4633-3j49-mh5q](https://github.com/advisories/GHSA-4633-3j49-mh5q) | moderate | Next.js: Cache confusion of response bodies for requests with bodies containing invalid UTF-8 byte sequences |
| `next` | [GHSA-4c39-4ccg-62r3](https://github.com/advisories/GHSA-4c39-4ccg-62r3) | moderate | Next.js: Unbounded Server Action payload in Edge runtime |
| `next` | [GHSA-p9j2-gv94-2wf4](https://github.com/advisories/GHSA-p9j2-gv94-2wf4) | high | Next.js: Server-Side Request Forgery in rewrites via attacker-controlled destination hostname |
| `next` | [GHSA-q8wf-6r8g-63ch](https://github.com/advisories/GHSA-q8wf-6r8g-63ch) | moderate | Next.js: Denial of Service in the Image Optimization API using SVGs |
| `next` | [GHSA-955p-x3mx-jcvp](https://github.com/advisories/GHSA-955p-x3mx-jcvp) | moderate | Next.js: Unauthenticated disclosure of internal Server Function endpoints |
| `next` | [GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36) | critical | Next.js: Unauthenticated Remote Code Execution on windows-hosted servers |
| `next` | [GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4) | critical | Next.js: Unauthenticated Remote Code Execution in Image Optimization API when AVIF files are used |
| `postcss` | [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) | moderate | PostCSS has XSS via Unescaped </style> in its CSS Stringify Output |
| `postcss` | [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q) | high | PostCSS: Arbitrary file read and information disclosure via attacker-controlled sourceMappingURL in CSS comments |
| `postcss` | [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) | moderate | PostCSS: incomplete fix of GHSA-6g55-p6wh-862q — attacker-controlled sourceMappingURL reads arbitrary .map files when `from` is unset |
| `postcss` | [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) | high | PostCSS: Path Traversal in Previous Source Map Auto-Loading (sourceMappingURL) leads to Arbitrary .map File Disclosure |
| `sharp` | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) | high | sharp inherited vulnerabilities in libvips: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 |
| `sharp` | [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) | high | sharp: Vulnerabilities in libheif: GHSA-g89c-p67h-r497 and GHSA-2jg2-4ch7-h545 |
| `ws` | [GHSA-58qx-3vcg-4xpx](https://github.com/advisories/GHSA-58qx-3vcg-4xpx) | moderate | ws: Uninitialized memory disclosure |
| `ws` | [GHSA-96hv-2xvq-fx4p](https://github.com/advisories/GHSA-96hv-2xvq-fx4p) | high | ws: Memory exhaustion DoS from tiny fragments and data chunks |
