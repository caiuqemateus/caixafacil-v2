# Evolução do Caixa Fácil

## Objetivo

Transformar o Caixa Fácil em um app instalável no celular, com funcionamento offline e recursos práticos para acompanhar o trabalho de caixa sem depender de contas manuais.

## Entregas desta versão

1. **App instalável (PWA):** manifesto próprio, ícones, modo standalone, botão de instalação e registro de service worker.
2. **Uso sem internet:** o shell do app, os estilos e a lógica ficam disponíveis depois do primeiro acesso; as contagens continuam no armazenamento local do aparelho.
3. **Histórico local de fechamentos:** o operador pode registrar o fechamento atual e consultar até 10 registros no aparelho, com data, total contado, valor do PDV, diferença e fundo sugerido.
4. **Ações rápidas:** botão para registrar o fechamento, copiar um resumo e limpar o histórico, mantendo confirmações para ações destrutivas.
5. **Interface de app:** preservar a aparência atual e adicionar um espaço compacto para instalação e histórico, com boa leitura em celular.

## Estrutura

- `index.html`: metadados PWA, botão de instalação, ações e painel de histórico.
- `app.js`: estado de abertura/fechamento, histórico local, instalação e registro do service worker.
- `styles.css`: componentes visuais do app instalável, ações rápidas e histórico responsivo.
- `manifest.webmanifest`: identidade, ícones, cores e comportamento standalone.
- `sw.js`: cache do shell e fallback offline.
- `icons/`: ícones PNG usados na instalação e no atalho do celular.
- `server.js` e `package.json`: suporte local e cópia dos arquivos necessários para `dist/`.

## Decisões de produto

O app continuará sem login e sem banco remoto: os dados de caixa são de uso individual e ficam no próprio aparelho. A instalação será feita pelo navegador como PWA; isso cria um ícone na tela inicial e abre em tela própria, sem exigir uma loja de aplicativos. O histórico será explicitamente local e limitado aos 10 registros mais recentes.
