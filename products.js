// ============================================================
// LISTA PRODOTTI COLAZIONE HOTEL APOGEO
// ============================================================

const STANDARD_PRODUCTS = [

  // ========================================
  // YOGURT
  // ========================================
  { id: "yogurt-frutta", name: "Yogurt Frutta - Plateau", category: "Yogurt" },
  { id: "yogurt-bianco", name: "Yogurt Bianco - Plateau", category: "Yogurt" },

  // ========================================
  // DOLCIFICANTI
  // ========================================
  { id: "zucchero-bianco", name: "Zucchero Bianco Monodose - Scatola Grande", category: "Dolcificanti" },
  { id: "zucchero-canna", name: "Zucchero Canna Monodose - Scatola", category: "Dolcificanti" },
  { id: "zucchero-dietetico", name: "Zucchero Dietetico Monodose - Scatola", category: "Dolcificanti" },
  { id: "miele-monodose", name: "Miele Monodose - Scatola", category: "Dolcificanti" },
  { id: "crema-nocciola", name: "Crema Nocciola Monodose (surr. Nutella)", category: "Dolcificanti" },

  // ========================================
  // BEVANDE CALDE
  // ========================================
  { id: "the-earl-grey", name: "Tè Twinings Earl Grey", category: "Bevande Calde" },
  { id: "the-english-breakfast", name: "Tè Twinings English Breakfast", category: "Bevande Calde" },
  { id: "the-verde", name: "Tè Twinings Verde", category: "Bevande Calde" },
  { id: "ciobar", name: "Preparato Cioccolato Ciobar", category: "Bevande Calde" },
  { id: "camomilla", name: "Camomilla Filtri", category: "Bevande Calde" },
  { id: "tisane", name: "Tisane Assortite", category: "Bevande Calde" },

  // ========================================
  // MARMELLATE
  // ========================================
  { id: "marm-ciliegia", name: "Marmellata Hero Ciliegia Monodose", category: "Marmellate" },
  { id: "marm-frutti-bosco", name: "Marmellata Hero Frutti di Bosco Monodose", category: "Marmellate" },
  { id: "marm-albicocca", name: "Marmellata Hero Albicocca Monodose", category: "Marmellate" },
  { id: "marm-fragola", name: "Marmellata Hero Fragola Monodose", category: "Marmellate" },

  // ========================================
  // CORNETTI E DOLCI
  // ========================================
  { id: "cornetto-ciliegia", name: "Cornetti Midi Ciliegia (no marca Piselli)", category: "Cornetti e Dolci" },
  { id: "cornetto-albicocca", name: "Cornetti Midi Albicocca (no marca Piselli)", category: "Cornetti e Dolci" },
  { id: "cornetto-cioccolato", name: "Cornetti Midi Cioccolato (no marca Piselli)", category: "Cornetti e Dolci" },
  { id: "plum-cake", name: "Plum Cake Mister Day o Midi", category: "Cornetti e Dolci" },
  { id: "crostatina-lago-ciocc", name: "Crostatine Lago Cioccolato", category: "Cornetti e Dolci" },
  { id: "crostatina-lago-alb", name: "Crostatine Lago Albicocca", category: "Cornetti e Dolci" },

  // ========================================
  // CEREALI
  // ========================================
  { id: "fette-biscottate", name: "Fette Biscottate Mulino Bianco", category: "Cereali" },
  { id: "riso-soffiato", name: "Riso Soffiato Cioccolato", category: "Cereali" },
  { id: "muesli", name: "Muesli Mix Cerealitalia", category: "Cereali" },

  // ========================================
  // CONCENTRATI E BEVANDE
  // ========================================
  { id: "concentrato-arancia", name: "Concentrato Marr Arancia", category: "Concentrati" },
  { id: "concentrato-ananas", name: "Concentrato Marr Ananas", category: "Concentrati" },
  { id: "latte-senza-lattosio", name: "Latte Senza Lattosio Tre Valli (no Granarolo)", category: "Concentrati" },
  { id: "latte-soia", name: "Latte di Soia Hoplà", category: "Concentrati" },
  { id: "latte-riso", name: "Latte di Riso", category: "Concentrati" },
  { id: "latte-mandorla", name: "Latte di Mandorla", category: "Concentrati" },

  // ========================================
  // TORTE E CIAMBELLONI
  // ========================================
  { id: "ciambellone-ciocc", name: "Ciambellone Galgani Variegato Cioccolato (preaffettato)", category: "Torte" },
  { id: "crostata-bosco", name: "Mezza Crostata Galgani Frutti di Bosco Rotonda", category: "Torte" },

  // ========================================
  // SALATO
  // ========================================
  { id: "prosciutto-cotto", name: "Prosciutto Cotto", category: "Salato" },
  { id: "burro-monodose", name: "Burro Monodose", category: "Salato" },

  // ========================================
  // SENZA GLUTINE
  // ========================================
  { id: "panfette-glutine", name: "Panfette Nutrifree Senza Glutine", category: "Senza Glutine" },
  { id: "crost-schar-alb", name: "Crostatine Schär Senza Glutine Albicocca", category: "Senza Glutine" },
  { id: "crost-schar-ciocc", name: "Crostatine Schär Senza Glutine Cioccolato", category: "Senza Glutine" },

  // ========================================
  // BISCOTTI
  // ========================================
  { id: "biscotti-oswego", name: "Biscotti Monodose Oswego", category: "Biscotti" },
  { id: "biscotti-gran-turchese", name: "Biscotti Monodose Gran Turchese", category: "Biscotti" },

  // ========================================
  // VARIE / MATERIALI
  // ========================================
  { id: "bicchieri", name: "Bicchieri Colazioni", category: "Materiali" },
  { id: "tovaglioli", name: "Tovaglioli Colazioni", category: "Materiali" },
  { id: "sale-addolcitore", name: "Sale per Addolcitore", category: "Materiali" },

];

// ============================================================
// CATEGORIE (ordine di visualizzazione) con icone
// ============================================================
const CATEGORIES_ORDER = [
  "Yogurt",
  "Dolcificanti",
  "Bevande Calde",
  "Marmellate",
  "Cornetti e Dolci",
  "Cereali",
  "Concentrati",
  "Torte",
  "Salato",
  "Senza Glutine",
  "Biscotti",
  "Materiali"
];

const CATEGORY_ICONS = {
  "Yogurt":           "🍶",
  "Dolcificanti":     "🍯",
  "Bevande Calde":    "☕",
  "Marmellate":       "🍓",
  "Cornetti e Dolci": "🥐",
  "Cereali":          "🌾",
  "Concentrati":      "🥛",
  "Torte":            "🎂",
  "Salato":           "🥩",
  "Senza Glutine":    "🌿",
  "Biscotti":         "🍪",
  "Materiali":        "🧻"
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STANDARD_PRODUCTS, CATEGORIES_ORDER, CATEGORY_ICONS };
}
