export const formatLaoKip = (amount: number): string => {
  return new Intl.NumberFormat("lo-LA", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatLaoKipWithCurrency = (amount: number): string => {
  return `${formatLaoKip(amount)} ກີບ`;
};
