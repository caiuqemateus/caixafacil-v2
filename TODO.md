# Entregas do Caixa Fácil

## Conferência do fundo inicial configurável — concluído
- [x] A tela principal explica de forma curta e direta como realizar a contagem.
- [x] A pessoa informa quantidades inteiras não negativas para cédulas e moedas.
- [x] Cada valor apresenta subtotal automático e o total geral é recalculado.
- [x] O valor do fundo inicial pode ser configurado em Extras (de R$ 0,01 a R$ 10.000,00).
- [x] O status indica se o caixa está abaixo, exatamente em ou acima da meta configurada.
- [x] O app indica em reais quanto falta para atingir a meta ou quanto está sobrando.
- [x] O modo de contagem rápida é ligado ou desligado em Extras e aplicado à abertura e ao fechamento.
- [x] No modo simples, a tela esconde textos e detalhes secundários, destaca os valores e amplia os controles; Enter leva ao próximo valor.

## Fechamento e conferência com o PDV — concluído
- [x] A pessoa acessa uma área separada de fechamento sem perder a contagem de abertura.
- [x] A pessoa informa o valor exibido no PDV e as quantidades contadas no fechamento.
- [x] O app compara o total contado com o PDV e indica se bateu, se falta dinheiro ou se sobra dinheiro.
- [x] O app calcula o valor para retirada/conferência depois de separar o fundo configurado.
- [x] A sugestão forma exatamente o fundo configurado, priorizando moedas e denominações menores e preservando notas altas.
- [x] A contagem de fechamento e o valor do PDV são salvos separadamente no aparelho.

## App instalável e offline — concluído
- [x] O app possui manifesto próprio com nome, cores, ícones, orientação vertical e modo standalone.
- [x] O app possui ícones PNG de 192x192 e 512x512 para o atalho da tela inicial.
- [x] O app registra um service worker e guarda o shell principal para uso sem internet após o primeiro acesso.
- [x] O cabeçalho oferece o botão “Instalar app”; quando o navegador não expõe instalação direta, o app orienta usar “Adicionar à tela inicial”.
- [x] A instalação mantém os dados de caixa no armazenamento local do aparelho.

## Histórico e ações rápidas — concluído
- [x] O operador pode registrar o fechamento atual com data, hora, total contado, PDV, diferença e sugestão do fundo.
- [x] O app mantém e mostra até 60 fechamentos recentes neste aparelho, agora na área Extras.
- [x] O histórico mostra totais de faltas/sobras e permite filtrar fechamentos que bateram, faltaram ou sobraram.
- [x] O operador pode copiar um resumo do fechamento para enviar ou guardar.
- [x] O operador pode apagar o histórico com confirmação.
- [x] A aba ativa de abertura ou fechamento é lembrada no aparelho.

## Ajustes de arredondamento — concluído
- [x] O operador registra valores que segurou do troco ou deu a mais.
- [x] O app calcula o saldo líquido e indica se ficou a mais ou a menos no caixa.
- [x] Os ajustes ficam salvos no aparelho e podem ser removidos ou zerados.

## Evidências da entrega

O build passou, os arquivos JavaScript passaram na verificação de sintaxe e foram gerados `dist/manifest.webmanifest`, `dist/sw.js` e os dois ícones PNG. O projeto segue sem servidor ou banco remoto: abertura, fechamento e histórico ficam no `localStorage` deste aparelho. A instalação como app depende de abrir a versão publicada em HTTPS ou usar “Adicionar à tela inicial” no navegador do celular.
