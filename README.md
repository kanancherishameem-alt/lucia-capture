# LUCIA FINANCE — Studio Money Tracker

A simple, fast, and smooth finance tracker crafted specifically for **Lucia Photography & Videography**.

Built with a **Black + Gold + White** luxury design system, large readable numbers, mobile-first bottom navigation, one-tap quick transaction logging, and automated 3-way profit split.

---

## Quick Start (How to Run)

### Option 1: Instant Direct Open (Zero Setup)
Simply double-click [`index.html`](file:///Users/user/Downloads/vegitable/ezgif-75d65c34c244108e-png-split/fresh%20cut/lucia%20capture/index.html) or run in terminal:
```bash
open index.html
```
The app runs completely client-side in Safari, Chrome, or any browser with instant offline persistence via `localStorage`.

### Option 2: Run Local Server (Computer & Mobile Access)
To access the app on your iPhone or Android over your local Wi-Fi network:
```bash
python3 server.py
```
This displays:
```
▸ On your Mac/PC:    http://localhost:8080
▸ On your Mobile:    http://<Your-Local-IP>:8080
```
Open that link in Safari or Chrome on your mobile phone, and tap **"Add to Home Screen"** to run it like a native iOS/Android app!

---

## Financial Calculation Rules

### The Golden Rule
$$\mathbf{Total\ Income} - \mathbf{Business\ Expenses} - \mathbf{Partner\ Salaries} = \mathbf{Net\ Profit}$$

### Profit Distribution (Editable in Settings)
- **Partner 1 — Shameem**: 33.33%
- **Partner 2 — Shiyan**: 33.33%
- **Company Fund**: 33.34%

The total distributed will **always strictly equal 100% of the Net Profit** with exact rupee rounding reconciliation (e.g. ₹1,20,000 net profit produces ₹39,996 for Shameem, ₹39,996 for Shiyan, and ₹40,008 for Company Fund, summing to ₹1,20,000).

---

## App Features

1. **Home Dashboard**:
   - Immediate visibility of This Month's Income (₹1,50,000), Expenses (₹40,000), Salaries (₹20,000), and Net Profit (₹90,000).
   - Automated 3-way profit split cards.
   - Pending payments indicator and Company Fund balance.
   - Real-time comparison bar chart and recent activity feed.

2. **Projects Hub**:
   - Manage gigs (e.g. *Aswathi Wedding*, *Rahul & Sneha Pre-wedding*, *Horizon Fashion Commercial*).
   - Track Package amount, Received, Pending due, and Project-specific expenses.
   - One-tap **"Mark as Paid"** to instantly collect remaining balance.
   - Tap any project to open a drawer detailing all linked income and expenses.

3. **Income & Expenses**:
   - Minimal click modals with payment method tags (`UPI`, `Cash`, `Bank`).
   - Category filtering for expenses (`Travel`, `Equipment`, `Editing`, `Food`, `Software`, `Marketing`, `Other`).
   - Category expense distribution donut chart.
   - Toast notification on save: **`Income added successfully ✓`**.

4. **Partners Hub**:
   - Dedicated profiles for **Shameem** and **Shiyan**.
   - Separate accounting for **Base Salary**, **Profit Share**, and **Withdrawals**.
   - Withdrawable Available Balance: $\text{Profit Share} - \text{Withdrawn}$.
   - One-tap button to record partner withdrawals.

5. **Company Fund**:
   - Large gold balance display (₹1,20,000).
   - Automatically credited with company's 33.34% share of net monthly profit.
   - `+ Add Fund` (capital investment/infusion) and `− Use Fund` (e.g. Camera ₹50,000, Lens ₹30,000, Equipment ₹10,000, Marketing ₹5,000).

6. **Reports & Exports**:
   - Monthly and annual performance filter (`This Month`, `Last Month`, `This Year`, `All Time`).
   - One-click **Export to CSV**.
   - Clean **Print / PDF Report** formatted for white paper printing.

7. **Settings & Data Backup**:
   - Real-time profit percentage editor with 100% validation check.
   - **Download Backup (.json)** and **Restore Backup** anytime.
   - **Reset Sample Data** button to quickly test scenarios.
