# Recipe Schema

Este documento define o contrato inicial do MVP para receitas importadas do Instagram.

## Objetivo

O sistema deve:

- receber um link compartilhado de um post do Instagram
- ler a descricao do post
- estruturar a receita quando houver conteudo suficiente
- informar claramente quando a receita nao estiver na descricao

## Status de processamento

Os itens importados devem usar um dos status abaixo:

- `processing`: link recebido e em processamento
- `ready`: receita estruturada e pronta para exibir
- `no_recipe_in_description`: nao foi encontrada receita suficiente na descricao
- `failed`: ocorreu uma falha tecnica no processamento

## Recipe

```ts
type RecipeStatus =
  | "processing"
  | "ready"
  | "no_recipe_in_description"
  | "failed";

type RecipeIngredient = {
  name: string;
  quantity?: string | null;
  notes?: string | null;
};

type RecipeStep = {
  order: number;
  instruction: string;
};

type Recipe = {
  id: string;
  sourceUrl: string;
  sourcePlatform: "instagram";
  sourceAuthorName?: string | null;
  rawDescription?: string | null;
  title?: string | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  totalTimeMinutes?: number | null;
  servings?: string | null;
  tags: string[];
  status: RecipeStatus;
  coverImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};
```

## Regras de preenchimento

### Campos obrigatorios para todo item importado

- `id`
- `sourceUrl`
- `sourcePlatform`
- `ingredients`
- `steps`
- `tags`
- `status`
- `createdAt`
- `updatedAt`

### Quando `status = ready`

Esperamos que os seguintes campos estejam preenchidos:

- `title`
- `ingredients` com ao menos 1 item
- `steps` com ao menos 1 item

Campos como tempo, porcoes e imagem podem continuar vazios no MVP.

### Quando `status = no_recipe_in_description`

O sistema deve:

- manter `sourceUrl`
- manter `rawDescription` quando disponivel
- permitir `ingredients` vazio
- permitir `steps` vazio
- exibir ao usuario que a receita nao foi encontrada na descricao

### Quando `status = failed`

O sistema deve:

- manter `sourceUrl`
- manter `rawDescription` se ela ja tiver sido obtida
- registrar erro tecnico fora deste schema de exibicao

## Regras de validacao

### `sourceUrl`

- obrigatorio
- deve ser uma URL valida
- no MVP, deve apontar para Instagram

### `title`

- opcional no schema geral
- obrigatorio quando `status = ready`
- idealmente curto e legivel

### `ingredients`

Cada item deve conter:

- `name`: obrigatorio
- `quantity`: opcional, texto livre no MVP
- `notes`: opcional

Exemplo:

```ts
{
  name: "farinha de trigo",
  quantity: "2 xicaras",
  notes: "sem fermento"
}
```

### `steps`

Cada passo deve conter:

- `order`: obrigatorio
- `instruction`: obrigatorio

O `order` deve iniciar em 1 e seguir sem repeticao.

### tempos

- `prepTimeMinutes`, `cookTimeMinutes` e `totalTimeMinutes` sao opcionais
- quando `totalTimeMinutes` estiver presente, ele deve ser maior ou igual a cada tempo parcial

### `servings`

- opcional
- texto livre no MVP, por exemplo `2 porcoes`, `1 bolo`, `8 fatias`

### `tags`

- lista de strings
- comecar vazia quando a IA nao tiver seguranca
- evitar duplicatas

## Resposta esperada da IA

Para o pipeline de estruturacao, a IA deve sempre retornar um objeto compativel com este contrato:

```ts
type RecipeExtractionResult =
  | {
      status: "ready";
      title: string;
      ingredients: RecipeIngredient[];
      steps: RecipeStep[];
      prepTimeMinutes?: number | null;
      cookTimeMinutes?: number | null;
      totalTimeMinutes?: number | null;
      servings?: string | null;
      tags?: string[];
    }
  | {
      status: "no_recipe_in_description";
      reason: string;
    };
```

## Implicacoes para testes

Este contrato permite testar:

- parser e validacao sem depender do app
- camada de IA com mocks
- casos felizes e casos sem receita na descricao
- evals com entradas reais e saida esperada
