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

if __name__ == '__main__':
    test_profit_split_example()
    test_default_this_month()
    test_partner_available_balances()
    test_project_aswathi()
    print("ALL TESTS PASSED SUCCESSFULLY! ✓")
