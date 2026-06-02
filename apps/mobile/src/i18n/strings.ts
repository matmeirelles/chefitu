export type Locale = "pt" | "en";

export const strings = {
  pt: {
    nav: {
      library: "Início",
      favorites: "Favoritos",
      create: "Chefitu",
      list: "Lista",
      profile: "Perfil",
    },
    home: {
      greeting: (name: string) => `Olá, ${name}! 👋`,
      subtitle: "O que vamos cozinhar hoje?",
      searchPlaceholder: "Buscar receitas, ingredientes…",
      yourRecipes: "Suas receitas",
      recipeCount: (n: number) => `${n} ${n === 1 ? "receita" : "receitas"}`,
    },
    profile: {
      title: "Perfil",
      editAvatar: "Alterar foto",
      namePlaceholder: "Seu nome",
      emailPlaceholder: "Seu e-mail",
      language: "Idioma",
      languagePt: "Português",
      languageEn: "English",
      help: "Ajuda e suporte",
      logOut: "Sair da conta",
      aboutLabel: "Sobre o Chefitu",
      version: (v: string) => `Versão ${v}`,
    },
    construction: {
      title: "Ainda no forno",
      body: "O Chefitu está sendo preparado. Volte em breve!",
      dismiss: "Entendi",
    },
    favorites: {
      title: "Favoritos",
      recipeCount: (n: number) => `${n} ${n === 1 ? "receita" : "receitas"}`,
      emptyTitle: "Nenhum coração por aqui… ainda",
      emptyBody:
        "Quando uma receita fizer seu olho brilhar no Início, toque no coração — ela vem parar bem aqui, quentinha.",
      emptyCta: "Explorar receitas",
      unfavoriteTitle: "Tirar dos favoritos?",
      unfavoriteBody: (title: string) =>
        `Tem certeza que deseja tirar "${title}" dos favoritos?`,
      unfavoriteConfirm: "Tirar dos favoritos",
      unfavoriteSubmitting: "Tirando dos favoritos…",
      unfavoriteCancel: "Cancelar",
      loadError: "Não foi possível carregar seus favoritos.",
      loadingTitle: "Carregando favoritos",
      loadingBody: "Buscando suas receitas preferidas.",
    },
  },
  en: {
    nav: {
      library: "Home",
      favorites: "Favorites",
      create: "Chefitu",
      list: "List",
      profile: "Profile",
    },
    home: {
      greeting: (name: string) => `Hi, ${name}! 👋`,
      subtitle: "What are we cooking today?",
      searchPlaceholder: "Search recipes, ingredients…",
      yourRecipes: "Your recipes",
      recipeCount: (n: number) => `${n} ${n === 1 ? "recipe" : "recipes"}`,
    },
    profile: {
      title: "Profile",
      editAvatar: "Change photo",
      namePlaceholder: "Your name",
      emailPlaceholder: "Your email",
      language: "Language",
      languagePt: "Português",
      languageEn: "English",
      help: "Help & support",
      logOut: "Log out",
      aboutLabel: "About Chefitu",
      version: (v: string) => `Version ${v}`,
    },
    construction: {
      title: "Still in the oven",
      body: "Chefitu is getting ready. Check back soon!",
      dismiss: "Got it",
    },
    favorites: {
      title: "Favorites",
      recipeCount: (n: number) => `${n} ${n === 1 ? "recipe" : "recipes"}`,
      emptyTitle: "No hearts here… yet",
      emptyBody:
        "When a recipe makes your eyes light up on Home, tap the heart — it lands right here, warm and cozy.",
      emptyCta: "Browse recipes",
      unfavoriteTitle: "Remove from favorites?",
      unfavoriteBody: (title: string) =>
        `Are you sure you want to remove "${title}" from favorites?`,
      unfavoriteConfirm: "Remove from favorites",
      unfavoriteSubmitting: "Removing…",
      unfavoriteCancel: "Cancel",
      loadError: "Could not load your favorites.",
      loadingTitle: "Loading favorites",
      loadingBody: "Fetching your saved recipes.",
    },
  },
} as const;

export type Translation = (typeof strings)[Locale];
