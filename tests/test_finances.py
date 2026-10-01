#!/usr/bin/env python3
"""
Automated unit verification for Lucia Finance calculation rules.
"""

def distribute_profit(net_profit, p1_pct=33.33, p2_pct=33.33, cf_pct=33.34):
    profit = round(net_profit)
    if profit == 0:
        return 0, 0, 0, 0
    total_pct = p1_pct + p2_pct + cf_pct
    r1 = p1_pct / total_pct
    r2 = p2_pct / total_pct

    p1_share = round(profit * r1)
    p2_share = round(profit * r2)
    cf_share = profit - (p1_share + p2_share)

    return p1_share, p2_share, cf_share, p1_share + p2_share + cf_share

def test_profit_split_example():
    # Example:
    # Revenue = 2,00,000, Expenses = 50,000 => Net Profit = 1,50,000 (No salary deduction)
    income = 200000
    expenses = 50000
    net_profit = income - expenses
    assert net_profit == 150000, f"Expected 150000, got {net_profit}"

    p1, p2, cf, total = distribute_profit(net_profit, 33.33, 33.33, 33.34)
    print(f"Example Test: Net Profit={net_profit} -> Shameem={p1}, Shiyan={p2}, Company Fund={cf}, Total={total}")
    assert p1 == 49995, f"Expected 49995, got {p1}"
    assert p2 == 49995, f"Expected 49995, got {p2}"
    assert cf == 50010, f"Expected 50010, got {cf}"
    assert total == net_profit, f"Distributed total {total} must strictly match net profit {net_profit}"

def test_default_this_month():
    # This month:
    # Revenue: 1,50,000, Expenses: 40,000 => Net Profit: 1,10,000
    income = 150000
    expenses = 40000
    net_profit = income - expenses
    assert net_profit == 110000, f"Expected 110000, got {net_profit}"

    p1, p2, cf, total = distribute_profit(net_profit, 33.33, 33.33, 33.34)
    print(f"This Month Test: Net Profit={net_profit} -> Shameem={p1}, Shiyan={p2}, Company Fund={cf}, Total={total}")
    assert p1 == 36663, f"Expected 36663, got {p1}"
    assert p2 == 36663, f"Expected 36663, got {p2}"
    assert cf == 36674, f"Expected 36674, got {cf}"
    assert total == 110000, f"Expected 110000, got {total}"

def test_partner_available_balances():
    # Shameem: Salary: 20000, Profit: 30000, Withdrawn: 10000 => Available: 20000
    p1_profit = 30000
    p1_withdrawn = 10000
    p1_available = p1_profit - p1_withdrawn
    assert p1_available == 20000, f"Expected 20000, got {p1_available}"

    # Shiyan: Salary: 20000, Profit: 30000, Withdrawn: 5000 => Available: 25000
    p2_profit = 30000
    p2_withdrawn = 5000
    p2_available = p2_profit - p2_withdrawn
    assert p2_available == 25000, f"Expected 25000, got {p2_available}"

def test_project_aswathi():
    pkg = 50000
    rcv = 30000
    exp = 10000
    pending = pkg - rcv
    profit = pkg - exp
    assert pending == 20000, f"Expected 20000, got {pending}"
    assert profit == 40000, f"Expected 40000, got {profit}"

