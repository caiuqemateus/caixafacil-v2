# Evolução do Caixa Fácil

## Objetivo

Transformar o Caixa Fácil em um app instalável no celular, com funcionamento offline e recursos práticos para acompanhar o trabalho de caixa sem depender de contas manuais.

## Entregas desta versão

1. **App instalável (PWA):** manifesto próprio, ícones, modo standalone, botão de instalação e registro de service worker.
2. **Uso sem internet:** o shell do app, os estilos e a lógica ficam disponíveis depois do primeiro acesso; as contagens continuam no armazenamento local do aparelho.
3. **Fundo configurável:** cada comércio pode ajustar o valor do fundo inicial e o valor sugerido para o próximo turno; R$ 200,00 é o padrão.
4. **Histórico local de fechamentos:** consulta de até 60 registros em Extras, com filtros e totais de faltas e sobras.
5. **Ajustes de troco:** registrar valores segurados ou dados a mais e acompanhar o saldo líquido.
6. **Contagem rápida:** modo simples, configurável em Extras, para abertura e fechamento; esconde informações secundárias e destaca os controles.
7. **Ações rápidas:** botão para registrar o fechamento, copiar um resumo e limpar o histórico, mantendo confirmações para ações destrutivas.
8. **Interface de app:** preservar a aparência atual e adicionar um espaço compacto para instalação e histórico, com boa leitura em celular.

## Estrutura

- `index.html`: metadados PWA, botão de instalação, ações e painel de histórico.
- `app.js`: estado de abertura/fechamento, fundo configurável, contagem rápida, histórico local, instalação e registro do service worker.
- `extras.js`: calculadora de troco, movimentações, ajustes de arredondamento, configurações e backup.
- `styles.css`: componentes visuais do app instalável, ações rápidas e histórico responsivo.
- `manifest.webmanifest`: identidade, ícones, cores e comportamento standalone.
- `sw.js`: cache do shell e fallback offline.
- `icons/`: ícones PNG usados na instalação e no atalho do celular.
- `server.js` e `package.json`: suporte local e cópia dos arquivos necessários para `dist/`.

## Decisões de produto

O app continuará sem login e sem banco remoto: os dados de caixa são de uso individual e ficam no próprio aparelho. A instalação será feita pelo navegador como PWA; isso cria um ícone na tela inicial e abre em tela própria, sem exigir uma loja de aplicativos. O histórico e os ajustes de troco são locais; o histórico mantém até 60 fechamentos recentes.
