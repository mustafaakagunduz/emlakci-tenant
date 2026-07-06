import type { PropertyStatus } from './types';

export const statusTone: Record<PropertyStatus, 'green' | 'gray' | 'blue' | 'red'> = {
  ACTIVE: 'green',
  SOLD: 'blue',
  RENTED: 'blue',
  PASSIVE: 'red',
};

export function formatPrice(price: string | number, currency: string): string {
  const value = Number(price);
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}