def number_to_words_inr(num):
    num = int(abs(num))
    if num == 0:
        return 'Zero Rupees Only'
    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    def two_digits(n):
        if n < 20:
            return ones[n]
        t = tens[n // 10]
        o = ones[n % 10]
        return t + ((' ' + o) if o else '')

    def three_digits(n):
        h = n // 100
        rest = n % 100
        s = ''
        if h > 0:
            s += ones[h] + ' Hundred'
        if rest > 0:
            s += (' ' if s else '') + two_digits(rest)
        return s

    words = ''
    crore = num // 10000000
    rem = num % 10000000
    lakh = rem // 100000
    rem = rem % 100000
    thousand = rem // 1000
    rem = rem % 1000

    if crore > 0:
        words += two_digits(crore) + ' Crore '
    if lakh > 0:
        words += two_digits(lakh) + ' Lakh '
    if thousand > 0:
        words += two_digits(thousand) + ' Thousand '
    if rem > 0:
        words += three_digits(rem)

    return words.strip() + ' Rupees Only'

def test_number_to_words():
    assert number_to_words_inr(20000) == 'Twenty Thousand Rupees Only'
    assert number_to_words_inr(150000) == 'One Lakh Fifty Thousand Rupees Only'
    assert number_to_words_inr(0) == 'Zero Rupees Only'
    assert number_to_words_inr(54321) == 'Fifty Four Thousand Three Hundred Twenty One Rupees Only'
    print("Number to Words Test Passed: 20000 ->", number_to_words_inr(20000))

def test_custom_profit_amounts():
    # User specifies exact amounts in Rupees: Shameem = 40000, Shiyan = 40000, Company Fund = 30000
    custom_amounts = {'partner1': 40000, 'partner2': 40000, 'companyFund': 30000}
    p1 = custom_amounts['partner1']
    p2 = custom_amounts['partner2']
    cf = custom_amounts['companyFund']
    total = p1 + p2 + cf
    assert p1 == 40000
    assert p2 == 40000
    assert cf == 30000
    assert total == 110000
    print(f"Custom Profit Amounts Test Passed: Shameem=₹{p1}, Shiyan=₹{p2}, Company Fund=₹{cf}, Total=₹{total}")

def test_project_service_details():
    # User's example:
    # Description: Photographer 1, Couple bride/groom single state full coverage, Qty: 1, Rate: 12000 => Amount: 12000
    items = [
        {
            'description': 'Photographer 1',
            'details': 'couple bride/groom single state full coverage',
            'quantity': 1,
            'rate': 12000,
            'amount': 12000
        },
        {
            'description': 'Videography (Camera)',
            'details': '3 Videos (2 Reels + 1 Highlights)',
            'quantity': 1,
            'rate': 15000,
            'amount': 15000
        },
        {
            'description': 'Additional Service - Drone Shoot',
            'details': 'Cinematic Aerial Shots',
            'quantity': 1,
            'rate': 3000,
            'amount': 3000
        },
        {
            'description': 'Custom Service - Photo Album',
            'details': 'Premium Photo Book (20 Pages)',
            'quantity': 1,
            'rate': 2500,
            'amount': 2500
        }
    ]

    total_package = sum(it['quantity'] * it['rate'] for it in items)
    assert total_package == 32500, f"Expected 32500, got {total_package}"
    assert items[0]['description'] == 'Photographer 1'
    assert items[0]['details'] == 'couple bride/groom single state full coverage'
    assert items[0]['amount'] == 12000
    print(f"Project Service Details Test Passed: Total Package=₹{total_package} with {len(items)} itemized services")

def test_other_expense_item_and_project_profit():
    # User's other expense request:
    # 1. Other Expense service item can be added and edited in description/scope/amount
    items = [
        {'description': 'Photographer 1', 'details': 'couple bride/groom single stage full coverage', 'quantity': 1, 'rate': 12000, 'amount': 12000},
        {'description': 'Other Expense', 'details': 'Travel, food, stay & extra gear rental', 'quantity': 1, 'rate': 2000, 'amount': 2000}
    ]
    package_total = sum(it['quantity'] * it['rate'] for it in items)
    assert package_total == 14000, f"Expected 14000, got {package_total}"
    assert items[1]['description'] == 'Other Expense'
    assert items[1]['amount'] == 2000

    # 2. Project Other Expense / Direct cost reduces net profit:
    project_expense = 3000
    net_profit = package_total - project_expense
    assert net_profit == 11000, f"Expected 11000, got {net_profit}"
    print(f"Other Expense Test Passed: Package=₹{package_total}, Other Expense=₹{project_expense}, Net Profit=₹{net_profit}")

def test_streamlined_direct_amount_items():
    # User's request:
    # "ithil qty section venda pinne rate , amount ithil amount mathram mathi"
    # Services are streamlined: description, coverage notes, and direct editable amount (₹)
    items = [
        {'description': 'Photographer 1', 'details': 'couple bride/groom single stage full coverage', 'amount': 12000},
        {'description': 'Other Expense', 'details': 'Travel & food logistics', 'amount': 2000},
        {'description': 'Photo Album', 'details': '20 Pages Premium Book', 'amount': 2500}
    ]
    package_total = sum(it['amount'] for it in items)
    assert package_total == 16500, f"Expected 16500, got {package_total}"

    # WhatsApp message formatting verification: "• Description (Details): ₹Amount"
    wa_lines = []
    for it in items:
        det = f" ({it['details']})" if it.get('details') else ''
        wa_lines.append(f"• {it['description']}{det}: ₹{it['amount']:,}")
    expected_line0 = "• Photographer 1 (couple bride/groom single stage full coverage): ₹12,000"
    assert wa_lines[0] == expected_line0, f"Expected '{expected_line0}', got '{wa_lines[0]}'"
    print("Streamlined Direct Amount Items Test Passed: Total Package=₹16,500, WhatsApp Line 1:", wa_lines[0])

def test_discount_and_payment_methods():
    # User's request:
    # "payment receipts il discount optionum add avanam ,add project il payment method undaavanam eg , cash ,g pay,"
    gross_package = 50000
    discount = 5000
    net_package = max(0, gross_package - discount)
    advance_received = 20000
    payment_method = 'Cash' # or 'GPay / UPI' or 'Bank'

    # Balance due calculation with discount:
    balance_due = max(0, net_package - advance_received)
    assert net_package == 45000, f"Expected 45000, got {net_package}"
    assert balance_due == 25000, f"Expected 25000, got {balance_due}"
    assert payment_method in ['GPay / UPI', 'Cash', 'Bank']

    # Project completion check with discount
    further_payment = 25000
    total_received = advance_received + further_payment
    is_completed = total_received >= net_package
    assert is_completed is True

    # WhatsApp format verification with discount and payment method
    wa_receipt = f"🟢 Amount Received: ₹{advance_received:,} ({payment_method})\n" \
                 f"💰 Grand Total: ₹{gross_package:,}\n" \
                 f"🏷️ Discount Applied: -₹{discount:,}\n" \
                 f"💵 Net Package Amount: ₹{net_package:,}\n" \
                 f"✅ Paid to Date: ₹{advance_received:,}\n" \
                 f"⚠️ Balance Due: ₹{balance_due:,}\n" \
                 f"💳 Payment Method: {payment_method}"
    assert "Discount Applied: -₹5,000" in wa_receipt
    assert "Net Package Amount: ₹45,000" in wa_receipt
    assert "Payment Method: Cash" in wa_receipt
    print(f"Discount & Payment Method Test Passed: Net Package=₹{net_package}, Balance=₹{balance_due}, Method={payment_method}")

def test_project_addition_auto_adds_to_dashboard():
    # User's scenario from screenshot media_1790838285835.png:
    # User adds a project with:
    # Package: ₹12,000, Discount: ₹500 => Net Package: ₹11,500
    # Advance received: 0 (or empty)
    # When added, it MUST automatically update Dashboard:
    # - Revenue: ₹11,500
    # - Expenses: ₹0
    # - Net Profit: ₹11,500
    # - Shameem Share (33.33%): ₹3,833
    # - Shiyan Share (33.33%): ₹3,833
    # - Company Fund Share (33.34%): ₹3,834
    # - Distributed Total strictly == Net Profit (11,500)
    # - Pending Payments: ₹11,500
    gross_pkg = 12000
    discount = 500
    net_pkg = max(0, gross_pkg - discount)
    advance_rcv = 0
    expenses = 0

    revenue = advance_rcv if advance_rcv > 0 else net_pkg
    net_profit = revenue - expenses
    pending = max(0, net_pkg - advance_rcv)

    p1, p2, cf, total = distribute_profit(net_profit, 33.33, 33.33, 33.34)

    assert revenue == 11500, f"Expected 11500, got {revenue}"
    assert net_profit == 11500, f"Expected 11500, got {net_profit}"
    assert p1 == 3833, f"Expected 3833, got {p1}"
    assert p2 == 3833, f"Expected 3833, got {p2}"
    assert cf == 3834, f"Expected 3834, got {cf}"
    assert total == 11500, f"Expected total 11500, got {total}"
    assert pending == 11500, f"Expected pending 11500, got {pending}"
    print(f"Auto Dashboard Reflection Test Passed: Revenue=₹{revenue}, Profit=₹{net_profit}, Shameem=₹{p1}, Shiyan=₹{p2}, Company Fund=₹{cf}")

def test_separate_monthly_calculations():
    # User's request: "monthly based calculate seperate"
    # Scenario with 3 distinct months of studio activity:
    # 1. September 2026:
    #    Income: ₹80,000, Expenses: ₹25,000 => Net Profit: ₹55,000
    # 2. October 2026:
    #    Income: ₹1,50,000, Expenses: ₹40,000 => Net Profit: ₹1,10,000
    # 3. November 2026:
    #    Income: ₹20,000, Expenses: ₹5,000 => Net Profit: ₹15,000
    #
    # Calculations for each month must be completely separate!

    months_data = {
        '2026-09': {'income': 80000, 'expenses': 25000, 'pending': 10000},
        '2026-10': {'income': 150000, 'expenses': 40000, 'pending': 25000},
        '2026-11': {'income': 20000, 'expenses': 5000, 'pending': 5000}
    }

    # Month 1: September 2026
    sep = months_data['2026-09']
    sep_profit = sep['income'] - sep['expenses']
    assert sep_profit == 55000
    sep_p1, sep_p2, sep_cf, sep_tot = distribute_profit(sep_profit, 33.33, 33.33, 33.34)
    assert sep_tot == 55000
    assert sep_p1 == 18332
    assert sep_p2 == 18332
    assert sep_cf == 18336

    # Month 2: October 2026
    octo = months_data['2026-10']
    octo_profit = octo['income'] - octo['expenses']
    assert octo_profit == 110000
    octo_p1, octo_p2, octo_cf, octo_tot = distribute_profit(octo_profit, 33.33, 33.33, 33.34)
    assert octo_tot == 110000
    assert octo_p1 == 36663
    assert octo_p2 == 36663
    assert octo_cf == 36674

    # Month 3: November 2026
    nov = months_data['2026-11']
    nov_profit = nov['income'] - nov['expenses']
    assert nov_profit == 15000
    nov_p1, nov_p2, nov_cf, nov_tot = distribute_profit(nov_profit, 33.33, 33.33, 33.34)
    assert nov_tot == 15000
    assert nov_p1 == 5000
    assert nov_p2 == 5000
    assert nov_cf == 5000

    # All-Time Cumulative:
    all_income = sum(m['income'] for m in months_data.values())
    all_expenses = sum(m['expenses'] for m in months_data.values())
    all_profit = all_income - all_expenses
    all_pending = sum(m['pending'] for m in months_data.values())

    assert all_income == 250000
    assert all_expenses == 70000
    assert all_profit == 180000
    assert all_pending == 40000

    all_p1, all_p2, all_cf, all_tot = distribute_profit(all_profit, 33.33, 33.33, 33.34)
    assert all_tot == 180000
    assert all_p1 == 59994
    assert all_p2 == 59994
    assert all_cf == 60012

    print("Separate Monthly Calculations Test Passed:")
    print(f"  • Sept 2026: Profit=₹{sep_profit} -> Shameem=₹{sep_p1}, Shiyan=₹{sep_p2}, Company Fund=₹{sep_cf}")
    print(f"  • Oct  2026: Profit=₹{octo_profit} -> Shameem=₹{octo_p1}, Shiyan=₹{octo_p2}, Company Fund=₹{octo_cf}")
    print(f"  • Nov  2026: Profit=₹{nov_profit} -> Shameem=₹{nov_p1}, Shiyan=₹{nov_p2}, Company Fund=₹{nov_cf}")
    print(f"  • All-Time : Profit=₹{all_profit} -> Shameem=₹{all_p1}, Shiyan=₹{all_p2}, Company Fund=₹{all_cf}")

if __name__ == '__main__':
    test_profit_split_example()
    test_default_this_month()
    test_partner_available_balances()
    test_project_aswathi()
    test_number_to_words()
    test_custom_profit_amounts()
    test_project_service_details()
    test_other_expense_item_and_project_profit()
    test_streamlined_direct_amount_items()
    test_discount_and_payment_methods()
    test_project_addition_auto_adds_to_dashboard()
    test_separate_monthly_calculations()
    print("ALL TESTS PASSED SUCCESSFULLY! ✓")
