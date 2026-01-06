
export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  receiptAttached: boolean;
  receiptUrl?: string;
  category?: string;
}

export interface CardAccount {
  id: string;
  name: string;
  lastFourDigits: string;
  color: string;
  expenses: Expense[];
}

export interface SummaryStats {
  totalAmount: number;
  reconciledAmount: number;
  pendingAmount: number;
  completionPercentage: number;
}
