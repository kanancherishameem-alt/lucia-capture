/**
 * LUCIA FINANCE - Core Financial Logic Engine
 * 
 * Financial Rules:
 * 1. Net Profit = Total Revenue - Business Expenses
 * 2. Net Profit is split according to settings percentages (default: 33.33% Shameem, 33.33% Shiyan, 33.34% Company Fund)
 * 3. Exact rounding handling: distributed total must strictly equal Net Profit.
 * 4. Partner Available Balance = Earned Profit Share - Withdrawals
 * 5. Company Fund Balance = Base/Added Funds + Cumulative Company Profit Share - Fund Expenditures
 */

const FinanceEngine = {
  // Format currency to Indian standard (e.g. ₹1,50,000)
  formatINR(amount, includeSymbol = true) {
    const num = Math.round(Number(amount) || 0);
    const sign = num < 0 ? '-' : '';
    const absStr = Math.abs(num).toString();
    
    let result = '';
    if (absStr.length > 3) {
      const lastThree = absStr.substring(absStr.length - 3);
      const otherNumbers = absStr.substring(0, absStr.length - 3);
      result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    } else {
      result = absStr;
    }
    
    const formatted = sign + result;
    return includeSymbol ? `₹${formatted}` : formatted;
  },

  // Parse formatted currency string or input back to clean number
  parseINR(value) {
    if (typeof value === 'number') return Math.round(value);
    if (!value) return 0;
    const cleanStr = String(value).replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : Math.round(num);
  },

  // Calculate net profit (Revenue - Expenses)
  calculateNetProfit(totalIncome, businessExpenses) {
    const income = Number(totalIncome) || 0;
    const expenses = Number(businessExpenses) || 0;
    return income - expenses;
  },

  /**
   * Distribute net profit with exact rounding guarantee.
   * Total distributed will always exactly equal netProfit.
   * 
   * @param {number} netProfit 
   * @param {object} percentages - { partner1: 33.33, partner2: 33.33, companyFund: 33.34 }
   */
  distributeProfit(netProfit, percentages = { partner1: 33.33, partner2: 33.33, companyFund: 33.34 }) {
    const profit = Math.round(Number(netProfit) || 0);
    if (profit === 0) {
      return { partner1: 0, partner2: 0, companyFund: 0, total: 0 };
    }

    const p1Percent = Number(percentages.partner1) || 33.33;
    const p2Percent = Number(percentages.partner2) || 33.33;
    const cfPercent = Number(percentages.companyFund) || 33.34;
    const totalPercent = p1Percent + p2Percent + cfPercent;

    // Normalize in case percentages don't sum to exactly 100
    const ratio1 = p1Percent / totalPercent;
    const ratio2 = p2Percent / totalPercent;

    // Calculate integer amounts for partner 1 and partner 2
    const p1Share = Math.round(profit * ratio1);
    const p2Share = Math.round(profit * ratio2);

    // Company Fund absorbs any rounding difference to ensure exact balance
    const companyFundShare = profit - (p1Share + p2Share);

    return {
      partner1: p1Share,
      partner2: p2Share,
      companyFund: companyFundShare,
      total: p1Share + p2Share + companyFundShare
    };
  },

  /**
   * Calculate all finances for a given filtered date range or month
   * @param {object} store - Full data store
   * @param {object} filter - { type: 'month'|'year'|'custom'|'all', monthIndex: 0-11, year: 2026, startDate, endDate }
   */
  computeFinancials(store, filter = { type: 'month', monthIndex: new Date().getMonth(), year: new Date().getFullYear() }) {
    const { income = [], expenses = [], projects = [], partnerSalaries = [], withdrawals = [], companyFundLedger = [], settings } = store;

    // Helper date matcher
    const matchDate = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;

      if (filter.type === 'all') return true;
      if (filter.type === 'year') {
        return d.getFullYear() === filter.year;
      }
      if (filter.type === 'month') {
        return d.getFullYear() === filter.year && d.getMonth() === filter.monthIndex;
      }
      if (filter.type === 'custom' && filter.startDate && filter.endDate) {
        const start = new Date(filter.startDate);
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      }
      return true;
    };

    // Filter income and calculate total
    const filteredIncome = income.filter(item => matchDate(item.date));
    const totalIncome = filteredIncome.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // Filter expenses (business expenses only; salary is separate)
    const filteredExpenses = expenses.filter(item => matchDate(item.date));
    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // Net Profit calculation (Revenue - Expenses)
    const netProfit = this.calculateNetProfit(totalIncome, totalExpenses);

    // Profit Distribution
    const distribution = this.distributeProfit(netProfit, settings.profitPercentages);

    // Pending Payments calculation (across all active projects)
    const pendingPayments = projects.reduce((sum, proj) => {
      const packageAmt = Number(proj.packageAmount) || 0;
      const receivedAmt = Number(proj.receivedAmount) || 0;
      const pending = Math.max(0, packageAmt - receivedAmt);
      return sum + pending;
    }, 0);

    // Company Fund Cumulative Balance:
    // Starts with initial balance + manual additions + company fund profit shares - fund uses
    let companyFundBalance = Number(settings.initialCompanyFundBalance || 0);

    // Add all company fund ledger additions and subtract uses
    companyFundLedger.forEach(entry => {
      const amt = Number(entry.amount) || 0;
      if (entry.type === 'addition') {
        companyFundBalance += amt;
      } else if (entry.type === 'usage') {
        companyFundBalance -= amt;
      }
    });

    // Add company share of profit from all past periods (or calculate globally)
    // To ensure consistency, calculate all-time net profit company fund share:
    const allTimeIncome = income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const allTimeExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const allTimeNetProfit = this.calculateNetProfit(allTimeIncome, allTimeExpenses);
    const allTimeDistribution = this.distributeProfit(allTimeNetProfit, settings.profitPercentages);

    const totalCompanyFundBalance = companyFundBalance + allTimeDistribution.companyFund;

    // Partner balances calculation (all-time available = total profit share - total withdrawals)
    const p1Withdrawals = withdrawals.filter(w => w.partnerId === 'partner1').reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
    const p2Withdrawals = withdrawals.filter(w => w.partnerId === 'partner2').reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    const partner1Stats = {
      name: settings.partner1Name || 'Shameem',
      profitShare: allTimeDistribution.partner1,
      withdrawn: p1Withdrawals,
      available: allTimeDistribution.partner1 - p1Withdrawals,
      periodProfitShare: distribution.partner1
    };

    const partner2Stats = {
      name: settings.partner2Name || 'Shiyan',
      profitShare: allTimeDistribution.partner2,
      withdrawn: p2Withdrawals,
      available: allTimeDistribution.partner2 - p2Withdrawals,
      periodProfitShare: distribution.partner2
    };

    return {
      period: filter,
      income: totalIncome,
      expenses: totalExpenses,
      salaries: 0,
      netProfit: netProfit,
      distribution: distribution,
      pendingPayments: pendingPayments,
      companyFundBalance: totalCompanyFundBalance,
      partner1: partner1Stats,
      partner2: partner2Stats,
      filteredIncomeCount: filteredIncome.length,
      filteredExpensesCount: filteredExpenses.length
    };
  },

  // --- INVOICE & BILLING CALCULATIONS ---

  calculateInvoiceTotals(items = [], discount = 0, taxPercent = 0, paidAmount = 0) {
    const validItems = Array.isArray(items) ? items : [];
    const subtotal = validItems.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      return sum + (qty * rate);
    }, 0);

    const disc = Math.min(subtotal, Math.max(0, Number(discount) || 0));
    const taxableAmount = Math.max(0, subtotal - disc);
    const taxPct = Math.max(0, Number(taxPercent) || 0);
    const taxAmount = Math.round(taxableAmount * (taxPct / 100));
    const totalAmount = taxableAmount + taxAmount;
    const paid = Math.max(0, Number(paidAmount) || 0);
    const balanceDue = Math.max(0, totalAmount - paid);

    let status = 'Pending';
    if (balanceDue <= 0 && totalAmount > 0) {
      status = 'Paid';
    } else if (paid > 0) {
      status = 'Partial';
    }

    return {
      subtotal,
      discount: disc,
      taxableAmount,
      taxPercent: taxPct,
      taxAmount,
      totalAmount,
      paidAmount: paid,
      balanceDue,
      status
    };
  },

  computeInvoiceSummary(invoices = []) {
    const list = Array.isArray(invoices) ? invoices : [];
    const totalInvoiced = list.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const totalReceived = list.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
    const totalOutstanding = list.reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0);
    const countPaid = list.filter(inv => inv.status === 'Paid' || (Number(inv.balanceDue) || 0) <= 0).length;
    const countPartial = list.filter(inv => inv.status === 'Partial').length;
    const countPending = list.filter(inv => inv.status === 'Pending').length;

    return {
      totalInvoiced,
      totalReceived,
      totalOutstanding,
      countPaid,
      countPartial,
      countPending,
      totalCount: list.length
    };
  }
};

// Export to window
if (typeof window !== 'undefined') {
  window.FinanceEngine = FinanceEngine;
}
