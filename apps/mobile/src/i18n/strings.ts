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
  },
} as const;

export type Translation = (typeof strings)[Locale];
