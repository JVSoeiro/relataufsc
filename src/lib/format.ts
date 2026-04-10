export function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatPublicDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatApproximateCoordinates(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}
