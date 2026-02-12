
import React, { useState, useEffect, useMemo } from 'react';
import { ExpenseItem, ExpenseCategory, ExtractionResult } from './types';
import { extractExpenseFromImage, convertCurrency } from './services/geminiService';
import { fileToBase64, downloadCsv } from './utils/helpers';
import ExpenseCard from './components/ExpenseCard';
import Navbar from './components/Navbar';
import SummaryTable from './components/SummaryTable';
import AuthScreen from './components/AuthScreen';
import ProfileModal from './components/ProfileModal';
import ManualBillModal from './components/ManualBillModal';
import { useAuth } from './AuthContext';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showProfile, setShowProfile] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingManualItem, setEditingManualItem] = useState<ExpenseItem | null>(null);

  useEffect(() => {
    if (user) {
      const allExpenses = JSON.parse(localStorage.getItem('expensify_data') || '[]');
      const userExpenses = allExpenses.filter((e: ExpenseItem) => e.userId === user.id);
      setExpenses(userExpenses);
    } else {
      setExpenses([]);
    }
  }, [user]);

  const saveExpenses = (updatedExpenses: ExpenseItem[]) => {
    setExpenses(updatedExpenses);
    const allExpenses = JSON.parse(localStorage.getItem('expensify_data') || '[]');
    const otherUsersExpenses = allExpenses.filter((e: ExpenseItem) => e.userId !== user?.id);
    localStorage.setItem('expensify_data', JSON.stringify([...otherUsersExpenses, ...updatedExpenses]));
  };

  const handleManualSave = (partialItem: Partial<ExpenseItem>) => {
    if (partialItem.id) {
      const updated = expenses.map(e => e.id === partialItem.id ? { ...e, ...partialItem } : e);
      const original = expenses.find(e => e.id === partialItem.id);
      if (original && partialItem.currency !== original.currency && partialItem.amount) {
        convertCurrency(partialItem.amount, partialItem.currency!, user!.baseCurrency, partialItem.date!).then(converted => {
          updateExpense(partialItem.id!, { convertedAmount: converted });
        });
      }
      saveExpenses(updated as ExpenseItem[]);
      setEditingManualItem(null);
    } else {
      const newItem: ExpenseItem = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user!.id,
        status: 'completed',
        convertedAmount: partialItem.amount,
        baseCurrencyAtTime: user!.baseCurrency,
        ...partialItem as any
      };
      if (newItem.currency !== user?.baseCurrency) {
          convertCurrency(newItem.amount, newItem.currency, user!.baseCurrency, newItem.date).then(converted => {
              updateExpense(newItem.id, { convertedAmount: converted });
          });
      }
      saveExpenses([newItem, ...expenses]);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;
    setIsProcessing(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tempId = Math.random().toString(36).substr(2, 9);
      const imageUrl = URL.createObjectURL(file);
      const placeholder: ExpenseItem = {
        id: tempId,
        userId: user.id,
        date: new Date().toISOString().split('T')[0],
        vendor: 'Extracting...',
        amount: 0,
        currency: '---',
        category: ExpenseCategory.OTHER,
        location: '---',
        details: 'Processing image...',
        imageUrl,
        status: 'processing'
      };
      setExpenses(prev => [placeholder, ...prev]);
      try {
        const base64 = await fileToBase64(file);
        const result = await extractExpenseFromImage(base64);
        const converted = await convertCurrency(result.amount, result.currency, user.baseCurrency, result.date);
        setExpenses(prev => {
          const updated = prev.map(exp => 
            exp.id === tempId ? { ...exp, ...result, convertedAmount: converted, baseCurrencyAtTime: user.baseCurrency, status: 'completed' as const } : exp
          );
          saveExpenses(updated);
          return updated;
        });
      } catch (error) {
        setExpenses(prev => {
          const updated = prev.map(exp => exp.id === tempId ? { ...exp, vendor: 'Error', details: 'Could not extract data', status: 'error' as const } : exp);
          saveExpenses(updated);
          return updated;
        });
      }
    }
    setIsProcessing(false);
    event.target.value = '';
  };

  const removeExpense = (id: string) => {
    saveExpenses(expenses.filter(e => e.id !== id));
  };

  const updateExpense = async (id: string, updates: Partial<ExpenseItem>) => {
    let newConvertedAmount = updates.convertedAmount;
    const targetExpense = expenses.find(e => e.id === id);
    if (targetExpense?.isManual) {
      setEditingManualItem(targetExpense);
      setShowManualModal(true);
      return;
    }
    if (updates.currency && updates.currency !== targetExpense?.currency && targetExpense && user) {
      newConvertedAmount = await convertCurrency(targetExpense.amount, updates.currency, user.baseCurrency, targetExpense.date);
    }
    const updated = expenses.map(e => e.id === id ? { ...e, ...updates, convertedAmount: newConvertedAmount !== undefined ? newConvertedAmount : e.convertedAmount } : e);
    saveExpenses(updated);
  };

  const totalConvertedAmount = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + (exp.convertedAmount || 0), 0);
  }, [expenses]);

  const downloadExcelBill = (expense: ExpenseItem) => {
    const filename = `ExcelBill_${expense.manualMetadata?.billNo || expense.id}.xls`;
    const itemsTotal = expense.items?.reduce((s, i) => s + (i.qty * i.price), 0) || 0;
    const scRate = expense.manualMetadata?.serviceChargeRate || 0;
    const cgstRate = expense.manualMetadata?.cgstRate || 0;
    const sgstRate = expense.manualMetadata?.sgstRate || 0;
    const scAmt = itemsTotal * (scRate / 100);
    const cgstAmt = itemsTotal * (cgstRate / 100);
    const sgstAmt = itemsTotal * (sgstRate / 100);

    const iconHtml = `<tr><td colspan="4" align="center" style="border:none; padding: 15px 0;"><span style="font-size: 24pt;">📄</span></td></tr>`;

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Bill</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body>
        <table border="1" style="font-family: 'Courier New', Courier, monospace; font-size: 10pt; width: 400px; border-collapse: collapse;">
          ${iconHtml}
          <tr><td colspan="4" align="center" style="font-weight: bold; font-size: 14pt; border:none;">${expense.vendor.split('-')[0].trim()}</td></tr>
          <tr><td colspan="4" align="center" style="font-size: 8pt; border:none;">${expense.manualMetadata?.address}</td></tr>
          <tr><td colspan="4" align="center" style="font-size: 8pt; border:none;">Ph: ${expense.manualMetadata?.phone}</td></tr>
          <tr><td colspan="4" align="center" style="font-size: 8pt; italic; border:none;">${expense.manualMetadata?.website || ''}</td></tr>
          <tr><td colspan="4" align="center" style="border-top: 1px dashed black; border-bottom: 1px dashed black;">&nbsp;</td></tr>
          <tr><td colspan="4" align="center" style="font-weight: bold; border:none;">${expense.vendor.split('-')[1]?.trim() || 'RECEIPT'}</td></tr>
          <tr><td colspan="4" style="border:none;">&nbsp;</td></tr>
          <tr><td colspan="2" style="border:none;">Bill no : ${expense.manualMetadata?.billNo}</td><td colspan="2" align="right" style="border:none;">Table #: 10</td></tr>
          <tr><td colspan="2" style="border:none;">Bill Date : ${expense.date}</td><td colspan="2" align="right" style="border:none;">${expense.manualMetadata?.time}</td></tr>
          <tr><td colspan="4" align="center" style="border-top: 1px dashed black; border-bottom: 1px dashed black;">&nbsp;</td></tr>
          <tr style="font-weight: bold;">
            <td>Qty</td>
            <td colspan="2">Item Name</td>
            <td align="right">Amount</td>
          </tr>
          ${expense.items?.map(item => `
            <tr>
              <td>${item.qty}</td>
              <td colspan="2">${item.name}</td>
              <td align="right">${(item.qty * item.price).toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr style="font-weight: bold;">
            <td colspan="3">Sub total</td>
            <td align="right">${itemsTotal.toFixed(2)}</td>
          </tr>
          ${scRate > 0 ? `<tr><td colspan="3">Service Ch ${scRate.toFixed(2)}%</td><td align="right">${scAmt.toFixed(2)}</td></tr>` : ''}
          ${cgstRate > 0 ? `<tr><td colspan="3">CGST ${cgstRate.toFixed(2)}%</td><td align="right">${cgstAmt.toFixed(2)}</td></tr>` : ''}
          ${sgstRate > 0 ? `<tr><td colspan="3">SGST ${sgstRate.toFixed(2)}%</td><td align="right">${sgstAmt.toFixed(2)}</td></tr>` : ''}
          <tr style="font-weight: bold; font-size: 11pt; border-top: 1px solid black;">
            <td colspan="3">Net Amt.</td>
            <td align="right">${expense.amount.toFixed(2)}</td>
          </tr>
          <tr><td colspan="4" style="border:none;">&nbsp;</td></tr>
          <tr><td colspan="4" style="font-weight: bold; border:none;">GSTIN NO : ${expense.manualMetadata?.gstin}</td></tr>
          <tr><td colspan="4" style="border:none;">&nbsp;</td></tr>
          <tr><td colspan="3" style="border:none;">Cashier : ${expense.manualMetadata?.cashier}</td><td align="right" style="border:none;">&nbsp;</td></tr>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return null;
  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen pb-20">
      <Navbar 
        onOpenProfile={() => setShowProfile(true)} 
        currentView={viewMode === 'grid' ? 'dashboard' : 'history'}
        onViewChange={(v) => setViewMode(v === 'dashboard' ? 'grid' : 'table')}
      />
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showManualModal && (
        <ManualBillModal 
          onClose={() => { setShowManualModal(false); setEditingManualItem(null); }} 
          onSave={handleManualSave} 
          baseCurrency={user.baseCurrency}
          editingItem={editingManualItem}
        />
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              {viewMode === 'grid' ? 'Expense Hub' : 'Expense History'}
            </h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest italic">Digitize receipts or <span className="text-amber-600">Generate Manual Bills</span>.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setEditingManualItem(null); setShowManualModal(true); }} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-100 transition-all active:scale-95">
              <i className="fas fa-magic"></i>
              <span>Create Manual Bill</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 no-print">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Receipts</div>
            <div className="text-3xl font-black text-slate-900 tracking-tighter">{expenses.length}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Total Claim</div>
            <div className="text-3xl font-black text-indigo-600 tracking-tighter">{totalConvertedAmount.toLocaleString()} <span className="text-xs font-bold text-slate-400">{user.baseCurrency}</span></div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
             <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Base Currency</div>
             <div className="text-sm font-black text-slate-900 uppercase tracking-widest">{user.baseCurrency}</div>
          </div>
          <div className="bg-indigo-600 p-6 rounded-xl shadow-md text-white flex flex-col justify-center">
            <label className="flex flex-col items-center justify-center gap-1 cursor-pointer h-full group">
              <i className="fas fa-camera text-2xl group-hover:scale-110 transition-transform"></i>
              <span className="font-black text-[10px] uppercase tracking-widest">Scan Bills</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
        {expenses.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-24 text-center no-print">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-50 text-amber-600 rounded-full mb-6">
              <i className="fas fa-file-invoice text-3xl"></i>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">No travel bills yet.</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto font-bold text-xs uppercase tracking-widest leading-relaxed">Scan your physical receipts or generate a manual Excel bill for paperless travel.</p>
            <button onClick={() => { setEditingManualItem(null); setShowManualModal(true); }} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-amber-100">
              <i className="fas fa-magic"></i>
              <span>Create First Bill</span>
            </button>
          </div>
        ) : (
          <div className="no-print">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {expenses.map(expense => (
                  <div key={expense.id} className="relative group">
                    <ExpenseCard expense={expense} onDelete={removeExpense} onUpdate={updateExpense} />
                    {expense.isManual && (
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <button 
                          onClick={() => downloadExcelBill(expense)}
                          className="bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-lg"
                        >
                          <i className="fas fa-file-excel"></i> Download Excel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <SummaryTable expenses={expenses} />
            )}
          </div>
        )}
      </main>
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center no-print">
          <div className="bg-white rounded-[2rem] p-10 shadow-2xl flex flex-col items-center max-w-sm w-full border-4 border-indigo-50">
            <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <h4 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">AI Extracting...</h4>
            <p className="text-slate-500 text-center text-[10px] font-black uppercase tracking-widest">Scanning your bill image for financial data.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
