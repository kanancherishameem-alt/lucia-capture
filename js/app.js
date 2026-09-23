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
  enteredPin: '',
  authMode: 'pin',

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

  navigateTo(viewName) {
    this.currentView = viewName;

    // Update desktop nav buttons
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });

    // Update mobile bottom nav
    document.querySelectorAll('.bottom-tab').forEach(tab => {
      const tabView = tab.getAttribute('data-view');
      const isActive = tabView === viewName || 
        (tabView === 'finance' && (viewName === 'income' || viewName === 'expenses' || viewName === 'company-fund' || viewName === 'invoices')) ||
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
        const dateEl = document.getElementById('inc-date');
        if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
        const titleEl = document.getElementById('modal-income-title');
        if (titleEl) titleEl.textContent = 'Add Revenue';
        const btnEl = document.getElementById('btn-save-income');
        if (btnEl) btnEl.textContent = 'Save Revenue';
        this.selectPaymentMethod('inc', 'UPI');
      } else if (modalId === 'modal-expense' && !this.editingExpenseId) {
        document.getElementById('form-expense')?.reset();
        const dateEl = document.getElementById('exp-date');
        if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
        const titleEl = document.getElementById('modal-expense-title');
        if (titleEl) titleEl.textContent = 'Add Expense';
        const btnEl = document.getElementById('btn-save-expense');
        if (btnEl) btnEl.textContent = 'Save Expense';
        this.selectPaymentMethod('exp', 'UPI');
      } else if (modalId === 'modal-project' && !this.editingProjectId) {
        document.getElementById('form-project')?.reset();
        const dateEl = document.getElementById('proj-date');
        if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
        const titleEl = document.getElementById('modal-project-title');
        if (titleEl) titleEl.textContent = 'Add Project';
        const btnEl = document.getElementById('btn-save-project');
        if (btnEl) btnEl.textContent = 'Save Project';
      } else if (modalId === 'modal-withdrawal' && !this.editingWithdrawalId) {
        document.getElementById('form-withdrawal')?.reset();
        const dateEl = document.getElementById('wd-date');
        if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
        const titleEl = document.getElementById('modal-withdrawal-title');
        if (titleEl) titleEl.textContent = 'Record Partner Withdrawal';
        const btnEl = document.getElementById('btn-save-withdrawal');
        if (btnEl) btnEl.textContent = 'Save Withdrawal';
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
    if (select && partnerId) select.value = partnerId;
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
    document.getElementById('form-fund')?.reset();
    const dateEl = document.getElementById('fund-date');
    if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
    this.openModal('modal-fund');
  },

  openEditIncomeModal(id) {
    const inc = (window.dataStore.data.income || []).find(i => i.id === id);
    if (!inc) return;

    this.editingIncomeId = id;
    this.populateIncomeProjectDropdown();

    const projSel = document.getElementById('inc-project');
    if (projSel) projSel.value = inc.projectId || '';

    const amtInp = document.getElementById('inc-amount');
    if (amtInp) amtInp.value = inc.amount;

    const dateInp = document.getElementById('inc-date');
    if (dateInp) dateInp.value = inc.date || new Date().toISOString().split('T')[0];

    const notesInp = document.getElementById('inc-notes');
    if (notesInp) notesInp.value = inc.notes || '';

    this.selectPaymentMethod('inc', inc.paymentMethod || 'UPI');

    const titleEl = document.getElementById('modal-income-title');
    if (titleEl) titleEl.textContent = 'Edit Revenue Record';

    const btnEl = document.getElementById('btn-save-income');
    if (btnEl) btnEl.textContent = 'Update Revenue';

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

  populateIncomeProjectDropdown() {
    const select = document.getElementById('inc-project');
    if (!select) return;
    const projects = window.dataStore.data.projects || [];

    let options = '<option value="">-- Direct Studio Revenue (No Project) --</option>';
    projects.forEach(p => {
      const pending = Math.max(0, p.packageAmount - p.receivedAmount);
      const pendingTxt = pending > 0 ? ` (Pending: ₹${pending.toLocaleString('en-IN')})` : ' (Fully Paid)';
      options += `<option value="${p.id}">${p.name} - ${p.clientName}${pendingTxt}</option>`;
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
    // optional helper
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

  handleSaveIncome(e) {
    e.preventDefault();
    const projSelect = document.getElementById('inc-project');
    const projectId = projSelect.value;
    let projectName = 'Direct Studio Revenue';
    let clientName = '';

    if (projectId) {
      const proj = window.dataStore.data.projects.find(p => p.id === projectId);
      if (proj) {
        projectName = proj.name;
        clientName = proj.clientName;
      }
    }

    const amount = FinanceEngine.parseINR(document.getElementById('inc-amount').value);
    const date = document.getElementById('inc-date').value;
    const paymentMethod = document.getElementById('inc-method').value || 'UPI';
    const notes = document.getElementById('inc-notes').value;

    if (!amount || amount <= 0) {
      alert('Please enter a valid revenue amount');
      return;
    }

    if (this.editingIncomeId) {
      window.dataStore.updateIncome(this.editingIncomeId, {
        projectId: projectId || null,
        projectName,
        clientName,
        amount,
        date,
        paymentMethod,
        notes
      });
      this.editingIncomeId = null;
      e.target.reset();
      this.closeModalDirect('modal-income');
      this.showToast('Revenue record updated ✓');
      if (projectId && document.getElementById('modal-project-details')?.classList.contains('open')) {
        this.viewProjectDetails(projectId);
      }
    } else {
      window.dataStore.addIncome({
        projectId,
        projectName,
        clientName,
        amount,
        date,
        paymentMethod,
        notes
      });
      e.target.reset();
      document.getElementById('inc-date').value = new Date().toISOString().split('T')[0];
      this.closeModalDirect('modal-income');
      this.showToast('Revenue added successfully ✓');
    }
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
      alert('Please enter a valid expense amount');
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
      alert('Please provide project name and package amount');
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
      alert('Please select a project');
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
      alert('Please enter a valid amount');
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
      alert('Please enter a valid amount');
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

    if (confirm(`Mark "${proj.name}" as fully paid? This will record ₹${pending.toLocaleString('en-IN')} as received revenue.`)) {
      window.dataStore.markProjectPaid(projectId, 'UPI');
      this.showToast(`Revenue added successfully ✓ (₹${pending.toLocaleString('en-IN')})`);
    }
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
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div class="tx-amount income">+${FinanceEngine.formatINR(i.amount)}</div>
                  <button class="edit-btn" onclick="App.editProjectIncome('${proj.id}', '${i.id}')" title="Edit payment">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="delete-btn" onclick="App.deleteProjectIncome('${proj.id}', '${i.id}')" title="Delete payment">
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
                  <button class="delete-btn" onclick="App.deleteProjectExpense('${proj.id}', '${e.id}')" title="Delete expense">
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
        <button class="btn btn-outline" style="flex: 1; color: #ef4444; border-color: rgba(239, 68, 68, 0.35); font-size: 13px;" onclick="App.deleteProject('${proj.id}', '${proj.name}')">
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
    this.renderIncome();
    this.renderExpenses();
    this.renderPartners();
    this.renderCompanyFund();
    this.renderReports();
    this.renderSettings();
  },

  renderHome() {
    const today = new Date();
    const filter = this.homePeriod === 'month' 
      ? { type: 'month', monthIndex: today.getMonth(), year: today.getFullYear() }
      : { type: 'all' };

    const financials = FinanceEngine.computeFinancials(window.dataStore.data, filter);

    // Update Top 4 Metric Cards
    document.getElementById('home-stat-income').textContent = FinanceEngine.formatINR(financials.income);
    document.getElementById('home-stat-expenses').textContent = FinanceEngine.formatINR(financials.expenses);
    document.getElementById('home-stat-salaries').textContent = FinanceEngine.formatINR(financials.salaries);
    document.getElementById('home-stat-netprofit').textContent = FinanceEngine.formatINR(financials.netProfit);

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

    // Render Recent Transactions
    this.renderRecentTransactions();

    // Render Home Chart
    LuciaCharts.renderFinancialBars('home-chart-canvas', financials);
  },

  renderRecentTransactions() {
    const container = document.getElementById('home-recent-transactions');
    if (!container) return;

    const { income = [], expenses = [] } = window.dataStore.data;
    
    // Combine into unified feed
    const combined = [
      ...income.map(i => ({ ...i, txType: 'income' })),
      ...expenses.map(e => ({ ...e, txType: 'expense' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

    if (combined.length === 0) {
      container.innerHTML = '<div class="empty-state">No transactions recorded yet. Tap + to add.</div>';
      return;
    }

    container.innerHTML = combined.map(tx => {
      const isInc = tx.txType === 'income';
      const title = isInc ? (tx.projectName || tx.clientName || 'Studio Revenue') : (tx.category + (tx.projectName ? ` (${tx.projectName})` : ''));
      const sign = isInc ? '+' : '−';
      const colorClass = isInc ? 'income' : 'expense';
      const collection = isInc ? 'income' : 'expenses';

      return `
        <div class="transaction-item">
          <div class="transaction-left">
            <div class="tx-icon ${colorClass}">${sign}</div>
            <div>
              <div class="tx-title">${title}</div>
              <div class="tx-meta">
                <span>${tx.date}</span>
                <span class="method-tag">${tx.paymentMethod}</span>
                ${tx.notes ? `<span>• ${tx.notes}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="tx-amount ${colorClass}">${sign}${FinanceEngine.formatINR(tx.amount)}</div>
            <button class="edit-btn" onclick="App.editItem('${collection}', '${tx.id}')" title="Edit this transaction">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="delete-btn" onclick="App.deleteItem('${collection}', '${tx.id}')" title="Delete this activity">
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
              <span class="status-badge ${statusClass}">${proj.status}</span>
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
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn btn-outline btn-sm" onclick="App.handleProjectInvoiceClick('${proj.id}')" title="Generate or View Client Bill">
                📄 Bill
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
              <button class="delete-btn" onclick="App.deleteProject('${proj.id}', '${proj.name}')" title="Delete Project">
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

  renderInvoices() {
    const listContainer = document.getElementById('invoices-list-container');
    if (!listContainer) return;

    const invoices = window.dataStore.data.invoices || [];
    const summary = FinanceEngine.computeInvoiceSummary(invoices);

    // Update KPI stat cards
    const totalEl = document.getElementById('inv-stat-total');
    const paidEl = document.getElementById('inv-stat-paid');
    const dueEl = document.getElementById('inv-stat-due');
    const countEl = document.getElementById('inv-stat-count');

    if (totalEl) totalEl.textContent = FinanceEngine.formatINR(summary.totalInvoiced);
    if (paidEl) paidEl.textContent = FinanceEngine.formatINR(summary.totalReceived);
    if (dueEl) dueEl.textContent = FinanceEngine.formatINR(summary.totalOutstanding);
    if (countEl) countEl.textContent = `${summary.totalCount} Invoices (${summary.countPaid} Paid, ${summary.countPending + summary.countPartial} Due)`;

    // Filter invoices
    let filtered = invoices;
    if (this.selectedInvoiceFilter === 'paid') {
      filtered = invoices.filter(inv => inv.status === 'Paid' || (Number(inv.balanceDue) || 0) <= 0);
    } else if (this.selectedInvoiceFilter === 'pending') {
      filtered = invoices.filter(inv => inv.status !== 'Paid' && (Number(inv.balanceDue) || 0) > 0);
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">No invoices found. Tap "+ Create Invoice" above to generate a client bill.</div>';
      return;
    }

    listContainer.innerHTML = filtered.map(inv => {
      const isPaid = inv.status === 'Paid' || (Number(inv.balanceDue) || 0) <= 0;
      const isPartial = inv.status === 'Partial';
      const badgeClass = isPaid ? 'badge-paid' : (isPartial ? 'badge-partial' : 'badge-pending');
      const badgeText = isPaid ? 'Fully Paid' : (isPartial ? 'Partially Paid' : 'Payment Due');

      return `
        <div class="invoice-card">
          <div class="invoice-header-row">
            <div class="invoice-num-group">
              <span class="invoice-number-tag">${inv.invoiceNumber}</span>
              <span class="${badgeClass}">${badgeText}</span>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary);">
              Due: <strong style="color: ${isPaid ? 'var(--accent-income)' : '#fbbf24'};">${inv.dueDate}</strong>
            </div>
          </div>

          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: var(--text-white); margin-bottom: 2px;">
              ${inv.clientName}
            </h3>
            <div style="font-size: 12px; color: var(--text-secondary);">
              ${inv.projectName ? `<span>Project: <strong>${inv.projectName}</strong></span> • ` : ''}
              ${inv.clientPhone ? `<span>${inv.clientPhone}</span> • ` : ''}
              <span>Issued: ${inv.issueDate}</span>
            </div>
          </div>

          <div class="invoice-meta-grid">
            <div class="invoice-meta-item">
              <div class="label">Total Amount</div>
              <div class="val">${FinanceEngine.formatINR(inv.totalAmount)}</div>
            </div>
            <div class="invoice-meta-item">
              <div class="label">Amount Paid</div>
              <div class="val" style="color: var(--accent-income);">${FinanceEngine.formatINR(inv.paidAmount)}</div>
            </div>
            <div class="invoice-meta-item">
              <div class="label">Balance Due</div>
              <div class="val" style="color: ${isPaid ? 'var(--text-muted)' : '#fbbf24'};">${FinanceEngine.formatINR(inv.balanceDue)}</div>
            </div>
          </div>

          <div class="invoice-actions-row">
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn btn-gold btn-sm" onclick="App.openInvoicePreview('${inv.id}')">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                View / Print Bill
              </button>
              ${!isPaid ? `
                <button class="btn btn-outline btn-sm" onclick="App.openRecordInvoicePaymentModal('${inv.id}')" style="color: #34D399; border-color: rgba(52, 211, 153, 0.4);">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Record Payment
                </button>
              ` : ''}
            </div>

            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn btn-outline btn-sm" onclick="App.openEditInvoiceModal('${inv.id}')" title="Edit Invoice">
                Edit
              </button>
              <button class="delete-btn" onclick="App.deleteInvoice('${inv.id}', '${inv.invoiceNumber}')" title="Delete Invoice">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  filterInvoices(status) {
    this.selectedInvoiceFilter = status;
    document.querySelectorAll('#invoice-status-filter .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-status') === status);
    });
    this.renderInvoices();
  },

  openCreateInvoiceFromHub() {
    this.closeModalDirect('modal-quick-hub');
    this.openCreateInvoiceModal();
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
      alert('Please add at least one service item to the invoice.');
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
          <div><strong>UPI ID:</strong> <span style="font-family: var(--font-mono); color: #0E52B8; font-weight: 700;">${billing.upiId}</span></div>
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
          <div style="font-weight: 700; color: #000926;">${billing.studioName}</div>
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

    const cleanPhone = (inv.clientPhone || '').replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone.length >= 10 ? cleanPhone : '';
    const url = `https://wa.me/${phoneParam}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
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
      alert('Please enter a valid payment amount.');
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
      alert('Failed to record payment on invoice.');
    }
  },

  deleteInvoice(invoiceId, invoiceNumber) {
    if (confirm(`Are you sure you want to delete invoice "${invoiceNumber}"?`)) {
      window.dataStore.deleteInvoice(invoiceId);
      this.showToast(`Invoice "${invoiceNumber}" deleted ✓`);
      this.renderInvoices();
    }
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
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="tx-amount income">+${FinanceEngine.formatINR(i.amount)}</div>
          <button class="edit-btn" onclick="App.openEditIncomeModal('${i.id}')" title="Edit Revenue">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="delete-btn" onclick="App.deleteItem('income', '${i.id}')" title="Delete">
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
          <button class="delete-btn" onclick="App.deleteItem('expenses', '${e.id}')" title="Delete">
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

    // Shameem
    document.getElementById('partner1-title-name').textContent = store.settings.partner1Name.toUpperCase();
    document.getElementById('p1-available').textContent = FinanceEngine.formatINR(financials.partner1.available);
    document.getElementById('p1-salary').textContent = FinanceEngine.formatINR(financials.partner1.salary);
    document.getElementById('p1-profit').textContent = FinanceEngine.formatINR(financials.partner1.profitShare);
    document.getElementById('p1-withdrawn').textContent = FinanceEngine.formatINR(financials.partner1.withdrawn);

    // Shiyan
    document.getElementById('partner2-title-name').textContent = store.settings.partner2Name.toUpperCase();
    document.getElementById('p2-available').textContent = FinanceEngine.formatINR(financials.partner2.available);
    document.getElementById('p2-salary').textContent = FinanceEngine.formatINR(financials.partner2.salary);
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
          <button class="delete-btn" onclick="App.deleteItem('withdrawals', '${w.id}')" title="Delete withdrawal">
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
            <button class="delete-btn" onclick="App.deleteItem('companyFundLedger', '${entry.id}')" title="Delete fund entry">
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
    document.getElementById('rep-salaries').textContent = FinanceEngine.formatINR(financials.salaries);
    document.getElementById('rep-profit').textContent = FinanceEngine.formatINR(financials.netProfit);

    document.getElementById('rep-shameem').textContent = FinanceEngine.formatINR(financials.distribution.partner1);
    document.getElementById('rep-shiyan').textContent = FinanceEngine.formatINR(financials.distribution.partner2);
    document.getElementById('rep-fund').textContent = FinanceEngine.formatINR(financials.distribution.companyFund);

    // Render bar chart in Reports
    LuciaCharts.renderFinancialBars('reports-chart-canvas', financials);
  },

  renderSettings() {
    const pcts = window.dataStore.data.settings.profitPercentages;
    const p1 = document.getElementById('set-pct-p1');
    const p2 = document.getElementById('set-pct-p2');
    const cf = document.getElementById('set-pct-cf');

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
    const p1 = parseFloat(document.getElementById('set-pct-p1').value) || 33.33;
    const p2 = parseFloat(document.getElementById('set-pct-p2').value) || 33.33;
    const cf = parseFloat(document.getElementById('set-pct-cf').value) || 33.34;

    window.dataStore.updateSettings({
      profitPercentages: {
        partner1: p1,
        partner2: p2,
        companyFund: cf
      }
    });

    this.showToast('Profit distribution percentages updated ✓');
  },

  saveSecuritySettings(e) {
    if (e) e.preventDefault();
    const enabled = document.getElementById('set-sec-enabled')?.checked ?? true;
    const pin = (document.getElementById('set-sec-pin')?.value || '').trim();
    const email = (document.getElementById('set-sec-email')?.value || '').trim();
    const password = document.getElementById('set-sec-password')?.value || '';

    if (!/^[0-9]{4}$/.test(pin)) {
      alert('PIN must be exactly 4 digits (e.g. 1234).');
      return;
    }

    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    if (!password) {
      alert('Password cannot be empty.');
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

  deleteItem(collection, id) {
    let itemLabel = 'activity';
    if (collection === 'income') itemLabel = 'revenue record';
    else if (collection === 'expenses') itemLabel = 'expense record';
    else if (collection === 'withdrawals') itemLabel = 'partner withdrawal';
    else if (collection === 'companyFundLedger') itemLabel = 'company fund record';
    else if (collection === 'projects') itemLabel = 'project';
    else if (collection === 'invoices') itemLabel = 'invoice';

    if (confirm(`Are you sure you want to delete this ${itemLabel}? All balances will recalculate automatically.`)) {
      window.dataStore.deleteItem(collection, id);
      this.showToast('Deleted successfully ✓');
    }
  },

  deleteProject(projectId, projectName) {
    const proj = window.dataStore.data.projects.find(p => p.id === projectId);
    const name = projectName || (proj ? proj.name : 'this project');
    if (confirm(`Are you sure you want to delete project "${name}"? This will also remove any income and expenses specifically logged for this project.`)) {
      window.dataStore.deleteProject(projectId);
      this.closeModalDirect('modal-project-details');
      this.showToast(`Project "${name}" deleted successfully ✓`);
    }
  },

  deleteProjectIncome(projectId, incomeId) {
    if (confirm('Delete this revenue payment? Project received amount and pending dues will recalculate.')) {
      window.dataStore.deleteItem('income', incomeId);
      this.showToast('Payment deleted ✓');
      this.viewProjectDetails(projectId);
    }
  },

  deleteProjectExpense(projectId, expenseId) {
    if (confirm('Delete this project expense?')) {
      window.dataStore.deleteItem('expenses', expenseId);
      this.showToast('Expense deleted ✓');
      this.viewProjectDetails(projectId);
    }
  },

  confirmClearAllData() {
    if (confirm('CAUTION: This will delete ALL transactions, projects, withdrawals and records to start from zero. Are you sure?')) {
      window.dataStore.clearAllData();
      this.showToast('All records cleared successfully ✓');
    }
  },

  confirmDeleteFundBalance() {
    if (confirm('Are you sure you want to delete/reset the Company Fund Balance to ₹0? This will reset the reserve balance and clear fund purchase history.')) {
      window.dataStore.resetCompanyFund(0);
      this.showToast('Company Fund balance reset to ₹0 ✓');
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
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  },

  confirmResetSampleData() {
    if (confirm('Reset all transactions and projects to default sample data?')) {
      window.dataStore.resetToDefaults();
      this.showToast('Sample data reset successfully ✓');
    }
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
  }
};

// Start application on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
