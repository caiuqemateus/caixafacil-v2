# Entregas do Caixa Fácil

## Conferência do fundo inicial de R$ 200,00 — concluído
- [x] A tela principal explica de forma curta e direta como realizar a contagem.
- [x] A pessoa informa quantidades inteiras não negativas para cédulas e moedas.
- [x] Cada valor apresenta subtotal automático e o total geral é recalculado.
- [x] O status indica se o caixa está abaixo, exatamente em ou acima da meta de R$ 200,00.
- [x] O app indica em reais quanto falta para atingir a meta ou quanto está sobrando.

## Fechamento e conferência com o PDV — concluído
- [x] A pessoa acessa uma área separada de fechamento sem perder a contagem de abertura.
- [x] A pessoa informa o valor exibido no PDV e as quantidades contadas no fechamento.
- [x] O app compara o total contado com o PDV e indica se bateu, se falta dinheiro ou se sobra dinheiro.
- [x] O app calcula o valor para retirada/conferência depois de separar R$ 200,00 para o próximo operador.
- [x] A sugestão forma exatamente R$ 200,00 e prioriza deixar notas e moedas menores para facilitar o troco.
- [x] A contagem de fechamento e o valor do PDV são salvos separadamente no aparelho.

## App instalável e offline — concluído
- [x] O app possui manifesto próprio com nome, cores, ícones, orientação vertical e modo standalone.
- [x] O app possui ícones PNG de 192x192 e 512x512 para o atalho da tela inicial.
- [x] O app registra um service worker e guarda o shell principal para uso sem internet após o primeiro acesso.
- [x] O cabeçalho oferece o botão “Instalar app”; quando o navegador não expõe instalação direta, o app orienta usar “Adicionar à tela inicial”.
- [x] A instalação mantém os dados de caixa no armazenamento local do aparelho.

## Histórico e ações rápidas — concluído
- [x] O operador pode registrar o fechamento atual com data, hora, total contado, PDV, diferença e sugestão do fundo.
- [x] O app mantém e mostra até 10 fechamentos recentes neste aparelho.
- [x] O operador pode copiar um resumo do fechamento para enviar ou guardar.
- [x] O operador pode apagar o histórico com confirmação.
- [x] A aba ativa de abertura ou fechamento é lembrada no aparelho.

## Evidências da entrega

O build passou, os arquivos JavaScript passaram na verificação de sintaxe e foram gerados `dist/manifest.webmanifest`, `dist/sw.js` e os dois ícones PNG. O projeto segue sem servidor ou banco remoto: abertura, fechamento e histórico ficam no `localStorage` deste aparelho. A instalação como app depende de abrir a versão publicada em HTTPS ou usar “Adicionar à tela inicial” no navegador do celular.
