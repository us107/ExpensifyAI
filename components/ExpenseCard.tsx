
import React, { useState } from 'react';
import { ExpenseItem, ExpenseCategory } from '../types';

interface Props {
  expense: ExpenseItem;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ExpenseItem>) => void;
}

const ExpenseCard: React.FC<Props> = ({ expense, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);

  const categoryIcons = {
    [ExpenseCategory.HOTEL]: 'fa-hotel text-amber-500 bg-amber-50',
    [ExpenseCategory.TRANSPORT]: 'fa-car text-blue-500 bg-blue-50',
    [ExpenseCategory.MEAL]: 'fa-utensils text-emerald-500 bg-emerald-50',
    [ExpenseCategory.OTHER]: 'fa-receipt text-slate-500 bg-slate-50'
  };

  const statusColors = {
    processing: 'animate-pulse bg-slate-100 border-slate-200',
    completed: 'bg-white border-slate-200 hover:border-indigo-300',
    error: 'bg-red-50 border-red-200'
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl border-2 border-indigo-500 p-5 shadow-lg">
        <h4 className="font-bold text-slate-900 mb-4 flex justify-between">
          Edit Expense 
          <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-red-500">
            <i className="fas fa-times"></i>
          </button>
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vendor</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={expense.vendor}
              onChange={(e) => onUpdate(expense.id, { vendor: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount</label>
              <input 
                type="number" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={expense.amount}
                onChange={(e) => onUpdate(expense.id, { amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Currency</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={expense.currency}
                onChange={(e) => onUpdate(expense.id, { currency: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg text-sm mt-2"
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group rounded-xl border transition-all duration-300 overflow-hidden shadow-sm flex flex-col ${statusColors[expense.status]}`}>
      {/* Image Preview */}
      <div className="relative h-40 bg-slate-100 overflow-hidden border-b border-slate-100">
        <img src={expense.imageUrl} alt="Bill thumbnail" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute top-3 left-3 flex gap-2">
           <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md bg-white/20`}>
            {expense.date}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 text-white">
          <div className="text-xl font-bold leading-none">{expense.amount.toFixed(2)} <span className="text-sm font-medium opacity-80">{expense.currency}</span></div>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex-1">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryIcons[expense.category].split(' ').slice(1).join(' ')}`}>
              <i className={`fas ${categoryIcons[expense.category].split(' ')[0]}`}></i>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 leading-tight">{expense.vendor}</h4>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <i className="fas fa-map-marker-alt"></i>
                {expense.location}
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[40px] italic">
          "{expense.details}"
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <button 
            onClick={() => onDelete(expense.id)}
            className="text-slate-400 hover:text-red-500 text-xs font-medium transition-colors"
          >
            <i className="fas fa-trash-alt mr-1"></i> Delete
          </button>
          <button 
            onClick={() => setIsEditing(true)}
            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold transition-colors"
          >
            <i className="fas fa-edit mr-1"></i> Adjust Details
          </button>
        </div>
      </div>
      
      {expense.status === 'processing' && (
        <div className="bg-indigo-600 h-1 flex items-center justify-center overflow-hidden">
          <div className="h-full bg-white/30 w-full animate-progress-stripes"></div>
        </div>
      )}
    </div>
  );
};

export default ExpenseCard;
