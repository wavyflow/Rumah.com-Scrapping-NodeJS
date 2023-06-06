export function getNumber(text: string): number | null {
    const regex = /(\d+(?:,\d+)?)\s*m²/i
    const match = text.match(regex);

    if (match) {
      const areaString = match[1].replace(/,/g, '');
      return parseFloat(areaString);
    }

    return null;
  }