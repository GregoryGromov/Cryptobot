import Decimal from 'decimal.js';

export const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN });
export type Usd = string & { readonly __brand: 'Usd' };
export type Price = string & { readonly __brand: 'Price' };
export const usd = (value: Decimal.Value): Usd => {
  const number = new D(value);
  if (!number.isFinite()) throw new Error('Invalid monetary value');
  return number.toDecimalPlaces(8).toFixed(8) as Usd;
};
export const price = (value: Decimal.Value): Price => {
  const number = new D(value);
  if (!number.isFinite() || number.lte(0)) throw new Error('Invalid price');
  return number.toDecimalPlaces(18).toFixed() as Price;
};
