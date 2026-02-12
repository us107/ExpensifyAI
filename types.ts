
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
  baseCurrency: string; // Target currency for reimbursement
}

export interface ExpenseItem {
  id: string;
  userId: string;
  date: string;
  vendor: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  location: string;
  details: string;
  imageUrl?: string;
  status: 'processing' | 'completed' | 'error';
  convertedAmount?: number; // The amount in baseCurrency
  baseCurrencyAtTime?: string; // The base currency used for conversion
  isManual?: boolean;
  items?: { qty: number; name: string; price: number }[];
  manualMetadata?: {
    address?: string;
    phone?: string;
    website?: string;
    billNo?: string;
    tableNo?: string;
    steward?: string;
    cover?: string;
    session?: string;
    gstin?: string;
    cashier?: string;
    time?: string;
    serviceChargeRate?: number;
    cgstRate?: number;
    sgstRate?: number;
  };
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
