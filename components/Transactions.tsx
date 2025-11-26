import React, { useState, useRef, useEffect } from 'react';
import { Transaction, Category, TransactionType, Bank } from '../types';
import { analyzeReceipt } from '../services/geminiService';
import { Plus, Trash2, Search, Upload, Loader2, Camera, X, CalendarClock, CreditCard } from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  banks: Bank[];
  onAddTransaction: (t: Transaction | Transaction[]) => void;
  onDeleteTransaction: (id: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const Transactions: React.FC<TransactionsProps> = ({ transactions, banks, onAddTransaction, onDeleteTransaction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('');
  
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(Category.Food);
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  
  // Installment State
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsTotal, setInstallmentsTotal] = useState<string>('2');
  const [installmentValue, setInstallmentValue] = useState<string>('');
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default bank if available
  useEffect(() => {
    if (banks.length > 0 && !selectedBankId) {
      setSelectedBankId(banks[0].id);
    }
  }, [banks, selectedBankId]);

  // Effect to sync amount when in installment mode
  useEffect(() => {
    if (isInstallment && installmentsTotal && installmentValue) {
      const total = parseFloat(installmentsTotal) * parseFloat(installmentValue);
      setAmount(isNaN(total) ? '' : total.toFixed(2));
    }
  }, [isInstallment, installmentsTotal, installmentValue]);

  // Effect to sync installment value if user types total amount
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val);
    if (isInstallment && installmentsTotal && val) {
      const instVal = parseFloat(val) / parseFloat(installmentsTotal);
      setInstallmentValue(isNaN(instVal) ? '' : instVal.toFixed(2));
    }
  };

  const filteredTransactions = transactions.filter(t => 
    t.merchant.toLowerCase().includes(filter.toLowerCase()) ||
    t.category.toLowerCase().includes(filter.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeReceipt(file);
      
      if (result.date) setDate(result.date);
      if (result.merchant) setMerchant(result.merchant);
      
      if (result.amount) {
        // Convert to string and ensure fixed decimals if needed
        const amountStr = result.amount.toFixed(2);
        setAmount(amountStr);
        
        // If we are in installment mode, recalc
        if (isInstallment && installmentsTotal) {
           const instVal = result.amount / parseFloat(installmentsTotal);
           setInstallmentValue(instVal.toFixed(2));
        }
      }
      
      if (result.category) setCategory(result.category);
      if (result.type) setType(result.type);
      
      // Optional: Visual confirmation could be a toast, for now just log or allow UI to update
      // Since fields update immediately via state, user sees it.
    } catch (error) {
      alert("Falha ao analisar o recibo. Por favor, verifique a imagem e tente novamente.");
    } finally {
      setIsAnalyzing(false);
      // clear input to allow selecting same file again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isInstallment && type === 'expense') {
      const numInstallments = parseInt(installmentsTotal);
      const valInstallment = parseFloat(installmentValue);
      const groupId = Date.now().toString(); // unique ID for this group
      const newTransactions: Transaction[] = [];

      for (let i = 0; i < numInstallments; i++) {
        // Calculate date for each installment (increment month)
        const d = new Date(date);
        d.setMonth(d.getMonth() + i);
        // Handle year rollover and month length edges automatically by Date object
        const dateStr = d.toISOString().split('T')[0];

        newTransactions.push({
          id: `${groupId}-${i}`,
          date: dateStr,
          merchant: `${merchant} (${i + 1}/${numInstallments})`,
          amount: valInstallment,
          category,
          type,
          bankId: selectedBankId,
          installment: {
            current: i + 1,
            total: numInstallments,
            id: groupId
          }
        });
      }
      onAddTransaction(newTransactions);
    } else {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        date,
        merchant,
        amount: parseFloat(amount),
        category,
        type,
        bankId: selectedBankId
      };
      onAddTransaction(newTransaction);
    }

    setIsModalOpen(false);
    // Reset
    setMerchant('');
    setAmount('');
    setCategory(Category.Food);
    setIsInstallment(false);
    setInstallmentsTotal('2');
    setInstallmentValue('');
  };

  const getBankName = (id: string) => banks.find(b => b.id === id)?.name || 'Desconhecido';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transações</h1>
          <p className="text-slate-500">Gerencie suas receitas e despesas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Adicionar Transação</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center space-x-3 bg-white">
          <Search size={20} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar transações..." 
            className="flex-1 outline-none text-slate-700 placeholder:text-slate-400 bg-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium text-sm">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Comerciante/Descrição</th>
                <th className="px-6 py-4">Banco</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {t.merchant}
                    {t.installment && (
                      <span className="ml-2 text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                         Parcela
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {getBankName(t.bankId)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => onDeleteTransaction(t.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Adicionar Transação</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Scan Button */}
              <div className="flex justify-center mb-6">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-blue-600"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={24} className="animate-spin mb-2" />
                      <span className="text-sm font-medium">Lendo Recibo (IA)...</span>
                    </>
                  ) : (
                    <>
                      <Camera size={24} className="mb-1" />
                      <span className="text-sm font-medium">Digitalizar Recibo</span>
                    </>
                  )}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
                    <input 
                      required
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                    <select 
                      value={type} 
                      onChange={(e) => setType(e.target.value as TransactionType)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    >
                      <option value="expense">Despesa</option>
                      <option value="income">Receita</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Conta Bancária</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select 
                      required
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white text-slate-900"
                    >
                      <option value="" disabled>Selecione um banco</option>
                      {banks.map(bank => (
                        <option key={bank.id} value={bank.id}>{bank.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Comerciante/Descrição</label>
                  <input 
                    required
                    type="text" 
                    placeholder="ex: Starbucks"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" 
                  />
                </div>

                {/* Installments Toggle */}
                {type === 'expense' && (
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isInstallment}
                        onChange={(e) => setIsInstallment(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-700 flex items-center">
                        <CalendarClock size={16} className="mr-1.5 text-blue-500" />
                        Compra Parcelada?
                      </span>
                    </label>

                    {isInstallment && (
                      <div className="mt-3 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Parcelas (Qtd)</label>
                          <input 
                            type="number" 
                            min="2"
                            max="60"
                            value={installmentsTotal}
                            onChange={(e) => setInstallmentsTotal(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Valor da Parcela</label>
                          <div className="relative">
                            <span className="absolute left-2 top-2 text-slate-400 text-xs">R$</span>
                            <input 
                              type="number"
                              step="0.01" 
                              value={installmentValue}
                              onChange={(e) => {
                                setInstallmentValue(e.target.value);
                                if (installmentsTotal && e.target.value) {
                                  // Update total amount immediately for visual feedback
                                  const total = parseFloat(installmentsTotal) * parseFloat(e.target.value);
                                  setAmount(total.toFixed(2));
                                }
                              }}
                              className="w-full pl-7 pr-2 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" 
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Valor Total</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400">R$</span>
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={handleAmountChange}
                        // If installment mode is active, total is read-only unless user wants to calc installment from total
                        className={`w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${isInstallment ? 'bg-slate-50 text-slate-500' : 'bg-white text-slate-900'}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    >
                      {Object.values(Category).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-200"
                  >
                    {isInstallment ? `Gerar ${installmentsTotal} Transações` : 'Salvar Transação'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;