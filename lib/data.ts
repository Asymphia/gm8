export interface EmployeeType {
   name: string
   surname: string
   phone: string
   email: string
   active: boolean
}

export interface ProductCatalog {
   name: string
   unit: string
   isActive: boolean
}

export const DUMMY_PRODUCT_CATALOG_DATA: ProductCatalog[] = [
   { name: "Fresh Milk 2%", unit: "L", isActive: true },
   { name: "Sourdough Bread", unit: "pcs", isActive: true },
   { name: "Brown Eggs M", unit: "pack", isActive: true },
   { name: "Chicken Breast Fillet", unit: "kg", isActive: true },
   { name: "Smoked Ham", unit: "kg", isActive: true },
   { name: "Cheddar Cheese", unit: "kg", isActive: true },
   { name: "Natural Yogurt", unit: "pcs", isActive: true },
   { name: "Butter 82%", unit: "pcs", isActive: true },
   { name: "Spaghetti Pasta", unit: "pcs", isActive: true },
   { name: "Tomato Passata", unit: "pcs", isActive: true },
   { name: "Basmati Rice", unit: "kg", isActive: true },
   { name: "Wheat Flour Type 500", unit: "kg", isActive: true },
   { name: "Cane Sugar", unit: "kg", isActive: true },
   { name: "Sea Salt", unit: "kg", isActive: true },
   { name: "Olive Oil Extra Virgin", unit: "L", isActive: true },
   { name: "Sunflower Oil", unit: "L", isActive: true },
   { name: "Orange Juice", unit: "L", isActive: true },
   { name: "Still Water 1.5L", unit: "pcs", isActive: true },
   { name: "Sparkling Water 1.5L", unit: "pcs", isActive: false },
   { name: "Dark Chocolate 70%", unit: "pcs", isActive: false }
]

export const DUMMY_EMPLOYEE_DATA: EmployeeType[] = [
   { name: "Anna", surname: "Kowalska", phone: "+48 512 100 001", email: "anna.kowalska@example.com", active: true },
   { name: "Piotr", surname: "Nowak", phone: "+48 512 100 002", email: "piotr.nowak@example.com", active: true },
   {
      name: "Maria",
      surname: "Wiśniewska",
      phone: "+48 512 100 003",
      email: "maria.wisniewska@example.com",
      active: false
   },
   { name: "Tomasz", surname: "Wójcik", phone: "+48 512 100 004", email: "tomasz.wojcik@example.com", active: true },
   {
      name: "Katarzyna",
      surname: "Kowalczyk",
      phone: "+48 512 100 005",
      email: "katarzyna.kowalczyk@example.com",
      active: true
   },
   {
      name: "Michał",
      surname: "Kamiński",
      phone: "+48 512 100 006",
      email: "michal.kaminski@example.com",
      active: true
   },
   {
      name: "Magdalena",
      surname: "Lewandowska",
      phone: "+48 512 100 007",
      email: "magdalena.lewandowska@example.com",
      active: false
   },
   {
      name: "Jakub",
      surname: "Zieliński",
      phone: "+48 512 100 008",
      email: "jakub.zielinski@example.com",
      active: true
   },
   {
      name: "Agnieszka",
      surname: "Szymańska",
      phone: "+48 512 100 009",
      email: "agnieszka.szymanska@example.com",
      active: true
   },
   { name: "Marcin", surname: "Woźniak", phone: "+48 512 100 010", email: "marcin.wozniak@example.com", active: false },
   { name: "Ewa", surname: "Dąbrowska", phone: "+48 512 100 011", email: "ewa.dabrowska@example.com", active: true },
   {
      name: "Łukasz",
      surname: "Kozłowski",
      phone: "+48 512 100 012",
      email: "lukasz.kozlowski@example.com",
      active: true
   },
   {
      name: "Joanna",
      surname: "Jankowska",
      phone: "+48 512 100 013",
      email: "joanna.jankowska@example.com",
      active: true
   },
   {
      name: "Krzysztof",
      surname: "Mazur",
      phone: "+48 512 100 014",
      email: "krzysztof.mazur@example.com",
      active: true
   },
   {
      name: "Aleksandra",
      surname: "Kwiatkowska",
      phone: "+48 512 100 015",
      email: "aleksandra.kwiatkowska@example.com",
      active: false
   },
   { name: "Adam", surname: "Krawczyk", phone: "+48 512 100 016", email: "adam.krawczyk@example.com", active: true },
   {
      name: "Natalia",
      surname: "Piotrowska",
      phone: "+48 512 100 017",
      email: "natalia.piotrowska@example.com",
      active: true
   },
   {
      name: "Grzegorz",
      surname: "Grabowski",
      phone: "+48 512 100 018",
      email: "grzegorz.grabowski@example.com",
      active: true
   },
   {
      name: "Monika",
      surname: "Pawłowska",
      phone: "+48 512 100 019",
      email: "monika.pawlowska@example.com",
      active: false
   },
   { name: "Dawid", surname: "Michalski", phone: "+48 512 100 020", email: "dawid.michalski@example.com", active: true }
]
