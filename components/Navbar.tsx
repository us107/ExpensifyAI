
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

interface Props {
  onOpenProfile: () => void;
  currentView?: 'dashboard' | 'history';
  onViewChange?: (view: 'dashboard' | 'history') => void;
}

const Navbar: React.FC<Props> = ({ onOpenProfile, currentView = 'dashboard', onViewChange }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <i className="fas fa-bolt"></i>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 uppercase">EXPENSIFY<span className="text-indigo-600">AI</span></span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => onViewChange?.('dashboard')}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  currentView === 'dashboard' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => onViewChange?.('history')}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  currentView === 'history' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                History
              </button>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-50 transition-colors"
              >
                <div className="hidden md:block text-right">
                  <p className="text-sm font-black text-slate-900 leading-none">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Business Elite</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden ring-2 ring-indigo-50">
                  <img src={user?.avatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-50 mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.email}</p>
                    </div>
                    <button 
                      onClick={() => { onOpenProfile(); setIsDropdownOpen(false); }}
                      className="w-full text-left px-4 py-3 text-[10px] uppercase font-black tracking-widest text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                    >
                      <i className="fas fa-user-circle text-slate-400 text-sm"></i>
                      My Profile
                    </button>
                    <button className="w-full text-left px-4 py-3 text-[10px] uppercase font-black tracking-widest text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                      <i className="fas fa-cog text-slate-400 text-sm"></i>
                      Settings
                    </button>
                    <div className="h-px bg-slate-100 my-2"></div>
                    <button 
                      onClick={logout}
                      className="w-full text-left px-4 py-3 text-[10px] uppercase font-black tracking-widest text-red-600 hover:bg-red-50 flex items-center gap-3"
                    >
                      <i className="fas fa-sign-out-alt text-sm"></i>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
