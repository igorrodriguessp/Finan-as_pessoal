import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Advisor from './components/Advisor';
import Accounts from './components/Accounts';
import { getTransactions, addTransaction, addTransactions, deleteTransaction, getBanks } from './services/storage';
import { Transaction, FinancialStats, Category, Bank } from './types';
import { PieChart } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const AnalyticsView: React.FC<{ stats: FinancialStats }> = ({ stats }) => (
  <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Análises</h1>
        <p className="text-slate-500">Mergulhe em seus hábitos de consumo.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Categorias de Maior Gasto</h3>
          <div className="space-y-4">
            {stats.expensesByCategory.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-600 font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-slate-900 font-bold">{formatCurrency(cat.value)}</span>
                  <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${(cat.value / stats.totalExpenses) * 100}%`,
                        backgroundColor: cat.color 
                      }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-600 p-8 rounded-xl shadow-lg text-white flex flex-col justify-center items-center text-center">
          <PieChart size={64} className="mb-4 opacity-80" />
          <h3 className="text-2xl font-bold mb-2">Despesas Mensais Totais</h3>
          <p className="text-4xl font-extrabold tracking-tight mb-2">{formatCurrency(stats.totalExpenses)}</p>
          <p className="text-blue-200">
            {stats.totalIncome > stats.totalExpenses ? 'Você está economizando!' : 'Você está gastando demais.'}
          </p>
        </div>
      </div>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  useEffect(() => {
    setTransactions(getTransactions());
    setBanks(getBanks());
  }, []);

  const handleAddTransaction = (t: Transaction | Transaction[]) => {
    if (Array.isArray(t)) {
      const updated = addTransactions(t);
      setTransactions(updated);
    } else {
      const updated = addTransaction(t);
      setTransactions(updated);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = deleteTransaction(id);
    setTransactions(updated);
  };

  const stats: FinancialStats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const expensesByCategory = Object.values(Category)
      .map((cat, index) => {
        const value = transactions
          .filter(t => t.type === 'expense' && t.category === cat)
          .reduce((sum, t) => sum + t.amount, 0);
        return { 
          name: cat, 
          value,
          color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#64748b'][index]
        };
      })
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);

    return {
      totalIncome,
      totalExpenses,
      netWorth: totalIncome - totalExpenses,
      expensesByCategory,
      recentTransactions: transactions.slice(0, 10)
    };
  }, [transactions]);

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard stats={stats} />}
      {activeTab === 'accounts' && <Accounts banks={banks} transactions={transactions} />}
      {activeTab === 'transactions' && (
        <Transactions 
          transactions={transactions} 
          banks={banks}
          onAddTransaction={handleAddTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}
      {activeTab === 'analytics' && <AnalyticsView stats={stats} />}
      {activeTab === 'advisor' && <Advisor transactions={transactions} />}
    </Layout>
  );
}

export default App;