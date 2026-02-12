
import React, { useState } from 'react';
import { ExpenseItem, ExpenseCategory } from '../types';

interface Props {
  expense: ExpenseItem;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ExpenseItem>) => void;
}

const currencies = [
  "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "INR", "CNY", "CHF", "HKD", "SGD", "SEK", "KRW", "NOK", "NZD", "MXN", "TWD", "ZAR", "BRL", "RUB", "TRY", "IDR", "AED", "SAR", "PLN", "THB", "ILS", "DKK", "PHP", "MYR", "HUF", "COP", "CZK", "EGP", "CLP", "PKR", "BDT", "VND", "LKR", "NGN", "KES", "GHS", "TZS", "UGX", "MAD", "DZD", "PEN", "UAH"
].sort();

const ExpenseCard: React.FC<Props> = ({ expense, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);

  const categoryIcons = {
    [ExpenseCategory.HOTEL]: 'fa-hotel text-amber-500 bg-amber-50',
    [ExpenseCategory.TRANSPORT]: 'fa-car text-blue-500 bg-blue-50',
    [ExpenseCategory.MEAL]: 'fa-utensils text-emerald-500 bg-emerald-50',
    [ExpenseCategory.OTHER]: 'fa-receipt text-slate-500 bg-slate-50'
  };

  const statusColors = {
    processing: 'animate-pulse bg-slate-50 border-indigo-200',
    completed: 'bg-white border-slate-200 hover:border-indigo-300',
    error: 'bg-red-50 border-red-200'
  };

  const StatusBadge = () => {
    switch (expense.status) {
      case 'processing':
        return (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg animate-bounce" title="Analyzing...">
            <i className="fas fa-circle-notch animate-spin"></i>
          </div>
        );
      case 'completed':
        return (
          <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full shadow-lg" title="Verified">
            <i className="fas fa-check text-[10px]"></i>
          </div>
        );
      case 'error':
        return (
          <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full shadow-lg" title="Failed">
            <i className="fas fa-exclamation text-[10px]"></i>
          </div>
        );
      default:
        return null;
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl border-2 border-indigo-500 p-5 shadow-lg animate-in fade-in zoom-in duration-200">
        <h4 className="text-sm font-black text-slate-900 mb-4 flex justify-between items-center uppercase tracking-tight">
          Adjust Details
          <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-red-500 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Vendor</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              value={expense.vendor}
              onChange={(e) => onUpdate(expense.id, { vendor: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Amount</label>
              <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed font-bold">
                {expense.amount.toFixed(2)}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Currency</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                value={expense.currency}
                onChange={(e) => onUpdate(expense.id, { currency: e.target.value })}
              >
                {!currencies.includes(expense.currency) && expense.currency !== '---' && (
                   <option value={expense.currency}>{expense.currency}</option>
                )}
                <option value="---" disabled>Select</option>
                {currencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Category</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              value={expense.category}
              onChange={(e) => onUpdate(expense.id, { category: e.target.value as ExpenseCategory })}
            >
              {Object.values(ExpenseCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setIsEditing(false)}
            className="w-full bg-indigo-600 text-white font-black py-2.5 rounded-lg text-[10px] uppercase tracking-widest mt-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
          >
            Update
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group rounded-xl border transition-all duration-300 overflow-hidden shadow-sm flex flex-col ${statusColors[expense.status]}`}>
      <div className="relative h-40 bg-slate-100 overflow-hidden border-b border-slate-100">
        <img src={expense.imageUrl} alt="Bill thumbnail" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <StatusBadge />
        <div className="absolute top-3 left-3 flex gap-2">
           <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-md bg-white/20 border border-white/30">
            {expense.date}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 text-white flex flex-col">
          <div className="text-xl font-black leading-none">{expense.amount.toFixed(2)} <span className="text-xs font-bold opacity-80">{expense.currency}</span></div>
          {expense.convertedAmount !== undefined && (
            <div className="text-[10px] font-black text-indigo-300 flex items-center gap-1 mt-1 uppercase tracking-tight">
               <i className="fas fa-sync-alt scale-75"></i>
               {expense.convertedAmount.toLocaleString()} {expense.baseCurrencyAtTime}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 flex-1">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryIcons[expense.category].split(' ').slice(1).join(' ')}`}>
              <i className={`fas ${categoryIcons[expense.category].split(' ')[0]}`}></i>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 leading-tight tracking-tight uppercase">{expense.vendor}</h4>
              <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase">
                <i className="fas fa-map-marker-alt text-[8px]"></i>
                {expense.location}
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-xs font-medium text-slate-600 mb-4 line-clamp-2 min-h-[32px] italic">
          "{expense.details}"
        </p>

        {expense.convertedAmount !== undefined && (
          <div className="mb-4 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
            <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Reimbursement Value</div>
            <div className="text-sm font-black text-indigo-700">
              {expense.convertedAmount.toLocaleString()} {expense.baseCurrencyAtTime}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <button 
            onClick={() => onDelete(expense.id)}
            className="text-slate-400 hover:text-red-500 text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <i className="fas fa-trash-alt"></i> Delete
          </button>
          <button 
            onClick={() => setIsEditing(true)}
            disabled={expense.status === 'processing'}
            className={`text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 ${expense.status === 'processing' ? 'text-slate-300 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}
          >
            <i className="fas fa-edit"></i> Edit
          </button>
        </div>
      </div>
      
      {expense.status === 'processing' && (
        <div className="bg-indigo-600 h-1 relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-[-100%] w-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.5s_infinite]"></div>
        </div>
      )}
    </div>
  );
};

export default ExpenseCard;
