export const formatLaoKip = (amount: number): string => {
  return new Intl.NumberFormat("lo-LA", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

export const formatLaoKipWithCurrency = (amount: number): string => {
  return `${formatLaoKip(amount)} ກີບ`;
};

export const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
