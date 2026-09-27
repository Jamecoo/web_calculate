// Expense categories. Stored on each Purchase as `category` (the id), so the
// cost report can break a period down by what the money went on, not just by
// who spent it. Ids are stable — change the label, never the id.
export interface ExpenseCategory {
  id: string
  label: string
  emoji: string
  color: string
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'food', label: 'ອາຫານ', emoji: '🍜', color: '#ef4444' },
  { id: 'drink', label: 'ເຄື່ອງດື່ມ', emoji: '🥤', color: '#f59e0b' },
  { id: 'transport', label: 'ເດີນທາງ', emoji: '🚗', color: '#3b82f6' },
  { id: 'stay', label: 'ທີ່ພັກ', emoji: '🏨', color: '#8b5cf6' },
  { id: 'shopping', label: 'ຊື້ເຄື່ອງ', emoji: '🛍️', color: '#ec4899' },
  { id: 'fun', label: 'ບັນເທີງ', emoji: '🎉', color: '#10b981' },
  { id: 'other', label: 'ອື່ນໆ', emoji: '📌', color: '#64748b' },
]

export const DEFAULT_CATEGORY_ID = 'other'

export const getCategory = (id?: string): ExpenseCategory =>
  EXPENSE_CATEGORIES.find((c) => c.id === id) ??
  EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]

export const categoryLabel = (id?: string): string => {
  const c = getCategory(id)
  return `${c.emoji} ${c.label}`
}
