/**
 * LUCIA FINANCE - Main Application Controller
 * Handles UI interactions, view transitions, data sync, and reactive renders.
 */

const App = {
  currentView: 'home',
  homePeriod: 'month', // 'month' or 'all'
  reportPeriod: 'this-month',
  selectedProjectFilter: 'all',
  selectedExpenseCategory: 'all',
  selectedInvoiceFilter: 'all',
  invoiceLineItems: [],
  editingInvoiceId: null,
  previewingInvoiceId: null,
  editingIncomeId: null,
  editingExpenseId: null,
  editingProjectId: null,
  editingWithdrawalId: null,
  editingFundId: null,
  sharingReceiptData: null,
  enteredPin: '',
  authMode: 'pin',
  navigationHistory: ['home'],
  selectedBillingTab: 'all',
  selectedNotifCategory: 'all',

  init() {
    // Check authentication
    this.checkAuth();

    // Subscribe to data store updates
    window.dataStore.subscribe(() => {
      App.renderAll();
    });

    // Populate date pickers with today's date
    const todayStr = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(inp => {
      if (!inp.value) inp.value = todayStr;
    });

    // Initial render
    this.renderAll();

    // Responsive resize listener for charts
    window.addEventListener('resize', () => {
      App.renderCharts();
    });

    // Browser popstate listener for back navigation
    window.addEventListener('popstate', (e) => {
      const openModal = document.querySelector('.modal-overlay.open');
      if (openModal && openModal.id !== 'auth-screen') {
        App.closeModalDirect(openModal.id);
        return;
      }
      if (e.state && e.state.view) {
        App.navigateTo(e.state.view, false);
      } else {
        App.navigateTo('home', false);
      }
    });

    // Keyboard listener for PIN lock screen
    window.addEventListener('keydown', (e) => {
      const authOverlay = document.getElementById('auth-screen');
      if (authOverlay && !authOverlay.classList.contains('hidden') && App.authMode === 'pin') {
        if (/^[0-9]$/.test(e.key)) {
          App.handlePinDigit(e.key);
        } else if (e.key === 'Backspace') {
          App.handlePinBackspace();
        } else if (e.key === 'Escape') {
          App.clearPin();
        }
      }
    });
  },

  // --- AUTHENTICATION & SECURITY ---

  checkAuth() {
    const sec = window.dataStore.data.settings?.security || { enabled: true, pin: '1234', defaultMode: 'pin' };
    const authOverlay = document.getElementById('auth-screen');
    if (!authOverlay) return;

    if (!sec.enabled) {
      authOverlay.classList.add('hidden');
      return;
    }

    const isAuthed = sessionStorage.getItem('lucia_authenticated');
    if (isAuthed === 'true') {
      authOverlay.classList.add('hidden');
    } else {
      this.enteredPin = '';
      this.updatePinDots();
      this.switchAuthMode(sec.defaultMode || 'pin');
      authOverlay.classList.remove('hidden');
    }
  },

  handlePinDigit(digit) {
    if (this.enteredPin.length >= 4) return;
    this.enteredPin += digit;
    this.updatePinDots();
    const errorEl = document.getElementById('auth-pin-error');
    if (errorEl) errorEl.textContent = '';

    if (this.enteredPin.length === 4) {
      setTimeout(() => {
        this.validatePin();
      }, 120);
    }
  },

  handlePinBackspace() {
    if (this.enteredPin.length > 0) {
      this.enteredPin = this.enteredPin.slice(0, -1);
      this.updatePinDots();
      const errorEl = document.getElementById('auth-pin-error');
      if (errorEl) errorEl.textContent = '';
    }
  },

  clearPin() {
    this.enteredPin = '';
    this.updatePinDots();
    const errorEl = document.getElementById('auth-pin-error');
    if (errorEl) errorEl.textContent = '';
  },

  updatePinDots() {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`pindot-${i}`);
      if (dot) {
        dot.classList.toggle('filled', i < this.enteredPin.length);
      }
    }
  },

  validatePin() {
    const sec = window.dataStore.data.settings?.security || { pin: '1234' };
    const correctPin = String(sec.pin || '1234');

    if (this.enteredPin === correctPin) {
      this.unlockApp();
    } else {
      const card = document.getElementById('auth-card-box');
      const errorEl = document.getElementById('auth-pin-error');
      if (card) {
        card.classList.remove('shake');
        void card.offsetWidth;
        card.classList.add('shake');
      }
      if (errorEl) {
        errorEl.textContent = 'Incorrect PIN. Please try again.';
      }
      setTimeout(() => {
        this.clearPin();
      }, 600);
    }
  },

  switchAuthMode(mode) {
    this.authMode = mode;
    const pinMode = document.getElementById('auth-mode-pin');
    const pwdMode = document.getElementById('auth-mode-password');
    const pinError = document.getElementById('auth-pin-error');
    const pwdError = document.getElementById('auth-password-error');
    if (pinError) pinError.textContent = '';
    if (pwdError) pwdError.textContent = '';

    if (mode === 'password') {
      if (pinMode) pinMode.style.display = 'none';
      if (pwdMode) pwdMode.style.display = 'block';
      setTimeout(() => {
        const emailInp = document.getElementById('auth-login-email');
        if (emailInp) emailInp.focus();
      }, 50);
    } else {
      if (pinMode) pinMode.style.display = 'block';
      if (pwdMode) pwdMode.style.display = 'none';
      this.clearPin();
    }
  },

  handlePasswordLogin(e) {
    if (e) e.preventDefault();
    const sec = window.dataStore.data.settings?.security || { email: 'lucia@studio.com', password: 'lucia' };
    const emailInp = document.getElementById('auth-login-email');
    const pwdInp = document.getElementById('auth-login-password');
    const errorEl = document.getElementById('auth-password-error');

    const emailVal = (emailInp ? emailInp.value : '').trim().toLowerCase();
    const pwdVal = pwdInp ? pwdInp.value : '';

    const correctEmail = (sec.email || 'lucia@studio.com').trim().toLowerCase();
    const correctPassword = sec.password || 'lucia';

    if (emailVal === correctEmail && pwdVal === correctPassword) {
      if (errorEl) errorEl.textContent = '';
      this.unlockApp();
    } else {
      const card = document.getElementById('auth-card-box');
      if (card) {
        card.classList.remove('shake');
        void card.offsetWidth;
        card.classList.add('shake');
      }
      if (errorEl) {
        errorEl.textContent = 'Invalid email or password. Please try again.';
      }
    }
  },

  unlockApp() {
    sessionStorage.setItem('lucia_authenticated', 'true');
    const authOverlay = document.getElementById('auth-screen');
    if (authOverlay) {
      authOverlay.classList.add('hidden');
    }
    this.enteredPin = '';
    this.updatePinDots();
    const pinError = document.getElementById('auth-pin-error');
    const pwdError = document.getElementById('auth-password-error');
    if (pinError) pinError.textContent = '';
    if (pwdError) pwdError.textContent = '';
    this.showToast('Unlocked successfully ✓');
  },

  lockApp() {
    sessionStorage.removeItem('lucia_authenticated');
    this.enteredPin = '';
    this.updatePinDots();
    const sec = window.dataStore.data.settings?.security || { defaultMode: 'pin' };
    this.switchAuthMode(sec.defaultMode || 'pin');
    const authOverlay = document.getElementById('auth-screen');
    if (authOverlay) {
      authOverlay.classList.remove('hidden');
    }
    this.showToast('App Locked 🔒');
  },

  togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPwd = input.type === 'password';
    input.type = isPwd ? 'text' : 'password';
    if (btnEl) {
      btnEl.innerHTML = isPwd
        ? `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    }
  },

  // --- NAVIGATION ---

  navigateTo(viewName, pushHistory = true) {
    // If navigating to income, redirect to the unified invoices & revenue hub
    if (viewName === 'income') viewName = 'invoices';

    if (pushHistory && viewName !== this.currentView) {
      this.navigationHistory.push(this.currentView);
      if (window.history && window.history.pushState) {
        window.history.pushState({ view: viewName }, '', '#' + viewName);
      }
    }

    this.currentView = viewName;

    // Update desktop nav buttons
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });

    // Update mobile bottom nav
    document.querySelectorAll('.bottom-tab').forEach(tab => {
      const tabView = tab.getAttribute('data-view');
      const isActive = tabView === viewName || 
        (tabView === 'finance' && (viewName === 'invoices' || viewName === 'expenses' || viewName === 'company-fund')) ||
        (tabView === 'invoices' && viewName === 'invoices') ||
        (tabView === 'more' && (viewName === 'partners' || viewName === 'reports' || viewName === 'settings'));
      tab.classList.toggle('active', isActive);
    });

    // Update views visibility
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Refresh charts when entering chart views
    setTimeout(() => {
      if (viewName === 'home' || viewName === 'expenses' || viewName === 'reports') {
        App.renderCharts();
      }
    }, 50);
  },

  goBack() {
    // 1. If any modal or drawer is open, close it first
    const openModals = document.querySelectorAll('.modal-overlay.open, .modal-overlay.active, .modal-overlay:not(.hidden)');
    for (const m of openModals) {
      if (m.id && m.id !== 'auth-screen' && m.style.display !== 'none' && window.getComputedStyle(m).display !== 'none') {
        this.closeModalDirect(m.id);
        return;
      }
    }

    // 2. Pop navigation history
    if (this.navigationHistory && this.navigationHistory.length > 0) {
      const prev = this.navigationHistory.pop();
      if (prev && prev !== this.currentView) {
        this.navigateTo(prev, false);
        return;
      }
    }

    // 3. Fallback to home
    if (this.currentView !== 'home') {
      this.navigateTo('home', false);
    }
  },

  setHomePeriod(period) {
    this.homePeriod = period;
    document.querySelectorAll('#home-period-filter .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-period') === period);
    });
    const sub = document.getElementById('dashboard-period-subtitle');
    if (sub) {
      sub.textContent = period === 'month' ? 'Showing performance for This Month' : 'Showing all-time studio performance';
    }
    this.renderHome();
  },

  setReportPeriod(period) {
    this.reportPeriod = period;
    document.querySelectorAll('#reports-period-selector .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-period') === period);
    });
    this.renderReports();
  },

  // --- MODALS ---

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';

      // Reset form and reset title/button if opening fresh (not in edit mode)
      if (modalId === 'modal-income' && !this.editingIncomeId) {
        document.getElementById('form-income')?.reset();
        const editId = document.getElementById('inc-edit-id');
        if (editId) editId.value = '';
        const dateEl = document.getElementById('inc-date');
        if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
        const titleEl = document.getElementById('modal-income-title');
        if (titleEl) titleEl.innerHTML = `<svg width="20" height="20" fill="none" stroke="var(--gold-primary)" stroke-width="2.2" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 6px;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Record Revenue & Client Bill`;
        const btnEl = document.getElementById('btn-save-income');
        if (btnEl) btnEl.textContent = 'Save Revenue & Bill';
        const delBtn = document.getElementById('btn-delete-income');
        if (delBtn) delBtn.style.display = 'none';
        this.selectPaymentMethod('inc', 'UPI');
        this.populateIncomeProjectDropdown();
        this.updateIncomeLiveBalance();
      } else if (modalId === 'modal-expense' && !this.editingExpenseId) {
        document.getElementById('form-expense')?.reset();
        const dateEl = document.getElementById('exp-date');
        if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
        const titleEl = document.getElementById('modal-expense-title');
        if (titleEl) titleEl.textContent = 'Add Expense';
        const btnEl = document.getElementById('btn-save-expense');
        if (btnEl) btnEl.textContent = 'Save Expense';
        const delBtn = document.getElementById('btn-delete-expense');
        if (delBtn) delBtn.style.display = 'none';
        this.selectPaymentMethod('exp', 'UPI');
      } else if (modalId === 'modal-project' && !this.editingProjectId) {
        document.getElementById('form-project')?.reset();
        const dateEl = document.getElementById('proj-date');
        if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
        const titleEl = document.getElementById('modal-project-title');
        if (titleEl) titleEl.textContent = 'Add Project';
        const btnEl = document.getElementById('btn-save-project');
        if (btnEl) btnEl.textContent = 'Save Project';
        const delBtn = document.getElementById('btn-delete-project');
        if (delBtn) delBtn.style.display = 'none';
      } else if (modalId === 'modal-withdrawal' && !this.editingWithdrawalId) {
        document.getElementById('form-withdrawal')?.reset();
        const dateEl = document.getElementById('wd-date');
        if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
        const titleEl = document.getElementById('modal-withdrawal-title');
        if (titleEl) titleEl.textContent = 'Record Partner Withdrawal';
        const btnEl = document.getElementById('btn-save-withdrawal');
        if (btnEl) btnEl.textContent = 'Save Withdrawal';
        const delBtn = document.getElementById('btn-delete-withdrawal');
        if (delBtn) delBtn.style.display = 'none';
      } else if (modalId === 'modal-fund' && !this.editingFundId) {
        const delBtn = document.getElementById('btn-delete-fund');
        if (delBtn) delBtn.style.display = 'none';
      } else if (modalId === 'modal-invoice' && !this.editingInvoiceId) {
        const delBtn = document.getElementById('btn-delete-invoice');
        if (delBtn) delBtn.style.display = 'none';
      }

      // Prepopulate select inputs
      if (modalId === 'modal-income') this.populateIncomeProjectDropdown();
      if (modalId === 'modal-expense') this.populateExpenseProjectDropdown();
      if (modalId === 'modal-payment') this.populatePaymentProjectDropdown();
    }
  },

  closeModal(event, modalId) {
    if (event.target.id === modalId) {
      this.closeModalDirect(modalId);
    }
  },

  closeModalDirect(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      if (modalId === 'modal-income') this.editingIncomeId = null;
      if (modalId === 'modal-expense') this.editingExpenseId = null;
      if (modalId === 'modal-project') this.editingProjectId = null;
      if (modalId === 'modal-withdrawal') this.editingWithdrawalId = null;
      if (modalId === 'modal-fund') this.editingFundId = null;
      if (modalId === 'modal-invoice') this.editingInvoiceId = null;
    }
  },

  openQuickHubModal() {
    this.openModal('modal-quick-hub');
  },

  openAddIncomeFromHub() {
    this.closeModalDirect('modal-quick-hub');
    this.openModal('modal-income');
  },

  openAddExpenseFromHub() {
    this.closeModalDirect('modal-quick-hub');
    this.openModal('modal-expense');
  },

  openAddProjectFromHub() {
    this.closeModalDirect('modal-quick-hub');
    this.openModal('modal-project');
  },

  openAddPaymentFromHub() {
    this.closeModalDirect('modal-quick-hub');
    this.openModal('modal-payment');
  },

  openWithdrawalModal(partnerId) {
    const select = document.getElementById('wd-partner');
    if (select) {
      const p1Name = window.dataStore.data.settings?.partner1Name || 'Shameem';
      const p2Name = window.dataStore.data.settings?.partner2Name || 'Shiyan';
      if (select.options.length >= 2) {
        select.options[0].textContent = p1Name;
        select.options[1].textContent = p2Name;
      }
      if (partnerId) select.value = partnerId;
    }
    this.openModal('modal-withdrawal');
  },

  openFundModal(type = 'usage') {
    this.editingFundId = null;
    const title = document.getElementById('fund-modal-title');
    const typeInput = document.getElementById('fund-tx-type');
    const btn = document.getElementById('btn-save-fund');
    if (title && typeInput) {
      typeInput.value = type;
      title.textContent = type === 'addition' ? '+ Add Company Fund' : '− Use Company Fund (Gear / Asset)';
    }
    if (btn) btn.textContent = 'Save Fund Record';
    const delBtn = document.getElementById('btn-delete-fund');
    if (delBtn) delBtn.style.display = 'none';
    document.getElementById('form-fund')?.reset();
    const dateEl = document.getElementById('fund-date');
    if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
    this.openModal('modal-fund');
  },

  openAddIncomeModal(projectId = null) {
    this.editingIncomeId = null;
    document.getElementById('form-income')?.reset();
    const editId = document.getElementById('inc-edit-id');
    if (editId) editId.value = '';

    const dateEl = document.getElementById('inc-date');
    if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];

    const titleEl = document.getElementById('modal-income-title');
    if (titleEl) titleEl.innerHTML = `<svg width="20" height="20" fill="none" stroke="var(--gold-primary)" stroke-width="2.2" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 6px;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Record Revenue & Client Bill`;

    const btnEl = document.getElementById('btn-save-income');
    if (btnEl) btnEl.textContent = 'Save Revenue & Bill';

    const delBtn = document.getElementById('btn-delete-income');
    if (delBtn) delBtn.style.display = 'none';

    this.selectPaymentMethod('inc', 'UPI');
    this.populateIncomeProjectDropdown(projectId);

    if (projectId) {
      const proj = (window.dataStore.data.projects || []).find(p => p.id === projectId);
      if (proj) {
        const clientInp = document.getElementById('inc-client-name');
        if (clientInp) clientInp.value = proj.clientName || '';
        const phoneInp = document.getElementById('inc-client-phone');
        if (phoneInp) phoneInp.value = proj.clientPhone || '';
        const projNameInp = document.getElementById('inc-project-name');
        if (projNameInp) projNameInp.value = proj.name || '';
        const totalInp = document.getElementById('inc-total-amount');
        if (totalInp) totalInp.value = proj.packageAmount || 0;
        const amtInp = document.getElementById('inc-amount');
        const pending = Math.max(0, (Number(proj.packageAmount) || 0) - (Number(proj.receivedAmount) || 0));
        if (amtInp) amtInp.value = pending > 0 ? pending : (proj.packageAmount || 0);
      }
    }
    this.updateIncomeLiveBalance();
    this.openModal('modal-income');
  },

  openEditIncomeModal(id) {
    const inc = (window.dataStore.data.income || []).find(i => i.id === id);
    if (!inc) return;

    this.editingIncomeId = id;
    this.populateIncomeProjectDropdown(inc.projectId);

    const editId = document.getElementById('inc-edit-id');
    if (editId) editId.value = inc.id;

    const projSel = document.getElementById('inc-project');
    if (projSel) projSel.value = inc.projectId || '';

    const clientInp = document.getElementById('inc-client-name');
    if (clientInp) clientInp.value = inc.clientName || '';

    const phoneInp = document.getElementById('inc-client-phone');
    if (phoneInp) phoneInp.value = inc.clientPhone || '';

    const projNameInp = document.getElementById('inc-project-name');
    if (projNameInp) projNameInp.value = inc.projectName || '';

    const catSel = document.getElementById('inc-category');
    if (catSel) catSel.value = inc.category || 'Wedding Shoot';

    const totalInp = document.getElementById('inc-total-amount');
    if (totalInp) totalInp.value = inc.totalAmount !== undefined ? inc.totalAmount : inc.amount;

    const amtInp = document.getElementById('inc-amount');
    if (amtInp) amtInp.value = inc.amount;

    const dateInp = document.getElementById('inc-date');
    if (dateInp) dateInp.value = inc.date || new Date().toISOString().split('T')[0];

    const notesInp = document.getElementById('inc-notes');
    if (notesInp) notesInp.value = inc.notes || '';

    this.selectPaymentMethod('inc', inc.paymentMethod || 'UPI');

    const titleEl = document.getElementById('modal-income-title');
    if (titleEl) titleEl.innerHTML = `<svg width="20" height="20" fill="none" stroke="var(--gold-primary)" stroke-width="2.2" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 6px;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Edit Revenue & Bill Record`;

    const btnEl = document.getElementById('btn-save-income');
    if (btnEl) btnEl.textContent = 'Update Revenue & Bill';

    const delBtn = document.getElementById('btn-delete-income');
    if (delBtn) delBtn.style.display = 'inline-flex';

    this.updateIncomeLiveBalance();

    const modal = document.getElementById('modal-income');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  openEditExpenseModal(id) {
    const exp = (window.dataStore.data.expenses || []).find(e => e.id === id);
    if (!exp) return;

    this.editingExpenseId = id;
    this.populateExpenseProjectDropdown();

    const amtInp = document.getElementById('exp-amount');
    if (amtInp) amtInp.value = exp.amount;

    const catSel = document.getElementById('exp-category');
    if (catSel) catSel.value = exp.category || 'Other';

    const projSel = document.getElementById('exp-project');
    if (projSel) projSel.value = exp.projectId || '';

    const dateInp = document.getElementById('exp-date');
    if (dateInp) dateInp.value = exp.date || new Date().toISOString().split('T')[0];

    const notesInp = document.getElementById('exp-notes');
    if (notesInp) notesInp.value = exp.notes || '';

    this.selectPaymentMethod('exp', exp.paymentMethod || 'UPI');

    const titleEl = document.getElementById('modal-expense-title');
    if (titleEl) titleEl.textContent = 'Edit Expense Record';

    const btnEl = document.getElementById('btn-save-expense');
    if (btnEl) btnEl.textContent = 'Update Expense';

    const delBtn = document.getElementById('btn-delete-expense');
    if (delBtn) delBtn.style.display = 'inline-flex';

    const modal = document.getElementById('modal-expense');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  openEditProjectModal(id) {
    const proj = (window.dataStore.data.projects || []).find(p => p.id === id);
    if (!proj) return;

    this.editingProjectId = id;

    const nameInp = document.getElementById('proj-name');
    if (nameInp) nameInp.value = proj.name || '';

    const clientInp = document.getElementById('proj-client');
    if (clientInp) clientInp.value = proj.clientName || '';

    const phoneInp = document.getElementById('proj-phone');
    if (phoneInp) phoneInp.value = proj.clientPhone || '';

    const pkgInp = document.getElementById('proj-package');
    if (pkgInp) pkgInp.value = proj.packageAmount || 0;

    const rcvInp = document.getElementById('proj-received');
    if (rcvInp) rcvInp.value = proj.receivedAmount || 0;

    const dateInp = document.getElementById('proj-date');
    if (dateInp) dateInp.value = proj.eventDate || new Date().toISOString().split('T')[0];

    const statusSel = document.getElementById('proj-status');
    if (statusSel) statusSel.value = proj.status || 'Upcoming';

    const locInp = document.getElementById('proj-location');
    if (locInp) locInp.value = proj.location || '';

    const titleEl = document.getElementById('modal-project-title');
    if (titleEl) titleEl.textContent = 'Edit Project Details';

    const btnEl = document.getElementById('btn-save-project');
    if (btnEl) btnEl.textContent = 'Update Project';

    const delBtn = document.getElementById('btn-delete-project');
    if (delBtn) delBtn.style.display = 'inline-flex';

    const modal = document.getElementById('modal-project');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  openEditWithdrawalModal(id) {
    const wd = (window.dataStore.data.withdrawals || []).find(w => w.id === id);
    if (!wd) return;

    this.editingWithdrawalId = id;

    const partnerSel = document.getElementById('wd-partner');
    if (partnerSel) partnerSel.value = wd.partnerId || 'partner1';

    const amtInp = document.getElementById('wd-amount');
    if (amtInp) amtInp.value = wd.amount;

    const dateInp = document.getElementById('wd-date');
    if (dateInp) dateInp.value = wd.date || new Date().toISOString().split('T')[0];

    const methodSel = document.getElementById('wd-method');
    if (methodSel) methodSel.value = wd.paymentMethod || 'Bank';

    const notesInp = document.getElementById('wd-notes');
    if (notesInp) notesInp.value = wd.notes || '';

    const titleEl = document.getElementById('modal-withdrawal-title');
    if (titleEl) titleEl.textContent = 'Edit Partner Withdrawal';

    const btnEl = document.getElementById('btn-save-withdrawal');
    if (btnEl) btnEl.textContent = 'Update Withdrawal';

    const delBtn = document.getElementById('btn-delete-withdrawal');
    if (delBtn) delBtn.style.display = 'inline-flex';

    const modal = document.getElementById('modal-withdrawal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  openEditFundTransactionModal(id) {
    const entry = (window.dataStore.data.companyFundLedger || []).find(e => e.id === id);
    if (!entry) return;

    this.editingFundId = id;

    const typeInp = document.getElementById('fund-tx-type');
    if (typeInp) typeInp.value = entry.type || 'usage';

    const catSel = document.getElementById('fund-category');
    if (catSel) catSel.value = entry.category || 'Other';

    const descInp = document.getElementById('fund-desc');
    if (descInp) descInp.value = entry.description || '';

    const amtInp = document.getElementById('fund-amount');
    if (amtInp) amtInp.value = entry.amount;

    const dateInp = document.getElementById('fund-date');
    if (dateInp) dateInp.value = entry.date || new Date().toISOString().split('T')[0];

    const titleEl = document.getElementById('fund-modal-title');
    if (titleEl) titleEl.textContent = entry.type === 'addition' ? 'Edit Capital Injection' : 'Edit Equipment / Asset Record';

    const btnEl = document.getElementById('btn-save-fund');
    if (btnEl) btnEl.textContent = 'Update Fund Record';

    const delBtn = document.getElementById('btn-delete-fund');
    if (delBtn) delBtn.style.display = 'inline-flex';

    const modal = document.getElementById('modal-fund');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  editItem(collection, id) {
    if (collection === 'income') this.openEditIncomeModal(id);
    else if (collection === 'expenses') this.openEditExpenseModal(id);
    else if (collection === 'projects') this.openEditProjectModal(id);
    else if (collection === 'withdrawals') this.openEditWithdrawalModal(id);
    else if (collection === 'companyFundLedger') this.openEditFundTransactionModal(id);
    else if (collection === 'invoices') this.openEditInvoiceModal(id);
  },

  editProjectIncome(projectId, incomeId) {
    this.openEditIncomeModal(incomeId);
  },

  editProjectExpense(projectId, expenseId) {
    this.openEditExpenseModal(expenseId);
  },

  openEditPartnersModal() {
    const settings = window.dataStore.data.settings;
    const p1Name = settings.partner1Name || 'Shameem';
    const p2Name = settings.partner2Name || 'Shiyan';
    const pcts = settings.profitPercentages || { partner1: 33.33, partner2: 33.33, companyFund: 33.34 };

    const p1Inp = document.getElementById('edit-partner1-name');
    const p2Inp = document.getElementById('edit-partner2-name');
    const p1Pct = document.getElementById('edit-partner1-pct');
    const p2Pct = document.getElementById('edit-partner2-pct');
    const cfPct = document.getElementById('edit-company-fund-pct');

    if (p1Inp) p1Inp.value = p1Name;
    if (p2Inp) p2Inp.value = p2Name;
    if (p1Pct) p1Pct.value = pcts.partner1;
    if (p2Pct) p2Pct.value = pcts.partner2;
    if (cfPct) cfPct.value = pcts.companyFund;

    this.updateEditPartnersLabels();
    this.validateEditPartnersSum();
    this.openModal('modal-edit-partners');
  },

  updateEditPartnersLabels() {
    const p1Name = document.getElementById('edit-partner1-name')?.value?.trim() || 'Partner 1';
    const p2Name = document.getElementById('edit-partner2-name')?.value?.trim() || 'Partner 2';
    const l1 = document.getElementById('edit-partner1-pct-label');
    const l2 = document.getElementById('edit-partner2-pct-label');
    if (l1) l1.textContent = `${p1Name} (%)`;
    if (l2) l2.textContent = `${p2Name} (%)`;
  },

  validateEditPartnersSum() {
    const p1 = parseFloat(document.getElementById('edit-partner1-pct')?.value) || 0;
    const p2 = parseFloat(document.getElementById('edit-partner2-pct')?.value) || 0;
    const cf = parseFloat(document.getElementById('edit-company-fund-pct')?.value) || 0;
    const sum = Math.round((p1 + p2 + cf) * 100) / 100;

    const badge = document.getElementById('edit-partners-sum-badge');
    const btn = document.getElementById('btn-save-edit-partners');

    if (badge) {
      badge.textContent = `Sum: ${sum}%`;
      const isValid = Math.abs(sum - 100) < 0.05;
      badge.style.color = isValid ? 'var(--accent-income)' : 'var(--accent-expense)';
      badge.style.borderColor = isValid ? 'var(--accent-income)' : 'var(--accent-expense)';
      if (btn) btn.disabled = !isValid;
    }
  },

  handleSavePartnersModal(e) {
    if (e) e.preventDefault();
    const p1Name = document.getElementById('edit-partner1-name')?.value?.trim();
    const p2Name = document.getElementById('edit-partner2-name')?.value?.trim();
    const p1Pct = parseFloat(document.getElementById('edit-partner1-pct')?.value) || 33.33;
    const p2Pct = parseFloat(document.getElementById('edit-partner2-pct')?.value) || 33.33;
    const cfPct = parseFloat(document.getElementById('edit-company-fund-pct')?.value) || 33.34;

    if (!p1Name || !p2Name) {
      this.showToast('⚠️ Please enter names for both partners');
      return;
    }

    const sum = Math.round((p1Pct + p2Pct + cfPct) * 100) / 100;
    if (Math.abs(sum - 100) >= 0.05) {
      this.showToast('⚠️ Percentages must sum to exactly 100%');
      return;
    }

    window.dataStore.updatePartnersAndSplits(p1Name, p2Name, p1Pct, p2Pct, cfPct);
    this.closeModalDirect('modal-edit-partners');
    this.showToast('Partner details & profit splits updated ✓');
  },

  openEditFundBalanceModal() {
    const store = window.dataStore.data;
    const financials = FinanceEngine.computeFinancials(store, { type: 'all' });
    const currentBalance = financials.companyFund.balance || 0;

    const input = document.getElementById('edit-fund-balance-input');
    const hint = document.getElementById('edit-fund-current-hint');

    if (input) input.value = currentBalance;
    if (hint) hint.textContent = FinanceEngine.formatINR(currentBalance);

    this.openModal('modal-edit-fund-balance');
  },

  handleSaveFundBalanceModal(e) {
    if (e) e.preventDefault();
    const amountVal = document.getElementById('edit-fund-balance-input')?.value;
    const targetBalance = FinanceEngine.parseINR(amountVal);

    if (isNaN(targetBalance) || targetBalance < 0) {
      this.showToast('⚠️ Please enter a valid fund balance amount');
      return;
    }

    window.dataStore.setCompanyFundBalance(targetBalance);
    this.closeModalDirect('modal-edit-fund-balance');
    this.showToast(`Company fund reserve updated to ${FinanceEngine.formatINR(targetBalance)} ✓`);
  },

  cycleProjectStatus(projectId) {
    const proj = (window.dataStore.data.projects || []).find(p => p.id === projectId);
    if (!proj) return;
    const statuses = ['Upcoming', 'Ongoing', 'Payment Pending', 'Completed'];
    const currentIndex = statuses.indexOf(proj.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];

    window.dataStore.updateProject(projectId, { status: nextStatus });
    this.showToast(`Project status set to "${nextStatus}" ✓`);
  },

  selectPaymentMethod(prefix, method) {
    const hidden = document.getElementById(`${prefix}-method`);
    if (hidden) hidden.value = method;

    const selector = document.getElementById(`${prefix}-method-selector`);
    if (selector) {
      selector.querySelectorAll('.method-choice').forEach(btn => {
        btn.classList.toggle('selected', btn.getAttribute('data-method') === method);
      });
    }
  },

  // --- POPULATE DROPDOWNS ---

  populateIncomeProjectDropdown(selectedProjectId = null) {
    const select = document.getElementById('inc-project');
    if (!select) return;
    const projects = window.dataStore.data.projects || [];

    let options = '<option value="">-- Direct Client Bill / Custom Event --</option>';
    projects.forEach(p => {
      const pending = Math.max(0, (Number(p.packageAmount) || 0) - (Number(p.receivedAmount) || 0));
      const pendingTxt = pending > 0 ? ` (Pending: ₹${pending.toLocaleString('en-IN')})` : ' (Fully Paid)';
      const isSel = p.id === selectedProjectId ? 'selected' : '';
      options += `<option value="${p.id}" ${isSel} data-client="${(p.clientName || '').replace(/"/g, '&quot;')}" data-phone="${(p.clientPhone || '').replace(/"/g, '&quot;')}" data-name="${(p.name || '').replace(/"/g, '&quot;')}" data-package="${p.packageAmount || 0}" data-pending="${pending}">${p.name} - ${p.clientName}${pendingTxt}</option>`;
    });
    select.innerHTML = options;
  },

  populateExpenseProjectDropdown() {
    const select = document.getElementById('exp-project');
    if (!select) return;
    const projects = window.dataStore.data.projects || [];

    let options = '<option value="">-- General Studio Overhead (No Project) --</option>';
    projects.forEach(p => {
      options += `<option value="${p.id}">${p.name}</option>`;
    });
    select.innerHTML = options;
  },

  populatePaymentProjectDropdown() {
    const select = document.getElementById('pay-project');
    if (!select) return;
    const projects = window.dataStore.data.projects || [];
    const pendingProjects = projects.filter(p => (p.packageAmount - p.receivedAmount) > 0);

    let options = '';
    if (pendingProjects.length === 0) {
      options = '<option value="">No projects with pending payments</option>';
    } else {
      pendingProjects.forEach(p => {
        const pending = p.packageAmount - p.receivedAmount;
        options += `<option value="${p.id}" data-pending="${pending}">${p.name} — Pending: ₹${pending.toLocaleString('en-IN')}</option>`;
      });
    }
    select.innerHTML = options;
    this.handlePayProjectSelected();
  },

  handleIncomeProjectChange() {
    const select = document.getElementById('inc-project');
    if (!select) return;
    const projectId = select.value;
    if (!projectId) return;

    const opt = select.options[select.selectedIndex];
    if (!opt) return;

    const client = opt.getAttribute('data-client') || '';
    const phone = opt.getAttribute('data-phone') || '';
    const projName = opt.getAttribute('data-name') || '';
    const pkg = Number(opt.getAttribute('data-package')) || 0;
    const pending = Number(opt.getAttribute('data-pending')) || 0;

    const clientInp = document.getElementById('inc-client-name');
    if (clientInp && (!clientInp.value || clientInp.value === 'Studio Client' || clientInp.value === 'Direct Client')) {
      clientInp.value = client;
    } else if (clientInp && !clientInp.value) {
      clientInp.value = client;
    }

    const phoneInp = document.getElementById('inc-client-phone');
    if (phoneInp && !phoneInp.value) phoneInp.value = phone;

    const projNameInp = document.getElementById('inc-project-name');
    if (projNameInp && !projNameInp.value) projNameInp.value = projName;

    const totalInp = document.getElementById('inc-total-amount');
    if (totalInp && (!totalInp.value || totalInp.value === '0')) totalInp.value = pkg;

    const amtInp = document.getElementById('inc-amount');
    if (amtInp && (!amtInp.value || amtInp.value === '0')) amtInp.value = pending > 0 ? pending : pkg;

    this.updateIncomeLiveBalance();
  },

  updateIncomeLiveBalance() {
    const totalInp = document.getElementById('inc-total-amount');
    const amtInp = document.getElementById('inc-amount');
    const totalPrev = document.getElementById('inc-preview-total');
    const recPrev = document.getElementById('inc-preview-received');
    const tagPrev = document.getElementById('inc-preview-balance-tag');

    const total = totalInp ? FinanceEngine.parseINR(totalInp.value) || 0 : 0;
    const received = amtInp ? FinanceEngine.parseINR(amtInp.value) || 0 : 0;
    const balance = Math.max(0, total - received);

    if (totalPrev) totalPrev.textContent = FinanceEngine.formatINR(total);
    if (recPrev) recPrev.textContent = FinanceEngine.formatINR(received);
    if (tagPrev) {
      if (balance <= 0 && total > 0) {
        tagPrev.style.background = 'rgba(16, 185, 129, 0.15)';
        tagPrev.style.color = '#34d399';
        tagPrev.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        tagPrev.textContent = 'Fully Settled ✓';
      } else if (balance > 0) {
        tagPrev.style.background = 'rgba(251, 191, 36, 0.15)';
        tagPrev.style.color = '#fbbf24';
        tagPrev.style.borderColor = 'rgba(251, 191, 36, 0.3)';
        tagPrev.textContent = `${FinanceEngine.formatINR(balance)} Due`;
      } else {
        tagPrev.style.background = 'rgba(255, 255, 255, 0.05)';
        tagPrev.style.color = 'var(--text-muted)';
        tagPrev.style.borderColor = 'transparent';
        tagPrev.textContent = '₹0 Due';
      }
    }
  },

  handlePayProjectSelected() {
    const select = document.getElementById('pay-project');
    const amountInput = document.getElementById('pay-amount');
    const hint = document.getElementById('pay-pending-hint');
    if (!select || !select.value) {
      if (hint) hint.textContent = '';
      return;
    }
    const opt = select.options[select.selectedIndex];
    const pending = opt.getAttribute('data-pending');
    if (pending) {
      if (amountInput && !amountInput.value) amountInput.value = pending;
      if (hint) hint.textContent = `Total pending balance: ₹${Number(pending).toLocaleString('en-IN')}`;
    }
  },

  // --- FORM HANDLERS ---

  handleSaveIncome(e, andShareWhatsApp = false) {
    if (e && e.preventDefault) e.preventDefault();
    const projSelect = document.getElementById('inc-project');
    const projectId = projSelect ? projSelect.value : '';

    let clientName = (document.getElementById('inc-client-name')?.value || '').trim();
    const clientPhone = (document.getElementById('inc-client-phone')?.value || '').trim();
    let projectName = (document.getElementById('inc-project-name')?.value || '').trim();
    const category = document.getElementById('inc-category')?.value || 'Wedding Shoot';

    if (projectId) {
      const proj = window.dataStore.data.projects.find(p => p.id === projectId);
      if (proj) {
        if (!projectName) projectName = proj.name;
        if (!clientName) clientName = proj.clientName;
      }
    }

    if (!clientName) {
      this.showToast('⚠️ Please enter the Client Name');
      return;
    }
    if (!projectName) {
      projectName = `${clientName} Shoot`;
    }

    const totalAmount = FinanceEngine.parseINR(document.getElementById('inc-total-amount')?.value) || 0;
    const amount = FinanceEngine.parseINR(document.getElementById('inc-amount')?.value) || 0;
    const date = document.getElementById('inc-date')?.value || new Date().toISOString().split('T')[0];
    const paymentMethod = document.getElementById('inc-method')?.value || 'UPI';
    const notes = (document.getElementById('inc-notes')?.value || '').trim();

    if (amount <= 0) {
      this.showToast('⚠️ Please enter a valid received amount');
      return;
    }

    const finalTotal = totalAmount > 0 ? totalAmount : amount;
    const balanceDue = Math.max(0, finalTotal - amount);

    let savedId = null;

    if (this.editingIncomeId) {
      savedId = this.editingIncomeId;
      window.dataStore.updateIncome(this.editingIncomeId, {
        projectId: projectId || null,
        projectName,
        clientName,
        clientPhone,
        category,
        totalAmount: finalTotal,
        amount,
        balanceDue,
        date,
        paymentMethod,
        notes
      });
      this.editingIncomeId = null;
      document.getElementById('form-income')?.reset();
      this.closeModalDirect('modal-income');
      this.showToast('Revenue & Bill updated ✓');
      if (projectId && document.getElementById('modal-project-details')?.classList.contains('open')) {
        this.viewProjectDetails(projectId);
      }
    } else {
      const newInc = window.dataStore.addIncome({
        projectId: projectId || null,
        projectName,
        clientName,
        clientPhone,
        category,
        totalAmount: finalTotal,
        amount,
        balanceDue,
        date,
        paymentMethod,
        notes
      });
      savedId = newInc?.id;
      document.getElementById('form-income')?.reset();
      const dateEl = document.getElementById('inc-date');
      if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
      this.closeModalDirect('modal-income');
      this.showToast('Revenue & Bill saved successfully ✓');
    }

    if (andShareWhatsApp && savedId) {
      setTimeout(() => {
        this.shareRevenueWhatsApp(savedId);
      }, 200);
    }
  },

  handleSaveAndShareWhatsAppIncome(e) {
    this.handleSaveIncome(e, true);
  },

  shareRevenueWhatsApp(incomeId) {
    const inc = (window.dataStore.data.income || []).find(i => i.id === incomeId);
    if (!inc) return;

    const billing = window.dataStore.data.settings?.billing || {
      studioName: 'LUCIA PHOTOGRAPHY & VIDEOGRAPHY',
      upiId: 'lucia@okaxis'
    };

    const clientName = inc.clientName || 'Valued Client';
    const total = (inc.totalAmount !== undefined && inc.totalAmount !== null && inc.totalAmount > 0)
      ? Number(inc.totalAmount)
      : Number(inc.amount);
    const received = Number(inc.amount) || 0;
    const balance = (inc.balanceDue !== undefined && inc.balanceDue !== null)
      ? Number(inc.balanceDue)
      : Math.max(0, total - received);
    const refNo = `REC-${inc.id.slice(-6).toUpperCase()}`;

    let statusLine = balance > 0 
      ? `*Balance Due: ${FinanceEngine.formatINR(balance)}*`
      : `*Status: Fully Settled ✅*`;

    const text = `*${billing.studioName}* 📸✨\n` +
      `*PAYMENT & BILL RECEIPT: ${refNo}*\n` +
      `---------------------------\n` +
      `Client: ${clientName}\n` +
      (inc.projectName ? `Project: ${inc.projectName}\n` : '') +
      (inc.category ? `Category: ${inc.category}\n` : '') +
      `Date: ${inc.date}\n` +
      `Payment Mode: ${inc.paymentMethod || 'UPI'}\n` +
      `---------------------------\n` +
      `Total Package: ${FinanceEngine.formatINR(total)}\n` +
      `Amount Received: ${FinanceEngine.formatINR(received)}\n` +
      `${statusLine}\n` +
      `---------------------------\n` +
      (balance > 0 ? `Pay remaining via UPI: ${billing.upiId}\n` : '') +
      `Thank you for choosing ${billing.studioName}!`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.showToast('Bill summary copied! Opening WhatsApp...');
    }

    let cleanPhone = (inc.clientPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  },

  handleSaveExpense(e) {
    e.preventDefault();
    const amount = FinanceEngine.parseINR(document.getElementById('exp-amount').value);
    const category = document.getElementById('exp-category').value;
    const projectId = document.getElementById('exp-project').value || null;
    let projectName = 'Studio Overhead';
    if (projectId) {
      const p = (window.dataStore.data.projects || []).find(x => x.id === projectId);
      if (p) projectName = p.name;
    }
    const date = document.getElementById('exp-date').value;
    const paymentMethod = document.getElementById('exp-method').value || 'UPI';
    const notes = document.getElementById('exp-notes').value;

    if (!amount || amount <= 0) {
      this.showToast('⚠️ Please enter a valid expense amount');
      return;
    }

    if (this.editingExpenseId) {
      window.dataStore.updateExpense(this.editingExpenseId, {
        projectId,
        projectName,
        category,
        amount,
        date,
        paymentMethod,
        notes
      });
      this.editingExpenseId = null;
      e.target.reset();
      this.closeModalDirect('modal-expense');
      this.showToast('Expense updated successfully ✓');
      if (projectId && document.getElementById('modal-project-details')?.classList.contains('open')) {
        this.viewProjectDetails(projectId);
      }
    } else {
      window.dataStore.addExpense({
        projectId,
        projectName,
        category,
        amount,
        date,
        paymentMethod,
        notes
      });
      e.target.reset();
      document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
      this.closeModalDirect('modal-expense');
      this.showToast('Expense recorded successfully ✓');
    }
  },

  handleSaveProject(e) {
    e.preventDefault();
    const name = document.getElementById('proj-name').value.trim();
    const clientName = document.getElementById('proj-client').value.trim();
    const clientPhone = document.getElementById('proj-phone').value.trim();
    const packageAmount = FinanceEngine.parseINR(document.getElementById('proj-package').value);
    const receivedAmount = FinanceEngine.parseINR(document.getElementById('proj-received').value);
    const eventDate = document.getElementById('proj-date').value;
    const status = document.getElementById('proj-status').value;
    const location = document.getElementById('proj-location').value.trim();

    if (!name || packageAmount <= 0) {
      this.showToast('⚠️ Please provide project name and package amount');
      return;
    }

    if (this.editingProjectId) {
      window.dataStore.updateProject(this.editingProjectId, {
        name,
        clientName,
        clientPhone,
        packageAmount,
        receivedAmount,
        eventDate,
        status,
        location
      });
      const pid = this.editingProjectId;
      this.editingProjectId = null;
      e.target.reset();
      this.closeModalDirect('modal-project');
      this.showToast(`Project "${name}" updated successfully ✓`);
      if (document.getElementById('modal-project-details')?.classList.contains('open')) {
        this.viewProjectDetails(pid);
      }
    } else {
      window.dataStore.addProject({
        name,
        clientName,
        clientPhone,
        packageAmount,
        receivedAmount,
        eventDate,
        status,
        location
      });
      e.target.reset();
      document.getElementById('proj-date').value = new Date().toISOString().split('T')[0];
      this.closeModalDirect('modal-project');
      this.showToast(`Project "${name}" created ✓`);
    }
  },

  handleSavePayment(e) {
    e.preventDefault();
    const projectId = document.getElementById('pay-project').value;
    if (!projectId) {
      this.showToast('⚠️ Please select a project');
      return;
    }

    const amount = FinanceEngine.parseINR(document.getElementById('pay-amount').value);
    const date = document.getElementById('pay-date').value;
    const paymentMethod = document.getElementById('pay-method').value || 'UPI';

    const project = window.dataStore.data.projects.find(p => p.id === projectId);
    if (!project) return;

    window.dataStore.addIncome({
      projectId: project.id,
      projectName: project.name,
      clientName: project.clientName,
      amount,
      date,
      paymentMethod,
      notes: `Payment collection for ${project.name}`
    });

    e.target.reset();
    document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
    this.closeModalDirect('modal-payment');

    this.showToast(`Payment of ₹${amount.toLocaleString('en-IN')} received for ${project.name} ✓`);
  },

  handleSaveWithdrawal(e) {
    e.preventDefault();
    const partnerId = document.getElementById('wd-partner').value;
    const amount = FinanceEngine.parseINR(document.getElementById('wd-amount').value);
    const date = document.getElementById('wd-date').value;
    const paymentMethod = document.getElementById('wd-method').value;
    const notes = document.getElementById('wd-notes').value;

    if (!amount || amount <= 0) {
      this.showToast('⚠️ Please enter a valid amount');
      return;
    }

    if (this.editingWithdrawalId) {
      window.dataStore.updateWithdrawal(this.editingWithdrawalId, {
        partnerId,
        amount,
        date,
        paymentMethod,
        notes
      });
      this.editingWithdrawalId = null;
      e.target.reset();
      this.closeModalDirect('modal-withdrawal');
      this.showToast('Withdrawal updated successfully ✓');
    } else {
      window.dataStore.addPartnerWithdrawal({
        partnerId,
        amount,
        date,
        paymentMethod,
        notes
      });
      e.target.reset();
      document.getElementById('wd-date').value = new Date().toISOString().split('T')[0];
      this.closeModalDirect('modal-withdrawal');
      const pName = partnerId === 'partner1' ? window.dataStore.data.settings.partner1Name : window.dataStore.data.settings.partner2Name;
      this.showToast(`Withdrawal of ₹${amount.toLocaleString('en-IN')} recorded for ${pName} ✓`);
    }
  },

  handleSaveFundTransaction(e) {
    e.preventDefault();
    const type = document.getElementById('fund-tx-type').value;
    const category = document.getElementById('fund-category').value;
    const description = document.getElementById('fund-desc').value.trim();
    const amount = FinanceEngine.parseINR(document.getElementById('fund-amount').value);
    const date = document.getElementById('fund-date').value;

    if (!amount || amount <= 0) {
      this.showToast('⚠️ Please enter a valid amount');
      return;
    }

    if (this.editingFundId) {
      window.dataStore.updateCompanyFundLedger(this.editingFundId, {
        type,
        category,
        description,
        amount,
        date
      });
      this.editingFundId = null;
      e.target.reset();
      this.closeModalDirect('modal-fund');
      this.showToast('Company Fund record updated ✓');
    } else {
      window.dataStore.addCompanyFundTransaction({
        type,
        category,
        description,
        amount,
        date
      });
      e.target.reset();
      document.getElementById('fund-date').value = new Date().toISOString().split('T')[0];
      this.closeModalDirect('modal-fund');
      this.showToast(type === 'usage' ? `Fund use of ₹${amount.toLocaleString('en-IN')} recorded ✓` : `Fund addition of ₹${amount.toLocaleString('en-IN')} recorded ✓`);
    }
  },

  // Direct quick action on project card: Mark as Paid
  quickMarkPaid(projectId) {
    const proj = window.dataStore.data.projects.find(p => p.id === projectId);
    if (!proj) return;

    const pending = Math.max(0, proj.packageAmount - proj.receivedAmount);
    if (pending <= 0) {
      this.showToast('Project is already fully paid!');
      return;
    }

    this.confirmDelete('markProjectPaid', projectId);
  },

  executeMarkProjectPaid(projectId) {
    const proj = window.dataStore.data.projects.find(p => p.id === projectId);
    if (!proj) return;
    const pending = Math.max(0, proj.packageAmount - proj.receivedAmount);
    window.dataStore.markProjectPaid(projectId, 'UPI');
    this.showToast(`Revenue added successfully ✓ (₹${pending.toLocaleString('en-IN')})`);
    this.renderAll();
  },

  // Open Project Details Drawer
  viewProjectDetails(projectId) {
    const proj = window.dataStore.data.projects.find(p => p.id === projectId);
    if (!proj) return;

    const titleEl = document.getElementById('detail-proj-name');
    const contentEl = document.getElementById('detail-proj-content');
    if (!titleEl || !contentEl) return;

    titleEl.textContent = proj.name;

    // Filter income and expenses for this project
    const projectIncomes = (window.dataStore.data.income || []).filter(i => i.projectId === proj.id);
    const projectExpenses = (window.dataStore.data.expenses || []).filter(e => e.projectId === proj.id);

    const totalIncome = projectIncomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalExpenses = projectExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const pending = Math.max(0, proj.packageAmount - proj.receivedAmount);
    const profit = totalIncome - totalExpenses;

    let html = `
      <div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--text-secondary); font-size: 13px;">Client</span>
          <span style="font-weight: 700;">${proj.clientName} ${proj.clientPhone ? '(' + proj.clientPhone + ')' : ''}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--text-secondary); font-size: 13px;">Event Date</span>
          <span style="font-weight: 700;">${proj.eventDate}</span>
        </div>
        ${proj.location ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--text-secondary); font-size: 13px;">Location</span>
          <span style="font-weight: 700;">${proj.location}</span>
        </div>` : ''}
        <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
          <span style="color: var(--text-secondary); font-size: 13px;">Package Total</span>
          <span style="font-size: 16px; font-weight: 800;">${FinanceEngine.formatINR(proj.packageAmount)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 6px;">
          <span style="color: var(--text-secondary); font-size: 13px;">Total Received</span>
          <span style="font-size: 16px; font-weight: 800; color: var(--accent-income);">${FinanceEngine.formatINR(proj.receivedAmount)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 6px;">
          <span style="color: var(--text-secondary); font-size: 13px;">Pending Due</span>
          <span style="font-size: 16px; font-weight: 800; color: #fbbf24;">${FinanceEngine.formatINR(pending)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 6px;">
          <span style="color: var(--text-secondary); font-size: 13px;">Project Expenses</span>
          <span style="font-size: 16px; font-weight: 800; color: var(--accent-expense);">${FinanceEngine.formatINR(totalExpenses)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-subtle);">
          <span style="color: var(--gold-primary); font-weight: 700; font-size: 14px;">Net Project Profit</span>
          <span style="font-size: 18px; font-weight: 900; color: var(--gold-primary);">${FinanceEngine.formatINR(profit)}</span>
        </div>
        <button class="btn btn-outline btn-sm" onclick="App.openShareReceiptModal('${proj.id}', 'project')" style="margin-top: 12px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--gold-primary); border-color: var(--gold-border);">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share Project Bill Receipt
        </button>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 10px; color: var(--text-white);">Revenue Received (${projectIncomes.length})</h4>
        <div class="transaction-list">
          ${projectIncomes.length === 0 ? '<div style="font-size: 12px; color: var(--text-muted);">No revenue logged yet</div>' : 
            projectIncomes.map(i => `
              <div class="transaction-item" style="padding: 10px 12px;">
                <div class="transaction-left">
                  <div class="tx-icon income" style="width: 28px; height: 28px; font-size: 11px;">+</div>
                  <div>
                    <div style="font-size: 13px; font-weight: 700;">${i.notes || 'Payment'}</div>
                    <div class="tx-meta">${i.date} • <span class="method-tag">${i.paymentMethod}</span></div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <div class="tx-amount income">+${FinanceEngine.formatINR(i.amount)}</div>
                  <button class="btn-share-icon" onclick="App.openShareReceiptModal('${i.id}', 'payment')" title="Share Payment Receipt">
                    <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    Receipt
                  </button>
                  <button class="edit-btn" onclick="App.editProjectIncome('${proj.id}', '${i.id}')" title="Edit payment">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="delete-btn" onclick="event.stopPropagation(); App.confirmDelete('projectIncome', '${proj.id}', '${i.id}')" title="Delete payment">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            `).join('')}
        </div>
      </div>

      <div>
        <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 10px; color: var(--text-white);">Project Expenses (${projectExpenses.length})</h4>
        <div class="transaction-list">
          ${projectExpenses.length === 0 ? '<div style="font-size: 12px; color: var(--text-muted);">No expenses logged for this project</div>' : 
            projectExpenses.map(e => `
              <div class="transaction-item" style="padding: 10px 12px;">
                <div class="transaction-left">
                  <div class="tx-icon expense" style="width: 28px; height: 28px; font-size: 11px;">−</div>
                  <div>
                    <div style="font-size: 13px; font-weight: 700;">${e.category}: ${e.notes || 'Shoot expense'}</div>
                    <div class="tx-meta">${e.date} • <span class="method-tag">${e.paymentMethod}</span></div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div class="tx-amount expense">−${FinanceEngine.formatINR(e.amount)}</div>
                  <button class="edit-btn" onclick="App.editProjectExpense('${proj.id}', '${e.id}')" title="Edit expense">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="delete-btn" onclick="event.stopPropagation(); App.confirmDelete('projectExpense', '${proj.id}', '${e.id}')" title="Delete expense">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            `).join('')}
        </div>
      </div>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-subtle); display: flex; gap: 10px;">
        <button class="btn btn-outline" style="flex: 1; font-size: 13px;" onclick="App.openEditProjectModal('${proj.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          Edit Project
        </button>
        <button class="btn btn-outline" style="flex: 1; color: #ef4444; border-color: rgba(239, 68, 68, 0.35); font-size: 13px;" onclick="event.stopPropagation(); App.confirmDelete('projects', '${proj.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          Delete Project
        </button>
      </div>
    `;

    contentEl.innerHTML = html;
    this.openModal('modal-project-details');
  },

  // --- RENDERING ALL VIEWS ---

  renderAll() {
    this.renderHome();
    this.renderProjects();
    this.renderInvoices();
    this.renderExpenses();
    this.renderPartners();
    this.renderCompanyFund();
    this.renderReports();
    this.renderSettings();
    this.updateNotificationBadge();
  },

  renderHome() {
    const today = new Date();
    const filter = this.homePeriod === 'month' 
      ? { type: 'month', monthIndex: today.getMonth(), year: today.getFullYear() }
      : { type: 'all' };

    const financials = FinanceEngine.computeFinancials(window.dataStore.data, filter);

    // Update Top Metric Cards
    if (document.getElementById('home-stat-income')) document.getElementById('home-stat-income').textContent = FinanceEngine.formatINR(financials.income);
    if (document.getElementById('home-stat-expenses')) document.getElementById('home-stat-expenses').textContent = FinanceEngine.formatINR(financials.expenses);
    const salEl = document.getElementById('home-stat-salaries');
    if (salEl) salEl.textContent = FinanceEngine.formatINR(financials.salaries);
    if (document.getElementById('home-stat-netprofit')) document.getElementById('home-stat-netprofit').textContent = FinanceEngine.formatINR(financials.netProfit);

    // Update Profit Split
    const p1Name = window.dataStore.data.settings.partner1Name || 'Shameem';
    const p2Name = window.dataStore.data.settings.partner2Name || 'Shiyan';
    const pcts = window.dataStore.data.settings.profitPercentages;

    document.getElementById('home-split-p1-name').textContent = p1Name;
    document.getElementById('home-split-p2-name').textContent = p2Name;
    document.getElementById('home-split-p1-pct').textContent = `${pcts.partner1}%`;
    document.getElementById('home-split-p2-pct').textContent = `${pcts.partner2}%`;
    document.getElementById('home-split-cf-pct').textContent = `${pcts.companyFund}%`;

    document.getElementById('home-split-p1-amount').textContent = FinanceEngine.formatINR(financials.distribution.partner1);
    document.getElementById('home-split-p2-amount').textContent = FinanceEngine.formatINR(financials.distribution.partner2);
    document.getElementById('home-split-cf-amount').textContent = FinanceEngine.formatINR(financials.distribution.companyFund);

    // Update OTHER Cards
    document.getElementById('home-pending-amount').textContent = FinanceEngine.formatINR(financials.pendingPayments);
    document.getElementById('home-company-fund-balance').textContent = FinanceEngine.formatINR(financials.companyFundBalance);

    // Render Active Projects on Home
    this.renderHomeProjects();

    // Render Recent Transactions
    this.renderRecentTransactions();

    // Render Home Chart
    LuciaCharts.renderFinancialBars('home-chart-canvas', financials);
  },

  renderHomeProjects() {
    const container = document.getElementById('home-projects-list');
    if (!container) return;

    const projects = (window.dataStore.data.projects || []).slice(0, 5);

    if (projects.length === 0) {
      container.innerHTML = '<div class="empty-state">No projects recorded yet. Tap "+ New Project" to add your first shoot.</div>';
      return;
    }

    container.innerHTML = projects.map(proj => {
      const pkg = Number(proj.packageAmount) || 0;
      const rcv = Number(proj.receivedAmount) || 0;
      const pending = Math.max(0, pkg - rcv);

      let statusBadgeClass = 'ongoing';
      if (proj.status === 'Completed') statusBadgeClass = 'completed';
      else if (proj.status === 'Payment Pending') statusBadgeClass = 'pending';
      else if (proj.status === 'Upcoming') statusBadgeClass = 'upcoming';

      return `
        <div class="transaction-item" style="cursor: pointer;" onclick="App.editItem('projects', '${proj.id}')">
          <div class="transaction-left">
            <div class="tx-icon" style="background: rgba(212, 175, 55, 0.15); color: var(--gold-primary);">🎬</div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="tx-title" style="font-weight: 700;">${proj.name || proj.projectName || proj.clientName}</span>
                <span class="badge-tag status-badge ${statusBadgeClass}" style="font-size: 10px; padding: 2px 6px;">${proj.status}</span>
              </div>
              <div class="tx-meta" style="margin-top: 3px;">
                <span>👤 ${proj.clientName || 'Client'}</span>
                ${proj.eventDate ? `<span>📅 ${proj.eventDate}</span>` : ''}
                ${proj.location ? `<span>📍 ${proj.location}</span>` : ''}
                <span style="color: var(--accent-income); font-weight: 600;">Recv: ${FinanceEngine.formatINR(rcv)}</span>
                ${pending > 0 ? `<span style="color: #fbbf24; font-weight: 600;">• Pending: ${FinanceEngine.formatINR(pending)}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="text-align: right; margin-right: 6px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--gold-primary);">${FinanceEngine.formatINR(pkg)}</div>
              <div style="font-size: 10px; color: var(--text-secondary);">Package</div>
            </div>
            ${proj.clientPhone ? `
              <button class="btn-share-icon" onclick="event.stopPropagation(); App.sendProjectWhatsAppReminder('${proj.id}')" title="Send WhatsApp Details">
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                WA
              </button>
            ` : ''}
            <button class="edit-btn" onclick="event.stopPropagation(); App.editItem('projects', '${proj.id}')" title="Edit project">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="delete-btn" onclick="event.stopPropagation(); App.confirmDelete('projects', '${proj.id}')" title="Delete project">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderRecentTransactions() {
    const container = document.getElementById('home-recent-transactions');
    if (!container) return;

    const { income = [], expenses = [], withdrawals = [], companyFundLedger = [] } = window.dataStore.data;
    
    // Partner names
    const p1Name = window.dataStore.data.settings?.partner1Name || 'Shameem';
    const p2Name = window.dataStore.data.settings?.partner2Name || 'Shiyan';

    // Combine into unified feed
    const combined = [
      ...income.map(i => ({
        ...i,
        txType: 'income',
        collection: 'income',
        displayTitle: i.projectName || i.clientName || 'Studio Revenue',
        displayMeta: i.paymentMethod || 'Direct Payment'
      })),
      ...expenses.map(e => ({
        ...e,
        txType: 'expense',
        collection: 'expenses',
        displayTitle: e.category + (e.projectName ? ` (${e.projectName})` : ''),
        displayMeta: e.paymentMethod || 'Studio Expense'
      })),
      ...withdrawals.map(w => {
        const partnerName = w.partnerId === 'partner2' ? p2Name : (w.partnerId === 'partner1' ? p1Name : (w.partner || p1Name));
        return {
          ...w,
          txType: 'withdrawal',
          collection: 'withdrawals',
          displayTitle: `${partnerName} Withdrawal`,
          displayMeta: `${w.paymentMethod || 'Bank'} • Payout`
        };
      }),
      ...companyFundLedger.map(f => ({
        ...f,
        txType: f.type === 'addition' ? 'fund-deposit' : 'fund-expense',
        collection: 'companyFundLedger',
        displayTitle: f.type === 'addition' ? `Fund Deposit: ${f.description || f.category || 'Capital'}` : `Fund Purchase: ${f.description || f.category || 'Asset'}`,
        displayMeta: `${f.paymentMethod || 'Fund Reserve'} • ${f.category || 'Reserve'}`
      }))
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 8);

    if (combined.length === 0) {
      container.innerHTML = '<div class="empty-state">No transactions recorded yet. Tap + Add New to add.</div>';
      return;
    }

    container.innerHTML = combined.map(tx => {
      const isInc = tx.txType === 'income' || tx.txType === 'fund-deposit';
      const sign = isInc ? '+' : '−';
      const colorClass = isInc ? 'income' : 'expense';
      const collection = tx.collection || (isInc ? 'income' : 'expenses');

      return `
        <div class="transaction-item" style="cursor: pointer;" onclick="App.editItem('${collection}', '${tx.id}')">
          <div class="transaction-left">
            <div class="tx-icon ${colorClass}">${sign}</div>
            <div>
              <div class="tx-title">${tx.displayTitle}</div>
              <div class="tx-meta">
                <span>${tx.date || 'Today'}</span>
                <span class="method-tag">${tx.displayMeta}</span>
                ${tx.notes ? `<span>• ${tx.notes}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <div class="tx-amount ${colorClass}">${sign}${FinanceEngine.formatINR(tx.amount)}</div>
            ${tx.txType === 'income' ? `
              <button class="btn-share-icon" onclick="event.stopPropagation(); App.openShareReceiptModal('${tx.id}', 'payment')" title="Share Payment Receipt">
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                Receipt
              </button>
            ` : ''}
            <button class="edit-btn" onclick="event.stopPropagation(); App.editItem('${collection}', '${tx.id}')" title="Edit this record">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="delete-btn" onclick="event.stopPropagation(); App.confirmDelete('${collection}', '${tx.id}')" title="Delete this record">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderProjects() {
    const container = document.getElementById('projects-grid-container');
    if (!container) return;

    let projects = window.dataStore.data.projects || [];
    if (this.selectedProjectFilter !== 'all') {
      projects = projects.filter(p => p.status === this.selectedProjectFilter);
    }

    if (projects.length === 0) {
      container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">No projects found for this filter. Tap "+ New Project" above.</div>';
      return;
    }

    container.innerHTML = projects.map(proj => {
      const pkg = Number(proj.packageAmount) || 0;
      const rcv = Number(proj.receivedAmount) || 0;
      const pending = Math.max(0, pkg - rcv);

      // Calculate project specific expenses
      const projExpenses = (window.dataStore.data.expenses || [])
        .filter(e => e.projectId === proj.id)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const profit = pkg - projExpenses;

      let statusClass = 'pending';
      if (proj.status === 'Completed') statusClass = 'completed';
      else if (proj.status === 'Ongoing') statusClass = 'ongoing';
      else if (proj.status === 'Upcoming') statusClass = 'upcoming';

      return `
        <div class="project-card" onclick="App.viewProjectDetails('${proj.id}')">
          <div>
            <div class="project-card-header">
              <div>
                <div class="project-title">${proj.name}</div>
                <div class="project-client">${proj.clientName} • ${proj.eventDate}</div>
              </div>
              <span class="status-badge ${statusClass} interactive-status" onclick="event.stopPropagation(); App.cycleProjectStatus('${proj.id}')" title="Click to instantly switch status (${proj.status})">${proj.status} ▾</span>
            </div>

            <div class="project-metrics-grid">
              <div class="metric-item">
                <span class="metric-label">Package</span>
                <span class="metric-val">${FinanceEngine.formatINR(pkg)}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Received</span>
                <span class="metric-val green">${FinanceEngine.formatINR(rcv)}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Pending</span>
                <span class="metric-val ${pending > 0 ? 'amber' : 'green'}">${FinanceEngine.formatINR(pending)}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Expenses</span>
                <span class="metric-val" style="color: var(--accent-expense);">${FinanceEngine.formatINR(projExpenses)}</span>
              </div>
              <div class="metric-item" style="grid-column: span 2;">
                <span class="metric-label">Project Profit</span>
                <span class="metric-val gold">${FinanceEngine.formatINR(profit)}</span>
              </div>
            </div>
          </div>

          <div class="project-card-actions" onclick="event.stopPropagation()">
            <span style="font-size: 11px; color: var(--text-muted);">${proj.location || 'Studio'}</span>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-outline btn-sm" onclick="App.handleProjectInvoiceClick('${proj.id}')" title="Generate or View Client Bill">
                📄 Bill
              </button>
              <button class="btn btn-outline btn-sm" onclick="App.openShareReceiptModal('${proj.id}', 'project')" title="Share Bill Receipt" style="color: var(--gold-primary); border-color: var(--gold-border);">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                Share
              </button>
              ${pending > 0 ? `
                <button class="btn btn-gold btn-sm" onclick="App.quickMarkPaid('${proj.id}')">
                  Mark as Paid
                </button>
              ` : `
                <span style="font-size: 11px; font-weight: 700; color: var(--accent-income);">Fully Settled ✓</span>
              `}
              <button class="edit-btn" onclick="App.openEditProjectModal('${proj.id}')" title="Edit Project">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="delete-btn" onclick="event.stopPropagation(); App.confirmDelete('projects', '${proj.id}')" title="Delete Project">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  filterProjects(status) {
    this.selectedProjectFilter = status;
    document.querySelectorAll('#project-status-filter .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-status') === status);
    });
    this.renderProjects();
  },

  handleProjectInvoiceClick(projectId) {
    const invoices = window.dataStore.data.invoices || [];
    const existing = invoices.find(inv => inv.projectId === projectId);
    if (existing) {
      this.openInvoicePreview(existing.id);
    } else {
      this.openCreateInvoiceModal(projectId);
    }
  },

  // --- INVOICES & BILLING CONTROLLER ---

  setBillingTab(tab) {
    this.filterInvoices(tab === 'revenue' ? 'all' : (tab === 'pending' ? 'pending' : 'all'));
  },

  filterInvoices(status) {
    this.selectedInvoiceFilter = status || 'all';
    document.querySelectorAll('#invoice-status-filter .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-status') === this.selectedInvoiceFilter);
    });
    this.renderInvoices();
  },

  renderInvoices() {
    const listContainer = document.getElementById('invoices-list-container');
    if (!listContainer) return;

    const income = window.dataStore.data.income || [];
    const projects = window.dataStore.data.projects || [];

    // KPI Metrics calculation
    const totalCollected = income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalBilled = income.reduce((sum, i) => {
      const tot = (i.totalAmount !== undefined && i.totalAmount !== null && i.totalAmount > 0)
        ? Number(i.totalAmount)
        : Number(i.amount) || 0;
      return sum + tot;
    }, 0);

    const totalIncomeDue = income.reduce((sum, i) => {
      const tot = (i.totalAmount !== undefined && i.totalAmount !== null && i.totalAmount > 0)
        ? Number(i.totalAmount)
        : Number(i.amount) || 0;
      const rcv = Number(i.amount) || 0;
      const due = (i.balanceDue !== undefined && i.balanceDue !== null)
        ? Number(i.balanceDue)
        : Math.max(0, tot - rcv);
      return sum + due;
    }, 0);

    // Unbilled project dues
    const pendingProjects = projects.filter(p => {
      if (p.status === 'Completed') return false;
      const pkg = Number(p.packageAmount) || 0;
      const rcv = Number(p.receivedAmount) || 0;
      return (pkg - rcv) > 0;
    });
    const unbilledProjectDue = pendingProjects.reduce((sum, p) => {
      const pkg = Number(p.packageAmount) || 0;
      const rcv = Number(p.receivedAmount) || 0;
      return sum + Math.max(0, pkg - rcv);
    }, 0);

    const grandDue = totalIncomeDue + unbilledProjectDue;

    // Update KPI stat cards
    const revEl = document.getElementById('inv-stat-revenue');
    const totalEl = document.getElementById('inv-stat-total');
    const dueEl = document.getElementById('inv-stat-due');
    const countEl = document.getElementById('inv-stat-count');

    if (revEl) revEl.textContent = FinanceEngine.formatINR(totalCollected);
    if (totalEl) totalEl.textContent = FinanceEngine.formatINR(totalBilled);
    if (dueEl) dueEl.textContent = FinanceEngine.formatINR(grandDue);
    if (countEl) countEl.textContent = `${income.length} Records`;

    const filter = this.selectedInvoiceFilter || 'all';

    let filtered = income;
    if (filter === 'pending') {
      filtered = income.filter(i => {
        const tot = (i.totalAmount !== undefined && i.totalAmount !== null && i.totalAmount > 0) ? Number(i.totalAmount) : Number(i.amount);
        const due = (i.balanceDue !== undefined && i.balanceDue !== null) ? Number(i.balanceDue) : Math.max(0, tot - (Number(i.amount) || 0));
        return due > 0;
      });
    } else if (filter === 'paid') {
      filtered = income.filter(i => {
        const tot = (i.totalAmount !== undefined && i.totalAmount !== null && i.totalAmount > 0) ? Number(i.totalAmount) : Number(i.amount);
        const due = (i.balanceDue !== undefined && i.balanceDue !== null) ? Number(i.balanceDue) : Math.max(0, tot - (Number(i.amount) || 0));
        return due <= 0;
      });
    } else if (filter === 'UPI' || filter === 'Cash' || filter === 'Bank') {
      filtered = income.filter(i => (i.paymentMethod || 'UPI') === filter);
    }

    if (filtered.length === 0 && (filter !== 'pending' || pendingProjects.length === 0)) {
      listContainer.innerHTML = `
        <div class="empty-state" style="padding: 32px 16px;">
          ${filter === 'pending'
            ? '🎉 No pending client dues! All records are fully settled.'
            : 'No revenue & bill records found for this filter.<br><br><button class="btn btn-gold btn-sm" onclick="App.openAddIncomeModal()">+ Add Revenue & Bill</button>'}
        </div>
      `;
      return;
    }

    let html = filtered.map(i => {
      const tot = (i.totalAmount !== undefined && i.totalAmount !== null && i.totalAmount > 0)
        ? Number(i.totalAmount)
        : Number(i.amount) || 0;
      const rcv = Number(i.amount) || 0;
      const due = (i.balanceDue !== undefined && i.balanceDue !== null)
        ? Number(i.balanceDue)
        : Math.max(0, tot - rcv);
      const isSettled = due <= 0;
      const ref = `REC-${(i.id || '').slice(-6).toUpperCase()}`;
      const client = i.clientName || 'Studio Client';
      const proj = i.projectName || 'Studio Direct Revenue';
      const cat = i.category || 'Wedding Shoot';
      const method = i.paymentMethod || 'UPI';

      return `
        <div class="invoice-card" style="border-left: 3px solid ${isSettled ? '#10b981' : '#fbbf24'}; margin-bottom: 12px;">
          <div class="invoice-header-row">
            <div class="invoice-num-group">
              <span class="invoice-number-tag">${ref}</span>
              <span style="font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: rgba(212, 175, 55, 0.15); color: var(--gold-light);">${cat}</span>
              <span class="${isSettled ? 'badge-paid' : 'badge-pending'}">${isSettled ? 'Fully Settled ✓' : `${FinanceEngine.formatINR(due)} Due`}</span>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary);">
              Date: <strong style="color: var(--text-white);">${i.date || ''}</strong>
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
              <h3 style="font-size: 16px; font-weight: 800; color: var(--text-white); margin-bottom: 2px;">
                ${client}
              </h3>
              <span class="method-tag">${method}</span>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
              ${proj ? `<span>Project: <strong style="color: var(--gold-light);">${proj}</strong></span>` : ''}
              ${i.clientPhone ? `<span> • 📞 ${i.clientPhone}</span>` : ''}
              ${i.notes ? `<span> • <em>${i.notes}</em></span>` : ''}
            </div>
          </div>

          <div class="invoice-meta-grid" style="margin-top: 10px;">
            <div class="invoice-meta-item">
              <div class="label">Total Bill / Package</div>
              <div class="val">${FinanceEngine.formatINR(tot)}</div>
            </div>
            <div class="invoice-meta-item">
              <div class="label">Amount Received</div>
              <div class="val" style="color: var(--accent-income);">+${FinanceEngine.formatINR(rcv)}</div>
            </div>
            <div class="invoice-meta-item">
              <div class="label">Balance Due</div>
              <div class="val" style="color: ${isSettled ? '#34d399' : '#fbbf24'};">${isSettled ? '₹0 (Settled)' : FinanceEngine.formatINR(due)}</div>
            </div>
          </div>

          <div class="invoice-actions-row" style="margin-top: 12px;">
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn-whatsapp" style="padding: 6px 12px; font-size: 12px;" onclick="App.shareRevenueWhatsApp('${i.id}')" title="Share WhatsApp Bill">
                <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.045.073.045.42-.099.825z"/></svg>
                WhatsApp Bill
              </button>
              <button class="btn btn-outline btn-sm" onclick="App.openShareReceiptModal('${i.id}', 'payment')" title="View / Share Receipt">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                Receipt
              </button>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn btn-outline btn-sm" onclick="App.openEditIncomeModal('${i.id}')" title="Edit Revenue & Bill">
                ✏️ Edit
              </button>
              <button class="delete-btn" onclick="event.stopPropagation(); App.confirmDelete('income', '${i.id}')" title="Delete Record">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // If pending filter is active, append unbilled project balances
    if (filter === 'pending' && pendingProjects.length > 0) {
      html += `
        <h3 style="font-size: 14px; font-weight: 700; color: #fbbf24; margin: 24px 0 12px 0; display: flex; align-items: center; gap: 6px;">
          <span>⚠️ Unbilled Project Balances (${pendingProjects.length})</span>
        </h3>
      `;
      html += pendingProjects.map(p => {
        const pkg = Number(p.packageAmount) || 0;
        const rcv = Number(p.receivedAmount) || 0;
        const pending = pkg - rcv;
        return `
          <div class="invoice-card" style="border-left: 3px solid #f87171; margin-bottom: 12px;">
            <div class="invoice-header-row">
              <span class="invoice-number-tag" style="background: rgba(248, 113, 113, 0.15); color: #f87171;">PROJECT BALANCE</span>
              <div class="val" style="color: #f87171; font-weight: 800; font-size: 15px;">
                ${FinanceEngine.formatINR(pending)} Due
              </div>
            </div>
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--text-white); margin-bottom: 2px;">
                ${p.name} (${p.clientName})
              </h3>
              <div style="font-size: 12px; color: var(--text-secondary);">
                <span>Package: ${FinanceEngine.formatINR(pkg)}</span> •
                <span>Collected: ${FinanceEngine.formatINR(rcv)}</span>
                ${p.clientPhone ? ` • <span>📞 ${p.clientPhone}</span>` : ''}
              </div>
            </div>
            <div class="invoice-actions-row" style="margin-top: 12px;">
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn-whatsapp" style="padding: 6px 12px; font-size: 12px;" onclick="App.sendProjectWhatsAppReminder('${p.id}')">
                  WhatsApp Reminder
                </button>
                <button class="btn btn-gold btn-sm" onclick="App.openAddIncomeModal('${p.id}')">
                  + Record Bill / Payment
                </button>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-outline btn-sm" onclick="App.viewProjectDetails('${p.id}')">View Details</button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    listContainer.innerHTML = html;
  },

  openCreateInvoiceFromHub() {
    this.closeModalDirect('modal-quick-hub');
    this.openAddIncomeModal();
  },

  openCreateInvoiceModal(projectId = null) {
    this.openAddIncomeModal(projectId);
  },

  populateInvoiceProjectDropdown(selectedProjectId = null) {
    const select = document.getElementById('inv-project');
    if (!select) return;
    const projects = window.dataStore.data.projects || [];
    let options = '<option value="">-- Direct Client (No Project) --</option>';
    projects.forEach(p => {
      const isSel = p.id === selectedProjectId ? 'selected' : '';
      options += `<option value="${p.id}" ${isSel}>${p.name} (${p.clientName})</option>`;
    });
    select.innerHTML = options;
  },

  openCreateInvoiceModal(projectId = null) {
    this.editingInvoiceId = null;
    const form = document.getElementById('form-invoice');
    if (form) form.reset();

    const titleEl = document.getElementById('invoice-modal-title');
    if (titleEl) titleEl.textContent = 'Create Client Invoice';

    const delBtn = document.getElementById('btn-delete-invoice');
    if (delBtn) delBtn.style.display = 'none';

    document.getElementById('inv-edit-id').value = '';
    document.getElementById('inv-num').value = window.dataStore.getNextInvoiceNumber();

    const todayStr = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + 15);
    const dueStr = due.toISOString().split('T')[0];

    document.getElementById('inv-issue-date').value = todayStr;
    document.getElementById('inv-due-date').value = dueStr;
    document.getElementById('inv-discount').value = '0';
    document.getElementById('inv-tax-pct').value = '0';
    document.getElementById('inv-paid').value = '0';

    this.populateInvoiceProjectDropdown(projectId);

    if (projectId) {
      const p = (window.dataStore.data.projects || []).find(proj => proj.id === projectId);
      if (p) {
        document.getElementById('inv-client').value = p.clientName || '';
        document.getElementById('inv-phone').value = p.clientPhone || '';
        document.getElementById('inv-address').value = p.location || '';
        document.getElementById('inv-paid').value = p.receivedAmount || 0;
        this.invoiceLineItems = [
          { description: `${p.name} - Photography & Videography Package`, quantity: 1, rate: p.packageAmount || 0 }
        ];
      } else {
        this.invoiceLineItems = [{ description: '', quantity: 1, rate: 0 }];
      }
    } else {
      this.invoiceLineItems = [{ description: '', quantity: 1, rate: 0 }];
    }

    this.renderLineItemRows();
    this.updateInvoiceCalculations();
    this.openModal('modal-invoice');
  },

  openEditInvoiceModal(invoiceId) {
    const inv = (window.dataStore.data.invoices || []).find(i => i.id === invoiceId);
    if (!inv) return;

    this.editingInvoiceId = invoiceId;
    const titleEl = document.getElementById('invoice-modal-title');
    if (titleEl) titleEl.textContent = `Edit Invoice ${inv.invoiceNumber}`;

    const delBtn = document.getElementById('btn-delete-invoice');
    if (delBtn) delBtn.style.display = 'inline-flex';

    document.getElementById('inv-edit-id').value = inv.id;
    document.getElementById('inv-num').value = inv.invoiceNumber;
    this.populateInvoiceProjectDropdown(inv.projectId);
    document.getElementById('inv-client').value = inv.clientName || '';
    document.getElementById('inv-phone').value = inv.clientPhone || '';
    document.getElementById('inv-email').value = inv.clientEmail || '';
    document.getElementById('inv-address').value = inv.clientAddress || '';
    document.getElementById('inv-issue-date').value = inv.issueDate || '';
    document.getElementById('inv-due-date').value = inv.dueDate || '';
    document.getElementById('inv-discount').value = inv.discountAmount || 0;
    document.getElementById('inv-tax-pct').value = inv.taxPercent || 0;
    document.getElementById('inv-paid').value = inv.paidAmount || 0;
    document.getElementById('inv-status').value = inv.status || 'Pending';
    document.getElementById('inv-notes').value = inv.notes || '';

    this.invoiceLineItems = (inv.items && inv.items.length > 0)
      ? JSON.parse(JSON.stringify(inv.items))
      : [{ description: '', quantity: 1, rate: 0 }];

    this.renderLineItemRows();
    this.updateInvoiceCalculations();
    this.openModal('modal-invoice');
  },

  handleInvoiceProjectSelect() {
    const select = document.getElementById('inv-project');
    const projId = select ? select.value : '';
    if (!projId) return;

    const p = (window.dataStore.data.projects || []).find(proj => proj.id === projId);
    if (p) {
      const clientInp = document.getElementById('inv-client');
      const phoneInp = document.getElementById('inv-phone');
      const addrInp = document.getElementById('inv-address');
      const paidInp = document.getElementById('inv-paid');

      if (clientInp && !clientInp.value) clientInp.value = p.clientName || '';
      if (phoneInp && !phoneInp.value) phoneInp.value = p.clientPhone || '';
      if (addrInp && !addrInp.value) addrInp.value = p.location || '';
      if (paidInp && (!paidInp.value || paidInp.value === '0')) paidInp.value = p.receivedAmount || 0;

      if (this.invoiceLineItems.length === 1 && !this.invoiceLineItems[0].description) {
        this.invoiceLineItems[0] = {
          description: `${p.name} - Photography & Videography Package`,
          quantity: 1,
          rate: p.packageAmount || 0
        };
        this.renderLineItemRows();
        this.updateInvoiceCalculations();
      }
    }
  },

  addLineItem(desc = '', qty = 1, rate = 0) {
    this.invoiceLineItems.push({ description: desc, quantity: qty, rate: rate });
    this.renderLineItemRows();
    this.updateInvoiceCalculations();
  },

  removeLineItem(index) {
    if (this.invoiceLineItems.length <= 1) {
      this.invoiceLineItems = [{ description: '', quantity: 1, rate: 0 }];
    } else {
      this.invoiceLineItems.splice(index, 1);
    }
    this.renderLineItemRows();
    this.updateInvoiceCalculations();
  },

  handleLineItemChange(index, field, value) {
    if (!this.invoiceLineItems[index]) return;
    if (field === 'description') {
      this.invoiceLineItems[index].description = value;
    } else if (field === 'quantity') {
      this.invoiceLineItems[index].quantity = Number(value) || 1;
    } else if (field === 'rate') {
      this.invoiceLineItems[index].rate = Number(value) || 0;
    }
    this.updateInvoiceCalculations();

    const rowTotalEl = document.getElementById(`line-item-total-${index}`);
    if (rowTotalEl) {
      const q = this.invoiceLineItems[index].quantity || 0;
      const r = this.invoiceLineItems[index].rate || 0;
      rowTotalEl.textContent = FinanceEngine.formatINR(q * r);
    }
  },

  renderLineItemRows() {
    const container = document.getElementById('invoice-line-items');
    if (!container) return;

    container.innerHTML = this.invoiceLineItems.map((item, idx) => {
      const q = Number(item.quantity) || 1;
      const r = Number(item.rate) || 0;
      const rowAmt = q * r;

      return `
        <div class="line-item-row">
          <div class="desc-col">
            <input type="text" class="form-input" placeholder="Service (e.g. Wedding Shoot, 4K Drone, Album)" 
              value="${item.description ? item.description.replace(/"/g, '&quot;') : ''}" 
              oninput="App.handleLineItemChange(${idx}, 'description', this.value)" required>
          </div>
          <div>
            <input type="number" min="1" class="form-input" placeholder="Qty" value="${q}" 
              oninput="App.handleLineItemChange(${idx}, 'quantity', this.value)" required>
          </div>
          <div>
            <input type="number" min="0" class="form-input" placeholder="Rate (₹)" value="${r}" 
              oninput="App.handleLineItemChange(${idx}, 'rate', this.value)" required>
          </div>
          <div style="font-weight: 700; font-size: 13px; text-align: right; padding-right: 6px; color: var(--text-white);" id="line-item-total-${idx}">
            ${FinanceEngine.formatINR(rowAmt)}
          </div>
          <div>
            <button type="button" class="line-item-delete-btn" onclick="App.removeLineItem(${idx})" title="Remove service">✕</button>
          </div>
        </div>
      `;
    }).join('');
  },

  updateInvoiceCalculations() {
    const discount = parseFloat(document.getElementById('inv-discount')?.value) || 0;
    const taxPct = parseFloat(document.getElementById('inv-tax-pct')?.value) || 0;
    const paid = parseFloat(document.getElementById('inv-paid')?.value) || 0;

    const totals = FinanceEngine.calculateInvoiceTotals(this.invoiceLineItems, discount, taxPct, paid);

    const subEl = document.getElementById('inv-calc-subtotal');
    const totEl = document.getElementById('inv-calc-total');
    const balEl = document.getElementById('inv-calc-balance');
    const statusSelect = document.getElementById('inv-status');

    if (subEl) subEl.textContent = FinanceEngine.formatINR(totals.subtotal);
    if (totEl) totEl.textContent = FinanceEngine.formatINR(totals.totalAmount);
    if (balEl) balEl.textContent = FinanceEngine.formatINR(totals.balanceDue);
    if (statusSelect && !this.editingInvoiceId) {
      statusSelect.value = totals.status;
    }
  },

  handleSaveInvoice(e) {
    e.preventDefault();
    const invoiceNumber = document.getElementById('inv-num').value.trim();
    const projectId = document.getElementById('inv-project').value || '';
    let projectName = '';
    if (projectId) {
      const p = (window.dataStore.data.projects || []).find(proj => proj.id === projectId);
      if (p) projectName = p.name;
    }

    const clientName = document.getElementById('inv-client').value.trim();
    const clientPhone = document.getElementById('inv-phone').value.trim();
    const clientEmail = document.getElementById('inv-email').value.trim();
    const clientAddress = document.getElementById('inv-address').value.trim();
    const issueDate = document.getElementById('inv-issue-date').value;
    const dueDate = document.getElementById('inv-due-date').value;
    const discountAmount = parseFloat(document.getElementById('inv-discount').value) || 0;
    const taxPercent = parseFloat(document.getElementById('inv-tax-pct').value) || 0;
    const paidAmount = parseFloat(document.getElementById('inv-paid').value) || 0;
    const status = document.getElementById('inv-status').value;
    const notes = document.getElementById('inv-notes').value.trim();

    const items = this.invoiceLineItems.filter(item => (item.description || '').trim().length > 0);
    if (items.length === 0) {
      this.showToast('⚠️ Please add at least one service item to the invoice.');
      return;
    }

    const totals = FinanceEngine.calculateInvoiceTotals(items, discountAmount, taxPercent, paidAmount);

    const invoicePayload = {
      invoiceNumber,
      projectId,
      projectName,
      clientName,
      clientPhone,
      clientEmail,
      clientAddress,
      issueDate,
      dueDate,
      status: status || totals.status,
      items,
      subtotal: totals.subtotal,
      discountAmount: totals.discount,
      taxPercent: totals.taxPercent,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      paidAmount: totals.paidAmount,
      balanceDue: totals.balanceDue,
      notes
    };

    if (this.editingInvoiceId) {
      window.dataStore.updateInvoice(this.editingInvoiceId, invoicePayload);
      this.showToast('Invoice updated successfully ✓');
    } else {
      window.dataStore.addInvoice(invoicePayload);
      this.showToast('Invoice generated successfully ✓');
    }

    this.closeModalDirect('modal-invoice');
    this.renderInvoices();
  },

  openInvoicePreview(invoiceId) {
    const inv = (window.dataStore.data.invoices || []).find(i => i.id === invoiceId);
    if (!inv) return;

    this.previewingInvoiceId = invoiceId;
    const billing = window.dataStore.data.settings?.billing || {
      studioName: 'LUCIA PHOTOGRAPHY & VIDEOGRAPHY',
      tagline: 'Cinematic Visuals & Luxury Wedding Capture',
      address: 'Studio Lucia, Mavoor Road, Calicut, Kerala 673004',
      phone: '+91 98470 12345 / +91 94460 54321',
      email: 'lucia@studio.com',
      upiId: 'lucia@okaxis',
      bankName: 'HDFC Bank',
      accountNumber: '50200012345678',
      ifsc: 'HDFC0001234 (Calicut)'
    };

    const isPaid = inv.status === 'Paid' || (Number(inv.balanceDue) || 0) <= 0;
    const isPartial = inv.status === 'Partial';
    const stampText = isPaid ? 'PAID IN FULL' : (isPartial ? 'PARTIALLY PAID' : 'PAYMENT DUE');
    const stampColor = isPaid ? '#10b981' : (isPartial ? '#fbbf24' : '#ef4444');

    const sheetContainer = document.getElementById('invoice-sheet');
    if (!sheetContainer) return;

    sheetContainer.innerHTML = `
      <div class="sheet-header">
        <div>
          <img src="lucia_logo.png" alt="Lucia Logo" class="sheet-brand-logo" onerror="this.style.display='none'">
          <div class="sheet-brand-name">${billing.studioName}</div>
          <div class="sheet-brand-sub">${billing.tagline}</div>
          <div class="sheet-brand-sub" style="margin-top: 4px;">
            ${billing.address}<br>
            Phone: ${billing.phone} • Email: ${billing.email}
          </div>
        </div>
        <div class="sheet-badge-title">
          <div class="sheet-tax-title">INVOICE</div>
          <div class="sheet-inv-num">${inv.invoiceNumber}</div>
          <div style="font-size: 11px; color: #718096; margin-top: 4px;">Issue: ${inv.issueDate}</div>
          <div style="font-size: 11px; color: #718096;">Due: ${inv.dueDate}</div>
          <div style="display: inline-block; margin-top: 8px; padding: 4px 10px; border-radius: 4px; border: 1.5px solid ${stampColor}; color: ${stampColor}; font-weight: 800; font-size: 11px; letter-spacing: 0.08em;">
            ${stampText}
          </div>
        </div>
      </div>

      <div class="sheet-parties-grid">
        <div class="sheet-party-box">
          <h4>Billed To (Client):</h4>
          <div class="name">${inv.clientName}</div>
          ${inv.projectName ? `<div class="detail"><strong>Event / Project:</strong> ${inv.projectName}</div>` : ''}
          ${inv.clientPhone ? `<div class="detail"><strong>Phone:</strong> ${inv.clientPhone}</div>` : ''}
          ${inv.clientEmail ? `<div class="detail"><strong>Email:</strong> ${inv.clientEmail}</div>` : ''}
          ${inv.clientAddress ? `<div class="detail"><strong>Location:</strong> ${inv.clientAddress}</div>` : ''}
        </div>
        <div class="sheet-party-box" style="text-align: right;">
          <h4>Invoice Summary:</h4>
          <div class="detail"><strong>Invoice Number:</strong> ${inv.invoiceNumber}</div>
          <div class="detail"><strong>Date of Issue:</strong> ${inv.issueDate}</div>
          <div class="detail"><strong>Payment Due:</strong> ${inv.dueDate}</div>
          <div class="detail"><strong>Status:</strong> ${inv.status}</div>
        </div>
      </div>

      <table class="sheet-table">
        <thead>
          <tr>
            <th style="width: 50%;">Service Description</th>
            <th class="num" style="width: 15%;">Qty</th>
            <th class="num" style="width: 15%;">Rate (₹)</th>
            <th class="num" style="width: 20%;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${(inv.items || []).map(item => `
            <tr>
              <td>${item.description}</td>
              <td class="num">${item.quantity}</td>
              <td class="num">${FinanceEngine.formatINR(item.rate, false)}</td>
              <td class="num" style="font-weight: 700;">${FinanceEngine.formatINR(item.quantity * item.rate, false)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="sheet-summary-layout">
        <div class="sheet-payment-info">
          <h5>Studio Payment & Settlement Details</h5>
          <div><strong>UPI ID:</strong> <span style="font-family: var(--font-mono); color: #0B2B20; font-weight: 800;">${billing.upiId}</span></div>
          <div style="margin-top: 4px;"><strong>Bank:</strong> ${billing.bankName}</div>
          <div><strong>Account No:</strong> ${billing.accountNumber}</div>
          <div><strong>IFSC / Branch:</strong> ${billing.ifsc}</div>
          ${inv.notes ? `<div style="margin-top: 8px; font-style: italic; color: #4a5568;">"${inv.notes}"</div>` : ''}
        </div>

        <div class="sheet-totals-box">
          <div class="sheet-totals-row">
            <span>Subtotal:</span>
            <span>${FinanceEngine.formatINR(inv.subtotal)}</span>
          </div>
          ${(inv.discountAmount > 0) ? `
            <div class="sheet-totals-row" style="color: #ef4444;">
              <span>Discount:</span>
              <span>−${FinanceEngine.formatINR(inv.discountAmount)}</span>
            </div>
          ` : ''}
          ${(inv.taxAmount > 0) ? `
            <div class="sheet-totals-row">
              <span>GST (${inv.taxPercent}%):</span>
              <span>+${FinanceEngine.formatINR(inv.taxAmount)}</span>
            </div>
          ` : ''}
          <div class="sheet-totals-row grand-total">
            <span>Grand Total:</span>
            <span>${FinanceEngine.formatINR(inv.totalAmount)}</span>
          </div>
          <div class="sheet-totals-row" style="color: #10b981; margin-top: 6px;">
            <span>Advance / Paid:</span>
            <span>${FinanceEngine.formatINR(inv.paidAmount)}</span>
          </div>
          <div class="sheet-totals-row balance-due">
            <span>Balance Due:</span>
            <span>${FinanceEngine.formatINR(inv.balanceDue)}</span>
          </div>
        </div>
      </div>

      <div class="sheet-footer">
        <div>
          <div>Thank you for choosing ${billing.studioName}!</div>
          <div style="color: #a0aec0; margin-top: 2px;">This is a computer-generated invoice and needs no physical seal.</div>
        </div>
        <div class="sheet-signature-line">
          <div class="sheet-sig-box"></div>
          <div>Authorized Signatory</div>
          <div style="font-weight: 700; color: #03140E;">${billing.studioName}</div>
        </div>
      </div>
    `;

    this.openModal('modal-invoice-preview');
  },

  printInvoice() {
    document.body.classList.add('printing-invoice');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-invoice');
    }, 1000);
  },

  shareInvoiceWhatsApp(invoiceId) {
    const id = invoiceId || this.previewingInvoiceId;
    const inv = (window.dataStore.data.invoices || []).find(i => i.id === id);
    if (!inv) return;

    const billing = window.dataStore.data.settings?.billing || {
      studioName: 'LUCIA PHOTOGRAPHY & VIDEOGRAPHY',
      upiId: 'lucia@okaxis'
    };

    const text = `*${billing.studioName}* 📸✨\n` +
      `*INVOICE: ${inv.invoiceNumber}*\n` +
      `Client: ${inv.clientName}\n` +
      (inv.projectName ? `Project: ${inv.projectName}\n` : '') +
      `Date: ${inv.issueDate}\n` +
      `---------------------------\n` +
      `Grand Total: ${FinanceEngine.formatINR(inv.totalAmount)}\n` +
      `Paid to Date: ${FinanceEngine.formatINR(inv.paidAmount)}\n` +
      `*Balance Due: ${FinanceEngine.formatINR(inv.balanceDue)}*\n` +
      `---------------------------\n` +
      `Pay via UPI: ${billing.upiId}\n` +
      `Thank you for your business!`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.showToast('Bill summary copied! Opening WhatsApp...');
    }

    let cleanPhone = (inv.clientPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  },

  // --- BILL & RECEIPT SHARING CONTROLLER ---

  openShareReceiptModal(id, type = 'invoice') {
    let receiptData = null;

    if (type === 'invoice') {
      const inv = (window.dataStore.data.invoices || []).find(i => i.id === id);
      if (!inv) return;
      receiptData = {
        type: 'invoice',
        id: inv.id,
        title: 'Tax Invoice & Bill',
        number: inv.invoiceNumber,
        clientName: inv.clientName,
        clientPhone: inv.clientPhone || '',
        projectName: inv.projectName || '',
        date: inv.issueDate,
        dueDate: inv.dueDate,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        balanceDue: inv.balanceDue,
        notes: inv.notes
      };
    } else if (type === 'project') {
      const proj = (window.dataStore.data.projects || []).find(p => p.id === id);
      if (!proj) return;
      const pkg = Number(proj.packageAmount) || 0;
      const rcv = Number(proj.receivedAmount) || 0;
      receiptData = {
        type: 'project',
        id: proj.id,
        title: 'Project Bill Statement',
        number: proj.name,
        clientName: proj.clientName,
        clientPhone: proj.clientPhone || '',
        projectName: proj.name,
        date: proj.eventDate,
        totalAmount: pkg,
        paidAmount: rcv,
        balanceDue: Math.max(0, pkg - rcv),
        notes: proj.location ? `Shoot Location: ${proj.location}` : ''
      };
    } else if (type === 'payment') {
      const inc = (window.dataStore.data.income || []).find(i => i.id === id);
      if (!inc) return;
      const proj = inc.projectId ? (window.dataStore.data.projects || []).find(p => p.id === inc.projectId) : null;
      const clientName = inc.clientName || (proj ? proj.clientName : (inc.notes || 'Studio Client'));
      const clientPhone = inc.clientPhone || (proj ? (proj.clientPhone || '') : '');
      const projectName = inc.projectName || (proj ? proj.name : '');
      const totalAmount = (inc.totalAmount !== undefined && inc.totalAmount !== null && inc.totalAmount > 0)
        ? Number(inc.totalAmount)
        : (proj ? (Number(proj.packageAmount) || 0) : Number(inc.amount));
      const receivedAmount = Number(inc.amount) || 0;
      const balanceDue = (inc.balanceDue !== undefined && inc.balanceDue !== null)
        ? Number(inc.balanceDue)
        : Math.max(0, totalAmount - receivedAmount);

      receiptData = {
        type: 'payment',
        id: inc.id,
        title: 'Payment & Bill Receipt',
        number: `REC-${inc.id.slice(-6).toUpperCase()}`,
        clientName,
        clientPhone,
        projectName,
        date: inc.date,
        amountReceived: receivedAmount,
        paymentMethod: inc.paymentMethod || 'UPI',
        totalAmount,
        paidAmount: receivedAmount,
        balanceDue,
        notes: inc.notes
      };
    }

    if (!receiptData) return;
    this.sharingReceiptData = receiptData;

    const billing = window.dataStore.data.settings?.billing || {
      studioName: 'LUCIA PHOTOGRAPHY & VIDEOGRAPHY',
      upiId: 'lucia@okaxis'
    };

    const previewEl = document.getElementById('share-receipt-preview');
    if (previewEl) {
      previewEl.innerHTML = `
        <div class="share-receipt-header">
          <img src="lucia_logo.png" alt="Lucia Logo" style="height: 44px; width: auto; object-fit: contain; margin: 0 auto 8px; display: block; filter: drop-shadow(0 0 10px rgba(197, 160, 89, 0.4));" onerror="this.style.display='none'">
          <div class="share-receipt-brand">${billing.studioName}</div>
          <div class="share-receipt-type">${receiptData.title}</div>
        </div>

        <div class="share-receipt-meta">
          <span>Ref / Number:</span>
          <strong>${receiptData.number}</strong>
        </div>
        <div class="share-receipt-meta">
          <span>Client:</span>
          <strong>${receiptData.clientName}</strong>
        </div>
        ${receiptData.projectName ? `
        <div class="share-receipt-meta">
          <span>Project:</span>
          <strong>${receiptData.projectName}</strong>
        </div>` : ''}
        <div class="share-receipt-meta">
          <span>Date:</span>
          <strong>${receiptData.date}</strong>
        </div>

        <div class="share-receipt-divider"></div>

        <div class="share-receipt-totals">
          ${receiptData.amountReceived !== undefined ? `
            <div class="share-receipt-row" style="color: var(--accent-income); font-weight: 800; font-size: 15px;">
              <span>Amount Received:</span>
              <span>+${FinanceEngine.formatINR(receiptData.amountReceived)}</span>
            </div>
            <div class="share-receipt-row" style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px;">
              <span>Payment Mode:</span>
              <span>${receiptData.paymentMethod || 'UPI'}</span>
            </div>
          ` : ''}
          <div class="share-receipt-row">
            <span>Package / Total:</span>
            <span>${FinanceEngine.formatINR(receiptData.totalAmount)}</span>
          </div>
          <div class="share-receipt-row" style="color: var(--accent-income);">
            <span>Total Paid to Date:</span>
            <span>${FinanceEngine.formatINR(receiptData.paidAmount)}</span>
          </div>
          <div class="share-receipt-row balance-due">
            <span>Balance Due:</span>
            <span>${FinanceEngine.formatINR(receiptData.balanceDue)}</span>
          </div>
        </div>

        <div class="share-receipt-upi">
          <div>Pay via UPI: <strong>${billing.upiId}</strong></div>
          ${billing.bankName ? `<div style="margin-top: 3px; font-size: 10px; color: var(--text-muted);">${billing.bankName} • A/C: ${billing.accountNumber} • IFSC: ${billing.ifsc}</div>` : ''}
        </div>
      `;
    }

    const phoneInput = document.getElementById('share-receipt-phone');
    if (phoneInput) {
      phoneInput.value = receiptData.clientPhone || '';
    }

    const titleEl = document.getElementById('share-receipt-modal-title');
    if (titleEl) {
      titleEl.textContent = `Share ${receiptData.title}`;
    }

    this.openModal('modal-share-receipt');
  },

  generateReceiptText(r) {
    if (!r) return '';
    const billing = window.dataStore.data.settings?.billing || {
      studioName: 'LUCIA PHOTOGRAPHY & VIDEOGRAPHY',
      upiId: 'lucia@okaxis'
    };

    let text = `📸 *${billing.studioName}* 📸\n` +
      `✨ *${r.title.toUpperCase()}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📄 *Ref:* ${r.number}\n` +
      `👤 *Client:* ${r.clientName}\n` +
      (r.projectName ? `🎬 *Project:* ${r.projectName}\n` : '') +
      `📅 *Date:* ${r.date}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n`;

    if (r.amountReceived !== undefined) {
      text += `🟢 *Amount Received:* ${FinanceEngine.formatINR(r.amountReceived)} (${r.paymentMethod || 'UPI'})\n`;
    }

    text += `💰 *Grand Total:* ${FinanceEngine.formatINR(r.totalAmount)}\n` +
      `✅ *Paid to Date:* ${FinanceEngine.formatINR(r.paidAmount)}\n` +
      `⚠️ *Balance Due:* ${FinanceEngine.formatINR(r.balanceDue)}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏦 *Payment Settlement Details:*\n` +
      `▸ *UPI ID:* ${billing.upiId}\n`;

    if (billing.bankName && billing.accountNumber) {
      text += `▸ *Bank:* ${billing.bankName}\n` +
        `▸ *Account No:* ${billing.accountNumber}\n` +
        `▸ *IFSC:* ${billing.ifsc}\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Thank you for choosing ${billing.studioName}! 🎞️✨`;

    return text;
  },

  sendReceiptWhatsApp() {
    if (!this.sharingReceiptData) return;
    const phoneInput = document.getElementById('share-receipt-phone');
    const phone = phoneInput ? phoneInput.value.trim() : (this.sharingReceiptData.clientPhone || '');
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    const text = this.generateReceiptText(this.sharingReceiptData);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
      this.showToast('Receipt text copied! Opening WhatsApp...');
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  },

  async sendReceiptNative() {
    if (!this.sharingReceiptData) return;
    const text = this.generateReceiptText(this.sharingReceiptData);
    const title = `${this.sharingReceiptData.title} - ${this.sharingReceiptData.number}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text
        });
        this.showToast('Receipt shared successfully ✓');
      } catch (err) {
        if (err.name !== 'AbortError') {
          this.copyReceiptText();
        }
      }
    } else {
      this.copyReceiptText();
    }
  },

  copyReceiptText() {
    if (!this.sharingReceiptData) return;
    const text = this.generateReceiptText(this.sharingReceiptData);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('Receipt copied to clipboard! Ready to paste & send ✓');
      }).catch(() => {
        this.showToast('Receipt text copied to clipboard ✓');
      });
    } else {
      this.showToast('Receipt text ready to send');
    }
  },

  viewReceiptFullInvoice() {
    if (!this.sharingReceiptData) return;
    const data = this.sharingReceiptData;
    this.closeModalDirect('modal-share-receipt');
    if (data.type === 'invoice') {
      this.openInvoicePreview(data.id);
    } else if (data.type === 'project') {
      this.handleProjectInvoiceClick(data.id);
    } else {
      const inv = (window.dataStore.data.invoices || [])[0];
      if (inv) {
        this.openInvoicePreview(inv.id);
      } else {
        this.showToast('Full print view is available under Invoices tab');
      }
    }
  },

  openRecordInvoicePaymentModal(invoiceId) {
    const inv = (window.dataStore.data.invoices || []).find(i => i.id === invoiceId);
    if (!inv) return;

    document.getElementById('inv-pay-invoice-id').value = inv.id;
    const infoBox = document.getElementById('inv-pay-info-box');
    if (infoBox) {
      infoBox.innerHTML = `
        <div style="font-weight: 800; font-size: 14px; color: var(--text-white);">${inv.invoiceNumber} — ${inv.clientName}</div>
        <div style="color: var(--text-secondary); margin-top: 4px;">
          Total: ${FinanceEngine.formatINR(inv.totalAmount)} • Paid: ${FinanceEngine.formatINR(inv.paidAmount)} • 
          <strong style="color: #fbbf24;">Outstanding Due: ${FinanceEngine.formatINR(inv.balanceDue)}</strong>
        </div>
      `;
    }

    const amountInp = document.getElementById('inv-pay-amount');
    if (amountInp) amountInp.value = inv.balanceDue;

    const dateInp = document.getElementById('inv-pay-date');
    if (dateInp) dateInp.value = new Date().toISOString().split('T')[0];

    const hint = document.getElementById('inv-pay-balance-hint');
    if (hint) hint.textContent = `Current balance due: ${FinanceEngine.formatINR(inv.balanceDue)}`;

    this.selectPaymentMethod('invpay', 'UPI');
    this.openModal('modal-invoice-payment');
  },

  handleSaveInvoicePayment(e) {
    e.preventDefault();
    const invoiceId = document.getElementById('inv-pay-invoice-id').value;
    const amount = FinanceEngine.parseINR(document.getElementById('inv-pay-amount').value);
    const date = document.getElementById('inv-pay-date').value;
    const paymentMethod = document.getElementById('inv-pay-method').value || 'UPI';
    const notes = document.getElementById('inv-pay-notes').value.trim();

    if (!amount || amount <= 0) {
      this.showToast('⚠️ Please enter a valid payment amount.');
      return;
    }

    const res = window.dataStore.recordInvoicePayment({
      invoiceId,
      amount,
      date,
      paymentMethod,
      notes
    });

    if (res) {
      this.closeModalDirect('modal-invoice-payment');
      this.showToast(`Payment of ${FinanceEngine.formatINR(amount)} recorded & Revenue updated ✓`);
      this.renderAll();
    } else {
      this.showToast('⚠️ Failed to record payment on invoice.');
    }
  },

  deleteInvoice(invoiceId, invoiceNumber) {
    this.confirmDelete('invoices', invoiceId);
  },

  renderIncome() {
    const listContainer = document.getElementById('income-list-container');
    const totalEl = document.getElementById('income-page-total');
    if (!listContainer) return;

    const income = window.dataStore.data.income || [];
    const total = income.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    if (totalEl) totalEl.textContent = FinanceEngine.formatINR(total);

    if (income.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">No revenue logged yet.</div>';
      return;
    }

    listContainer.innerHTML = income.map(i => `
      <div class="transaction-item">
        <div class="transaction-left">
          <div class="tx-icon income">+</div>
          <div>
            <div class="tx-title">${i.projectName || 'Studio Direct Revenue'}</div>
            <div class="tx-meta">
              <span>${i.date}</span>
              <span class="method-tag">${i.paymentMethod}</span>
              ${i.clientName ? `<span>• ${i.clientName}</span>` : ''}
              ${i.notes ? `<span>• ${i.notes}</span>` : ''}
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div class="tx-amount income">+${FinanceEngine.formatINR(i.amount)}</div>
          <button class="btn-share-icon" onclick="App.openShareReceiptModal('${i.id}', 'payment')" title="Share Payment Receipt">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Receipt
          </button>
          <button class="edit-btn" onclick="App.openEditIncomeModal('${i.id}')" title="Edit Revenue">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="delete-btn" onclick="event.stopPropagation(); App.confirmDelete('income', '${i.id}')" title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');
  },

  renderExpenses() {
    const listContainer = document.getElementById('expenses-list-container');
    const totalEl = document.getElementById('expenses-page-total');
    if (!listContainer) return;

    let expenses = window.dataStore.data.expenses || [];
    const allTotal = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    if (totalEl) totalEl.textContent = FinanceEngine.formatINR(allTotal);

    if (this.selectedExpenseCategory !== 'all') {
      expenses = expenses.filter(e => e.category === this.selectedExpenseCategory);
    }

    if (expenses.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">No expenses found for this category.</div>';
      return;
    }

    listContainer.innerHTML = expenses.map(e => `
      <div class="transaction-item">
        <div class="transaction-left">
          <div class="tx-icon expense">−</div>
          <div>
            <div class="tx-title">${e.category}: ${e.projectName || 'Studio Overhead'}</div>
            <div class="tx-meta">
              <span>${e.date}</span>
              <span class="method-tag">${e.paymentMethod}</span>
              ${e.notes ? `<span>• ${e.notes}</span>` : ''}
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="tx-amount expense">−${FinanceEngine.formatINR(e.amount)}</div>
          <button class="edit-btn" onclick="App.openEditExpenseModal('${e.id}')" title="Edit Expense">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="delete-btn" onclick="event.stopPropagation(); App.confirmDelete('expenses', '${e.id}')" title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');

    // Render Donut Chart
    LuciaCharts.renderCategoryDonut('expenses-category-canvas', window.dataStore.data.expenses);
  },

  filterExpenses(cat) {
    this.selectedExpenseCategory = cat;
    document.querySelectorAll('#expense-cat-filter .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-cat') === cat);
    });
    this.renderExpenses();
  },

  renderPartners() {
    const store = window.dataStore.data;
    const financials = FinanceEngine.computeFinancials(store, { type: 'all' });

    const p1Name = store.settings.partner1Name || 'Shameem';
    const p2Name = store.settings.partner2Name || 'Shiyan';

    // Partner 1
    const p1Title = document.getElementById('partner1-title-name');
    if (p1Title) p1Title.textContent = p1Name.toUpperCase();
    const p1Avatar = document.getElementById('partner1-avatar');
    if (p1Avatar) p1Avatar.textContent = p1Name.substring(0, 2).toUpperCase();
    const p1Btn = document.getElementById('btn-p1-record-wd');
    if (p1Btn) p1Btn.textContent = `Record ${p1Name} Withdrawal`;

    document.getElementById('p1-available').textContent = FinanceEngine.formatINR(financials.partner1.available);
    document.getElementById('p1-profit').textContent = FinanceEngine.formatINR(financials.partner1.profitShare);
    document.getElementById('p1-withdrawn').textContent = FinanceEngine.formatINR(financials.partner1.withdrawn);

    // Partner 2
    const p2Title = document.getElementById('partner2-title-name');
    if (p2Title) p2Title.textContent = p2Name.toUpperCase();
    const p2Avatar = document.getElementById('partner2-avatar');
    if (p2Avatar) p2Avatar.textContent = p2Name.substring(0, 2).toUpperCase();
    const p2Btn = document.getElementById('btn-p2-record-wd');
    if (p2Btn) p2Btn.textContent = `Record ${p2Name} Withdrawal`;

    document.getElementById('p2-available').textContent = FinanceEngine.formatINR(financials.partner2.available);
    document.getElementById('p2-profit').textContent = FinanceEngine.formatINR(financials.partner2.profitShare);
    document.getElementById('p2-withdrawn').textContent = FinanceEngine.formatINR(financials.partner2.withdrawn);

    // Withdrawals List
    const listContainer = document.getElementById('partners-withdrawal-list');
    if (!listContainer) return;

    const withdrawals = store.withdrawals || [];
    if (withdrawals.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">No partner withdrawals logged yet.</div>';
      return;
    }

    listContainer.innerHTML = withdrawals.map(w => `
      <div class="transaction-item">
        <div class="transaction-left">
          <div class="tx-icon" style="background: rgba(248, 113, 113, 0.15); color: #f87171;">W</div>
          <div>
            <div class="tx-title">${w.partnerName} Withdrawal</div>
            <div class="tx-meta">
              <span>${w.date}</span>
              <span class="method-tag">${w.paymentMethod}</span>
              ${w.notes ? `<span>• ${w.notes}</span>` : ''}
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="tx-amount" style="color: #f87171;">−${FinanceEngine.formatINR(w.amount)}</div>
          <button class="edit-btn" onclick="App.openEditWithdrawalModal('${w.id}')" title="Edit withdrawal">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="delete-btn" onclick="event.stopPropagation(); App.confirmDelete('withdrawals', '${w.id}')" title="Delete withdrawal">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');
  },

  renderCompanyFund() {
    const store = window.dataStore.data;
    const financials = FinanceEngine.computeFinancials(store, { type: 'all' });

    const balanceEl = document.getElementById('fund-balance-large');
    if (balanceEl) balanceEl.textContent = FinanceEngine.formatINR(financials.companyFundBalance);

    const listContainer = document.getElementById('fund-ledger-list');
    if (!listContainer) return;

    const ledger = store.companyFundLedger || [];
    if (ledger.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">No company fund transactions recorded yet.</div>';
      return;
    }

    listContainer.innerHTML = ledger.map(entry => {
      const isUse = entry.type === 'usage';
      const sign = isUse ? '−' : '+';
      const color = isUse ? 'var(--accent-expense)' : 'var(--gold-primary)';

      return `
        <div class="transaction-item">
          <div class="transaction-left">
            <div class="tx-icon" style="background: ${isUse ? 'var(--accent-expense-bg)' : 'var(--gold-subtle)'}; color: ${color};">${sign}</div>
            <div>
              <div class="tx-title">${entry.category}: ${entry.description}</div>
              <div class="tx-meta">
                <span>${entry.date}</span>
                <span class="method-tag">${entry.paymentMethod}</span>
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="tx-amount" style="color: ${color};">${sign}${FinanceEngine.formatINR(entry.amount)}</div>
            <button class="edit-btn" onclick="App.openEditFundTransactionModal('${entry.id}')" title="Edit fund record">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="delete-btn" onclick="event.stopPropagation(); App.confirmDelete('companyFundLedger', '${entry.id}')" title="Delete fund entry">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderReports() {
    const today = new Date();
    let filter = { type: 'month', monthIndex: today.getMonth(), year: today.getFullYear() };

    if (this.reportPeriod === 'last-month') {
      const prevMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
      const prevYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
      filter = { type: 'month', monthIndex: prevMonth, year: prevYear };
    } else if (this.reportPeriod === 'this-year') {
      filter = { type: 'year', year: today.getFullYear() };
    } else if (this.reportPeriod === 'all-time') {
      filter = { type: 'all' };
    }

    const financials = FinanceEngine.computeFinancials(window.dataStore.data, filter);

    document.getElementById('rep-income').textContent = FinanceEngine.formatINR(financials.income);
    document.getElementById('rep-expenses').textContent = FinanceEngine.formatINR(financials.expenses);
    document.getElementById('rep-profit').textContent = FinanceEngine.formatINR(financials.netProfit);

    document.getElementById('rep-shameem').textContent = FinanceEngine.formatINR(financials.distribution.partner1);
    document.getElementById('rep-shiyan').textContent = FinanceEngine.formatINR(financials.distribution.partner2);
    document.getElementById('rep-fund').textContent = FinanceEngine.formatINR(financials.distribution.companyFund);

    // Render bar chart in Reports
    LuciaCharts.renderFinancialBars('reports-chart-canvas', financials);
  },

  renderSettings() {
    const settings = window.dataStore.data.settings;
    const pcts = settings.profitPercentages || { partner1: 33.33, partner2: 33.33, companyFund: 33.34 };
    const p1 = document.getElementById('set-pct-p1');
    const p2 = document.getElementById('set-pct-p2');
    const cf = document.getElementById('set-pct-cf');

    const p1NameInp = document.getElementById('set-partner1-name');
    const p2NameInp = document.getElementById('set-partner2-name');
    const p1Label = document.getElementById('set-pct-p1-label');
    const p2Label = document.getElementById('set-pct-p2-label');

    const p1Name = settings.partner1Name || 'Shameem';
    const p2Name = settings.partner2Name || 'Shiyan';

    if (p1NameInp) p1NameInp.value = p1Name;
    if (p2NameInp) p2NameInp.value = p2Name;
    if (p1Label) p1Label.textContent = `${p1Name} Share (%)`;
    if (p2Label) p2Label.textContent = `${p2Name} Share (%)`;

    if (p1 && p2 && cf) {
      p1.value = pcts.partner1;
      p2.value = pcts.partner2;
      cf.value = pcts.companyFund;
    }
    this.validatePercentages();

    // Security Settings
    const sec = window.dataStore.data.settings?.security || {
      enabled: true,
      pin: '1234',
      email: 'lucia@studio.com',
      password: 'lucia'
    };
    const secEnabled = document.getElementById('set-sec-enabled');
    const secPin = document.getElementById('set-sec-pin');
    const secEmail = document.getElementById('set-sec-email');
    const secPassword = document.getElementById('set-sec-password');
    const secBadge = document.getElementById('settings-security-badge');

    if (secEnabled) secEnabled.checked = !!sec.enabled;
    if (secPin) secPin.value = sec.pin || '1234';
    if (secEmail) secEmail.value = sec.email || 'lucia@studio.com';
    if (secPassword) secPassword.value = sec.password || 'lucia';

    if (secBadge) {
      if (sec.enabled) {
        secBadge.textContent = 'Active 🔒';
        secBadge.style.color = 'var(--gold-primary)';
        secBadge.style.borderColor = 'rgba(212, 175, 55, 0.4)';
      } else {
        secBadge.textContent = 'Disabled';
        secBadge.style.color = 'var(--text-muted)';
        secBadge.style.borderColor = 'var(--border-subtle)';
      }
    }

    // Billing & Invoicing Profile
    const bill = window.dataStore.data.settings?.billing || {};
    const bStudio = document.getElementById('set-bill-studio');
    const bTagline = document.getElementById('set-bill-tagline');
    const bAddress = document.getElementById('set-bill-address');
    const bPhone = document.getElementById('set-bill-phone');
    const bEmail = document.getElementById('set-bill-email');
    const bUpi = document.getElementById('set-bill-upi');
    const bBank = document.getElementById('set-bill-bank');
    const bAcc = document.getElementById('set-bill-acc');
    const bIfsc = document.getElementById('set-bill-ifsc');

    if (bStudio && bill.studioName) bStudio.value = bill.studioName;
    if (bTagline && bill.tagline) bTagline.value = bill.tagline;
    if (bAddress && bill.address) bAddress.value = bill.address;
    if (bPhone && bill.phone) bPhone.value = bill.phone;
    if (bEmail && bill.email) bEmail.value = bill.email;
    if (bUpi && bill.upiId) bUpi.value = bill.upiId;
    if (bBank && bill.bankName) bBank.value = bill.bankName;
    if (bAcc && bill.accountNumber) bAcc.value = bill.accountNumber;
    if (bIfsc && bill.ifsc) bIfsc.value = bill.ifsc;
  },

  validatePercentages() {
    const p1 = parseFloat(document.getElementById('set-pct-p1').value) || 0;
    const p2 = parseFloat(document.getElementById('set-pct-p2').value) || 0;
    const cf = parseFloat(document.getElementById('set-pct-cf').value) || 0;

    const sum = Math.round((p1 + p2 + cf) * 100) / 100;
    const statusBadge = document.getElementById('settings-pct-status');
    const saveBtn = document.getElementById('btn-save-pct');

    if (statusBadge) {
      statusBadge.textContent = `Sum: ${sum}%`;
      const isValid = Math.abs(sum - 100) < 0.05;
      statusBadge.style.color = isValid ? 'var(--accent-income)' : 'var(--accent-expense)';
      statusBadge.style.borderColor = isValid ? 'var(--accent-income)' : 'var(--accent-expense)';
      if (saveBtn) saveBtn.disabled = !isValid;
    }
  },

  savePercentages(e) {
    e.preventDefault();
    const p1Name = document.getElementById('set-partner1-name')?.value?.trim();
    const p2Name = document.getElementById('set-partner2-name')?.value?.trim();
    const p1 = parseFloat(document.getElementById('set-pct-p1').value) || 33.33;
    const p2 = parseFloat(document.getElementById('set-pct-p2').value) || 33.33;
    const cf = parseFloat(document.getElementById('set-pct-cf').value) || 33.34;

    const sum = Math.round((p1 + p2 + cf) * 100) / 100;
    if (Math.abs(sum - 100) >= 0.05) {
      this.showToast('⚠️ Percentages must sum to exactly 100%');
      return;
    }

    window.dataStore.updatePartnersAndSplits(p1Name, p2Name, p1, p2, cf);
    this.showToast('Partner names and profit distribution percentages updated ✓');
  },

  saveSecuritySettings(e) {
    if (e) e.preventDefault();
    const enabled = document.getElementById('set-sec-enabled')?.checked ?? true;
    const pin = (document.getElementById('set-sec-pin')?.value || '').trim();
    const email = (document.getElementById('set-sec-email')?.value || '').trim();
    const password = document.getElementById('set-sec-password')?.value || '';

    if (!/^[0-9]{4}$/.test(pin)) {
      this.showToast('⚠️ PIN must be exactly 4 digits (e.g. 1234).');
      return;
    }

    if (!email || !email.includes('@')) {
      this.showToast('⚠️ Please enter a valid email address.');
      return;
    }

    if (!password) {
      this.showToast('⚠️ Password cannot be empty.');
      return;
    }

    window.dataStore.updateSecuritySettings({
      enabled,
      pin,
      email,
      password
    });

    this.renderSettings();
    this.showToast('Security settings updated ✓');
  },

  saveBillingSettings(e) {
    if (e) e.preventDefault();
    const studioName = (document.getElementById('set-bill-studio')?.value || '').trim();
    const tagline = (document.getElementById('set-bill-tagline')?.value || '').trim();
    const address = (document.getElementById('set-bill-address')?.value || '').trim();
    const phone = (document.getElementById('set-bill-phone')?.value || '').trim();
    const email = (document.getElementById('set-bill-email')?.value || '').trim();
    const upiId = (document.getElementById('set-bill-upi')?.value || '').trim();
    const bankName = (document.getElementById('set-bill-bank')?.value || '').trim();
    const accountNumber = (document.getElementById('set-bill-acc')?.value || '').trim();
    const ifsc = (document.getElementById('set-bill-ifsc')?.value || '').trim();

    window.dataStore.updateBillingSettings({
      studioName,
      tagline,
      address,
      phone,
      email,
      upiId,
      bankName,
      accountNumber,
      ifsc
    });

    this.renderSettings();
    this.showToast('Studio Billing Profile updated ✓');
  },

  pendingDeleteAction: null,

  openConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('modal-confirm-delete');
    const titleEl = document.getElementById('confirm-delete-title');
    const msgEl = document.getElementById('confirm-delete-msg');
    if (titleEl) titleEl.textContent = title || 'Confirm Deletion';
    if (msgEl) msgEl.textContent = message || 'Are you sure you want to permanently delete this item? This action cannot be undone.';
    this.pendingDeleteAction = onConfirm;
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeConfirmModal(event) {
    if (event && event.target && event.target.id !== 'modal-confirm-delete') {
      return;
    }
    const modal = document.getElementById('modal-confirm-delete');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
    this.pendingDeleteAction = null;
  },

  executeConfirmedDelete() {
    const action = this.pendingDeleteAction;
    this.closeConfirmModal();
    if (typeof action === 'function') {
      try {
        action();
      } catch (err) {
        console.error('Error executing delete action:', err);
      }
    }
  },

  confirmDelete(type, id, secondaryId) {
    if (type === 'projects' || type === 'project') {
      const proj = (window.dataStore.data.projects || []).find(p => p.id === id);
      const name = proj ? proj.name : 'this project';
      this.openConfirmModal(
        'Delete Project',
        `Are you sure you want to delete project "${name}"? This will also remove any income, expenses, and linked client bills logged for this project.`,
        () => {
          window.dataStore.deleteProject(id);
          this.closeModalDirect('modal-project-details');
          this.closeModalDirect('modal-project');
          this.showToast(`Project "${name}" deleted successfully ✓`);
          this.renderAll();
        }
      );
    } else if (type === 'invoices' || type === 'invoice') {
      const inv = (window.dataStore.data.invoices || []).find(i => i.id === id);
      const invNum = inv ? inv.invoiceNumber : 'Invoice';
      this.openConfirmModal(
        'Delete Invoice',
        `Are you sure you want to delete invoice "${invNum}"? All balances and client records will update automatically.`,
        () => {
          window.dataStore.deleteInvoice(id);
          this.closeModalDirect('modal-invoice');
          this.closeModalDirect('modal-invoice-preview');
          this.showToast(`Invoice "${invNum}" deleted successfully ✓`);
          this.renderAll();
        }
      );
    } else if (type === 'income') {
      const inc = (window.dataStore.data.income || []).find(i => i.id === id);
      const desc = inc ? ` of ₹${Number(inc.amount || 0).toLocaleString('en-IN')}` : '';
      this.openConfirmModal(
        'Delete Revenue Record',
        `Are you sure you want to delete this revenue record${desc}? All balances will recalculate automatically.`,
        () => {
          window.dataStore.deleteItem('income', id);
          this.closeModalDirect('modal-income');
          this.showToast('Revenue record deleted successfully ✓');
          this.renderAll();
        }
      );
    } else if (type === 'expenses') {
      const exp = (window.dataStore.data.expenses || []).find(e => e.id === id);
      const desc = exp ? ` of ₹${Number(exp.amount || 0).toLocaleString('en-IN')} (${exp.category})` : '';
      this.openConfirmModal(
        'Delete Expense Record',
        `Are you sure you want to delete this expense record${desc}? All balances will recalculate automatically.`,
        () => {
          window.dataStore.deleteItem('expenses', id);
          this.closeModalDirect('modal-expense');
          this.showToast('Expense record deleted successfully ✓');
          this.renderAll();
        }
      );
    } else if (type === 'withdrawals') {
      const wd = (window.dataStore.data.withdrawals || []).find(w => w.id === id);
      const desc = wd ? ` of ₹${Number(wd.amount || 0).toLocaleString('en-IN')}` : '';
      this.openConfirmModal(
        'Delete Partner Withdrawal',
        `Are you sure you want to delete this partner withdrawal${desc}? Balances will recalculate automatically.`,
        () => {
          window.dataStore.deleteItem('withdrawals', id);
          this.closeModalDirect('modal-withdrawal');
          this.showToast('Partner withdrawal deleted ✓');
          this.renderAll();
        }
      );
    } else if (type === 'companyFundLedger') {
      this.openConfirmModal(
        'Delete Fund Record',
        'Are you sure you want to delete this company fund transaction? Reserve balance will recalculate automatically.',
        () => {
          window.dataStore.deleteItem('companyFundLedger', id);
          this.closeModalDirect('modal-fund');
          this.showToast('Fund record deleted ✓');
          this.renderAll();
        }
      );
    } else if (type === 'projectIncome') {
      this.openConfirmModal(
        'Delete Payment',
        'Delete this revenue payment? Project received amount and pending dues will recalculate automatically.',
        () => {
          window.dataStore.deleteItem('income', secondaryId);
          this.showToast('Payment deleted ✓');
          if (id) this.viewProjectDetails(id);
          this.renderAll();
        }
      );
    } else if (type === 'projectExpense') {
      this.openConfirmModal(
        'Delete Expense',
        'Delete this project expense? Project profit and expenses will recalculate automatically.',
        () => {
          window.dataStore.deleteItem('expenses', secondaryId);
          this.showToast('Expense deleted ✓');
          if (id) this.viewProjectDetails(id);
          this.renderAll();
        }
      );
    } else if (type === 'markProjectPaid') {
      const proj = (window.dataStore.data.projects || []).find(p => p.id === id);
      if (!proj) return;
      const pending = Math.max(0, (proj.packageAmount || 0) - (proj.receivedAmount || 0));
      this.openConfirmModal(
        'Mark Project as Fully Paid',
        `Mark "${proj.name}" as fully paid? This will record ₹${pending.toLocaleString('en-IN')} as received revenue.`,
        () => {
          this.executeMarkProjectPaid(id);
        }
      );
    } else if (type === 'clearAll') {
      this.openConfirmModal(
        'Clear All Records',
        'CAUTION: This will delete ALL transactions, projects, withdrawals, and records to start fresh from zero. Are you sure?',
        () => {
          window.dataStore.clearAllData();
          this.showToast('All records cleared successfully ✓');
          this.renderAll();
        }
      );
    } else if (type === 'resetFund') {
      this.openConfirmModal(
        'Reset Company Fund',
        'Are you sure you want to delete/reset the Company Fund Balance to ₹0? This will reset the reserve balance and clear fund purchase history.',
        () => {
          window.dataStore.resetCompanyFund(0);
          this.showToast('Company Fund balance reset to ₹0 ✓');
          this.renderAll();
        }
      );
    } else if (type === 'resetSample') {
      this.openConfirmModal(
        'Reset Sample Data',
        'Reset all transactions and projects to default studio sample data?',
        () => {
          window.dataStore.resetToDefaults();
          this.showToast('Sample data reset successfully ✓');
          this.renderAll();
        }
      );
    } else {
      this.openConfirmModal(
        'Confirm Deletion',
        'Are you sure you want to delete this record? All balances will recalculate automatically.',
        () => {
          window.dataStore.deleteItem(type, id);
          this.showToast('Deleted successfully ✓');
          this.renderAll();
        }
      );
    }
  },

  deleteItem(collection, id) {
    this.confirmDelete(collection, id);
  },

  deleteProject(projectId, projectName) {
    this.confirmDelete('projects', projectId);
  },

  deleteProjectIncome(projectId, incomeId) {
    this.confirmDelete('projectIncome', projectId, incomeId);
  },

  deleteProjectExpense(projectId, expenseId) {
    this.confirmDelete('projectExpense', projectId, expenseId);
  },

  confirmClearAllData() {
    this.confirmDelete('clearAll');
  },

  confirmDeleteFundBalance() {
    this.confirmDelete('resetFund');
  },

  // Modal Direct Delete Handlers
  deleteCurrentEditingIncome() {
    if (this.editingIncomeId) {
      this.confirmDelete('income', this.editingIncomeId);
    }
  },

  deleteCurrentEditingExpense() {
    if (this.editingExpenseId) {
      this.confirmDelete('expenses', this.editingExpenseId);
    }
  },

  deleteCurrentEditingProject() {
    if (this.editingProjectId) {
      this.confirmDelete('projects', this.editingProjectId);
    }
  },

  deleteCurrentEditingWithdrawal() {
    if (this.editingWithdrawalId) {
      this.confirmDelete('withdrawals', this.editingWithdrawalId);
    }
  },

  deleteCurrentEditingFund() {
    if (this.editingFundId) {
      this.confirmDelete('companyFundLedger', this.editingFundId);
    }
  },

  deleteCurrentEditingInvoice() {
    if (this.editingInvoiceId) {
      this.confirmDelete('invoices', this.editingInvoiceId);
    }
  },

  // --- CHARTS RENDER TRIGGER ---
  renderCharts() {
    const today = new Date();
    const filter = this.homePeriod === 'month' 
      ? { type: 'month', monthIndex: today.getMonth(), year: today.getFullYear() }
      : { type: 'all' };

    const financials = FinanceEngine.computeFinancials(window.dataStore.data, filter);
    LuciaCharts.renderFinancialBars('home-chart-canvas', financials);
    LuciaCharts.renderCategoryDonut('expenses-category-canvas', window.dataStore.data.expenses);
    this.renderReports();
  },

  // --- TOAST SYSTEM ---

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="18" height="18" fill="none" stroke="var(--gold-primary)" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  },

  // --- BACKUP & CSV EXPORT ---

  backupJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(window.dataStore.exportJSON());
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `lucia_finance_backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchor.click();
    this.showToast('Backup downloaded ✓');
  },

  restoreJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const success = window.dataStore.importJSON(e.target.result);
      if (success) {
        this.showToast('Backup restored successfully ✓');
      } else {
        this.showToast('⚠️ Invalid backup file format');
      }
    };
    reader.readAsText(file);
  },

  confirmResetSampleData() {
    this.confirmDelete('resetSample');
  },

  exportCSV() {
    const { income = [], expenses = [] } = window.dataStore.data;
    let csv = 'Type,ID,Date,Category/Project,Client,Payment Method,Amount,Notes\n';

    income.forEach(i => {
      csv += `"Revenue","${i.id}","${i.date}","${i.projectName}","${i.clientName || ''}","${i.paymentMethod}","${i.amount}","${(i.notes || '').replace(/"/g, '""')}"\n`;
    });

    expenses.forEach(e => {
      csv += `"Expense","${e.id}","${e.date}","${e.category} (${e.projectName || 'Overhead'})","","${e.paymentMethod}","-${e.amount}","${(e.notes || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lucia_finance_statement_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    this.showToast('Statement exported to CSV ✓');
  },

  // --- NOTIFICATION & REMINDER ENGINE ---

  computeNotifications() {
    const notifications = [];
    const { projects = [], invoices = [], expenses = [] } = window.dataStore.data;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // 1. Work Dates / Shoot Reminders
    projects.forEach(p => {
      const shootDateStr = p.shootDate || p.eventDate || p.date;
      if (shootDateStr) {
        const parts = shootDateStr.split('-');
        if (parts.length === 3) {
          const shootTime = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
          const diffDays = Math.round((shootTime - todayTime) / (1000 * 60 * 60 * 24));

          if (diffDays === 0) {
            notifications.push({
              category: 'work',
              severity: 'urgent',
              iconType: 'work',
              title: `🚨 Shoot Scheduled TODAY: ${p.projectName || p.name || p.clientName}`,
              desc: `Client: ${p.clientName || 'N/A'} • Package: ${FinanceEngine.formatINR(p.packageAmount || 0)}`,
              meta: `Date: Today (${shootDateStr})`,
              tag: 'TODAY',
              tagClass: 'today',
              actionType: 'project',
              actionId: p.id
            });
          } else if (diffDays === 1) {
            notifications.push({
              category: 'work',
              severity: 'warning',
              iconType: 'work',
              title: `📅 Shoot TOMORROW: ${p.projectName || p.name || p.clientName}`,
              desc: `Client: ${p.clientName || 'N/A'} • Package: ${FinanceEngine.formatINR(p.packageAmount || 0)}`,
              meta: `Date: Tomorrow (${shootDateStr})`,
              tag: 'TOMORROW',
              tagClass: 'upcoming',
              actionType: 'project',
              actionId: p.id
            });
          } else if (diffDays > 1 && diffDays <= 14) {
            notifications.push({
              category: 'work',
              severity: 'info',
              iconType: 'work',
              title: `📅 Upcoming Shoot in ${diffDays} Days: ${p.projectName || p.name || p.clientName}`,
              desc: `Scheduled on ${shootDateStr}. Client: ${p.clientName || 'N/A'}`,
              meta: `Shoot Date: ${shootDateStr}`,
              tag: `In ${diffDays}d`,
              tagClass: 'upcoming',
              actionType: 'project',
              actionId: p.id
            });
          }
        }
      }

      if (p.status === 'Ongoing') {
        notifications.push({
          category: 'work',
          severity: 'info',
          iconType: 'work',
          title: `🎬 Project In Progress: ${p.projectName || p.name || p.clientName}`,
          desc: `Ongoing status • Package: ${FinanceEngine.formatINR(p.packageAmount || 0)}`,
          meta: `Status: Ongoing`,
          tag: 'ONGOING',
          tagClass: 'upcoming',
          actionType: 'project',
          actionId: p.id
        });
      }
    });

    // 2. Pending Dues Reminders
    (income || []).forEach(inc => {
      const tot = (inc.totalAmount !== undefined && inc.totalAmount !== null && inc.totalAmount > 0)
        ? Number(inc.totalAmount)
        : Number(inc.amount);
      const rcv = Number(inc.amount) || 0;
      const due = (inc.balanceDue !== undefined && inc.balanceDue !== null)
        ? Number(inc.balanceDue)
        : Math.max(0, tot - rcv);

      if (due > 0) {
        notifications.push({
          category: 'due',
          severity: 'urgent',
          iconType: 'due',
          title: `⚠️ Pending Bill: ${inc.clientName || 'Client'}`,
          desc: `${inc.projectName || 'Studio Shoot'} has an outstanding balance of ${FinanceEngine.formatINR(due)}.`,
          meta: `Date: ${inc.date} • Total: ${FinanceEngine.formatINR(tot)}`,
          tag: `${FinanceEngine.formatINR(due)} Due`,
          tagClass: 'due',
          actionType: 'whatsapp-revenue',
          actionId: inc.id,
          phone: inc.clientPhone
        });
      }
    });

    invoices.forEach(inv => {
      const due = Number(inv.balanceDue) || 0;
      if (due > 0 && inv.status !== 'Paid') {
        notifications.push({
          category: 'due',
          severity: 'urgent',
          iconType: 'due',
          title: `⚠️ Pending Bill: ${inv.clientName}`,
          desc: `Invoice #${inv.invoiceNumber} has an outstanding balance of ${FinanceEngine.formatINR(due)}.`,
          meta: `Due Date: ${inv.dueDate || 'Immediate'} • Total: ${FinanceEngine.formatINR(inv.totalAmount)}`,
          tag: `${FinanceEngine.formatINR(due)} Due`,
          tagClass: 'due',
          actionType: 'whatsapp-invoice',
          actionId: inv.id,
          phone: inv.clientPhone
        });
      }
    });

    projects.forEach(p => {
      const pkg = Number(p.packageAmount) || 0;
      const rcv = Number(p.receivedAmount || p.amountReceived) || 0;
      const pending = pkg - rcv;
      if (pending > 0 && p.status !== 'Completed') {
        notifications.push({
          category: 'due',
          severity: 'warning',
          iconType: 'due',
          title: `⚠️ Project Balance Due: ${p.projectName || p.name || p.clientName}`,
          desc: `${p.clientName || 'Client'} has ${FinanceEngine.formatINR(pending)} unpaid on package of ${FinanceEngine.formatINR(pkg)}.`,
          meta: `Pending: ${FinanceEngine.formatINR(pending)} • Received: ${FinanceEngine.formatINR(rcv)}`,
          tag: `${FinanceEngine.formatINR(pending)} Due`,
          tagClass: 'due',
          actionType: 'whatsapp-project',
          actionId: p.id,
          phone: p.clientPhone
        });
      }
    });

    // 3. Expenses Overview & Recent Entries
    const currentMonthExpenses = expenses.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlyTotal = currentMonthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    if (currentMonthExpenses.length > 0) {
      notifications.push({
        category: 'expense',
        severity: 'info',
        iconType: 'exp',
        title: `💸 Monthly Studio Expenses`,
        desc: `Total ${FinanceEngine.formatINR(monthlyTotal)} recorded across ${currentMonthExpenses.length} entries this month.`,
        meta: `Period: Current Month`,
        tag: FinanceEngine.formatINR(monthlyTotal),
        tagClass: 'upcoming',
        actionType: 'navigate-expenses'
      });
    }

    // Add recent 3 expense records
    if (expenses.length > 0) {
      expenses.slice(0, 3).forEach(e => {
        notifications.push({
          category: 'expense',
          severity: 'info',
          iconType: 'exp',
          title: `Expense: ${e.category} (${FinanceEngine.formatINR(e.amount)})`,
          desc: `${e.date} • ${e.notes || 'Recorded studio expense'}`,
          meta: `Category: ${e.category} • Method: ${e.paymentMethod || 'Cash'}`,
          tag: `₹${FinanceEngine.formatINR(e.amount)}`,
          tagClass: 'due',
          actionType: 'navigate-expenses'
        });
      });
    }

    return notifications;
  },

  updateNotificationBadge() {
    const notifs = this.computeNotifications();
    const count = notifs.length;
    const badge = document.getElementById('header-notif-badge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

    // Also update modal counts if modal is present
    const cAll = document.getElementById('notif-count-all');
    const cWork = document.getElementById('notif-count-work');
    const cDue = document.getElementById('notif-count-due');
    const cExp = document.getElementById('notif-count-exp');

    if (cAll) cAll.textContent = count;
    if (cWork) cWork.textContent = notifs.filter(n => n.category === 'work').length;
    if (cDue) cDue.textContent = notifs.filter(n => n.category === 'due').length;
    if (cExp) cExp.textContent = notifs.filter(n => n.category === 'expense').length;
  },

  openNotificationsModal() {
    this.updateNotificationBadge();
    this.renderNotificationsList();
    this.openModal('modal-notifications');
  },

  filterNotifications(cat) {
    this.selectedNotifCategory = cat;
    document.querySelectorAll('#notif-category-filter .billing-tab-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-cat') === cat);
    });
    this.renderNotificationsList();
  },

  renderNotificationsList() {
    const container = document.getElementById('notifications-list-container');
    if (!container) return;

    let notifs = this.computeNotifications();
    if (this.selectedNotifCategory && this.selectedNotifCategory !== 'all') {
      notifs = notifs.filter(n => n.category === this.selectedNotifCategory);
    }

    if (notifs.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding: 24px 10px;">✨ All clear! No pending notifications or alerts in this category.</div>';
      return;
    }

    container.innerHTML = notifs.map(n => {
      let actionBtnHtml = '';
      if (n.actionType === 'whatsapp-revenue') {
        actionBtnHtml = `
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
            <button class="btn-whatsapp" style="padding: 6px 12px; font-size: 11px;" onclick="App.shareRevenueWhatsApp('${n.actionId}')">
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.045.073.045.42-.099.825z"/></svg>
              Send WhatsApp Reminder
            </button>
            <button class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 11px;" onclick="App.closeModalDirect('modal-notifications'); App.openEditIncomeModal('${n.actionId}')">
              Edit Bill
            </button>
          </div>
        `;
      } else if (n.actionType === 'whatsapp-invoice') {
        actionBtnHtml = `
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
            <button class="btn-whatsapp" style="padding: 6px 12px; font-size: 11px;" onclick="App.shareInvoiceWhatsApp('${n.actionId}')">
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.045.073.045.42-.099.825z"/></svg>
              Send WhatsApp Reminder
            </button>
            <button class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 11px;" onclick="App.closeModalDirect('modal-notifications'); App.openEditInvoiceModal('${n.actionId}')">
              Edit Invoice
            </button>
          </div>
        `;
      } else if (n.actionType === 'whatsapp-project') {
        actionBtnHtml = `
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
            <button class="btn-whatsapp" style="padding: 6px 12px; font-size: 11px;" onclick="App.sendProjectWhatsAppReminder('${n.actionId}')">
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.045.073.045.42-.099.825z"/></svg>
              Send WhatsApp Reminder
            </button>
            <button class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 11px;" onclick="App.closeModalDirect('modal-notifications'); App.openEditProjectModal('${n.actionId}')">
              Edit Project
            </button>
          </div>
        `;
      } else if (n.actionType === 'project') {
        actionBtnHtml = `
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px;">
            <button class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 11px;" onclick="App.closeModalDirect('modal-notifications'); App.viewProjectDetails('${n.actionId}')">
              View Project
            </button>
            <button class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 11px;" onclick="App.closeModalDirect('modal-notifications'); App.openEditProjectModal('${n.actionId}')">
              Edit Shoot
            </button>
          </div>
        `;
      } else if (n.actionType === 'navigate-expenses') {
        actionBtnHtml = `
          <button class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 11px; margin-top: 6px;" onclick="App.closeModalDirect('modal-notifications'); App.navigateTo('expenses')">
            Open Expenses
          </button>
        `;
      }

      return `
        <div class="notif-card ${n.severity}">
          <div class="notif-icon-box notif-icon-${n.iconType}">
            ${n.iconType === 'work' ? '📅' : (n.iconType === 'due' ? '⚠️' : '💸')}
          </div>
          <div class="notif-card-body">
            <div class="notif-card-title">
              <span>${n.title}</span>
              <span class="notif-badge-tag ${n.tagClass}">${n.tag}</span>
            </div>
            <div class="notif-card-desc">${n.desc}</div>
            <div class="notif-card-meta">
              <span>${n.meta}</span>
            </div>
            ${actionBtnHtml}
          </div>
        </div>
      `;
    }).join('');
  },

  sendProjectWhatsAppReminder(projectId) {
    const proj = (window.dataStore.data.projects || []).find(p => p.id === projectId);
    if (!proj) return;
    const pending = (Number(proj.packageAmount) || 0) - (Number(proj.amountReceived) || 0);
    const billing = window.dataStore.data.settings?.billing || { studioName: 'LUCIA PHOTOGRAPHY & VIDEOGRAPHY' };
    const text = `*${billing.studioName}* 📸✨\n` +
      `Hello ${proj.clientName},\n` +
      `This is a gentle payment reminder regarding *${proj.projectName || proj.name}*.\n` +
      `Total Package: ${FinanceEngine.formatINR(proj.packageAmount)}\n` +
      `Amount Received: ${FinanceEngine.formatINR(proj.amountReceived)}\n` +
      `*Outstanding Balance: ${FinanceEngine.formatINR(pending)}*\n` +
      `Kindly settle at your earliest convenience. Thank you!`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.showToast('Reminder copied! Opening WhatsApp...');
    }

    let cleanPhone = (proj.clientPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  }
};

// Start application on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
