
import React, { useState, useEffect, useMemo } from 'react';
import { ExpenseItem, ExpenseCategory } from './types';
import { extractExpenseFromImage, convertCurrency } from './services/geminiService';
import { fileToBase64 } from './utils/helpers';
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
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (user) {
      const allExpenses = JSON.parse(localStorage.getItem('expensify_data') || '[]');
      const userExpenses = allExpenses.filter((e: ExpenseItem) => e.userId === user.id);
      setExpenses(userExpenses.sort((a: ExpenseItem, b: ExpenseItem) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } else {
      setExpenses([]);
    }
  }, [user]);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const saveExpenses = (updatedExpenses: ExpenseItem[]) => {
    setExpenses(updatedExpenses);
    const allExpenses = JSON.parse(localStorage.getItem('expensify_data') || '[]');
    const otherUsersExpenses = allExpenses.filter((e: ExpenseItem) => e.userId !== user?.id);
    localStorage.setItem('expensify_data', JSON.stringify([...otherUsersExpenses, ...updatedExpenses]));
  };

  const handleManualSave = async (partialItem: Partial<ExpenseItem>) => {
    try {
      if (partialItem.id) {
        const updated = expenses.map(e => e.id === partialItem.id ? { ...e, ...partialItem } : e);
        const original = expenses.find(e => e.id === partialItem.id);
        if (original && partialItem.currency !== original.currency && partialItem.amount) {
          const converted = await convertCurrency(partialItem.amount, partialItem.currency!, user!.baseCurrency, partialItem.date!);
          updateExpense(partialItem.id!, { convertedAmount: converted });
        }
        saveExpenses(updated as ExpenseItem[]);
        notify("Bill updated successfully");
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
          const converted = await convertCurrency(newItem.amount, newItem.currency, user!.baseCurrency, newItem.date);
          newItem.convertedAmount = converted;
        }
        saveExpenses([newItem, ...expenses]);
        notify("Manual bill added to hub");
      }
    } catch (err) {
      notify("Error saving bill", "error");
    } finally {
      setEditingManualItem(null);
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
        notify(`Failed to process ${file.name}`, "error");
        setExpenses(prev => {
          const updated = prev.map(exp => exp.id === tempId ? { ...exp, vendor: 'Extraction Failed', details: 'Check image quality', status: 'error' as const } : exp);
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
    notify("Expense removed");
  };

  const updateExpense = async (id: string, updates: Partial<ExpenseItem>) => {
    const targetExpense = expenses.find(e => e.id === id);
    if (targetExpense?.isManual) {
      setEditingManualItem(targetExpense);
      setShowManualModal(true);
      return;
    }
    
    let newConvertedAmount = updates.convertedAmount;
    if (updates.currency && updates.currency !== targetExpense?.currency && targetExpense && user) {
      newConvertedAmount = await convertCurrency(targetExpense.amount, updates.currency, user.baseCurrency, targetExpense.date);
    }
    
    const updated = expenses.map(e => e.id === id ? { ...e, ...updates, convertedAmount: newConvertedAmount !== undefined ? newConvertedAmount : e.convertedAmount } : e);
    saveExpenses(updated);
  };

  const totalConvertedAmount = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + (exp.convertedAmount || 0), 0);
  }, [expenses]);

  const handlePrint = () => {
    window.print();
  };

  const downloadExcelBill = (expense: ExpenseItem) => {
    const filename = `Expensify_${expense.vendor.split('-')[0].trim()}_${expense.date}.xls`;
    const itemsTotal = expense.items?.reduce((s, i) => s + (i.qty * i.price), 0) || 0;
    const { serviceChargeRate = 0, cgstRate = 0, sgstRate = 0 } = expense.manualMetadata || {};
    
    const scAmt = itemsTotal * (serviceChargeRate / 100);
    const cgstAmt = itemsTotal * (cgstRate / 100);
    const sgstAmt = itemsTotal * (sgstRate / 100);

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Bill</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body>
        <table border="1" style="font-family: Arial, sans-serif; font-size: 10pt; width: 450px; border-collapse: collapse;">
          <tr><td colspan="4" align="center" style="border:none; padding: 20px 0;"><span style="font-size: 32pt;">📄</span></td></tr>
          <tr><td colspan="4" align="center" style="font-weight: bold; font-size: 16pt; border:none;">${expense.vendor.split('-')[0].trim()}</td></tr>
          <tr><td colspan="4" align="center" style="font-size: 9pt; color: #64748b; border:none;">${expense.manualMetadata?.address}</td></tr>
          <tr><td colspan="4" align="center" style="font-size: 9pt; color: #64748b; border:none;">Ph: ${expense.manualMetadata?.phone}</td></tr>
          <tr><td colspan="4" align="center" style="border-top: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1; height: 10px;"></td></tr>
          <tr><td colspan="4" align="center" style="font-weight: bold; padding: 10px; border:none;">${expense.vendor.split('-')[1]?.trim() || 'TAX INVOICE'}</td></tr>
          <tr><td colspan="2" style="border:none;">Bill No: ${expense.manualMetadata?.billNo}</td><td colspan="2" align="right" style="border:none;">Date: ${expense.date}</td></tr>
          <tr style="background-color: #f8fafc; font-weight: bold;"><td>Qty</td><td colspan="2">Description</td><td align="right">Amount</td></tr>
          ${expense.items?.map(item => `
            <tr><td>${item.qty}</td><td colspan="2">${item.name}</td><td align="right">${(item.qty * item.price).toFixed(2)}</td></tr>
          `).join('')}
          <tr style="border-top: 1px solid #000;">
            <td colspan="3" align="right">Subtotal</td>
            <td align="right">${itemsTotal.toFixed(2)}</td>
          </tr>
          ${serviceChargeRate > 0 ? `<tr><td colspan="3" align="right">Service Charge (${serviceChargeRate}%)</td><td align="right">${scAmt.toFixed(2)}</td></tr>` : ''}
          ${cgstRate > 0 ? `<tr><td colspan="3" align="right">CGST (${cgstRate}%)</td><td align="right">${cgstAmt.toFixed(2)}</td></tr>` : ''}
          ${sgstRate > 0 ? `<tr><td colspan="3" align="right">SGST (${sgstRate}%)</td><td align="right">${sgstAmt.toFixed(2)}</td></tr>` : ''}
          <tr style="font-weight: bold; font-size: 12pt; background-color: #f1f5f9;">
            <td colspan="3" align="right">GRAND TOTAL (${expense.currency})</td>
            <td align="right">${expense.amount.toFixed(2)}</td>
          </tr>
          <tr><td colspan="4" style="border:none; font-size: 8pt; color: #94a3b8; padding-top: 20px;">GSTIN: ${expense.manualMetadata?.gstin}</td></tr>
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
    <div className="min-h-screen pb-20 selection:bg-indigo-100">
      <Navbar 
        onOpenProfile={() => setShowProfile(true)} 
        currentView={viewMode === 'grid' ? 'dashboard' : 'history'}
        onViewChange={(v) => setViewMode(v === 'dashboard' ? 'grid' : 'table')}
      />
      
      {notification && (
        <div className={`fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300 ${
          notification.type === 'success' ? 'bg-indigo-600' : 'bg-red-600'
        } text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-xs uppercase tracking-widest`}>
          <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
          {notification.message}
        </div>
      )}

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
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
              {viewMode === 'grid' ? 'Travel Hub' : 'Full History'}
            </h1>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1 italic">
              AI-Augmented Reimbursement Workflow
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            >
              <i className="fas fa-print"></i>
              <span>Print Report</span>
            </button>
            <button 
              onClick={() => { setEditingManualItem(null); setShowManualModal(true); }} 
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-100 transition-all active:scale-95"
            >
              <i className="fas fa-magic"></i>
              <span>Create Manual Bill</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 no-print">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 flex justify-between items-center">
              Total Receipts
              <i className="fas fa-file-invoice text-slate-200"></i>
            </div>
            <div className="text-4xl font-black text-slate-900 tracking-tighter">{expenses.length}</div>
          </div>
          
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-all hover:shadow-md md:col-span-2">
            <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 flex justify-between items-center">
              Total Claim Amount
              <i className="fas fa-wallet text-indigo-200"></i>
            </div>
            <div className="text-4xl font-black text-indigo-600 tracking-tighter">
              {totalConvertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
              <span className="text-sm font-bold text-slate-300 ml-2">{user.baseCurrency}</span>
            </div>
          </div>

          <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-2xl shadow-indigo-200 text-white flex flex-col justify-center transition-all hover:bg-indigo-700">
            <label className="flex flex-col items-center justify-center gap-2 cursor-pointer h-full group">
              <i className="fas fa-camera text-3xl group-hover:scale-110 transition-transform"></i>
              <span className="font-black text-[10px] uppercase tracking-widest">Scan New Bill</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center no-print">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full mb-8">
              <i className="fas fa-receipt text-4xl"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Your hub is empty</h3>
            <p className="text-slate-500 mb-10 max-w-sm mx-auto font-bold text-[10px] uppercase tracking-widest leading-relaxed">
              Start by scanning a travel receipt or generating a manual bill for missing documents.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <button onClick={() => { setEditingManualItem(null); setShowManualModal(true); }} className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-amber-100 active:scale-95">
                <i className="fas fa-magic mr-2"></i>
                Generate Manual Bill
              </button>
               <label className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 cursor-pointer active:scale-95">
                <i className="fas fa-camera mr-2"></i>
                Scan Travel Receipt
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="no-print">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {expenses.map(expense => (
                    <div key={expense.id} className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <ExpenseCard expense={expense} onDelete={removeExpense} onUpdate={updateExpense} />
                      {expense.isManual && expense.status === 'completed' && (
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          <button 
                            onClick={() => downloadExcelBill(expense)}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl hover:shadow-emerald-100 active:scale-95"
                          >
                            <i className="fas fa-file-excel"></i> Excel Bill
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

            {/* Print Only View */}
            <div className="print-only">
              <div className="mb-8 border-b-2 border-slate-900 pb-4 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black uppercase">Travel Reimbursement Report</h1>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Prepared for: {user.name} ({user.email})</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400">Total Claim</p>
                  <p className="text-2xl font-black text-indigo-600">{totalConvertedAmount.toLocaleString()} {user.baseCurrency}</p>
                </div>
              </div>
              <SummaryTable expenses={expenses} />
              <div className="mt-12 pt-8 border-t border-slate-100">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-8 text-center tracking-[0.5em]">This report was generated via Expensify AI</p>
                <div className="grid grid-cols-2 gap-24">
                  <div className="border-t border-slate-900 pt-2 text-center text-[10px] font-black uppercase">Employee Signature</div>
                  <div className="border-t border-slate-900 pt-2 text-center text-[10px] font-black uppercase">Finance Approval</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center no-print">
          <div className="bg-white rounded-[3rem] p-12 shadow-2xl flex flex-col items-center max-w-sm w-full border-4 border-indigo-50 animate-in zoom-in duration-300">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fas fa-brain text-indigo-600 text-3xl animate-pulse"></i>
              </div>
            </div>
            <h4 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Thinking...</h4>
            <p className="text-slate-500 text-center text-[10px] font-black uppercase tracking-widest leading-relaxed">
              Gemini AI is distilling financial data from your bill image.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
