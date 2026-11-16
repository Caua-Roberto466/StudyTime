# StudyTime — atualização visual

## O que mudou

- **Início:** novo topo roxo limpo, com saudação, resumo do dia e acesso rápido para criar atividades.
- **Início:** cartão de progresso semanal reorganizado, calendário da semana, indicadores de tarefas para hoje e atrasadas e lista de atividades mais clara.
- **Perfil:** cabeçalho redesenhado com avatar, identificação e botão de edição; resumo de desempenho, barra de conclusão e histórico mais organizado.
- **Topo:** removidas a camada SVG e as linhas transparentes sobre a cor roxa (`src/components/ScreenHero.tsx`).
- **Atividades vencidas:** também aparecem na lista da tela inicial, em vez de serem ignoradas.
- **Sair:** confirmação antes de encerrar a sessão.

Os dados locais, rotas e permissões do app foram preservados.

## Executar o projeto

1. Abra a pasta `studytime` no terminal.
2. Rode `npm install` para instalar as dependências.
3. Rode `npx expo start` para abrir o ambiente de desenvolvimento.

## Gerar APK Android

Este ZIP contém **código-fonte**, não um APK pronto. O arquivo `eas.json` já possui o perfil `preview`, configurado para gerar APK. Com sua conta Expo vinculada:

```bash
npx eas-cli@latest build --platform android --profile preview
```

## Verificação

- `npx tsc --noEmit`: passou sem erros.
- Empacotamento do bundle Android com Expo SDK 58: passou.
- O lint não pôde ser executado, pois o projeto original não inclui as dependências/configuração do ESLint e a tentativa de instalá-las ficou sem rede. Nenhuma dependência foi adicionada ao projeto final.
