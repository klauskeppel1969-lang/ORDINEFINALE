// ============================================================
// ============================================================
//
//          LISTA PRODOTTI COLAZIONE HOTEL
//
//          Ogni articolo deve avere:
//          - id: identificativo unico (senza spazi, minuscolo)
//          - name: nome visualizzato
//          - category: categoria di appartenenza
//
// ============================================================
// ============================================================

const STANDARD_PRODUCTS = [

  // ========================================
  // BEVANDE
  // ========================================
  {
    id: "latte-intero",
    name: "Latte Intero",
    category: "Bevande"
  },
  {
    id: "latte-scremato",
    name: "Latte Scremato",
    category: "Bevande"
  },
  {
    id: "cappuccino",
    name: "Cappuccino in polvere",
    category: "Bevande"
  },
  {
    id: "succo-arancia",
    name: "Succo d'Arancia",
    category: "Bevande"
  },
  {
    id: "succo-mela",
    name: "Succo di Mela",
    category: "Bevande"
  },
  {
    id: "acqua-naturale",
    name: "Acqua Naturale 0.5L",
    category: "Bevande"
  },
  {
    id: "acqua-frizzante",
    name: "Acqua Frizzante 0.5L",
    category: "Bevande"
  },

  // ========================================
  // CORNETTI
  // ========================================
  {
    id: "cornetto-cioccolato",
    name: "Cornetto Cioccolato",
    category: "Cornetti"
  },
  {
    id: "cornetto-albicocca",
    name: "Cornetto Albicocca",
    category: "Cornetti"
  },
  {
    id: "cornetto-ciliegia",
    name: "Cornetto Ciliegia",
    category: "Cornetti"
  },
  {
    id: "mini-brioches",
    name: "Mini Brioches Miste",
    category: "Cornetti"
  },

  // ========================================
  // YOGURT
  // ========================================
  {
    id: "yogurt-bianco",
    name: "Yogurt Bianco",
    category: "Yogurt"
  },
  {
    id: "yogurt-fragola",
    name: "Yogurt Fragola",
    category: "Yogurt"
  },
  {
    id: "yogurt-mirtilli",
    name: "Yogurt Mirtilli",
    category: "Yogurt"
  },

  // ========================================
  // SALATO
  // ========================================
  {
    id: "prosciutto-cotto",
    name: "Prosciutto Cotto",
    category: "Salato"
  },
  {
    id: "prosciutto-crudo",
    name: "Prosciutto Crudo",
    category: "Salato"
  },
  {
    id: "formaggio-fette",
    name: "Formaggio a Fette",
    category: "Salato"
  },
  {
    id: "uova-sode",
    name: "Uova Sode confezionate",
    category: "Salato"
  },

  // ========================================
  // DOLCI
  // ========================================
  {
    id: "marmellata-albicocca",
    name: "Marmellata Albicocca Monodose",
    category: "Dolci"
  },
  {
    id: "marmellata-fruttirossi",
    name: "Marmellata Frutti Rossi Monodose",
    category: "Dolci"
  },
  {
    id: "nutella-monodose",
    name: "Crema al Cioccolato Monodose",
    category: "Dolci"
  },
  {
    id: "miele-monodose",
    name: "Miele Monodose",
    category: "Dolci"
  },

  // ========================================
  // EXTRA
  // ========================================
  {
    id: "pane-slice",
    name: "Pane in Cassetta",
    category: "Extra"
  },
  {
    id: "biscotti-secchi",
    name: "Biscotti Secchi Assortiti",
    category: "Extra"
  },
  {
    id: "cornflakes",
    name: "Cornflakes",
    category: "Extra"
  }

];

// ============================================================
// CATEGORIE DISPONIBILI (ordine di visualizzazione)
// ============================================================
const CATEGORIES_ORDER = [
  "Bevande",
  "Cornetti",
  "Yogurt",
  "Salato",
  "Dolci",
  "Extra"
];

// Esporta per uso in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STANDARD_PRODUCTS, CATEGORIES_ORDER };
}
