// src/components/GrantFinancialAidModal.jsx
import React, { useState } from 'react';
import { DollarSign, X } from 'lucide-react';

export default function GrantFinancialAidModal({ student, onClose, onSubmit }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Tuition / Fee Support');

  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="text-emerald-400" size={20} />
            Provide College Fund
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-slate-300 mb-4">
          Grant financial assistance for <strong className="text-white">{student.name}</strong>.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(student._id || student.id, { amount, reason });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Fund Amount ($)</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition"
          >
            Confirm Financial Aid
          </button>
        </form>
      </div>
    </div>
  );
}