const STORAGE_KEY = 'family_medicine_box';

export interface MedicineItem {
  id: string;
  name: string;
  quantity: string;
  expiryDate?: string;
  memberId?: string;
  addedAt: string;
}

export function getMedicineBox(): MedicineItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addMedicine(item: Omit<MedicineItem, 'id' | 'addedAt'>): MedicineItem {
  const items = getMedicineBox();
  const newItem: MedicineItem = {
    ...item,
    id: `med_${Math.random().toString(36).slice(2, 9)}`,
    addedAt: new Date().toISOString(),
  };
  items.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return newItem;
}

export function removeMedicine(id: string): void {
  const items = getMedicineBox().filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getMedicineBoxSummary(): string {
  const items = getMedicineBox();
  if (items.length === 0) return '';
  return items.map(i => `${i.name}(${i.quantity})`).join('、');
}
