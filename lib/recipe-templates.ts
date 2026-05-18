export const RECIPE_TEMPLATES = [
   {
      id: "tpl-pasta",
      title: "Danie makaronowe",
      description: "Układ jak Classic Carbonara: kilka stałych składników + ilości na porcję.",
      baseRecipeId: 201 as const,
   },
   {
      id: "tpl-soup",
      title: "Zupa na bazie garnku",
      description: "Układ jak Tomato Soup — prosty zestaw kilku komponentów.",
      baseRecipeId: 202 as const,
   },
   {
      id: "tpl-salad",
      title: "Sałatka komponowana",
      description: "Układ jak Greek Salad — kilka osobnych produktów.",
      baseRecipeId: 203 as const,
   },
] as const
