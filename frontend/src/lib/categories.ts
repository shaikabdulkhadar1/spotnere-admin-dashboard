export interface Category {
  name: string;
  subCategories: string[];
}

export interface CategoriesData {
  categories: Category[];
}

export const categories: Category[] = [
  {
    name: "Sports",
    subCategories: [
      "Cricket",
      "Racquet games",
      "Football",
      "Basket ball",
      "Volly ball",
      "Golf",
      "Bowling",
      "Snooker",
      "Aiming Games",
      "VR Games",
      "Paintball",
      "Go Carting",
      "Trampolin",
      "Cycling",
    ],
  },
  {
    name: "Adventure",
    subCategories: [
      "Water Amusement",
      "Jungle Safari",
      "Para Gliding",
      "Para Motoring",
      "Trekking",
      "Ziplining",
      "Horse Riding",
    ],
  },
  {
    name: "Parks",
    subCategories: [
      "Water Amusement",
      "Family Park",
      "Zoological park",
      "Kids park",
    ],
  },
  {
    name: "Staycation",
    subCategories: ["Farm House", "Resorts", "5S Villa's"],
  },
  {
    name: "Tickets to Event",
    subCategories: [
      "Football Match",
      "Cricket Match",
      "Hockey Match",
      "Snooker Match",
      "Tennis Match",
      "Kabaddi Match",
      "IPL Tickets",
    ],
  },
  {
    name: "Exclusive",
    subCategories: [
      "Scuba Diving",
      "Sky Diving",
      "Hot Air Ballon",
      "Disney Land",
      "Ferrari World",
      "Mount Everest Climbing",
    ],
  },
];

/**
 * Get all category names
 */
export function getCategoryNames(): string[] {
  return categories.map((cat) => cat.name);
}

/**
 * Get sub-categories for a specific category
 */
export function getSubCategories(categoryName: string): string[] {
  const category = categories.find(
    (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
  );
  return category?.subCategories || [];
}

/**
 * Get category by name
 */
export function getCategory(categoryName: string): Category | undefined {
  return categories.find(
    (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
  );
}

/**
 * Check if a category exists
 */
export function categoryExists(categoryName: string): boolean {
  return categories.some(
    (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
  );
}

/**
 * Check if a sub-category exists for a category
 */
export function subCategoryExists(
  categoryName: string,
  subCategoryName: string
): boolean {
  const subCategories = getSubCategories(categoryName);
  return subCategories.some(
    (sub) => sub.toLowerCase() === subCategoryName.toLowerCase()
  );
}
