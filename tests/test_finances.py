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
    # Prompt example:
    # Income = 2,00,000, Expenses = 50,000, Salaries = 30,000 => Net Profit = 1,20,000
    income = 200000
    expenses = 50000
    salaries = 30000
    net_profit = income - expenses - salaries
    assert net_profit == 120000, f"Expected 120000, got {net_profit}"

    p1, p2, cf, total = distribute_profit(net_profit, 33.33, 33.33, 33.34)
    print(f"Example Test: Net Profit={net_profit} -> Shameem={p1}, Shiyan={p2}, Company Fund={cf}, Total={total}")
    assert p1 == 39996, f"Expected 39996, got {p1}"
    assert p2 == 39996, f"Expected 39996, got {p2}"
    assert cf == 40008, f"Expected 40008, got {cf}"
    assert total == net_profit, f"Distributed total {total} must strictly match net profit {net_profit}"

def test_default_this_month():
    # This month:
    # Income: 1,50,000, Expenses: 40,000, Salaries: 20,000 => Net Profit: 90,000
    income = 150000
    expenses = 40000
    salaries = 20000
    net_profit = income - expenses - salaries
    assert net_profit == 90000, f"Expected 90000, got {net_profit}"

    p1, p2, cf, total = distribute_profit(net_profit, 33.33, 33.33, 33.34)
    print(f"This Month Test: Net Profit={net_profit} -> Shameem={p1}, Shiyan={p2}, Company Fund={cf}, Total={total}")
    # Under strict 33.33% / 33.33% / 33.34% formula:
    assert p1 == 29997, f"Expected 29997, got {p1}"
    assert p2 == 29997, f"Expected 29997, got {p2}"
    assert cf == 30006, f"Expected 30006, got {cf}"
    assert total == 90000, f"Expected 90000, got {total}"

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

if __name__ == '__main__':
    test_profit_split_example()
    test_default_this_month()
    test_partner_available_balances()
    test_project_aswathi()
    print("ALL TESTS PASSED SUCCESSFULLY! ✓")
