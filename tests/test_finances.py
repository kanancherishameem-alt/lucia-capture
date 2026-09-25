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

if __name__ == '__main__':
    test_profit_split_example()
    test_default_this_month()
    test_partner_available_balances()
    test_project_aswathi()
    test_number_to_words()
    print("ALL TESTS PASSED SUCCESSFULLY! ✓")
