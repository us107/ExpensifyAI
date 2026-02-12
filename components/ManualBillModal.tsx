
import React, { useState, useEffect } from 'react';
import { ExpenseCategory, ExpenseItem } from '../types';

interface Props {
  onClose: () => void;
  onSave: (item: Partial<ExpenseItem>) => void;
  baseCurrency: string;
  editingItem?: ExpenseItem | null;
}

const currencies = [
  "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "INR", "CNY", "CHF", "HKD", "SGD", "SEK", "KRW", "NOK", "NZD", "MXN", "TWD", "ZAR", "BRL", "RUB", "TRY", "IDR", "AED", "SAR", "PLN", "THB", "ILS", "DKK", "PHP", "MYR", "HUF", "COP", "CZK", "EGP", "CLP", "PKR", "BDT", "VND", "LKR", "NGN", "KES", "GHS", "TZS", "UGX", "MAD", "DZD", "PEN", "UAH"
].sort();

const ManualBillModal: React.FC<Props> = ({ onClose, onSave, baseCurrency, editingItem }) => {
  const [vendor, setVendor] = useState(editingItem?.vendor.split(' - ')[0] || 'LEGACY VENTURE');
  const [subVendor, setSubVendor] = useState(editingItem?.vendor.split(' - ')[1] || 'SAARANGI');
  const [address, setAddress] = useState(editingItem?.manualMetadata?.address || '27th cross, IV block, Jayanagar');
  const [phone, setPhone] = useState(editingItem?.manualMetadata?.phone || '080 - 490 7000');
  const [gstin, setGstin] = useState(editingItem?.manualMetadata?.gstin || '29AAFFL6511N1ZX');
  const [date, setDate] = useState(editingItem?.date || new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState(editingItem?.currency || baseCurrency);
  const [time, setTime] = useState(editingItem?.manualMetadata?.time || '21:41');
  const [steward, setSteward] = useState(editingItem?.manualMetadata?.steward || 'KRISHNA');
  const [cashier, setCashier] = useState(editingItem?.manualMetadata?.cashier || 'HEMANT');
  const [billNo, setBillNo] = useState(editingItem?.manualMetadata?.billNo || '9022');
  
  // Tax Rates
  const [serviceChargeRate, setServiceChargeRate] = useState(editingItem?.manualMetadata?.serviceChargeRate ?? 5.0);
  const [cgstRate, setCgstRate] = useState(editingItem?.manualMetadata?.cgstRate ?? 2.5);
  const [sgstRate, setSgstRate] = useState(editingItem?.manualMetadata?.sgstRate ?? 2.5);

  const [items, setItems] = useState(editingItem?.items || [
    { qty: 1, name: 'Paneer Tawa Masala', price: 380 },
    { qty: 4, name: 'Butter Roti', price: 70 },
    { qty: 1, name: 'Mineral Water', price: 100 }
  ]);

  const addItem = () => setItems([...items, { qty: 1, name: '', price: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const serviceChargeAmount = Number((subtotal * (serviceChargeRate / 100)).toFixed(2));
  const cgstAmount = Number((subtotal * (cgstRate / 100)).toFixed(2));
  const sgstAmount = Number((subtotal * (sgstRate / 100)).toFixed(2));
  const total = subtotal + serviceChargeAmount + cgstAmount + sgstAmount;

  const handleSave = () => {
    onSave({
      id: editingItem?.id, // App.tsx handles new vs edit based on ID presence
      vendor: `${vendor} - ${subVendor}`,
      amount: total,
      currency: currency,
      date,
      category: editingItem?.category || ExpenseCategory.MEAL,
      location: editingItem?.location || 'Bengaluru',
      details: items.map(i => `${i.qty}x ${i.name}`).join(', '),
      isManual: true,
      items,
      manualMetadata: {
        address,
        phone,
        billNo,
        time,
        steward,
        cashier,
        cover: editingItem?.manualMetadata?.cover || '1',
        session: editingItem?.manualMetadata?.session || 'Dinner',
        website: editingItem?.manualMetadata?.website || 'www.theroyalcomfort.com',
        gstin,
        serviceChargeRate,
        cgstRate,
        sgstRate
      }
    });
    onClose();
  };

  const inputClasses = "w-full bg-white border border-slate-200 rounded-xl text-xs font-bold p-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">
            {editingItem ? 'Edit Manual Bill' : 'Generate Manual Excel Bill'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8 scrollbar-hide">
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-3 bg-indigo-600 rounded-full"></span>
              Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Business Name</label>
                <input type="text" value={vendor} onChange={e => setVendor(e.target.value)} className={inputClasses} placeholder="Enter company name" />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Outlet/Brand</label>
                <input type="text" value={subVendor} onChange={e => setSubVendor(e.target.value)} className={inputClasses} placeholder="Enter brand name" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={inputClasses} placeholder="Street address, City, Pincode" />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Phone</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={inputClasses} placeholder="Contact number" />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">GSTIN Number</label>
                <input type="text" value={gstin} onChange={e => setGstin(e.target.value)} className={inputClasses} placeholder="GST Registration Number" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-3 bg-indigo-600 rounded-full"></span>
              Bill Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Bill No</label>
                <input type="text" value={billNo} onChange={e => setBillNo(e.target.value)} className={inputClasses} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClasses} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Time</label>
                <input type="text" value={time} onChange={e => setTime(e.target.value)} className={inputClasses} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputClasses}>
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Steward</label>
                <input type="text" value={steward} onChange={e => setSteward(e.target.value)} className={inputClasses} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Cashier</label>
                <input type="text" value={cashier} onChange={e => setCashier(e.target.value)} className={inputClasses} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-3 bg-slate-900 rounded-full"></span>
                Bill Line Items
              </h3>
              <button onClick={addItem} className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:text-indigo-800 transition-colors bg-indigo-50 px-4 py-2 rounded-xl active:scale-95">
                <i className="fas fa-plus mr-1.5"></i> Add Row
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-center group animate-in slide-in-from-right-2 duration-300">
                  <input type="number" placeholder="Qty" value={item.qty} onChange={e => updateItem(idx, 'qty', parseInt(e.target.value))} className={`${inputClasses} w-20`} />
                  <input type="text" placeholder="Item Name" value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl text-xs font-bold p-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  <input type="number" placeholder="Price" value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value))} className={`${inputClasses} w-32`} />
                  <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500 transition-colors p-2.5 rounded-xl hover:bg-red-50">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
             <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-3 bg-indigo-600 rounded-full"></span>
              Tax Configuration (%)
            </h3>
            <div className="grid grid-cols-3 gap-4">
               <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Service Ch (%)</label>
                <input type="number" step="0.1" value={serviceChargeRate} onChange={e => setServiceChargeRate(parseFloat(e.target.value))} className={inputClasses} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">CGST (%)</label>
                <input type="number" step="0.1" value={cgstRate} onChange={e => setCgstRate(parseFloat(e.target.value))} className={inputClasses} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">SGST (%)</label>
                <input type="number" step="0.1" value={sgstRate} onChange={e => setSgstRate(parseFloat(e.target.value))} className={inputClasses} />
              </div>
            </div>
          </section>

          <div className="bg-indigo-50/40 border border-indigo-100 p-6 rounded-3xl shadow-inner-sm">
             <div className="flex justify-between text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">
               <span>Subtotal</span>
               <span className="font-mono text-xs">{subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">
               <span>Tax & Service ({ (serviceChargeRate + cgstRate + sgstRate).toFixed(1) }%)</span>
               <span className="font-mono text-xs">{(total - subtotal).toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-xl font-black pt-4 border-t border-indigo-200/40">
              <span className="uppercase tracking-tighter text-indigo-900">Amount Due</span>
              <span className="text-indigo-700 font-mono">{total.toFixed(2)} <span className="text-xs font-bold text-indigo-400 uppercase">{currency}</span></span>
             </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row gap-4">
          <button onClick={onClose} className="flex-1 bg-white border border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:bg-slate-100 transition-all active:scale-95 shadow-sm">Discard</button>
          <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2">
            <i className="fas fa-check-circle text-lg"></i>
            {editingItem ? 'Update Report' : 'Save to Travel Hub'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualBillModal;
