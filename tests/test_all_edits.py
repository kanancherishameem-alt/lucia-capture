import json
import unittest

def distribute_profit(net_profit, percentages):
    p1 = round(net_profit * (percentages['partner1'] / 100))
    p2 = round(net_profit * (percentages['partner2'] / 100))
    cf = round(net_profit * (percentages['companyFund'] / 100))
    diff = net_profit - (p1 + p2 + cf)
    cf += diff
    return {'partner1': p1, 'partner2': p2, 'companyFund': cf}

class TestAllDataEditing(unittest.TestCase):
    def setUp(self):
        self.settings = {
            'partner1Name': 'Shameem',
            'partner2Name': 'Shiyan',
            'profitPercentages': {'partner1': 33.33, 'partner2': 33.33, 'companyFund': 33.34},
            'initialCompanyFundBalance': 185000
        }
        self.projects = [
            {'id': 'proj-1', 'name': 'Aswathi Wedding', 'packageAmount': 50000, 'receivedAmount': 30000, 'status': 'Payment Pending'}
        ]
        self.withdrawals = [
            {'id': 'wd-1', 'partnerId': 'partner1', 'partnerName': 'Shameem', 'amount': 10000}
        ]
        self.fund_ledger = [
            {'id': 'cf-1', 'type': 'usage', 'amount': 45000}
        ]

    def test_edit_partners_and_splits(self):
        # Update partner names and custom split 40/40/20
        self.settings['partner1Name'] = 'Shameem K'
        self.settings['partner2Name'] = 'Shiyan V'
        self.settings['profitPercentages'] = {'partner1': 40, 'partner2': 40, 'companyFund': 20}
        
        # Withdrawals should synchronize names
        for w in self.withdrawals:
            if w['partnerId'] == 'partner1':
                w['partnerName'] = self.settings['partner1Name']

        self.assertEqual(self.settings['partner1Name'], 'Shameem K')
        self.assertEqual(self.withdrawals[0]['partnerName'], 'Shameem K')
        
        dist = distribute_profit(100000, self.settings['profitPercentages'])
        self.assertEqual(dist['partner1'], 40000)
        self.assertEqual(dist['partner2'], 40000)
        self.assertEqual(dist['companyFund'], 20000)
        self.assertEqual(sum(dist.values()), 100000)

    def test_cycle_project_status(self):
        statuses = ['Upcoming', 'Ongoing', 'Payment Pending', 'Completed']
        current = self.projects[0]['status']
        next_status = statuses[(statuses.index(current) + 1) % len(statuses)]
        self.projects[0]['status'] = next_status
        self.assertEqual(self.projects[0]['status'], 'Completed')

    def test_edit_company_fund_balance(self):
        # Current ledger net: -45000
        # All time net profit company fund share: 20000
        # Target desired: 150000
        target = 150000
        ledger_diff = -45000
        profit_share = 20000
        # total = initial + ledger_diff + profit_share = 150000
        # initial = 150000 - (-45000 + 20000) = 150000 - (-25000) = 175000
        self.settings['initialCompanyFundBalance'] = target - (ledger_diff + profit_share)
        self.assertEqual(self.settings['initialCompanyFundBalance'], 175000)

        # verify total
        total = self.settings['initialCompanyFundBalance'] + ledger_diff + profit_share
        self.assertEqual(total, target)

if __name__ == '__main__':
    unittest.main()
