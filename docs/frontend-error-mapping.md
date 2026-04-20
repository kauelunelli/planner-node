# Frontend Error Mapping

Este documento mapeia os erros atuais do backend para mensagens de UI (toast) no frontend.

## Contrato de erro esperado

O backend agora retorna, quando houver falha:

```json
{
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "errors": ["..."]
}
```

- `code`: chave estável para mapear no frontend.
- `message`: mensagem técnica/humana (fallback).
- `errors`: lista de validação (apenas quando `code = VALIDATION_ERROR`).

## Mapeamento recomendado para toast

| Backend code/message | Quando acontece | Toast para usuario |
|---|---|---|
| `AUTH_TOKEN_MISSING` / `Token não fornecido` | Requisição autenticada sem token | `Sua sessão expirou. Faça login novamente.` |
| `AUTH_TOKEN_INVALID` / `Token inválido ou expirado` | Token inválido/expirado | `Sua sessão expirou. Faça login novamente.` |
| `BUSINESS_RULE_VIOLATION` + `Start date should be in the future` | Criação/edição de viagem com data inicial passada | `A data de início precisa ser no futuro.` |
| `BUSINESS_RULE_VIOLATION` + `Start date should be before end date` | Data inicial maior que data final | `A data de início deve ser anterior à data de fim.` |
| `BUSINESS_RULE_VIOLATION` + `Activity should be within trip dates` | Atividade fora do período da viagem | `A atividade deve estar dentro das datas da viagem.` |
| `BUSINESS_RULE_VIOLATION` + `Trip not found` | Viagem inexistente | `Viagem não encontrada.` |
| `BUSINESS_RULE_VIOLATION` + `Participant not found` | Participante inexistente | `Participante não encontrado.` |
| `BUSINESS_RULE_VIOLATION` + `Link not found` | Link inexistente | `Link não encontrado.` |
| `BUSINESS_RULE_VIOLATION` + `You are not the owner of this trip` | Usuário sem permissão para alterar/deletar | `Você não tem permissão para alterar esta viagem.` |
| `BUSINESS_RULE_VIOLATION` + `User not logged in` | Fluxo sem usuário autenticado | `Faça login para continuar.` |
| `BUSINESS_RULE_VIOLATION` + `User does not exist` | Token com usuário removido/inválido | `Usuário inválido. Faça login novamente.` |
| `BUSINESS_RULE_VIOLATION` + `Email already in use` | Cadastro com e-mail já usado | `Este e-mail já está em uso.` |
| `BUSINESS_RULE_VIOLATION` + `User not found` | Login com e-mail inexistente | `E-mail ou senha inválidos.` |
| `BUSINESS_RULE_VIOLATION` + `Invalid password` | Login com senha inválida | `E-mail ou senha inválidos.` |
| `VALIDATION_ERROR` | Erro de schema (zod) | Mostrar primeiro item de `errors` ou `Dados inválidos.` |
| `INTERNAL_SERVER_ERROR` | Exceção não tratada no backend | `Ocorreu um erro inesperado. Tente novamente.` |

## Prioridade de implementação no front

1. Criar um interceptor global (Axios) para ler `code`, `message` e `errors`.
2. Exibir toast por `code` quando existir mapeamento.
3. Se não houver mapeamento por `code`, usar `message`.
4. Em `VALIDATION_ERROR`, mostrar `errors[0]` no toast e, se necessário, destacar campo do formulário.
5. Para `401/403`, além do toast: limpar token e redirecionar para login.

## Rotas com regras de negocio criticas (alto impacto de UX)

- `POST /trips`
- `PUT /trips/:tripId`
- `POST /trips/:tripId/activities`
- `POST /login`
- `GET /authenticate`
- `DELETE /trips/:tripId/remove`
- `POST /trips/:tripId/add-participant`
