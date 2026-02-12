
import React from 'react';
import { ExpenseItem } from '../types';

interface Props {
  expenses: ExpenseItem[];
}

const SummaryTable: React.FC<Props> = ({ expenses }) => {
  const baseCurrency = expenses[0]?.baseCurrencyAtTime || 'INR';
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Original Amount</th>
              <th className="py-4 px-6 text-xs font-bold text-indigo-600 uppercase tracking-wider text-right bg-indigo-50/30">Reimbursement ({baseCurrency})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 text-sm text-slate-700 whitespace-nowrap">{expense.date}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    expense.category === 'Hotel' ? 'bg-amber-100 text-amber-800' :
                    expense.category === 'Transport' ? 'bg-blue-100 text-blue-800' :
                    expense.category === 'Meal' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {expense.category}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm font-bold text-slate-900">{expense.vendor}</td>
                <td className="py-4 px-6 text-sm text-slate-500 italic">
                  {expense.amount.toFixed(2)} {expense.currency}
                </td>
                <td className="py-4 px-6 text-sm font-black text-indigo-700 text-right whitespace-nowrap bg-indigo-50/10">
                  {expense.convertedAmount?.toLocaleString() || '---'} {expense.baseCurrencyAtTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SummaryTable;
