import React from 'react';
import { Transaction, FinancialStats } from '../types';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardProps {
  stats: FinancialStats;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ElementType; trend?: string; color: string }> = ({ label, value, icon: Icon, trend, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        <span className="text-green-500 font-medium flex items-center">
          <TrendingUp size={16} className="mr-1" /> {trend}
        </span>
        <span className="text-slate-400 ml-2">vs mês anterior</span>
      </div>
    )}
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const chartData = stats.recentTransactions
    .slice()
    .reverse()
    .map(t => ({
      name: new Date(t.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      amount: t.type === 'income' ? t.amount : -t.amount,
      value: t.amount // Absolute value for visuals if needed
    }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Visão Geral Financeira</h1>
          <p className="text-slate-500">Bem-vindo de volta! Aqui está seu resumo financeiro.</p>
        </div>
        <div className="text-sm text-slate-500 bg-white px-3 py-1 rounded-md border border-slate-200">
          Última atualização: Agora mesmo
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Saldo Total" 
          value={formatCurrency(stats.netWorth)} 
          icon={Wallet} 
          trend="+12.5%"
          color="bg-blue-500"
        />
        <StatCard 
          label="Receita Total" 
          value={formatCurrency(stats.totalIncome)} 
          icon={TrendingUp} 
          color="bg-emerald-500"
        />
        <StatCard 
          label="Despesas Totais" 
          value={formatCurrency(stats.totalExpenses)} 
          icon={TrendingDown} 
          color="bg-rose-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Histórico de Fluxo de Caixa</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Despesas por Categoria</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.expensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;