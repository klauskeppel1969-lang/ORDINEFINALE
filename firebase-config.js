// ============================================================
// ============================================================
//
//          CONFIGURAZIONE FIREBASE
//
//          ISTRUZIONI:
//          1. Vai su https://console.firebase.google.com
//          2. Crea un nuovo progetto (o usa uno esistente)
//          3. Vai su Impostazioni Progetto > Generali
//          4. Scorri fino a "Le tue app" e clicca "Web"
//          5. Registra l'app e copia i valori di configurazione
//          6. Sostituisci i valori qui sotto con i tuoi
//
//          IMPORTANTE: Abilita Firestore Database dal pannello Firebase!
//
// ============================================================
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyB61V1JR7F5GX1kfraqLn98uVcXNjjAwOo",
  authDomain: "ordine-97777.firebaseapp.com",
  projectId: "ordine-97777",
  storageBucket: "ordine-97777.firebasestorage.app",
  messagingSenderId: "47723451358",
  appId: "1:47723451358:web:567df2bb7ca7aa0a71434f"
};

// ============================================================
// INIZIALIZZAZIONE FIREBASE
// ============================================================

let db = null;
let firebaseInitialized = false;

/**
 * Inizializza Firebase se la configurazione è valida
 * @returns {boolean} true se inizializzato con successo
 */
function initializeFirebase() {
  // Verifica se la configurazione è stata modificata
  if (firebaseConfig.apiKey === "LA-TUA-API-KEY") {
    console.warn("⚠️ Firebase non configurato. La sincronizzazione realtime è disabilitata.");
    console.warn("📝 Modifica firebase-config.js con le tue credenziali Firebase.");
    return false;
  }

  try {
    // Inizializza Firebase
    firebase.initializeApp(firebaseConfig);
    
    // Ottieni riferimento a Firestore
    db = firebase.firestore();
    
    // Abilita persistenza offline
    db.enablePersistence({ synchronizeTabs: true })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("Persistenza offline non disponibile (più tab aperte)");
        } else if (err.code === 'unimplemented') {
          console.warn("Persistenza offline non supportata da questo browser");
        }
      });

    firebaseInitialized = true;
    console.log("✅ Firebase inizializzato con successo");
    return true;
  } catch (error) {
    console.error("❌ Errore inizializzazione Firebase:", error);
    return false;
  }
}

/**
 * Verifica se Firebase è pronto
 * @returns {boolean}
 */
function isFirebaseReady() {
  return firebaseInitialized && db !== null;
}

/**
 * Ottieni riferimento al database Firestore
 * @returns {firebase.firestore.Firestore|null}
 */
function getFirestore() {
  return db;
}

// ============================================================
// COLLEZIONI FIRESTORE
// ============================================================

const COLLECTIONS = {
  // Stato corrente degli articoli (selezioni, quantità, note)
  CURRENT_ORDER: "currentOrder",
  
  // Articoli extra aggiunti dall'utente
  EXTRA_ITEMS: "extraItems",
  
  // Storico ordini salvati (per futura implementazione)
  ORDER_HISTORY: "orderHistory",
  
  // Impostazioni app (per futura implementazione)
  SETTINGS: "settings"
};
