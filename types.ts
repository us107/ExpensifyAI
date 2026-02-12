
export enum ExpenseCategory {
  HOTEL = 'Hotel',
  TRANSPORT = 'Transport',
  MEAL = 'Meal',
  OTHER = 'Other'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
}

export interface ExpenseItem {
  id: string;
  userId: string; // Added to associate expenses with specific users
  date: string;
  vendor: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  location: string;
  details: string;
  imageUrl?: string;
  status: 'processing' | 'completed' | 'error';
}

export interface ExtractionResult {
  date: string;
  vendor: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  location: string;
  details: string;
}
