# Revisão Completa — agenda-pessoal

## BUGS ENCONTRADOS

### BUG 1 (CRÍTICO): Regras de promoção não salvam corretamente
- **Causa**: O `_calcDesconto` no server.js usa semântica diferente do Electron.
  - Electron: `fixo` = valor final cobrado (subtotal vira vd), `reais` = subtrai vd do subtotal
  - Web server.js: `fixo`/`valor_fixo` = sub - vd, `reais` = vd direto, `percentual` = sub * vd / 100
  - Frontend HTML usa `valor_fixo` como opção, mas Electron usa `fixo`
  - O cálculo de desconto está inconsistente entre os dois
- **Correção**: Alinhar `_calcDesconto` com semântica clara e aceitar ambos `fixo` e `valor_fixo`

### BUG 2: GET /api/agendamentos lista não retorna procedimentos corretamente
- O endpoint GET /api/agendamentos faz JOIN com procedimentos/variantes da tabela agendamentos (campos legados), mas os dados agora estão em agendamento_procedimentos
- Precisa subquery para pegar nomes dos procedimentos de agendamento_procedimentos

### BUG 3: GET /api/agendamentos/:id não retorna promocao_uso
- O Electron retorna `promocao_uso` no buscar, mas o Express não
- O frontend `editarAgendamento` verifica `a.promocao_uso` para pré-carregar promoção

### BUG 4: Variáveis CSS inexistentes em financeiro.js
- Usa --color-success, --color-primary, --color-blue, --color-error, --text-sm, --text-xs, --text-xl, --color-text-muted, --color-success-highlight, --radius-full, --color-text-faint
- O CSS real usa --success, --warning, --danger, --info, --text-muted, --radius, --text

### BUG 5: Variáveis CSS inexistentes em agendamentos.js
- Usa --color-surface-offset, --color-text-muted, --text-sm
- Parcialmente corrigido no commit anterior, mas restam --color-surface-offset e --text-sm

### BUG 6: GET /api/financeiro/detalhado não retorna promoção
- O Electron retorna `ag.promocao` com `promocao_nome` e `desconto_aplicado`
- O Express não faz JOIN com promocao_usos

### BUG 7: Falta endpoint PATCH /api/usuarios/:id para editar cargo
- Só existe PATCH para senha, mas não para alterar cargo de um usuário

## MELHORIAS NECESSÁRIAS

### Backend
1. Adicionar validação de entrada mais robusta (sanitização)
2. Adicionar try-catch em todos os endpoints
3. Normalizar tipo_desconto: aceitar tanto 'fixo' quanto 'valor_fixo'
4. Adicionar endpoint GET /api/dashboard para estatísticas rápidas
5. Melhorar GET /api/agendamentos para usar agendamento_procedimentos
6. Adicionar promocao_uso ao GET /api/agendamentos/:id

### Frontend
7. Corrigir todas as variáveis CSS inexistentes
8. Adicionar confirmação visual de promoção no financeiro
9. Adicionar indicador de loading nos botões de salvar
10. Melhorar responsividade do modal

### Módulos Complementares (inspirado em sistemas de clínica)
11. Dashboard com KPIs na página inicial (calendário)
12. Histórico de atendimentos por cliente
13. Backup/export do banco de dados
14. Relatório de promoções utilizadas
