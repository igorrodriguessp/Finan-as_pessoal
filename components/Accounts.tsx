import React from 'react';
import { Bank, Transaction } from '../types';
import { CreditCard, Wallet, Calendar, TrendingDown } from 'lucide-react';

interface AccountsProps {
  banks: Bank[];
  transactions: Transaction[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const Accounts: React.FC<AccountsProps> = ({ banks, transactions }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Helper to calculate bank stats
  const getBankStats = (bankId: string, initialBalance: number) => {
    const bankTransactions = transactions.filter(t => t.bankId === bankId);
    
    // 1. Current Balance
    // Sum of all past and current income - expenses
    const now = new Date();
    const balanceChanges = bankTransactions
      .filter(t => new Date(t.date) <= now) 
      .reduce((acc, t) => {
        return t.type === 'income' ? acc + t.amount : acc - t.amount;
      }, 0);
    
    const currentBalance = initialBalance + balanceChanges;

    // 2. Monthly Expenses
    const monthlyExpenses = bankTransactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && 
               d.getFullYear() === currentYear && 
               t.type === 'expense';
      })
      .reduce((acc, t) => acc + t.amount, 0);

    // 3. Active Installments Logic
    // Group transactions by installment ID that have FUTURE payments pending
    const installmentGroups = new Map<string, Transaction[]>();
    
    bankTransactions
      .filter(t => t.installment) // Only installment transactions
      .forEach(t => {
        if (!t.installment?.id) return;
        const group = installmentGroups.get(t.installment.id) || [];
        group.push(t);
        installmentGroups.set(t.installment.id, group);
      });

    const activeInstallments = Array.from(installmentGroups.entries())
      .map(([id, group]) => {
        // Sort by date
        group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const first = group[0];
        const total = first.installment!.total;
        
        // Count how many are strictly in the future (after current date)
        const remaining = group.filter(t => new Date(t.date) > new Date()).length;
        
        // If 0 remaining, it's not "active" in terms of future debt, but we might want to show it if it's recent. 
        // For this requirement, let's show if remaining > 0.
        if (remaining === 0) return null;

        // Clean merchant name (remove "(1/N)")
        const cleanName = first.merchant.replace(/\s\(\d+\/\d+\)$/, '');

        return {
          id,
          description: cleanName,
          totalInstallments: total,
          remainingInstallments: remaining,
          installmentValue: first.amount
        };
      })
      .filter(Boolean) as {
        id: string, 
        description: string, 
        totalInstallments: number, 
        remainingInstallments: number, 
        installmentValue: number
      }[];

    return {
      currentBalance,
      monthlyExpenses,
      activeInstallments
    };
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Minhas Contas</h1>
        <p className="text-slate-500">Gerencie saldos e parcelamentos por banco.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banks.map(bank => {
          const stats = getBankStats(bank.id, bank.initialBalance);
          
          return (
            <div key={bank.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
              {/* Card Header (Bank Card Look) */}
              <div 
                className="p-6 text-white relative overflow-hidden"
                style={{ backgroundColor: bank.color }}
              >
                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white opacity-10" />
                <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 rounded-full bg-white opacity-10" />

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex items-center space-x-2">
                     <CreditCard size={24} className="opacity-90" />
                     <span className="font-bold text-lg tracking-wide">{bank.name}</span>
                  </div>
                  <Wallet size={20} className="opacity-70" />
                </div>
                
                <div className="relative z-10">
                  <p className="text-sm opacity-80 mb-1">Saldo Atual</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.currentBalance)}</p>
                </div>
              </div>

              {/* Monthly Spend */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center text-slate-600 text-sm font-medium">
                   <TrendingDown size={16} className="mr-2 text-rose-500" />
                   Gastos do Mês
                </div>
                <span className="text-rose-600 font-bold">{formatCurrency(stats.monthlyExpenses)}</span>
              </div>

              {/* Active Installments List */}
              <div className="flex-1 p-0 overflow-y-auto max-h-80">
                <div className="px-6 py-3 bg-white border-b border-slate-50">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parcelamentos Ativos</h4>
                </div>
                
                {stats.activeInstallments.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {stats.activeInstallments.map((inst) => (
                      <div key={inst.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-slate-800 text-sm">{inst.description}</span>
                          <span className="font-bold text-slate-900 text-sm">{formatCurrency(inst.installmentValue)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500">
                          <div className="flex items-center bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            <Calendar size={10} className="mr-1" />
                            {inst.remainingInstallments} restantes
                          </div>
                          <span>Total: {inst.totalInstallments}x</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    Nenhum parcelamento ativo.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Accounts;