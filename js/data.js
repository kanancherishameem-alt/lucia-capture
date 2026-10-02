/**
 * LUCIA FINANCE - Initial Sample Data Store
 * Pre-populated with realistic photography and videography studio transactions.
 * Matches all numbers from the prompt specification.
 */

const STORAGE_KEY = 'lucia_finance_store_v1';

function getISODate(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function getDefaultData() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${currentYear}-${currentMonth}`;

  return {
    settings: {
      appName: 'LUCIA FINANCE',
      currency: '₹',
      partner1Name: 'Shameem',
      partner2Name: 'Shiyan',
      companyFundName: 'Company Fund',
      profitPercentages: {
        partner1: 33.33,
        partner2: 33.33,
        companyFund: 33.34
      },
      initialCompanyFundBalance: 185000, // With fund uses (₹95,000) and net profit share (₹30,000), total balance = ₹1,20,000
      security: {
        enabled: true,
        email: 'lucia@studio.com',
        password: 'lucia',
        pin: '1234',
        defaultMode: 'pin' // 'pin' or 'password'
      },
      billing: {
        studioName: 'LUCIA PHOTOGRAPHY & VIDEOGRAPHY',
        tagline: 'Cinematic Visuals & Luxury Wedding Capture',
        address: 'Studio Lucia, Mavoor Road, Calicut, Kerala 673004',
        phone: '+91 98470 12345 / +91 94460 54321',
        email: 'lucia@studio.com',
        upiId: 'lucia@okaxis',
        bankName: 'HDFC Bank',
        accountNumber: '50200012345678',
        ifsc: 'HDFC0001234',
        branch: 'Calicut Main'
      }
    },

    // Projects: Photography & Videography gigs
    projects: [
      {
        id: 'proj-1',
        name: 'Aswathi Wedding',
        clientName: 'Aswathi & Kiran',
        clientPhone: '+91 98470 12345',
        packageAmount: 50000,
        receivedAmount: 30000,
        eventDate: `${monthPrefix}-18`,
        status: 'Payment Pending', // Upcoming, Ongoing, Completed, Payment Pending
        location: 'Calicut Grand Hyatt',
        notes: 'Full day traditional wedding & reception shoot with 2 candid cameras & drone.',
        items: [
          { description: 'Photographer 1', details: 'couple bride/groom single stage full coverage', quantity: 1, rate: 12000, amount: 12000 },
          { description: 'Wedding Photography (Package 01)', details: 'Candid + Traditional + Family + Full Coverage', quantity: 1, rate: 12000, amount: 12000 },
          { description: 'Videography (Camera)', details: '3 Videos (2 Reels + 1 Highlights)', quantity: 1, rate: 15000, amount: 15000 },
          { description: 'Additional Service - Drone Shoot', details: 'Cinematic Aerial Shots', quantity: 1, rate: 3000, amount: 3000 },
          { description: 'Custom Service - Photo Album', details: 'Premium Photo Book (20 Pages)', quantity: 1, rate: 8000, amount: 8000 }
        ]
      },
      {
        id: 'proj-2',
        name: 'Rahul & Sneha Pre-wedding',
        clientName: 'Rahul Menon',
        clientPhone: '+91 94460 54321',
        packageAmount: 45000,
        receivedAmount: 45000,
        eventDate: `${monthPrefix}-12`,
        status: 'Completed',
        location: 'Wayanad Tea Estates',
        notes: '2-day destination cinematic outdoor shoot + teaser reel.'
      },
      {
        id: 'proj-3',
        name: 'Horizon Fashion Brand Commercial',
        clientName: 'Horizon Apparel Ltd',
        clientPhone: '+91 98950 88221',
        packageAmount: 60000,
        receivedAmount: 60000,
        eventDate: `${monthPrefix}-05`,
        status: 'Completed',
        location: 'Kochi Studio A',
        notes: 'Autumn Lookbook 4K shoot & 5 Instagram reels.'
      },
      {
        id: 'proj-4',
        name: 'Zara & Fahad Reception',
        clientName: 'Fahad Kareem',
        clientPhone: '+91 97455 33210',
        packageAmount: 20000,
        receivedAmount: 15000,
        eventDate: `${monthPrefix}-26`,
        status: 'Ongoing',
        location: 'Kozhikode Beach Resort',
        notes: 'Evening reception photography & live highlights.'
      }
    ],

    // Income items for This Month (Total = ₹1,50,000)
    // 30,000 (Aswathi) + 45,000 (Rahul) + 60,000 (Horizon) + 15,000 (Zara) = ₹1,50,000
    income: [
      {
        id: 'inc-1',
        projectId: 'proj-1',
        projectName: 'Aswathi Wedding',
        clientName: 'Aswathi & Kiran',
        amount: 30000,
        totalAmount: 50000,
        balanceDue: 20000,
        date: `${monthPrefix}-08`,
        paymentMethod: 'UPI', // Cash, UPI, Bank
        notes: 'Advance booking payment',
        items: [
          { description: 'Photographer 1', details: 'couple bride/groom single stage full coverage', quantity: 1, rate: 12000, amount: 12000 },
          { description: 'Videography (Camera)', details: '3 Videos (2 Reels + 1 Highlights)', quantity: 1, rate: 15000, amount: 15000 },
          { description: 'Additional Service - Drone Shoot', details: 'Cinematic Aerial Shots', quantity: 1, rate: 3000, amount: 3000 }
        ]
      },
      {
        id: 'inc-2',
        projectId: 'proj-2',
        projectName: 'Rahul & Sneha Pre-wedding',
        clientName: 'Rahul Menon',
        amount: 45000,
        date: `${monthPrefix}-12`,
        paymentMethod: 'Bank',
        notes: 'Full package settlement via NEFT'
      },
      {
        id: 'inc-3',
        projectId: 'proj-3',
        projectName: 'Horizon Fashion Brand Commercial',
        clientName: 'Horizon Apparel Ltd',
        amount: 60000,
        date: `${monthPrefix}-06`,
        paymentMethod: 'Bank',
        notes: 'Commercial production advance & balance'
      },
      {
        id: 'inc-4',
        projectId: 'proj-4',
        projectName: 'Zara & Fahad Reception',
        clientName: 'Fahad Kareem',
        amount: 15000,
        date: `${monthPrefix}-15`,
        paymentMethod: 'Cash',
        notes: 'Advance token received at office'
      }
    ],

    // Business Expenses for This Month (Total = ₹40,000)
    // 10,000 (Aswathi shoot expenses) + 8,000 (Travel) + 6,000 (Editing) + 5,000 (Equipment rental) + 4,000 (Food) + 4,000 (Software) + 3,000 (Marketing) = ₹40,000
    expenses: [
      {
        id: 'exp-1',
        projectId: 'proj-1',
        projectName: 'Aswathi Wedding',
        amount: 10000,
        category: 'Equipment', // Travel, Equipment, Editing, Food, Software, Marketing, Other
        date: `${monthPrefix}-09`,
        paymentMethod: 'UPI',
        notes: 'Extra lighting kit & gimbal rental'
      },
      {
        id: 'exp-2',
        projectId: 'proj-2',
        projectName: 'Rahul & Sneha Pre-wedding',
        amount: 8000,
        category: 'Travel',
        date: `${monthPrefix}-11`,
        paymentMethod: 'UPI',
        notes: 'Fuel and vehicle hire to Wayanad'
      },
      {
        id: 'exp-3',
        projectId: 'proj-3',
        projectName: 'Horizon Fashion Brand Commercial',
        amount: 6000,
        category: 'Editing',
        date: `${monthPrefix}-13`,
        paymentMethod: 'Bank',
        notes: 'Color grading and sound mix freelance fee'
      },
      {
        id: 'exp-4',
        projectId: null,
        projectName: 'Studio Overhead',
        amount: 5000,
        category: 'Equipment',
        date: `${monthPrefix}-07`,
        paymentMethod: 'UPI',
        notes: 'SD cards, backup hard drives, battery spares'
      },
      {
        id: 'exp-5',
        projectId: 'proj-1',
        projectName: 'Aswathi Wedding',
        amount: 4000,
        category: 'Food',
        date: `${monthPrefix}-09`,
        paymentMethod: 'Cash',
        notes: 'Crew meals & refreshments on wedding day'
      },
      {
        id: 'exp-6',
        projectId: null,
        projectName: 'Studio Overhead',
        amount: 4000,
        category: 'Software',
        date: `${monthPrefix}-02`,
        paymentMethod: 'Bank',
        notes: 'Adobe Creative Cloud & Dropbox backup subscription'
      },
      {
        id: 'exp-7',
        projectId: null,
        projectName: 'General Studio',
        amount: 3000,
        category: 'Marketing',
        date: `${monthPrefix}-14`,
        paymentMethod: 'UPI',
        notes: 'Instagram sponsored ad for wedding season'
      }
    ],

    partnerSalaries: [],

    // Partner Withdrawals (Separate from Salary)
    // Shameem Withdrawn = ₹10,000
    // Shiyan Withdrawn = ₹5,000
    withdrawals: [
      {
        id: 'wd-1',
        partnerId: 'partner1',
        partnerName: 'Shameem',
        amount: 10000,
        date: `${monthPrefix}-10`,
        paymentMethod: 'UPI',
        notes: 'Personal withdrawal for family expense'
      },
      {
        id: 'wd-2',
        partnerId: 'partner2',
        partnerName: 'Shiyan',
        amount: 5000,
        date: `${monthPrefix}-12`,
        paymentMethod: 'Bank',
        notes: 'Personal withdrawal'
      }
    ],

    // Company Fund Usages (Capital investments / Studio assets)
    // Total uses = ₹95,000 (Camera 50,000 + Lens 30,000 + Equipment 10,000 + Marketing 5,000)
    companyFundLedger: [
      {
        id: 'cf-1',
        type: 'usage', // 'addition' or 'usage'
        category: 'Camera',
        description: 'Sony FX3 Cinema Camera body purchase',
        amount: 50000,
        date: `${monthPrefix}-03`,
        paymentMethod: 'Bank'
      },
      {
        id: 'cf-2',
        type: 'usage',
        category: 'Lens',
        description: 'Sony G-Master 24-70mm f/2.8 II lens',
        amount: 30000,
        date: `${monthPrefix}-04`,
        paymentMethod: 'Bank'
      },
      {
        id: 'cf-3',
        type: 'usage',
        category: 'Equipment',
        description: 'Aputure Amaran 200d light + softbox dome',
        amount: 10000,
        date: `${monthPrefix}-10`,
        paymentMethod: 'UPI'
      },
      {
        id: 'cf-4',
        type: 'usage',
        category: 'Marketing',
        description: 'Annual website showcase & brand domain renewal',
        amount: 5000,
        date: `${monthPrefix}-14`,
        paymentMethod: 'Bank'
      }
    ],

    // Invoices: Client Bills & Quotations
    invoices: [
      {
        id: 'inv-1',
        invoiceNumber: 'LUCIA-INV-001',
        projectId: 'proj-1',
        projectName: 'Aswathi Wedding',
        clientName: 'Aswathi & Kiran',
        clientPhone: '+91 98470 12345',
        clientEmail: 'aswathi.kiran@gmail.com',
        clientAddress: 'Calicut, Kerala',
        issueDate: `${monthPrefix}-10`,
        dueDate: `${monthPrefix}-25`,
        status: 'Partial',
        items: [
          { description: 'Full Day Traditional Wedding Photography (2 Candid Shooters)', quantity: 1, rate: 25000, amount: 25000 },
          { description: 'Cinematic 4K Highlights Video & Drone Coverage', quantity: 1, rate: 20000, amount: 20000 },
          { description: 'Premium Matte Photo Album (40 Pages)', quantity: 1, rate: 5000, amount: 5000 }
        ],
        subtotal: 50000,
        discountAmount: 0,
        taxPercent: 0,
        taxAmount: 0,
        totalAmount: 50000,
        paidAmount: 30000,
        balanceDue: 20000,
        paymentTerms: '50% advance on booking, balance on deliverables handover.',
        notes: 'Thank you for choosing Lucia Photography & Videography!'
      },
      {
        id: 'inv-2',
        invoiceNumber: 'LUCIA-INV-002',
        projectId: 'proj-2',
        projectName: 'Rahul & Sneha Pre-wedding',
        clientName: 'Rahul Menon',
        clientPhone: '+91 94460 54321',
        clientEmail: 'rahul.menon@outlook.com',
        clientAddress: 'Wayanad, Kerala',
        issueDate: `${monthPrefix}-05`,
        dueDate: `${monthPrefix}-12`,
        status: 'Paid',
        items: [
          { description: '2-Day Cinematic Outdoor Shoot in Wayanad', quantity: 1, rate: 35000, amount: 35000 },
          { description: 'Instagram Reel Teasers & Aerial 4K Drone Shoot', quantity: 1, rate: 10000, amount: 10000 }
        ],
        subtotal: 45000,
        discountAmount: 0,
        taxPercent: 0,
        taxAmount: 0,
        totalAmount: 45000,
        paidAmount: 45000,
        balanceDue: 0,
        paymentTerms: 'Payment completed in full.',
        notes: 'All high-res deliverables and video cuts transferred.'
      }
    ]
  };
}

/**
 * DataStore class managing localStorage, state changes, and listeners.
 */
class DataStore {
  constructor() {
    this.data = null;
    this.listeners = [];
    this.init();
  }

  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
        if (!this.data.settings) this.data.settings = {};

        // Ensure security settings exist if upgrading from older store version
        if (!this.data.settings.security) {
          this.data.settings.security = {
            enabled: true,
            email: 'lucia@studio.com',
            password: 'lucia',
            pin: '1234',
            defaultMode: 'pin'
          };
          this.save();
        }

        // Ensure billing profile exists
        if (!this.data.settings.billing) {
          this.data.settings.billing = {
            studioName: 'LUCIA PHOTOGRAPHY & VIDEOGRAPHY',
            tagline: 'Cinematic Visuals & Luxury Wedding Capture',
            address: 'Studio Lucia, Mavoor Road, Calicut, Kerala 673004',
            phone: '+91 98470 12345 / +91 94460 54321',
            email: 'lucia@studio.com',
            upiId: 'lucia@okaxis',
            bankName: 'HDFC Bank',
            accountNumber: '50200012345678',
            ifsc: 'HDFC0001234',
            branch: 'Calicut Main'
          };
          this.save();
        }

        // Ensure invoices collection exists
        if (!this.data.invoices) {
          this.data.invoices = [];
          this.save();
        }

        // Reconcile projects so all projects automatically reflect in Dashboard revenue & profit
        this.reconcileProjectsWithIncome();
        this.reconcileCompanyFundWithExpenses();
      } else {
        this.resetToDefaults();
      }
    } catch (e) {
      console.error('Failed to load store, initializing defaults', e);
      this.resetToDefaults();
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.notify();
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  resetToDefaults() {
    this.data = getDefaultData();
    this.save();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.data));
  }

  /**
   * Automatically ensure every project has a corresponding income record
   * so projects immediately reflect in Dashboard Revenue, Net Profit, and Partner Split.
   */
  reconcileProjectsWithIncome() {
    if (!this.data || !Array.isArray(this.data.projects)) return;
    if (!Array.isArray(this.data.income)) this.data.income = [];

    let changed = false;
    this.data.projects.forEach(proj => {
      const pkg = Number(proj.packageAmount) || 0;
      const disc = Number(proj.discount) || 0;
      const netPkg = Math.max(0, pkg - disc);
      const rcv = Number(proj.receivedAmount) || 0;

      // Find if this project has any linked income record
      const existingIncome = this.data.income.find(i => i.projectId === proj.id);
      if (!existingIncome) {
        // Automatically create project income record so it reflects on Dashboard
        const incomeAmt = rcv > 0 ? rcv : netPkg;
        this.data.income.unshift({
          id: 'inc-' + String(proj.id).replace('proj-', '') + '-' + Date.now(),
          projectId: proj.id,
          projectName: proj.name,
          clientName: proj.clientName || '',
          clientPhone: proj.clientPhone || '',
          amount: incomeAmt,
          discount: disc,
          totalAmount: pkg,
          netAmount: netPkg,
          balanceDue: Math.max(0, netPkg - rcv),
          items: proj.items && proj.items.length > 0 ? JSON.parse(JSON.stringify(proj.items)) : [],
          date: proj.eventDate || new Date().toISOString().split('T')[0],
          paymentMethod: proj.paymentMethod || 'GPay / UPI',
          notes: rcv > 0 ? `Advance payment for ${proj.name}` : `Project contract booked for ${proj.name}`
        });
        changed = true;
      }
    });

    if (changed) {
      this.save();
    }
  }

  /**
   * Automatically ensure every expense has a corresponding usage in companyFundLedger
   * so expenses automatically decrease Company Fund balance and appear in fund records.
   */
  reconcileCompanyFundWithExpenses() {
    if (!this.data || !Array.isArray(this.data.expenses)) return;
    if (!Array.isArray(this.data.companyFundLedger)) this.data.companyFundLedger = [];

    const existingExpenseFundIds = new Set(
      this.data.companyFundLedger
        .filter(entry => entry.expenseId || entry.id?.startsWith('cf-exp-'))
        .map(entry => entry.expenseId || entry.id.replace('cf-exp-', ''))
    );

    let changed = false;
    this.data.expenses.forEach(exp => {
      if (exp.id && !existingExpenseFundIds.has(exp.id) && Number(exp.amount) > 0) {
        this.data.companyFundLedger.unshift({
          id: 'cf-exp-' + exp.id,
          expenseId: exp.id,
          type: 'usage',
          category: exp.category || 'Expense',
          description: `${exp.projectName || 'Studio Overhead'}${exp.notes ? ' - ' + exp.notes : ''}`,
          amount: Number(exp.amount) || 0,
          date: exp.date || new Date().toISOString().split('T')[0],
          paymentMethod: exp.paymentMethod || 'UPI'
        });
        existingExpenseFundIds.add(exp.id);
        changed = true;
      }
    });

    if (changed) {
      this.save();
    }
  }

  // --- ACTIONS ---

  addIncome({ projectId, projectName, clientName, clientPhone, amount, totalAmount, discount = 0, balanceDue, category, date, paymentMethod, notes, items }) {
    const rcv = Number(amount) || 0;
    const total = totalAmount !== undefined ? (Number(totalAmount) || 0) : rcv;
    const disc = Number(discount) || 0;
    const net = Math.max(0, total - disc);
    const due = balanceDue !== undefined ? (Number(balanceDue) || 0) : Math.max(0, net - rcv);

    const newIncome = {
      id: 'inc-' + Date.now(),
      projectId: projectId || null,
      projectName: projectName || 'Direct Studio Income',
      clientName: clientName || '',
      clientPhone: clientPhone || '',
      amount: rcv,
      discount: disc,
      totalAmount: total > 0 ? total : rcv,
      netAmount: net,
      balanceDue: due,
      category: category || 'Wedding Shoot',
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'GPay / UPI',
      notes: notes || '',
      items: Array.isArray(items) ? items : []
    };

    this.data.income.unshift(newIncome);

    // If attached to a project, update project's received amount & status
    if (projectId) {
      const project = this.data.projects.find(p => p.id === projectId);
      if (project) {
        project.receivedAmount = (Number(project.receivedAmount) || 0) + newIncome.amount;
        const projNet = Math.max(0, (Number(project.packageAmount) || 0) - (Number(project.discount) || 0));
        if (project.receivedAmount >= projNet) {
          if (project.status === 'Payment Pending') {
            project.status = 'Completed';
          }
        }
      }
    }

    this.save();
    return newIncome;
  }

  addExpense({ projectId, projectName, amount, category, date, paymentMethod, notes }) {
    let projName = projectName;
    if (projectId && !projName) {
      const proj = this.data.projects.find(p => p.id === projectId);
      if (proj) projName = proj.name;
    }

    const newExpense = {
      id: 'exp-' + Date.now(),
      projectId: projectId || null,
      projectName: projName || 'Studio Overhead',
      amount: Number(amount) || 0,
      category: category || 'Other',
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'UPI',
      notes: notes || ''
    };

    this.data.expenses.unshift(newExpense);

    // Automatically record deduction in Company Fund so expenses automatically decrease company fund
    if (newExpense.amount > 0) {
      if (!Array.isArray(this.data.companyFundLedger)) this.data.companyFundLedger = [];
      this.data.companyFundLedger.unshift({
        id: 'cf-exp-' + newExpense.id,
        expenseId: newExpense.id,
        type: 'usage',
        category: newExpense.category || 'Expense',
        description: `${newExpense.projectName || 'Studio Overhead'}${newExpense.notes ? ' - ' + newExpense.notes : ''}`,
        amount: newExpense.amount,
        date: newExpense.date,
        paymentMethod: newExpense.paymentMethod || 'UPI'
      });
    }

    this.save();
    return newExpense;
  }

  addProject({ name, clientName, clientPhone, packageAmount, discount = 0, receivedAmount, paymentMethod, eventDate, status, location, notes, items }) {
    const pkg = Number(packageAmount) || 0;
    const disc = Number(discount) || 0;
    const netPkg = Math.max(0, pkg - disc);
    const rcv = Number(receivedAmount) || 0;
    const method = paymentMethod || 'GPay / UPI';

    const newProject = {
      id: 'proj-' + Date.now(),
      name: name || 'Untitled Project',
      clientName: clientName || '',
      clientPhone: clientPhone || '',
      packageAmount: pkg,
      discount: disc,
      netPackageAmount: netPkg,
      receivedAmount: rcv,
      paymentMethod: method,
      eventDate: eventDate || new Date().toISOString().split('T')[0],
      status: status || (rcv < netPkg ? 'Payment Pending' : 'Ongoing'),
      location: location || '',
      notes: notes || '',
      items: Array.isArray(items) ? items : []
    };

    this.data.projects.unshift(newProject);

    // ALWAYS create corresponding income record automatically so project immediately adds to Dashboard
    const incomeAmt = rcv > 0 ? rcv : netPkg;
    this.data.income.unshift({
      id: 'inc-' + Date.now(),
      projectId: newProject.id,
      projectName: newProject.name,
      clientName: newProject.clientName,
      clientPhone: newProject.clientPhone,
      amount: incomeAmt,
      discount: disc,
      totalAmount: pkg,
      netAmount: netPkg,
      balanceDue: Math.max(0, netPkg - rcv),
      items: newProject.items && newProject.items.length > 0 ? JSON.parse(JSON.stringify(newProject.items)) : [],
      date: eventDate || new Date().toISOString().split('T')[0],
      paymentMethod: method,
      notes: rcv > 0 ? `Advance payment for ${newProject.name}` : `Project contract booked for ${newProject.name}`
    });

    this.save();
    return newProject;
  }

  markProjectPaid(projectId, paymentMethod = 'UPI') {
    const project = this.data.projects.find(p => p.id === projectId);
    if (!project) return null;

    const remaining = Math.max(0, project.packageAmount - project.receivedAmount);
    if (remaining <= 0) return project;

    project.receivedAmount = project.packageAmount;
    if (project.status === 'Payment Pending') {
      project.status = 'Completed';
    }

    // Record the full remaining balance payment as income
    const incomeRecord = {
      id: 'inc-' + Date.now(),
      projectId: project.id,
      projectName: project.name,
      clientName: project.clientName,
      amount: remaining,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod,
      notes: `Final payment settlement for ${project.name}`
    };

    this.data.income.unshift(incomeRecord);
    this.save();
    return { project, incomeRecord };
  }

  updateProjectReceivedAmount(projectId, newReceivedAmount) {
    const project = this.data.projects.find(p => p.id === projectId);
    if (!project) return null;

    const oldRcv = Number(project.receivedAmount) || 0;
    const newRcv = Math.max(0, Number(newReceivedAmount) || 0);
    const pkg = Number(project.packageAmount) || 0;

    project.receivedAmount = newRcv;
    if (newRcv >= pkg && project.status === 'Payment Pending') {
      project.status = 'Completed';
    } else if (newRcv < pkg && project.status === 'Completed') {
      project.status = 'Payment Pending';
    }

    const diff = newRcv - oldRcv;
    if (diff > 0) {
      this.data.income.unshift({
        id: 'inc-' + Date.now(),
        projectId: project.id,
        projectName: project.name,
        clientName: project.clientName,
        amount: diff,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'UPI',
        notes: `Payment collection for ${project.name}`
      });
    }

    this.save();
    return project;
  }

  addPartnerWithdrawal({ partnerId, amount, date, paymentMethod, notes }) {
    const partnerName = partnerId === 'partner1' ? this.data.settings.partner1Name : this.data.settings.partner2Name;
    const newWithdrawal = {
      id: 'wd-' + Date.now(),
      partnerId,
      partnerName,
      amount: Number(amount) || 0,
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'Bank',
      notes: notes || ''
    };

    this.data.withdrawals.unshift(newWithdrawal);
    this.save();
    return newWithdrawal;
  }

  addCompanyFundTransaction({ type, category, description, amount, date, paymentMethod }) {
    const entry = {
      id: 'cf-' + Date.now(),
      type: type || 'usage', // 'addition' or 'usage'
      category: category || 'Equipment',
      description: description || '',
      amount: Number(amount) || 0,
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'Bank'
    };

    this.data.companyFundLedger.unshift(entry);
    this.save();
    return entry;
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    if (newSettings.partner1Name || newSettings.partner2Name) {
      (this.data.withdrawals || []).forEach(w => {
        if (w.partnerId === 'partner1') w.partnerName = this.data.settings.partner1Name;
        if (w.partnerId === 'partner2') w.partnerName = this.data.settings.partner2Name;
      });
    }
    this.save();
  }

  setCompanyFundBalance(targetBalance) {
    const target = Number(targetBalance) || 0;
    
    // Calculate ledger net difference (additions - usages, including expenses)
    const ledgerDiff = (this.data.companyFundLedger || []).reduce((sum, entry) => {
      const amt = Number(entry.amount) || 0;
      return entry.type === 'addition' ? sum + amt : sum - amt;
    }, 0);

    const allLinkedProjectIds = new Set((this.data.income || []).filter(i => i.projectId).map(i => i.projectId));
    let unlinkedAllTimeProjectRevenue = 0;
    (this.data.projects || []).forEach(proj => {
      if (!allLinkedProjectIds.has(proj.id)) {
        const pkg = Number(proj.packageAmount) || 0;
        const disc = Number(proj.discount) || 0;
        const net = Math.max(0, pkg - disc);
        const rcv = Number(proj.receivedAmount) || 0;
        unlinkedAllTimeProjectRevenue += (rcv > 0 ? rcv : net);
      }
    });

    const allTimeIncome = (this.data.income || []).reduce((sum, i) => sum + (Number(i.amount) || 0), 0) + unlinkedAllTimeProjectRevenue;
    const allTimeRevenueDist = FinanceEngine.distributeProfit(allTimeIncome, this.data.settings.profitPercentages, this.data.settings.customProfitAmounts);

    // Set initial balance so total matches target exactly
    this.data.settings.initialCompanyFundBalance = target - (ledgerDiff + allTimeRevenueDist.companyFund);
    this.save();
    return true;
  }

  updatePartnerProfitAmounts(p1Amount, p2Amount, cfAmount, partner1Name, partner2Name) {
    if (partner1Name) this.data.settings.partner1Name = partner1Name.trim();
    if (partner2Name) this.data.settings.partner2Name = partner2Name.trim();

    const p1 = Math.max(0, Math.round(Number(p1Amount) || 0));
    const p2 = Math.max(0, Math.round(Number(p2Amount) || 0));
    const cf = Math.max(0, Math.round(Number(cfAmount) || 0));

    this.data.settings.customProfitAmounts = {
      partner1: p1,
      partner2: p2,
      companyFund: cf
    };

    // Calculate background percentages if total > 0 so standard percentage reports remain consistent
    const total = p1 + p2 + cf;
    if (total > 0) {
      const p1Pct = Math.round((p1 / total) * 10000) / 100;
      const p2Pct = Math.round((p2 / total) * 10000) / 100;
      const cfPct = Math.round((100 - (p1Pct + p2Pct)) * 100) / 100;
      this.data.settings.profitPercentages = {
        partner1: p1Pct,
        partner2: p2Pct,
        companyFund: cfPct
      };
    }

    // Synchronize withdrawal partnerName labels
    (this.data.withdrawals || []).forEach(w => {
      if (w.partnerId === 'partner1') w.partnerName = this.data.settings.partner1Name;
      if (w.partnerId === 'partner2') w.partnerName = this.data.settings.partner2Name;
    });

    this.save();
    return true;
  }

  updatePartnersAndSplits(partner1Name, partner2Name, p1Pct, p2Pct, cfPct) {
    if (partner1Name) this.data.settings.partner1Name = partner1Name.trim();
    if (partner2Name) this.data.settings.partner2Name = partner2Name.trim();
    if (p1Pct !== undefined && p2Pct !== undefined && cfPct !== undefined) {
      this.data.settings.profitPercentages = {
        partner1: Number(p1Pct),
        partner2: Number(p2Pct),
        companyFund: Number(cfPct)
      };
      // Clear custom amounts so percentage takes effect
      this.data.settings.customProfitAmounts = null;
    }
    // Synchronize withdrawal partnerName labels
    (this.data.withdrawals || []).forEach(w => {
      if (w.partnerId === 'partner1') w.partnerName = this.data.settings.partner1Name;
      if (w.partnerId === 'partner2') w.partnerName = this.data.settings.partner2Name;
    });
    this.save();
    return true;
  }

  updateSecuritySettings(newSec) {
    this.data.settings.security = { ...this.data.settings.security, ...newSec };
    this.save();
  }

  updateBillingSettings(newBilling) {
    if (!this.data.settings.billing) this.data.settings.billing = {};
    this.data.settings.billing = { ...this.data.settings.billing, ...newBilling };
    this.save();
  }

  getNextInvoiceNumber() {
    const list = this.data.invoices || [];
    const count = list.length + 1;
    return `LUCIA-INV-${String(count).padStart(3, '0')}`;
  }

  addInvoice(invoiceData) {
    if (!this.data.invoices) this.data.invoices = [];
    const newInv = {
      id: 'inv-' + Date.now(),
      invoiceNumber: invoiceData.invoiceNumber || this.getNextInvoiceNumber(),
      projectId: invoiceData.projectId || '',
      projectName: invoiceData.projectName || '',
      clientName: invoiceData.clientName || 'Valued Client',
      clientPhone: invoiceData.clientPhone || '',
      clientEmail: invoiceData.clientEmail || '',
      clientAddress: invoiceData.clientAddress || '',
      issueDate: invoiceData.issueDate || new Date().toISOString().split('T')[0],
      dueDate: invoiceData.dueDate || new Date().toISOString().split('T')[0],
      status: invoiceData.status || 'Pending',
      items: Array.isArray(invoiceData.items) ? invoiceData.items : [],
      subtotal: Number(invoiceData.subtotal) || 0,
      discountAmount: Number(invoiceData.discountAmount) || 0,
      taxPercent: Number(invoiceData.taxPercent) || 0,
      taxAmount: Number(invoiceData.taxAmount) || 0,
      totalAmount: Number(invoiceData.totalAmount) || 0,
      paidAmount: Number(invoiceData.paidAmount) || 0,
      balanceDue: Number(invoiceData.balanceDue) || 0,
      paymentTerms: invoiceData.paymentTerms || '',
      notes: invoiceData.notes || ''
    };

    this.data.invoices.unshift(newInv);
    this.save();
    return newInv;
  }

  updateInvoice(id, updatedData) {
    if (!this.data.invoices) return null;
    const index = this.data.invoices.findIndex(inv => inv.id === id);
    if (index === -1) return null;

    this.data.invoices[index] = {
      ...this.data.invoices[index],
      ...updatedData
    };
    this.save();
    return this.data.invoices[index];
  }

  deleteInvoice(id) {
    if (!this.data.invoices) return false;
    this.data.invoices = this.data.invoices.filter(inv => inv.id !== id);
    this.save();
    return true;
  }

  recordInvoicePayment({ invoiceId, amount, date, paymentMethod, notes }) {
    if (!this.data.invoices) return null;
    const inv = this.data.invoices.find(i => i.id === invoiceId);
    if (!inv) return null;

    const payAmt = Number(amount) || 0;
    if (payAmt <= 0) return null;

    const newPaid = (Number(inv.paidAmount) || 0) + payAmt;
    const newBalance = Math.max(0, (Number(inv.totalAmount) || 0) - newPaid);
    inv.paidAmount = newPaid;
    inv.balanceDue = newBalance;
    inv.status = newBalance <= 0 ? 'Paid' : 'Partial';

    // If linked to a project, update project's received amount & status
    if (inv.projectId) {
      const proj = (this.data.projects || []).find(p => p.id === inv.projectId);
      if (proj) {
        proj.receivedAmount = (Number(proj.receivedAmount) || 0) + payAmt;
        if (proj.receivedAmount >= proj.packageAmount && proj.status === 'Payment Pending') {
          proj.status = 'Completed';
        }
      }
    }

    // Automatically record a revenue record
    const incomeRecord = {
      id: 'inc-' + Date.now(),
      projectId: inv.projectId || null,
      projectName: inv.projectName || `Invoice ${inv.invoiceNumber}`,
      clientName: inv.clientName || '',
      amount: payAmt,
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'UPI',
      notes: notes || `Payment for Invoice ${inv.invoiceNumber}`
    };
    if (!this.data.income) this.data.income = [];
    this.data.income.unshift(incomeRecord);

    this.save();
    return { invoice: inv, incomeRecord };
  }

  updateProject(id, updatedData) {
    const proj = (this.data.projects || []).find(p => p.id === id);
    if (!proj) return null;

    const oldName = proj.name;

    if (updatedData.packageAmount !== undefined) updatedData.packageAmount = Number(updatedData.packageAmount) || 0;
    if (updatedData.discount !== undefined) updatedData.discount = Number(updatedData.discount) || 0;
    if (updatedData.receivedAmount !== undefined) updatedData.receivedAmount = Number(updatedData.receivedAmount) || 0;

    Object.assign(proj, updatedData);

    const pkg = Number(proj.packageAmount) || 0;
    const disc = Number(proj.discount) || 0;
    const netPkg = Math.max(0, pkg - disc);
    const rcv = Number(proj.receivedAmount) || 0;
    proj.netPackageAmount = netPkg;

    // Synchronize linked income record so Dashboard revenue stays accurate
    const linkedIncome = (this.data.income || []).find(i => i.projectId === id);
    if (linkedIncome) {
      if (updatedData.name) linkedIncome.projectName = updatedData.name;
      if (updatedData.clientName) linkedIncome.clientName = updatedData.clientName;
      if (updatedData.clientPhone) linkedIncome.clientPhone = updatedData.clientPhone;
      if (updatedData.eventDate) linkedIncome.date = updatedData.eventDate;
      if (updatedData.paymentMethod) linkedIncome.paymentMethod = updatedData.paymentMethod;
      if (updatedData.items) linkedIncome.items = JSON.parse(JSON.stringify(updatedData.items));
      linkedIncome.totalAmount = pkg;
      linkedIncome.discount = disc;
      linkedIncome.netAmount = netPkg;
      linkedIncome.balanceDue = Math.max(0, netPkg - rcv);
      linkedIncome.amount = rcv > 0 ? rcv : netPkg;
    } else {
      this.data.income.unshift({
        id: 'inc-' + Date.now(),
        projectId: proj.id,
        projectName: proj.name,
        clientName: proj.clientName || '',
        clientPhone: proj.clientPhone || '',
        amount: rcv > 0 ? rcv : netPkg,
        discount: disc,
        totalAmount: pkg,
        netAmount: netPkg,
        balanceDue: Math.max(0, netPkg - rcv),
        items: proj.items ? JSON.parse(JSON.stringify(proj.items)) : [],
        date: proj.eventDate || new Date().toISOString().split('T')[0],
        paymentMethod: proj.paymentMethod || 'GPay / UPI',
        notes: rcv > 0 ? `Advance payment for ${proj.name}` : `Project contract booked for ${proj.name}`
      });
    }

    // If name or client changed, synchronize linked records
    if (updatedData.name && updatedData.name !== oldName) {
      (this.data.expenses || []).forEach(e => {
        if (e.projectId === id) {
          e.projectName = updatedData.name;
        }
      });
      (this.data.invoices || []).forEach(inv => {
        if (inv.projectId === id) {
          inv.projectName = updatedData.name;
          if (updatedData.clientName) inv.clientName = updatedData.clientName;
        }
      });
    }

    this.save();
    return proj;
  }

  updateIncome(id, updatedData) {
    const inc = (this.data.income || []).find(i => i.id === id);
    if (!inc) return null;

    const oldAmount = Number(inc.amount) || 0;
    const oldProjectId = inc.projectId;
    const newAmount = Number(updatedData.amount) || 0;
    const newProjectId = updatedData.projectId || null;

    // Adjust project receivedAmount
    if (oldProjectId === newProjectId) {
      if (newProjectId) {
        const proj = (this.data.projects || []).find(p => p.id === newProjectId);
        if (proj) {
          const delta = newAmount - oldAmount;
          proj.receivedAmount = Math.max(0, (Number(proj.receivedAmount) || 0) + delta);
          const net = Math.max(0, (Number(proj.packageAmount) || 0) - (Number(proj.discount) || 0));
          if (proj.receivedAmount >= net && proj.status === 'Payment Pending') {
            proj.status = 'Completed';
          } else if (proj.receivedAmount < net && proj.status === 'Completed') {
            proj.status = 'Payment Pending';
          }
        }
      }
    } else {
      // Switched project
      if (oldProjectId) {
        const oldProj = (this.data.projects || []).find(p => p.id === oldProjectId);
        if (oldProj) {
          oldProj.receivedAmount = Math.max(0, (Number(oldProj.receivedAmount) || 0) - oldAmount);
          const oldNet = Math.max(0, (Number(oldProj.packageAmount) || 0) - (Number(oldProj.discount) || 0));
          if (oldProj.receivedAmount < oldNet && oldProj.status === 'Completed') {
            oldProj.status = 'Payment Pending';
          }
        }
      }
      if (newProjectId) {
        const newProj = (this.data.projects || []).find(p => p.id === newProjectId);
        if (newProj) {
          newProj.receivedAmount = (Number(newProj.receivedAmount) || 0) + newAmount;
          const newNet = Math.max(0, (Number(newProj.packageAmount) || 0) - (Number(newProj.discount) || 0));
          if (newProj.receivedAmount >= newNet && newProj.status === 'Payment Pending') {
            newProj.status = 'Completed';
          }
        }
      }
    }

    Object.assign(inc, updatedData);
    inc.amount = newAmount;

    this.save();
    return inc;
  }

  updateExpense(id, updatedData) {
    const exp = (this.data.expenses || []).find(e => e.id === id);
    if (!exp) return null;

    if (updatedData.amount !== undefined) updatedData.amount = Number(updatedData.amount) || 0;

    let projName = updatedData.projectName;
    if (updatedData.projectId && !projName) {
      const proj = (this.data.projects || []).find(p => p.id === updatedData.projectId);
      if (proj) projName = proj.name;
    }
    if (projName) updatedData.projectName = projName;

    Object.assign(exp, updatedData);

    // Keep linked company fund deduction entry in sync
    const cf = (this.data.companyFundLedger || []).find(e => e.expenseId === id || e.id === 'cf-exp-' + id);
    if (cf) {
      if (updatedData.amount !== undefined) cf.amount = Number(updatedData.amount) || 0;
      if (updatedData.category) cf.category = updatedData.category;
      if (updatedData.date) cf.date = updatedData.date;
      if (updatedData.paymentMethod) cf.paymentMethod = updatedData.paymentMethod;
      const pName = exp.projectName || 'Studio Overhead';
      const nts = exp.notes || '';
      cf.description = `${pName}${nts ? ' - ' + nts : ''}`;
    }

    this.save();
    return exp;
  }

  updateWithdrawal(id, updatedData) {
    const wd = (this.data.withdrawals || []).find(w => w.id === id);
    if (!wd) return null;

    if (updatedData.amount !== undefined) updatedData.amount = Number(updatedData.amount) || 0;
    if (updatedData.partnerId) {
      updatedData.partnerName = updatedData.partnerId === 'partner1' ? this.data.settings.partner1Name : this.data.settings.partner2Name;
    }

    Object.assign(wd, updatedData);
    this.save();
    return wd;
  }

  updateCompanyFundLedger(id, updatedData) {
    const entry = (this.data.companyFundLedger || []).find(e => e.id === id);
    if (!entry) return null;

    if (updatedData.amount !== undefined) updatedData.amount = Number(updatedData.amount) || 0;

    Object.assign(entry, updatedData);

    // If this entry is linked to an expense, keep expense in sync
    if (entry.expenseId) {
      const exp = (this.data.expenses || []).find(e => e.id === entry.expenseId);
      if (exp) {
        if (updatedData.amount !== undefined) exp.amount = Number(updatedData.amount) || 0;
        if (updatedData.category) exp.category = updatedData.category;
        if (updatedData.date) exp.date = updatedData.date;
        if (updatedData.paymentMethod) exp.paymentMethod = updatedData.paymentMethod;
      }
    }

    this.save();
    return entry;
  }

  deleteItem(collectionName, id) {
    if (collectionName === 'projects') {
      return this.deleteProject(id);
    }
    if (collectionName === 'invoices') {
      return this.deleteInvoice(id);
    }
    if (this.data[collectionName]) {
      const target = this.data[collectionName].find(item => item.id === id);
      // If deleting an income linked to a project, subtract from project's received amount
      if (collectionName === 'income' && target && target.projectId) {
        const project = (this.data.projects || []).find(p => p.id === target.projectId);
        if (project) {
          project.receivedAmount = Math.max(0, (Number(project.receivedAmount) || 0) - (Number(target.amount) || 0));
          if (project.receivedAmount < project.packageAmount && project.status === 'Completed') {
            project.status = 'Payment Pending';
          }
        }
      }

      // If deleting an expense, also remove its deduction from company fund ledger
      if (collectionName === 'expenses') {
        this.data.companyFundLedger = (this.data.companyFundLedger || []).filter(
          e => e.expenseId !== id && e.id !== 'cf-exp-' + id
        );
      }

      // If deleting from company fund ledger and it's linked to an expense, also remove from expenses
      if (collectionName === 'companyFundLedger' && target && (target.expenseId || target.id?.startsWith('cf-exp-'))) {
        const expId = target.expenseId || target.id.replace('cf-exp-', '');
        this.data.expenses = (this.data.expenses || []).filter(e => e.id !== expId);
      }

      this.data[collectionName] = this.data[collectionName].filter(item => item.id !== id);
      this.save();
      return true;
    }
    return false;
  }

  deleteProject(projectId) {
    const proj = (this.data.projects || []).find(p => p.id === projectId);
    if (!proj) return false;

    // Collect linked expense IDs
    const linkedExpenseIds = new Set(
      (this.data.expenses || []).filter(e => e.projectId === projectId).map(e => e.id)
    );

    // Remove project
    this.data.projects = this.data.projects.filter(p => p.id !== projectId);

    // Also clean up linked project income, expenses, and invoices
    this.data.income = (this.data.income || []).filter(i => i.projectId !== projectId);
    this.data.expenses = (this.data.expenses || []).filter(e => e.projectId !== projectId);
    this.data.invoices = (this.data.invoices || []).filter(inv => inv.projectId !== projectId);

    // Clean up linked company fund deductions for these project expenses
    this.data.companyFundLedger = (this.data.companyFundLedger || []).filter(
      entry => !entry.expenseId || !linkedExpenseIds.has(entry.expenseId)
    );

    this.save();
    return true;
  }

  clearAllData() {
    this.data.projects = [];
    this.data.invoices = [];
    this.data.income = [];
    this.data.expenses = [];
    this.data.partnerSalaries = [];
    this.data.withdrawals = [];
    this.data.companyFundLedger = [];
    this.data.settings.initialCompanyFundBalance = 0;
    this.save();
  }

  resetCompanyFund(targetBalance = 0) {
    this.data.companyFundLedger = [];
    
    const allLinkedProjectIds = new Set((this.data.income || []).filter(i => i.projectId).map(i => i.projectId));
    let unlinkedAllTimeProjectRevenue = 0;
    (this.data.projects || []).forEach(proj => {
      if (!allLinkedProjectIds.has(proj.id)) {
        const pkg = Number(proj.packageAmount) || 0;
        const disc = Number(proj.discount) || 0;
        const net = Math.max(0, pkg - disc);
        const rcv = Number(proj.receivedAmount) || 0;
        unlinkedAllTimeProjectRevenue += (rcv > 0 ? rcv : net);
      }
    });

    const allTimeIncome = (this.data.income || []).reduce((sum, i) => sum + (Number(i.amount) || 0), 0) + unlinkedAllTimeProjectRevenue;
    const allTimeRevenueDist = FinanceEngine.distributeProfit(allTimeIncome, this.data.settings.profitPercentages, this.data.settings.customProfitAmounts);
    
    this.data.settings.initialCompanyFundBalance = targetBalance - allTimeRevenueDist.companyFund;
    this.save();
    return true;
  }

  exportJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.settings && parsed.projects) {
        this.data = parsed;
        this.save();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }
}

// Global singleton instance
window.dataStore = new DataStore();
