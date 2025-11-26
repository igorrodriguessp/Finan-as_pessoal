export type TransactionType = 'income' | 'expense';

export enum Category {
  Food = 'Alimentação',
  Transport = 'Transporte',
  Housing = 'Habitação',
  Utilities = 'Utilidades',
  Entertainment = 'Entretenimento',
  Health = 'Saúde',
  Shopping = 'Compras',
  Salary = 'Salário',
  Investment = 'Investimento',
  Other = 'Outros'
}

export interface Bank {
  id: string;
  name: string;
  color: string; // Hex code for UI styling
  initialBalance: number;
}

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  type: TransactionType;
  category: Category;
  bankId: string; // Linked bank account
  notes?: string;
  installment?: {
    current: number;
    total: number;
    id: string; // ID compartilhado para agrupar parcelas
  };
}

export interface FinancialStats {
  totalIncome: number;
  totalExpenses: number;
  netWorth: number;
  expensesByCategory: { name: string; value: number; color: string }[];
  recentTransactions: Transaction[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isLoading?: boolean;
}