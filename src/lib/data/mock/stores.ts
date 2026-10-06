import type { Store } from "../../types";

// Stand-in for rows of the `stores` table. Add a row here (later: in the DB)
// and the store shows up across the dashboard automatically.
export const MOCK_STORES: Store[] = [
  {
    id: "st_maax",
    slug: "maax",
    brand: "WOLHWA_GALBI",
    storeName: "Wolhwa Galbi MAAX, Pasay",
    shortName: "MAAX",
    googleLocationId: null,
    address: "MAAX, Pasay City",
    active: true,
    sortOrder: 1,
  },
  {
    id: "st_greenhills",
    slug: "greenhills",
    brand: "WOLHWA_GALBI",
    storeName: "Wolhwa Galbi Greenhills",
    shortName: "Greenhills",
    googleLocationId: null,
    address: "Greenhills, San Juan",
    active: true,
    sortOrder: 2,
  },
  {
    id: "st_fairview",
    slug: "ayala-fairview",
    brand: "WOLHWA_GALBI",
    storeName: "Wolhwa Galbi Ayala Fairview",
    shortName: "Ayala Fairview",
    googleLocationId: null,
    address: "Ayala Malls Fairview Terraces, Quezon City",
    active: true,
    sortOrder: 3,
  },
  {
    id: "st_tomas",
    slug: "tomas-morato",
    brand: "WOLHWA_GALBI",
    storeName: "Wolhwa Galbi Tomas Morato",
    shortName: "Tomas Morato",
    googleLocationId: null,
    address: "Tomas Morato Ave, Quezon City",
    active: true,
    sortOrder: 4,
  },
  {
    id: "st_kodo_jazz",
    slug: "kodokodo-jazz-mall",
    brand: "KODOKODO",
    storeName: "KODOKODO Jazz Mall, Makati",
    shortName: "KODOKODO Jazz",
    googleLocationId: null,
    address: "Jazz Mall, Makati City",
    active: true,
    sortOrder: 5,
  },
];

/** Google cumulative rating/count as of the day before mock data starts. */
export const BASELINE: Record<string, { avg: number; count: number }> = {
  st_maax: { avg: 4.72, count: 1840 },
  st_greenhills: { avg: 4.65, count: 1215 },
  st_fairview: { avg: 4.58, count: 760 },
  st_tomas: { avg: 4.74, count: 1532 },
  st_kodo_jazz: { avg: 4.61, count: 410 },
};
