# Dataset — recipe-extraction.v1

## Use Cases

| useCase | Descrição |
|---------|-----------|
| 1 | Receita extraída de descrição de post do Instagram |
| 2 | Input sem receita (noRecipe = true) |

## Critérios de campos não óbvios

**cuisine**
Reflete o estilo de preparo e contexto cultural da receita,
não a origem do ingrediente principal.
Exemplo: bacalhau frito com maionese verde = brasileira, não portuguesa.

**tags**
Lista de termos que descrevem a receita de forma útil para busca e filtragem.
Usar sempre lowercase e primeira letra maiúscula.
