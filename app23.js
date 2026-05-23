// ============================================================
// ============================================================
//
//          APP.JS - LOGICA PRINCIPALE
//          Gestione Ordini Colazione Hotel
//
// ============================================================
// ============================================================

// ============================================================
// STATO APPLICAZIONE
// ============================================================

/**
 * Stato globale dell'applicazione
 */
const AppState = {
  // Tutti gli articoli (standard + extra)
  items: [],
  
  // Articoli extra salvati
  extraItems: [],
  
  // Stato corrente ordine (selezioni, quantità, note)
  orderState: {},
  
  // Filtro attivo
  activeFilter: 'all', // 'all', 'selected', o nome categoria
  
  // Categorie espanse/collassate
  expandedCategories: {},
  
  // Firebase listener attivi
  unsubscribeListeners: []
};

// ============================================================
// INIZIALIZZAZIONE
// ============================================================

/**
 * Inizializza l'applicazione al caricamento della pagina
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log("🥐 Inizializzazione Ordini Colazione Hotel...");
  
  // Registra Service Worker per PWA
  registerServiceWorker();
  
  // Carica articoli standard
  loadStandardProducts();
  
  // Inizializza Firebase
  const firebaseOk = initializeFirebase();
  
  if (firebaseOk) {
    // Avvia sync realtime
    startRealtimeSync();
    updateConnectionStatus('online');
  } else {
    // Modalità locale
    loadLocalState();
    updateConnectionStatus('local');
  }
  
  // Inizializza stato categorie (tutte espanse)
  CATEGORIES_ORDER.forEach(cat => {
    AppState.expandedCategories[cat] = true;
  });
  
  // Renderizza interfaccia
  renderApp();
  
  // Setup event listeners globali
  setupGlobalListeners();
  
  console.log("✅ App inizializzata");
});

/**
 * Registra il Service Worker
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register("service-worker.js")
      .then((reg) => {
        console.log('✅ Service Worker registrato');
        
        // Controlla aggiornamenti
        reg.addEventListener('updatefound', () => {
          showToast('Nuova versione disponibile. Ricarica la pagina.', 'warning');
        });
      })
      .catch((err) => {
        console.warn('⚠️ Service Worker non registrato:', err);
      });
  }
}

/**
 * Carica gli articoli standard da products.js
 */
function loadStandardProducts() {
  if (typeof STANDARD_PRODUCTS === 'undefined') {
    console.error("❌ STANDARD_PRODUCTS non trovato in products.js");
    return;
  }
  
  AppState.items = STANDARD_PRODUCTS.map(product => ({
    ...product,
    isExtra: false
  }));
  
  console.log(`📦 Caricati ${AppState.items.length} articoli standard`);
}

// ============================================================
// FIREBASE SYNC
// ============================================================

/**
 * Avvia la sincronizzazione realtime con Firebase
 */
function startRealtimeSync() {
  if (!isFirebaseReady()) return;
  
  const db = getFirestore();
  
  // Sync stato ordine corrente
  const unsubOrder = db.collection(COLLECTIONS.CURRENT_ORDER)
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const itemId = change.doc.id;
        
        if (change.type === 'added' || change.type === 'modified') {
          AppState.orderState[itemId] = data;
        } else if (change.type === 'removed') {
          delete AppState.orderState[itemId];
        }
      });
      
      renderApp();
      updateStats();
    }, (error) => {
      console.error("Errore sync ordine:", error);
      updateConnectionStatus('offline');
    });
  
  AppState.unsubscribeListeners.push(unsubOrder);
  
  // Sync articoli extra
  const unsubExtra = db.collection(COLLECTIONS.EXTRA_ITEMS)
    .onSnapshot((snapshot) => {
      AppState.extraItems = [];
      
      snapshot.forEach((doc) => {
        AppState.extraItems.push({
          id: doc.id,
          ...doc.data(),
          isExtra: true
        });
      });
      
      // Aggiorna lista items
      updateItemsList();
      renderApp();
    }, (error) => {
      console.error("Errore sync extra:", error);
    });
  
  AppState.unsubscribeListeners.push(unsubExtra);
  
  console.log("🔄 Sync realtime attivato");
}

/**
 * Aggiorna la lista completa degli articoli
 */
function updateItemsList() {
  // Ricarica standard
  const standardItems = STANDARD_PRODUCTS.map(p => ({
    ...p,
    isExtra: false
  }));
  
  // Unisci con extra
  AppState.items = [...standardItems, ...AppState.extraItems];
}

/**
 * Salva lo stato di un articolo su Firebase
 */
