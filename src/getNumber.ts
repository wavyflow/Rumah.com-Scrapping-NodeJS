export function getNumber(text: string): number | null {
    const regex = /\d+/;
    const match = text.match(regex);
    if (match) {
      return parseInt(match[0], 10);
    }
    return null;
  }