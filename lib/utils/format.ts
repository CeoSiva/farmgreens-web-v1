export function formatQuantity(qty: number, unit: string) {
  const normalizedUnit = unit.toLowerCase();
  
  if (normalizedUnit === "kg") {
    if (qty < 1) {
      return `${Math.round(qty * 1000)}g`;
    }
    return `${qty}kg`;
  }
  
  return `${qty} ${unit}`;
}