async function saveItemState(itemId, state) {
  if (!isFirebaseReady()) {
    // Salva localmente se Firebase non disponibile
    saveLocalState();
    return;
  }
  
  const db = getFirestore();
  
  try {
    if (state.selected || state.quantity > 0 || state.note) {
      // Salva/aggiorna
      await db.collection(COLLECTIONS.CURRENT_ORDER).doc(itemId).set(state);
    } else {
      // Rimuovi se vuoto
      await db.collection(COLLECTIONS.CURRENT_ORDER).doc(itemId).delete();
    }
  } catch (error) {
    console.error("Errore salvataggio:", error);
    showToast("Errore di sincronizzazione", "error");
  }
}

/**
 * Aggiunge un articolo extra su Firebase
 */
async function addExtraItem(item) {
  if (!isFirebaseReady()) {
    // Aggiungi localmente
    const localItem = {
      ...item,
      id: 'extra-' + Date.now(),
      isExtra: true
    };
    AppState.extraItems.push(localItem);
    updateItemsList();
    saveLocalState();
    renderApp();
    return localItem.id;
  }
  
  const db = getFirestore();
  
  try {
    const docRef = await db.collection(COLLECTIONS.EXTRA_ITEMS).add({
      name: item.name,
      category: item.category || 'Extra',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Errore aggiunta extra:", error);
    showToast("Errore aggiunta articolo", "error");
    return null;
  }
}

/**
 * Elimina un articolo extra
 */
async function deleteExtraItem(itemId) {
  if (!isFirebaseReady()) {
    AppState.extraItems = AppState.extraItems.filter(i => i.id !== itemId);
    delete AppState.orderState[itemId];
    updateItemsList();
    saveLocalState();
    renderApp();
    return;
  }
  
  const db = getFirestore();
  
  try {
    await db.collection(COLLECTIONS.EXTRA_ITEMS).doc(itemId).delete();
    await db.collection(COLLECTIONS.CURRENT_ORDER).doc(itemId).delete();
    showToast("Articolo eliminato", "success");
  } catch (error) {
    console.error("Errore eliminazione:", error);
    showToast("Errore eliminazione", "error");
  }
}

// ============================================================
// STORAGE LOCALE (Fallback)
// ============================================================

const LOCAL_STORAGE_KEY = 'ordiniColazioneHotel';

/**
 * Salva stato in localStorage
 */
function saveLocalState() {
  const data = {
    orderState: AppState.orderState,
    extraItems: AppState.extraItems,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Errore salvataggio locale:", e);
  }
}

/**
 * Carica stato da localStorage
 */
function loadLocalState() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      AppState.orderState = parsed.orderState || {};
      AppState.extraItems = parsed.extraItems || [];
      updateItemsList();
      console.log("📂 Stato locale caricato");
    }
  } catch (e) {
    console.warn("Errore caricamento locale:", e);
  }
}

// ============================================================
// RENDERING UI
// ============================================================

/**
 * Renderizza l'intera applicazione
 */
