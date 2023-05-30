export function parseCurrency(text: string): number {
  text = text.trim()
  let value = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.'));

  if (isNaN(value)) {
    return NaN
  }

  const lastChar = text.charAt(text.length - 1).toLowerCase();
  if (lastChar === 'm') {
    value *= 1_000_000_000;
  } else if (lastChar === 't' && text.charAt(text.length - 2).toLowerCase() == 'j') {
    value *= 1_000_000;
  }
  return value;
}