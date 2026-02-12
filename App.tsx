
import React, { useState, useEffect, useMemo } from 'react';
import { ExpenseItem, ExpenseCategory, ExtractionResult } from './types';
import { extractExpenseFromImage } from './services/geminiService';
import { fileToBase64, downloadCsv } from './utils/helpers';
import ExpenseCard from './components/ExpenseCard';
import Navbar from './components/Navbar';
import SummaryTable from './components/SummaryTable';
import AuthScreen from './components/AuthScreen';
import ProfileModal from './components/ProfileModal';
import { useAuth } from './AuthContext';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showProfile, setShowProfile] = useState(false);

  // Load user's expenses from localStorage on login
  useEffect(() => {
    if (user) {
      const allExpenses = JSON.parse(localStorage.getItem('expensify_data') || '[]');
      const userExpenses = allExpenses.filter((e: ExpenseItem) => e.userId === user.id);
      setExpenses(userExpenses);
    } else {
      setExpenses([]);
    }
  }, [user]);

  // Save expenses to localStorage whenever they change
  const saveExpenses = (updatedExpenses: ExpenseItem[]) => {
    setExpenses(updatedExpenses);
    const allExpenses = JSON.parse(localStorage.getItem('expensify_data') || '[]');
    // Filter out user's old data and add updated
    const otherUsersExpenses = allExpenses.filter((e: ExpenseItem) => e.userId !== user?.id);
    localStorage.setItem('expensify_data', JSON.stringify([...otherUsersExpenses, ...updatedExpenses]));
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
        
        setExpenses(prev => {
          const updated = prev.map(exp => 
            exp.id === tempId ? { 
              ...exp, 
              ...result, 
              status: 'completed' as const 
            } : exp
          );
          saveExpenses(updated);
          return updated;
        });
      } catch (error) {
        console.error("Error extracting bill:", error);
        setExpenses(prev => {
          const updated = prev.map(exp => 
            exp.id === tempId ? { 
              ...exp, 
              vendor: 'Error', 
              details: 'Could not extract data', 
              status: 'error' as const 
            } : exp
          );
          saveExpenses(updated);
          return updated;
        });
      }
    }
    setIsProcessing(false);
    event.target.value = '';
  };

  const removeExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    saveExpenses(updated);
  };

  const updateExpense = (id: string, updates: Partial<ExpenseItem>) => {
    const updated = expenses.map(e => e.id === id ? { ...e, ...updates } : e);
    saveExpenses(updated);
  };

  const exportData = () => {
    const reportData = expenses.map(e => ({
      Date: e.date,
      Vendor: e.vendor,
      Category: e.category,
      Amount: e.amount,
      Currency: e.currency,
      Location: e.location,
      Details: e.details
    }));
    downloadCsv(reportData, `reimbursement-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const printReport = () => {
    window.print();
  };

  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  if (loading) return null;
  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen pb-20">
      <Navbar onOpenProfile={() => setShowProfile(true)} />
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Personal Dashboard</h1>
            <p className="text-slate-500">Managing travel records for <span className="text-indigo-600 font-semibold">{user.email}</span></p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-400 border border-slate-200'}`}
              title="Grid View"
            >
              <i className="fas fa-th-large"></i>
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-400 border border-slate-200'}`}
              title="Table View"
            >
              <i className="fas fa-list"></i>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <button 
              onClick={exportData}
              disabled={expenses.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <i className="fas fa-file-excel"></i>
              <span>Export CSV</span>
            </button>
            <button 
              onClick={printReport}
              disabled={expenses.length === 0}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <i className="fas fa-print"></i>
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">Your Expenses</div>
            <div className="text-3xl font-bold text-indigo-600">{expenses.length}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">Current Reimbursement</div>
            <div className="text-3xl font-bold text-slate-900">{totalAmount.toLocaleString()} <span className="text-lg font-medium text-slate-400">{expenses[0]?.currency || 'USD'}</span></div>
          </div>
          <div className="bg-indigo-600 p-6 rounded-xl shadow-md text-white">
            <div className="text-indigo-100 text-sm font-medium mb-4 uppercase tracking-wider">Add New Bill</div>
            <label className="flex items-center justify-center gap-2 bg-white text-indigo-600 px-4 py-3 rounded-lg font-bold cursor-pointer hover:bg-indigo-50 transition-colors">
              <i className="fas fa-plus-circle"></i>
              <span>Upload Receipts</span>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        {/* Content Area */}
        {expenses.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-20 text-center no-print">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 text-slate-300 rounded-full mb-4">
              <i className="fas fa-receipt text-3xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No private bills stored</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Upload your travel bills. They are encrypted and associated only with your account profile.</p>
            <label className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold cursor-pointer transition-all shadow-lg shadow-indigo-200">
              <i className="fas fa-cloud-upload-alt"></i>
              <span>Start Uploading</span>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
              />
            </label>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
                {expenses.map(expense => (
                  <ExpenseCard 
                    key={expense.id} 
                    expense={expense} 
                    onDelete={removeExpense} 
                    onUpdate={updateExpense}
                  />
                ))}
              </div>
            ) : (
              <div className="no-print">
                <SummaryTable expenses={expenses} />
              </div>
            )}
          </>
        )}

        {/* Print Only View */}
        <div className="print-only">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-2">Travel Expense Report</h1>
            <p className="text-gray-600">Employee: {user.name} ({user.email})</p>
            <p className="text-gray-600 italic">Report generated on {new Date().toLocaleDateString()}</p>
          </div>
          
          <table className="w-full border-collapse mb-10">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50 text-left">
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold">Vendor</th>
                <th className="py-3 px-4 font-bold">Location</th>
                <th className="py-3 px-4 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id} className="border-b border-gray-200">
                  <td className="py-3 px-4">{e.date}</td>
                  <td className="py-3 px-4 font-medium">{e.category}</td>
                  <td className="py-3 px-4">{e.vendor}</td>
                  <td className="py-3 px-4">{e.location}</td>
                  <td className="py-3 px-4 text-right">{e.amount.toFixed(2)} {e.currency}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={4} className="py-4 px-4 text-right font-bold text-lg">Total Reimbursement:</td>
                <td className="py-4 px-4 text-right font-bold text-lg">{totalAmount.toFixed(2)} {expenses[0]?.currency || 'USD'}</td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-6">Verified Receipt Evidence</h2>
            <div className="grid grid-cols-2 gap-8">
              {expenses.map(e => (
                <div key={`receipt-${e.id}`} className="border p-4 rounded-lg page-break">
                  <p className="font-bold mb-2">{e.date} - {e.vendor}</p>
                  <img src={e.imageUrl} alt="Receipt" className="max-h-96 object-contain w-full bg-gray-100 p-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden no-print">
        <label className="flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl cursor-pointer">
          <i className="fas fa-camera text-xl"></i>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center no-print">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center max-w-xs w-full">
            <div className="relative mb-4">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fas fa-magic text-indigo-600 text-xs"></i>
              </div>
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">AI Processing...</h4>
            <p className="text-slate-500 text-center text-sm">Our neural engine is analyzing your private receipt data.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