function renderApp() {
  const container = document.getElementById('items-container');
  if (!container) return;
  
  // Raggruppa per categoria
  const grouped = groupByCategory(getFilteredItems());
  
  // Genera HTML
  let html = '';
  
  CATEGORIES_ORDER.forEach(category => {
    const items = grouped[category];
    if (!items || items.length === 0) return;
    
    const isExpanded = AppState.expandedCategories[category] !== false;
    const selectedCount = items.filter(i => getItemState(i.id).selected).length;
    
    html += `
      <div class="category ${isExpanded ? '' : 'collapsed'}" data-category="${category}">
        <div class="category-header" onclick="toggleCategory('${category}')">
          <div class="category-title">
            <span class="category-icon">${getCategoryIcon(category)}</span>
            <span>${category}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="category-count ${selectedCount > 0 ? 'has-selected' : ''}">${selectedCount}/${items.length}</span>
            <span class="category-toggle">▼</span>
          </div>
        </div>
        <div class="category-items" style="max-height: ${isExpanded ? items.length * 60 + 'px' : '0'}">
          ${items.map(item => renderItemRow(item)).join('')}
        </div>
      </div>
    `;
  });
  
  if (html === '') {
    html = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">Nessun articolo da visualizzare</div>
      </div>
    `;
  }
  
  container.innerHTML = html;
  
  // Aggiorna stats
  updateStats();
}

/**
 * Renderizza una singola riga articolo
 */
function renderItemRow(item) {
  const state = getItemState(item.id);
  const isSelected = state.selected;
  const quantity = state.quantity || 0;
  const note = state.note || '';
  
  const classes = [
    'item-row',
    isSelected ? 'selected' : '',
    item.isExtra ? 'extra' : ''
  ].filter(Boolean).join(' ');
  
  return `
    <div class="${classes}" data-id="${item.id}">
      <div class="item-checkbox" onclick="toggleItem('${item.id}')"></div>
      
      <div class="item-name ${note ? 'has-note' : ''}" onclick="toggleItem('${item.id}')">
        <span>
          ${item.name}
          ${item.isExtra ? '<span class="extra-badge">EXTRA</span>' : ''}
        </span>
        ${note ? `<span class="item-note-preview">${escapeHtml(note)}</span>` : ''}
      </div>
      
      <div class="item-qty-controls">
        <button class="qty-btn minus" onclick="changeQty('${item.id}', -1)">−</button>
        <span class="item-qty ${quantity > 0 ? 'has-qty' : ''}">${quantity}</span>
        <button class="qty-btn plus" onclick="changeQty('${item.id}', 1)">+</button>
      </div>
      
      <button class="item-note-btn ${note ? 'has-note' : ''}" onclick="editNote('${item.id}')" title="Note">
        📝
      </button>
      
      ${item.isExtra ? `
        <button class="item-delete-btn" onclick="confirmDeleteExtra('${item.id}')" title="Elimina">
          🗑️
        </button>
      ` : ''}
      
      <span class="print-qty">${quantity > 0 ? quantity : ''}</span>
    </div>
  `;
}

/**
 * Ottiene lo stato di un articolo
 */
function getItemState(itemId) {
  return AppState.orderState[itemId] || {
    selected: false,
    quantity: 0,
    note: ''
  };
}

/**
 * Raggruppa gli articoli per categoria
 */
function groupByCategory(items) {
  const grouped = {};
  
  items.forEach(item => {
    const category = item.category || 'Extra';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  });
  
  return grouped;
}

/**
 * Filtra gli articoli in base al filtro attivo
 */
function getFilteredItems() {
  let items = AppState.items;
  
  if (AppState.activeFilter === 'selected') {
    items = items.filter(i => getItemState(i.id).selected);
  } else if (AppState.activeFilter !== 'all') {
    items = items.filter(i => i.category === AppState.activeFilter);
  }
  
  return items;
}

/**
 * Restituisce l'icona per una categoria
 */
function getCategoryIcon(category) {
  if (typeof CATEGORY_ICONS !== 'undefined' && CATEGORY_ICONS[category]) {
    return CATEGORY_ICONS[category];
  }
  return '📦';
}

/**
 * Aggiorna le statistiche nell'header
 */
function updateStats() {
  const selectedItems = AppState.items.filter(i => getItemState(i.id).selected);
  const totalQty = selectedItems.reduce((sum, i) => sum + (getItemState(i.id).quantity || 0), 0);
  
  const selectedCountEl = document.getElementById('selected-count');
  const totalQtyEl = document.getElementById('total-qty');
  
  if (selectedCountEl) selectedCountEl.textContent = selectedItems.length;
  if (totalQtyEl) totalQtyEl.textContent = totalQty;
}

/**
 * Aggiorna indicatore stato connessione
 */
function updateConnectionStatus(status) {
  const el = document.getElementById('connection-status');
  if (!el) return;
  
  el.className = 'connection-status ' + status;
  
  const labels = {
    'online': '● Online',
    'offline': '● Offline',
    'local': '● Locale'
  };
  
  el.textContent = labels[status] || status;
}

// ============================================================
// INTERAZIONI UTENTE
// ============================================================

/**
 * Toggle selezione articolo
 */
function toggleItem(itemId) {
  const state = getItemState(itemId);
  state.selected = !state.selected;
  
  // Se selezionato e quantità 0, imposta a 1
  if (state.selected && state.quantity === 0) {
    state.quantity = 1;
  }
  
  AppState.orderState[itemId] = state;
  saveItemState(itemId, state);
  renderApp();
}

/**
 * Modifica quantità articolo
 */
function changeQty(itemId, delta) {
  const state = getItemState(itemId);
  const newQty = Math.max(0, (state.quantity || 0) + delta);
  
  state.quantity = newQty;
  
  // Auto-seleziona se quantità > 0
  if (newQty > 0) {
    state.selected = true;
  }
  
  // Auto-deseleziona se quantità = 0
  if (newQty === 0) {
    state.selected = false;
  }
  
  AppState.orderState[itemId] = state;
  saveItemState(itemId, state);
  renderApp();
}

/**
 * Modifica nota articolo
 */
function editNote(itemId) {
  const item = AppState.items.find(i => i.id === itemId);
  const state = getItemState(itemId);
  
  showModal('note-modal', {
    title: `Note: ${item ? item.name : 'Articolo'}`,
    content: `
      <div class="form-group">
        <label class="form-label">Nota (opzionale)</label>
        <textarea class="form-textarea" id="note-input" placeholder="Es: solo se in offerta, marca specifica...">${state.note || ''}</textarea>
      </div>
    `,
    onConfirm: () => {
      const noteInput = document.getElementById('note-input');
      state.note = noteInput.value.trim();
      AppState.orderState[itemId] = state;
      saveItemState(itemId, state);
      hideModal('note-modal');
      renderApp();
    }
  });
}

/**
 * Toggle espansione categoria
 */
function toggleCategory(category) {
  AppState.expandedCategories[category] = !AppState.expandedCategories[category];
  renderApp();
}

/**
 * Imposta filtro attivo
 */
function setFilter(filter) {
  AppState.activeFilter = filter;
  
  // Aggiorna UI filtri
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  
  renderApp();
}

// ============================================================
// ARTICOLI EXTRA
// ============================================================

/**
 * Mostra modal per aggiungere articolo extra
 */
function showAddExtraModal() {
  // Genera opzioni categorie
  const categoryOptions = CATEGORIES_ORDER
    .map(cat => `<option value="${cat}">${cat}</option>`)
    .join('');
  
  showModal('extra-modal', {
    title: 'Aggiungi Articolo Extra',
    content: `
      <div class="form-group">
        <label class="form-label">Nome Articolo *</label>
        <input type="text" class="form-input" id="extra-name" placeholder="Es: Torta evento aziendale" required>
      </div>
      <div class="form-group">
        <label class="form-label">Categoria</label>
        <select class="form-select" id="extra-category">
          ${categoryOptions}
        </select>
      </div>
    `,
    onConfirm: async () => {
      const name = document.getElementById('extra-name').value.trim();
      const category = document.getElementById('extra-category').value;
      
      if (!name) {
        showToast('Inserisci un nome', 'error');
        return;
      }
      
      const itemId = await addExtraItem({ name, category });
      
      if (itemId) {
        showToast('Articolo extra aggiunto', 'success');
        hideModal('extra-modal');
        
        // Auto-seleziona il nuovo articolo
        setTimeout(() => {
          toggleItem(itemId);
        }, 100);
      }
    }
  });
  
  // Focus sul campo nome
  setTimeout(() => {
    document.getElementById('extra-name')?.focus();
  }, 100);
}

/**
 * Conferma eliminazione articolo extra
 */
function confirmDeleteExtra(itemId) {
  const item = AppState.items.find(i => i.id === itemId);
  
  showModal('confirm-modal', {
    title: 'Elimina Articolo Extra',
    content: `
      <p>Sei sicuro di voler eliminare <strong>${item ? item.name : 'questo articolo'}</strong>?</p>
      <p style="color:#6b7280;font-size:0.85rem;margin-top:8px;">Questa azione non può essere annullata.</p>
    `,
    confirmText: 'Elimina',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      deleteExtraItem(itemId);
      hideModal('confirm-modal');
    }
  });
}

// ============================================================
// RESET ORDINE
// ============================================================

/**
 * Conferma e resetta l'ordine
 */
function confirmResetOrder() {
  showModal('confirm-modal', {
    title: 'Reset Ordine',
    content: `
      <p>Sei sicuro di voler resettare l'ordine?</p>
      <p style="color:#6b7280;font-size:0.85rem;margin-top:8px;">
        Questa azione cancellerà tutte le selezioni, le quantità e gli articoli extra.
      </p>
    `,
    confirmText: 'Reset',
    confirmClass: 'btn-danger',
    onConfirm: async () => {
      await resetOrder();
      hideModal('confirm-modal');
    }
  });
}

/**
 * Resetta l'ordine
 */
async function resetOrder() {
  if (isFirebaseReady()) {
    const db = getFirestore();
    const batch = db.batch();
    
    // Elimina tutti i documenti in currentOrder
    const orderSnapshot = await db.collection(COLLECTIONS.CURRENT_ORDER).get();
    orderSnapshot.forEach(doc => batch.delete(doc.ref));
    
    // Elimina tutti gli articoli extra
    const extraSnapshot = await db.collection(COLLECTIONS.EXTRA_ITEMS).get();
    extraSnapshot.forEach(doc => batch.delete(doc.ref));
    
    try {
      await batch.commit();
    } catch (error) {
      console.error("Errore reset:", error);
      showToast("Errore durante il reset", "error");
      return;
    }
  }
  
  // Reset stato locale
  AppState.orderState = {};
  AppState.extraItems = [];
  updateItemsList();
  saveLocalState();
  
  renderApp();
  showToast("Ordine resettato", "success");
}

// ============================================================
// STAMPA
// ============================================================

/**
 * Stampa l'ordine
 */
function printOrder() {
  const selectedItems = AppState.items.filter(i => getItemState(i.id).selected);
  
  if (selectedItems.length === 0) {
    showToast("Nessun articolo selezionato da stampare", "warning");
    return;
  }
  
  // Prepara intestazione stampa
  const printHeader = document.querySelector('.print-header');
  if (printHeader) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    printHeader.querySelector('p').textContent = `Ordine del ${dateStr}`;
  }
  
  // Prepara footer stampa
  const printFooter = document.querySelector('.print-footer');
  if (printFooter) {
    printFooter.textContent = `Totale articoli: ${selectedItems.length} | Generato il ${new Date().toLocaleString('it-IT')}`;
  }
  
  // Lancia stampa
  window.print();
}

// ============================================================
// MODAL SYSTEM
// ============================================================

let currentModal = null;

/**
 * Mostra un modal
 */
function showModal(id, options = {}) {
  // Crea o aggiorna il modal
  let overlay = document.getElementById('modal-overlay');
  
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => {
      if (e.target === overlay) hideModal();
    };
    document.body.appendChild(overlay);
  }
  
  const confirmText = options.confirmText || 'Conferma';
  const confirmClass = options.confirmClass || 'btn-primary';
  
  overlay.innerHTML = `
    <div class="modal" id="${id}">
      <div class="modal-header">
        <span class="modal-title">${options.title || ''}</span>
        <button class="modal-close" onclick="hideModal()">&times;</button>
      </div>
      <div class="modal-body">
        ${options.content || ''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="hideModal()">Annulla</button>
        <button class="btn ${confirmClass}" id="modal-confirm-btn">${confirmText}</button>
      </div>
    </div>
  `;
  
  // Aggiungi listener conferma
  const confirmBtn = document.getElementById('modal-confirm-btn');
  if (confirmBtn && options.onConfirm) {
    confirmBtn.onclick = options.onConfirm;
  }
  
  // Mostra
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });
  
  currentModal = id;
}

/**
 * Nasconde il modal corrente
 */
function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
  currentModal = null;
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

/**
 * Mostra una notifica toast
 */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  // Rimuovi dopo 3 secondi
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Escape HTML per prevenire XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Setup listener globali
 */
function setupGlobalListeners() {
  // Gestione online/offline
  window.addEventListener('online', () => {
    updateConnectionStatus('online');
    showToast('Connessione ripristinata', 'success');
  });
  
  window.addEventListener('offline', () => {
    updateConnectionStatus('offline');
    showToast('Modalità offline', 'warning');
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // ESC chiude modal
    if (e.key === 'Escape' && currentModal) {
      hideModal();
    }
  });
}

// ============================================================
// STORICO ORDINI (Struttura per futura implementazione)
// ============================================================

/**
 * Salva l'ordine corrente nello storico
 * @returns {Promise<string|null>} ID dell'ordine salvato
 */
async function saveOrderToHistory() {
  const selectedItems = AppState.items
    .filter(i => getItemState(i.id).selected)
    .map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      isExtra: item.isExtra,
      ...getItemState(item.id)
    }));
  
  if (selectedItems.length === 0) {
    showToast("Nessun articolo da salvare", "warning");
    return null;
  }
  
  if (!isFirebaseReady()) {
    showToast("Storico non disponibile in modalità locale", "warning");
    return null;
  }
  
  const db = getFirestore();
  
  try {
    const docRef = await db.collection(COLLECTIONS.ORDER_HISTORY).add({
      items: selectedItems,
      itemCount: selectedItems.length,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showToast("Ordine salvato nello storico", "success");
    return docRef.id;
  } catch (error) {
    console.error("Errore salvataggio storico:", error);
    showToast("Errore salvataggio", "error");
    return null;
  }
}

/**
 * Carica un ordine dallo storico (futura implementazione)
 * @param {string} orderId - ID dell'ordine da caricare
 */
async function loadOrderFromHistory(orderId) {
  // TODO: Implementare caricamento ordine dallo storico
  console.log("loadOrderFromHistory:", orderId);
}

/**
 * Duplica un ordine dallo storico (futura implementazione)
 * @param {string} orderId - ID dell'ordine da duplicare
 */
async function duplicateOrder(orderId) {
  // TODO: Implementare duplicazione ordine
  console.log("duplicateOrder:", orderId);
}

// ============================================================
// ESPORTA FUNZIONI GLOBALI (per onclick inline)
// ============================================================
window.toggleItem = toggleItem;
window.changeQty = changeQty;
window.editNote = editNote;
window.toggleCategory = toggleCategory;
window.setFilter = setFilter;
window.showAddExtraModal = showAddExtraModal;
window.confirmDeleteExtra = confirmDeleteExtra;
window.confirmResetOrder = confirmResetOrder;
window.printOrder = printOrder;
window.hideModal = hideModal;
window.saveOrderToHistory = saveOrderToHistory;

// ============================================================
// NAVIGAZIONE TRA VISTE
// ============================================================

function showView(name) {
  document.getElementById('view-main').style.display = name === 'main' ? '' : 'none';
  document.getElementById('view-storico').style.display = name === 'storico' ? '' : 'none';
  document.getElementById('view-statistiche').style.display = name === 'statistiche' ? '' : 'none';

  if (name === 'storico') renderStorico();
  if (name === 'statistiche') renderStatistiche();
}

// ============================================================
// CONFERMA E SALVATAGGIO ORDINE
// ============================================================

function confirmSaveOrder() {
  const selectedItems = AppState.items.filter(i => getItemState(i.id).selected);
  if (selectedItems.length === 0) {
    showToast('Nessun articolo selezionato', 'warning');
    return;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  showModal('save-modal', {
    title: '✅ Conferma Ordine',
    content: `
      <p>Stai per confermare l'ordine del <strong>${dateStr}</strong>.</p>
      <p style="margin-top:8px;color:#6b7280;font-size:0.85rem;">${selectedItems.length} articoli selezionati.</p>
      <p style="margin-top:8px;color:#6b7280;font-size:0.85rem;">L'ordine verrà salvato nello storico. L'ordine corrente rimarrà attivo.</p>
    `,
    confirmText: 'Conferma e Salva',
    confirmClass: 'btn-success',
    onConfirm: async () => {
      await doSaveOrder();
      hideModal();
    }
  });
}

async function doSaveOrder() {
  const selectedItems = AppState.items
    .filter(i => getItemState(i.id).selected)
    .map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      isExtra: item.isExtra || false,
      quantity: getItemState(item.id).quantity || 0,
      note: getItemState(item.id).note || ''
    }));

  const now = new Date();
  const record = {
    items: selectedItems,
    itemCount: selectedItems.length,
    totalQty: selectedItems.reduce((s, i) => s + i.quantity, 0),
    createdAt: now.toISOString(),
    dateLabel: now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  };

  if (isFirebaseReady()) {
    try {
      await getFirestore().collection(COLLECTIONS.ORDER_HISTORY).add(record);
      showToast('Ordine salvato nello storico ✅', 'success');
    } catch (e) {
      console.error(e);
      showToast('Errore salvataggio Firebase', 'error');
      _saveOrderLocal(record);
    }
  } else {
    _saveOrderLocal(record);
    showToast('Ordine salvato localmente ✅', 'success');
  }
}

function _saveOrderLocal(record) {
  try {
    const key = 'ordiniStorico';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    record.id = 'local-' + Date.now();
    existing.unshift(record);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 100)));
  } catch(e) { console.warn(e); }
}

// ============================================================
// STORICO
// ============================================================

async function renderStorico() {
  const container = document.getElementById('storico-container');
  container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">Caricamento...</div></div>';

  let orders = [];

  if (isFirebaseReady()) {
    try {
      const snap = await getFirestore().collection(COLLECTIONS.ORDER_HISTORY)
        .orderBy('createdAt', 'desc').limit(50).get();
      snap.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
    } catch(e) {
      console.error(e);
    }
  }

  // Fallback locale
  if (orders.length === 0) {
    try {
      orders = JSON.parse(localStorage.getItem('ordiniStorico') || '[]');
    } catch(e) {}
  }

  if (orders.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">Nessun ordine confermato ancora</div></div>';
    return;
  }

  let html = '';
  orders.forEach(order => {
    const date = order.dateLabel || order.createdAt?.substring(0,10) || '—';
    const grouped = {};
    (order.items || []).forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    const categorieHtml = Object.entries(grouped).map(([cat, items]) => `
      <div class="storico-cat">
        <div class="storico-cat-title">${getCategoryIcon(cat)} ${cat}</div>
        ${items.map(i => `<div class="storico-item"><span>${i.name}</span><span class="storico-qty">${i.quantity > 0 ? '×' + i.quantity : ''}</span></div>`).join('')}
      </div>
    `).join('');

    html += `
      <div class="storico-card">
        <div class="storico-header" onclick="this.nextElementSibling.classList.toggle('open')">
          <div>
            <div class="storico-date">📅 ${date}</div>
            <div class="storico-meta">${order.itemCount} articoli · qtà tot: ${order.totalQty || '—'}</div>
          </div>
          <span class="storico-toggle">▼</span>
        </div>
        <div class="storico-body">
          ${categorieHtml}
          <button class="btn btn-danger btn-sm" style="margin-top:12px;" onclick="deleteOrderFromStorico('${order.id}', this)">🗑️ Elimina</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

async function deleteOrderFromStorico(id, btn) {
  if (!confirm('Eliminare questo ordine dallo storico?')) return;
  if (isFirebaseReady() && !id.startsWith('local-')) {
    try { await getFirestore().collection(COLLECTIONS.ORDER_HISTORY).doc(id).delete(); } catch(e) {}
  } else {
    try {
      const existing = JSON.parse(localStorage.getItem('ordiniStorico') || '[]');
      localStorage.setItem('ordiniStorico', JSON.stringify(existing.filter(o => o.id !== id)));
    } catch(e) {}
  }
  btn.closest('.storico-card').remove();
  showToast('Ordine eliminato', 'success');
}

// ============================================================
// STATISTICHE
// ============================================================

async function renderStatistiche() {
  const container = document.getElementById('statistiche-container');
  container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">Calcolo statistiche...</div></div>';

  let orders = [];

  if (isFirebaseReady()) {
    try {
      const snap = await getFirestore().collection(COLLECTIONS.ORDER_HISTORY)
        .orderBy('createdAt', 'desc').limit(200).get();
      snap.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
    } catch(e) { console.error(e); }
  }
  if (orders.length === 0) {
    try { orders = JSON.parse(localStorage.getItem('ordiniStorico') || '[]'); } catch(e) {}
  }

  if (orders.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">Nessun dato disponibile ancora.<br>Conferma almeno un ordine prima.</div></div>';
    return;
  }

  // Frequenza e quantità per prodotto
  const prodStats = {};
  const monthlyOrders = {};

  orders.forEach(order => {
    // Andamento mensile
    const dateStr = order.createdAt || order.dateLabel || '';
    let monthKey = '—';
    if (dateStr.includes('-') && dateStr.length >= 7) {
      const d = new Date(dateStr);
      if (!isNaN(d)) monthKey = d.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) monthKey = parts[1] + '/' + parts[2];
    }
    monthlyOrders[monthKey] = (monthlyOrders[monthKey] || 0) + 1;

    (order.items || []).forEach(item => {
      if (!prodStats[item.id]) {
        prodStats[item.id] = { name: item.name, category: item.category, count: 0, totalQty: 0 };
      }
      prodStats[item.id].count++;
      prodStats[item.id].totalQty += (item.quantity || 0);
    });
  });

  const totalOrders = orders.length;

  // Top 10 per frequenza
  const byFreq = Object.values(prodStats).sort((a, b) => b.count - a.count).slice(0, 15);

  // Top 10 per quantità media
  const byAvgQty = Object.values(prodStats)
    .map(p => ({ ...p, avgQty: p.totalQty / p.count }))
    .sort((a, b) => b.avgQty - a.avgQty).slice(0, 15);

  // Andamento mensile
  const monthEntries = Object.entries(monthlyOrders).reverse();

  const maxFreq = byFreq[0]?.count || 1;
  const maxAvg = byAvgQty[0]?.avgQty || 1;

  const freqHtml = byFreq.map((p, i) => `
    <div class="stat-row">
      <div class="stat-rank">${i+1}</div>
      <div class="stat-name">${getCategoryIcon(p.category)} ${p.name}</div>
      <div class="stat-bar-wrap"><div class="stat-bar" style="width:${Math.round(p.count/maxFreq*100)}%"></div></div>
      <div class="stat-val">${p.count}/${totalOrders}</div>
    </div>
  `).join('');

  const avgHtml = byAvgQty.map((p, i) => `
    <div class="stat-row">
      <div class="stat-rank">${i+1}</div>
      <div class="stat-name">${getCategoryIcon(p.category)} ${p.name}</div>
      <div class="stat-bar-wrap"><div class="stat-bar stat-bar-green" style="width:${Math.round(p.avgQty/maxAvg*100)}%"></div></div>
      <div class="stat-val">${p.avgQty.toFixed(1)}</div>
    </div>
  `).join('');

  const monthHtml = monthEntries.length > 0 ? monthEntries.map(([m, c]) => `
    <div class="stat-row">
      <div class="stat-name" style="min-width:90px">${m}</div>
      <div class="stat-bar-wrap"><div class="stat-bar stat-bar-purple" style="width:${Math.round(c/Math.max(...Object.values(monthlyOrders))*100)}%"></div></div>
      <div class="stat-val">${c} ordini</div>
    </div>
  `).join('') : '<p style="color:#9ca3af;font-size:0.85rem;">Dati insufficienti</p>';

  container.innerHTML = `
    <div class="stat-summary">
      <div class="stat-card-mini"><div class="stat-card-num">${totalOrders}</div><div class="stat-card-label">Ordini totali</div></div>
      <div class="stat-card-mini"><div class="stat-card-num">${Object.keys(prodStats).length}</div><div class="stat-card-label">Prodotti distinti</div></div>
      <div class="stat-card-mini"><div class="stat-card-num">${(orders.reduce((s,o)=>s+(o.totalQty||0),0)/totalOrders).toFixed(0)}</div><div class="stat-card-label">Qtà media/ordine</div></div>
    </div>

    <div class="stat-section">
      <div class="stat-section-title">🏆 Prodotti ordinati più spesso</div>
      ${freqHtml}
    </div>

    <div class="stat-section">
      <div class="stat-section-title">📦 Quantità media per ordine</div>
      ${avgHtml}
    </div>

    <div class="stat-section">
      <div class="stat-section-title">📅 Ordini per mese</div>
      ${monthHtml}
    </div>
  `;
}

// ============================================================
// CONDIVISIONE
// ============================================================

const SHARE_EMAILS = ['info@hotelapogeo.it', 'ogvcap@gmail.com'];

function showSharePanel() {
  const selectedItems = AppState.items.filter(i => getItemState(i.id).selected);
  if (selectedItems.length === 0) {
    showToast('Nessun articolo da inviare', 'warning');
    return;
  }

  const text = buildOrderText();
  const waText = encodeURIComponent(text);
  const waUrl = `https://wa.me/?text=${waText}`;

  const emailSubject = encodeURIComponent('Ordine Colazione Hotel Apogeo - ' + new Date().toLocaleDateString('it-IT'));
  const emailBody = encodeURIComponent(text);

  const emailBtns = SHARE_EMAILS.map(email => `
    <a href="mailto:${email}?subject=${emailSubject}&body=${emailBody}" class="share-btn share-email" target="_blank">
      ✉️ ${email}
    </a>
  `).join('');

  document.getElementById('share-body').innerHTML = `
    <div class="share-preview">${text.replace(/\n/g,'<br>')}</div>

    <div class="share-section-title">📱 WhatsApp</div>
    <a href="${waUrl}" target="_blank" class="share-btn share-whatsapp">
      💬 Apri in WhatsApp
    </a>

    <div class="share-section-title" style="margin-top:16px;">✉️ Email preimpostata</div>
    ${emailBtns}

    <div class="share-section-title" style="margin-top:16px;">✉️ Altro indirizzo</div>
    <div style="display:flex;gap:8px;align-items:center;">
      <input type="email" id="custom-email" class="form-input" placeholder="es. fornitore@example.com" style="flex:1;">
      <button class="btn btn-primary" onclick="sendToCustomEmail('${emailSubject}','${emailBody}')">Invia</button>
    </div>

    <button class="share-btn share-copy" style="margin-top:16px;" onclick="copyOrderText()">📋 Copia testo</button>
  `;

  document.getElementById('share-overlay').classList.add('active');
}

function sendToCustomEmail(subject, body) {
  const email = document.getElementById('custom-email').value.trim();
  if (!email || !email.includes('@')) { showToast('Indirizzo non valido', 'error'); return; }
  window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
}

function closeSharePanel() {
  document.getElementById('share-overlay').classList.remove('active');
}

function buildOrderText() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const selectedItems = AppState.items.filter(i => getItemState(i.id).selected);

  // Raggruppa per categoria
  const grouped = {};
  selectedItems.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  let text = `🥐 ORDINE COLAZIONE - HOTEL APOGEO\n`;
  text += `📅 ${dateStr}\n`;
  text += `${'─'.repeat(35)}\n\n`;

  CATEGORIES_ORDER.forEach(cat => {
    const items = grouped[cat];
    if (!items || items.length === 0) return;
    text += `${getCategoryIcon(cat)} ${cat.toUpperCase()}\n`;
    items.forEach(item => {
      const state = getItemState(item.id);
      const qty = state.quantity > 0 ? ` ×${state.quantity}` : '';
      const note = state.note ? ` (${state.note})` : '';
      text += `  • ${item.name}${qty}${note}\n`;
    });
    text += '\n';
  });

  text += `${'─'.repeat(35)}\n`;
  text += `Totale: ${selectedItems.length} articoli`;
  return text;
}

function copyOrderText() {
  const text = buildOrderText();
  navigator.clipboard.writeText(text).then(() => {
    showToast('Testo copiato negli appunti ✅', 'success');
  }).catch(() => {
    showToast('Copia manuale: seleziona il testo sopra', 'warning');
  });
}

// Esporta funzioni globali aggiuntive
window.showView = showView;
window.confirmSaveOrder = confirmSaveOrder;
window.showSharePanel = showSharePanel;
window.closeSharePanel = closeSharePanel;
window.copyOrderText = copyOrderText;
window.sendToCustomEmail = sendToCustomEmail;
window.deleteOrderFromStorico = deleteOrderFromStorico;
