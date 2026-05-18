export type FeatureStatus = "available" | "planned"

export interface FeatureItem {
   id: string
   title: string
   description: string
   status: FeatureStatus
}

export interface FeatureGroup {
   title: string
   route: string
   items: FeatureItem[]
}

export const APP_FEATURE_GROUPS: FeatureGroup[] = [
   {
      title: "Magazyn",
      route: "/warehouse",
      items: [
         { id: "1.1.1.1", title: "Przeglądaj listę produktów", description: "Lista produktów w katalogu", status: "available" },
         { id: "1.1.1.2", title: "Dodaj nowy produkt", description: "Akcja dostępna jako przycisk w UI", status: "planned" },
         { id: "1.1.2.1", title: "Rejestruj dostarczone produkty", description: "Formularz szkicu dostawy", status: "available" },
         { id: "1.1.2.2", title: "Przyjmij dostawę", description: "Zatwierdzenie dostawy aktualizuje magazyn operacyjny", status: "available" },
         { id: "1.1.3.1", title: "Wyświetl stany magazynowe", description: "Podgląd stanów (tylko odczyt)", status: "available" },
         { id: "1.1.3.2", title: "Sprawdź daty ważności", description: "Produkty posortowane wg ważności", status: "available" },
         { id: "1.1.4.1", title: "Porównaj stan systemu z rzeczywistym", description: "Tabela porównawcza inwentaryzacji", status: "planned" },
         { id: "1.1.4.2", title: "Koryguj stany magazynowe", description: "Lista ręcznych korekt", status: "planned" },
      ],
   },
   {
      title: "Przepisy",
      route: "/recipes",
      items: [
         { id: "1.2.1.1", title: "Przypisz produkty do przepisu", description: "Mapowanie składników przepisu", status: "available" },
         { id: "1.2.1.2", title: "Określ ilość na porcję", description: "Podgląd ilości na porcję", status: "available" },
         { id: "1.2.2.1", title: "Modyfikuj istniejące przepisy", description: "Tablica edycji przepisów", status: "available" },
         { id: "1.2.2.2", title: "Usuń nieaktualne przepisy", description: "Lista archiwizacji", status: "available" },
      ],
   },
   {
      title: "Zamówienia",
      route: "/orders",
      items: [
         { id: "1.3.1.1", title: "Wybierz przepis z menu", description: "Lista przepisów do zamówienia", status: "available" },
         {
            id: "1.3.1.2",
            title: "Przyjmij zamówienie i zużyj stan",
            description: "Operacyjny flow akceptacji zamówienia",
            status: "available",
         },
         { id: "1.3.2.1", title: "Przeglądaj listę zamówień", description: "Widok kolejki zamówień", status: "available" },
         { id: "1.3.2.2", title: "Edytuj i usuń zamówienie", description: "Akcje na zamówieniu (mock)", status: "available" },
      ],
   },
   {
      title: "Kadra i komunikacja",
      route: "/schedule",
      items: [
         { id: "1.4.1.1", title: "Przeglądaj listę pracowników", description: "Tabela pracowników (właściciel)", status: "available" },
         { id: "1.4.1.2", title: "Dodawaj i edytuj pracowników", description: "Modal i akcje w UI", status: "available" },
         { id: "1.4.2", title: "Tablica harmonogramu pracy", description: "Kalendarz zmian (właściciel)", status: "available" },
         { id: "1.4.3.1", title: "Publikuj i edytuj ogłoszenia", description: "Tablica ogłoszeń (właściciel)", status: "available" },
         { id: "1.4.3.2", title: "Czytaj ogłoszenia", description: "Kanał zespołu (pracownik — odczyt)", status: "available" },
      ],
   },
   {
      title: "Pulpit główny",
      route: "/",
      items: [
         { id: "1.5.1", title: "Pokaż plan dnia", description: "Zmiany na dziś wg roli", status: "available" },
         { id: "1.5.2", title: "Podgląd ostatnich zamówień", description: "Karta ostatnich zamówień", status: "available" },
         {
            id: "1.5.3",
            title: "Alerty świeżości i jakości",
            description: "Szybki panel alertów magazynowych",
            status: "available",
         },
      ],
   },
]
