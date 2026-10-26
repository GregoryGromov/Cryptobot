const numberFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();

const numberFormat = (locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat => {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, options);
    numberFormats.set(key, format);
  }
  return format;
};

export const dateFormat = (locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = dateFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options);
    dateFormats.set(key, format);
  }
  return format;
};

const TYPOGRAPHIC_MINUS = '−';

export const formatNumber = (locale: string, options: Intl.NumberFormatOptions, value: number): string =>
  numberFormat(locale, options)
    .formatToParts(value)
    .map((part) => (part.type === 'minusSign' ? TYPOGRAPHIC_MINUS : part.value))
    .join('');
