import { useState, useMemo, useCallback } from 'react';
import { Pill, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { getMedicineBox, addMedicine, removeMedicine } from '../lib/familyMedicineBox';
import { checkMedicationSafety } from '../lib/medicationSafety';

export function MedicineBoxPanel() {
  const [items, setItems] = useState(() => getMedicineBox());
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');

  const handleAdd = useCallback(() => {
    if (!newName.trim()) return;
    const item = addMedicine({ name: newName.trim(), quantity: newQty.trim() || '适量' });
    setItems(prev => [...prev, item]);
    setNewName('');
    setNewQty('');
  }, [newName, newQty]);

  const handleRemove = useCallback((id: string) => {
    removeMedicine(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  // Cross-check interactions between all medicines in the box
  const interactions = useMemo(() => {
    const names = items.map(i => i.name);
    if (names.length < 2) return [];
    const results = [];
    for (let a = 0; a < names.length; a++) {
      for (let b = a + 1; b < names.length; b++) {
        const checks = checkMedicationSafety([names[a]], [names[b]]);
        results.push(...checks);
      }
    }
    return results;
  }, [items]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Pill size={16} className="text-violet-600" />
        <p className="text-sm font-semibold text-slate-800">家庭药箱</p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          {items.length} 种
        </span>
      </div>

      {/* Add form */}
      <div className="flex gap-2 mb-3">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="药品名称"
          className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-300 focus:outline-none"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <input
          value={newQty}
          onChange={e => setNewQty(e.target.value)}
          placeholder="数量"
          className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-blue-300 focus:outline-none"
        />
        <button
          onClick={handleAdd}
          className="rounded-lg bg-blue-500 p-1.5 text-white hover:bg-blue-600 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Medicine list */}
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <div>
              <p className="text-xs font-medium text-slate-700">{item.name}</p>
              <p className="text-xs text-slate-400">{item.quantity}</p>
            </div>
            <button onClick={() => handleRemove(item.id)} className="text-slate-300 hover:text-red-400">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-3">药箱为空，添加家中常备药品</p>
        )}
      </div>

      {/* Interaction warnings */}
      {interactions.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={12} className="text-red-600" />
            <p className="text-xs font-semibold text-red-700">药物相互作用提醒</p>
          </div>
          {interactions.slice(0, 3).map((w, idx) => (
            <p key={idx} className="text-xs text-red-600 leading-relaxed">
              {w.triggeredBy.current} + {w.triggeredBy.recommended}：{w.interaction.warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
