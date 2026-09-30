# Busca por disponibilidade e localização — 29/09/2026

Alterações locais, sem push, deploy, aplicação ou alteração de migrations. Os dois commits anteriores de estabilização e dependências permanecem separados. A personalização de e-mails feita por Pedro no Supabase é independente desta entrega; arquivos de cadastro e a imagem de e-mail em edição pelo usuário foram preservados.

## Problemas encontrados e correções

- O botão principal “Encontrar atendimento” abria descoberta de contatos. Agora abre `/busca`, a busca orientada pelos dias e horários do paciente. A ação do estado vazio do dashboard também foi corrigida.
- Os dois atalhos do menu lateral caíam no ícone genérico de configurações. Disponibilidade usa calendário com lupa; rede cadastrada usa estetoscópio. Dashboard e menu mobile seguem a mesma distinção, com os rótulos visíveis e a paleta existente.
- Datas invertidas, dias da semana ausentes do período e faixas inválidas eram enviados antes de serem recusados pelo banco. A tela agora valida todas as faixas e as regras de período da RPC antes de criar a busca, no fuso de Brasília, sem descartar silenciosamente uma faixa inválida.
- Qualquer coordenada era chamada de “precisa”. A busca agora mostra o endereço de origem, permite conferir o ponto no mapa e explica que a distância é em linha reta. Usar GPS não é obrigatório para localizar um endereço.
- Salvar telefone/convênio geocodificava novamente o endereço e podia substituir ou apagar um ponto de GPS. Endereço inalterado preserva o ponto salvo; endereço alterado não mantém coordenadas antigas. Um ponto confirmado durante a edição tem prioridade.
- O CEP era consultado automaticamente ao carregar o perfil ou preencher o endereço por GPS, podendo sobrescrever campos e descartar o GPS. A consulta de CEP agora é explícita. Respostas atrasadas são ignoradas após outra edição do endereço.
- GPS agora coleta atualizações por até 15 segundos, encerra ao obter margem de até 50 m e recusa usar uma leitura acima de 200 m. Esses limites são escolhas de interface, não uma garantia de posição exata. A [margem informada pelo navegador](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationCoordinates/accuracy) continua visível. Há prévia, link do mapa, confirmação e descarte antes de substituir os campos.
- A geocodificação de endereço rejeita estado/cidade/número explicitamente divergentes e resultados sem rua quando uma rua foi solicitada. Quando o provedor identifica só a rua, a prévia informa que o número não foi confirmado. Não há contratação de um novo provedor nesta etapa. O serviço existente OpenStreetMap/Nominatim tem capacidade limitada e [política própria](https://operations.osmfoundation.org/policies/nominatim/); capacidade de produção segue no roadmap.

## Verificação

- TypeScript aprovado; 81 testes web/backend passaram, incluindo testes locais de disponibilidade em PGlite e novos casos de datas, preservação de coordenadas e GPS impreciso.
- Lint: zero erros, 16 avisos existentes; build Next 16.3.6 aprovado.
- `scripts/check-location-journey.mjs`: fluxo mobile completo com fixtures — CTA principal, origem no mapa, datas incompatíveis sem gravação, GPS sem alteração antes da confirmação, descarte, confirmação, edição de telefone e persistência das coordenadas sem nova consulta de CEP/geocoder.
- Jornadas existentes aprovadas: agendamento alternativo com aceite explícito, perfil, rede, documentos, impressão, avaliações e histórico. Nenhuma mensagem foi enviada e nenhum perfil real foi alterado pelos testes.
- Conferência remota somente leitura: a função `match_patient_availability` existe e rejeita busca inexistente/anônima. Não foi feita uma busca autenticada com os dados particulares de Pedro.

A mensagem de ausência de médicos também pode corresponder à interseção real de especialidade, raio, plano/modalidade, foto/perfil ativo e agenda. A correção da origem não cria disponibilidade inexistente. O ponto e o raio devem ser conferidos novamente na versão publicada quando o deploy for autorizado.

No roadmap, os cinco passos concretos e os modelos de e-mail estão registrados como concluídos segundo Pedro; isso não equivale a uma inspeção independente dos painéis ou da caixa de entrada.
