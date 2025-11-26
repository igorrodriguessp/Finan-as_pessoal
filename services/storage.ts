import { Transaction, Category, Bank } from '../types';

const STORAGE_KEY_TRANSACTIONS = 'geminifin_transactions';
const STORAGE_KEY_BANKS = 'geminifin_banks';

const MOCK_BANKS: Bank[] = [
  { id: 'bank_1', name: 'Nubank', color: '#820ad1', initialBalance: 1500.00 },
  { id: 'bank_2', name: 'Bradesco', color: '#cc092f', initialBalance: 5000.00 },
  { id: 'bank_3', name: 'Neon', color: '#00b4d8', initialBalance: 800.00 },
];

const MOCK_DATA: Transaction[] = [
  { id: '1', date: '2023-10-01', merchant: 'Supermercado Silva', amount: 124.50, type: 'expense', category: Category.Food, bankId: 'bank_1' },
  { id: '2', date: '2023-10-02', merchant: 'Posto Shell', amount: 45.00, type: 'expense', category: Category.Transport, bankId: 'bank_2' },
  { id: '3', date: '2023-10-03', merchant: 'Salário Tech Corp', amount: 3500.00, type: 'income', category: Category.Salary, bankId: 'bank_1' },
  { id: '4', date: '2023-10-05', merchant: 'Netflix', amount: 15.99, type: 'expense', category: Category.Entertainment, bankId: 'bank_3' },
  { id: '5', date: '2023-10-06', merchant: 'Conta de Luz', amount: 120.00, type: 'expense', category: Category.Utilities, bankId: 'bank_2' },
  { id: '6', date: '2023-10-08', merchant: 'Farmácia Pague Menos', amount: 32.40, type: 'expense', category: Category.Health, bankId: 'bank_1' },
  { id: '7', date: '2023-10-10', merchant: 'Amazon Brasil', amount: 89.99, type: 'expense', category: Category.Shopping, bankId: 'bank_3' },
];

// --- Transactions ---

export const getTransactions = (): Transaction[] => {
  const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(MOCK_DATA));
    return MOCK_DATA;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Falha ao analisar transações", e);
    return [];
  }
};

export const saveTransactions = (transactions: Transaction[]) => {
  localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
};

export const addTransaction = (transaction: Transaction) => {
  const current = getTransactions();
  const updated = [transaction, ...current];
  saveTransactions(updated);
  return updated;
};

export const addTransactions = (newTransactions: Transaction[]) => {
  const current = getTransactions();
  const updated = [...newTransactions, ...current];
  saveTransactions(updated);
  return updated;
};

export const deleteTransaction = (id: string) => {
  const current = getTransactions();
  const updated = current.filter(t => t.id !== id);
  saveTransactions(updated);
  return updated;
};

// --- Banks ---

export const getBanks = (): Bank[] => {
  const stored = localStorage.getItem(STORAGE_KEY_BANKS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_BANKS, JSON.stringify(MOCK_BANKS));
    return MOCK_BANKS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Falha ao analisar bancos", e);
    return [];
  }
};

export const saveBanks = (banks: Bank[]) => {
  localStorage.setItem(STORAGE_KEY_BANKS, JSON.stringify(banks));
};

export const addBank = (bank: Bank) => {
  const current = getBanks();
  const updated = [...current, bank];
  saveBanks(updated);
  return updated;
};