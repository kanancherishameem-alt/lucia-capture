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
        (tabView === 'finance' && (viewName === 'income' || viewName === 'expenses' || viewName === 'company-fund')) ||
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
    const title = document.getElementById('fund-modal-title');
    const typeInput = document.getElementById('fund-tx-type');
    if (title && typeInput) {
      typeInput.value = type;
      title.textContent = type === 'addition' ? '+ Add Company Fund' : '− Use Company Fund (Gear / Asset)';
    }
    this.openModal('modal-fund');
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

    let options = '<option value="">-- Direct Studio Income (No Project) --</option>';
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
    let projectName = 'Direct Studio Income';
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
      alert('Please enter a valid income amount');
      return;
    }

    window.dataStore.addIncome({
      projectId,
      projectName,
      clientName,
      amount,
      date,
      paymentMethod,
      notes
    });

    // Reset and close
    e.target.reset();
    document.getElementById('inc-date').value = new Date().toISOString().split('T')[0];
    this.closeModalDirect('modal-income');

    // Prompt requested exact toast:
    this.showToast('Income added successfully ✓');
  },

  handleSaveExpense(e) {
    e.preventDefault();
    const amount = FinanceEngine.parseINR(document.getElementById('exp-amount').value);
    const category = document.getElementById('exp-category').value;
    const projectId = document.getElementById('exp-project').value || null;
    const date = document.getElementById('exp-date').value;
    const paymentMethod = document.getElementById('exp-method').value || 'UPI';
    const notes = document.getElementById('exp-notes').value;

    if (!amount || amount <= 0) {
      alert('Please enter a valid expense amount');
      return;
    }

    window.dataStore.addExpense({
      projectId,
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

    if (confirm(`Mark "${proj.name}" as fully paid? This will record ₹${pending.toLocaleString('en-IN')} as received income.`)) {
      window.dataStore.markProjectPaid(projectId, 'UPI');
      this.showToast(`Income added successfully ✓ (₹${pending.toLocaleString('en-IN')})`);
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
        <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 10px; color: var(--text-white);">Income Received (${projectIncomes.length})</h4>
        <div class="transaction-list">
          ${projectIncomes.length === 0 ? '<div style="font-size: 12px; color: var(--text-muted);">No income logged yet</div>' : 
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
                  <button class="delete-btn" onclick="App.deleteProjectExpense('${proj.id}', '${e.id}')" title="Delete expense">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            `).join('')}
        </div>
      </div>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-subtle);">
        <button class="btn btn-outline" style="width: 100%; color: #ef4444; border-color: rgba(239, 68, 68, 0.35); font-size: 13px;" onclick="App.deleteProject('${proj.id}', '${proj.name}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          Delete This Entire Project
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
      const title = isInc ? (tx.projectName || tx.clientName || 'Studio Income') : (tx.category + (tx.projectName ? ` (${tx.projectName})` : ''));
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
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="tx-amount ${colorClass}">${sign}${FinanceEngine.formatINR(tx.amount)}</div>
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
              ${pending > 0 ? `
                <button class="btn btn-gold btn-sm" onclick="App.quickMarkPaid('${proj.id}')">
                  Mark as Paid
                </button>
              ` : `
                <span style="font-size: 11px; font-weight: 700; color: var(--accent-income);">Fully Settled ✓</span>
              `}
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

  renderIncome() {
    const listContainer = document.getElementById('income-list-container');
    const totalEl = document.getElementById('income-page-total');
    if (!listContainer) return;

    const income = window.dataStore.data.income || [];
    const total = income.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    if (totalEl) totalEl.textContent = FinanceEngine.formatINR(total);

    if (income.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">No income logged yet.</div>';
      return;
    }

    listContainer.innerHTML = income.map(i => `
      <div class="transaction-item">
        <div class="transaction-left">
          <div class="tx-icon income">+</div>
          <div>
            <div class="tx-title">${i.projectName || 'Studio Direct Collection'}</div>
            <div class="tx-meta">
              <span>${i.date}</span>
              <span class="method-tag">${i.paymentMethod}</span>
              ${i.clientName ? `<span>• ${i.clientName}</span>` : ''}
              ${i.notes ? `<span>• ${i.notes}</span>` : ''}
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="tx-amount income">+${FinanceEngine.formatINR(i.amount)}</div>
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
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="tx-amount expense">−${FinanceEngine.formatINR(e.amount)}</div>
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
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="tx-amount" style="color: #f87171;">−${FinanceEngine.formatINR(w.amount)}</div>
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
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="tx-amount" style="color: ${color};">${sign}${FinanceEngine.formatINR(entry.amount)}</div>
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

  deleteItem(collection, id) {
    let itemLabel = 'activity';
    if (collection === 'income') itemLabel = 'income record';
    else if (collection === 'expenses') itemLabel = 'expense record';
    else if (collection === 'withdrawals') itemLabel = 'partner withdrawal';
    else if (collection === 'companyFundLedger') itemLabel = 'company fund record';
    else if (collection === 'projects') itemLabel = 'project';

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
    if (confirm('Delete this income payment? Project received amount and pending dues will recalculate.')) {
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
      csv += `"Income","${i.id}","${i.date}","${i.projectName}","${i.clientName || ''}","${i.paymentMethod}","${i.amount}","${(i.notes || '').replace(/"/g, '""')}"\n`;
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
