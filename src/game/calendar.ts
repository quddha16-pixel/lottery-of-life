import type { WorldDate } from "./types";
export const leap = (year: number) =>
  year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
export const daysInYear = (year: number) => (leap(year) ? 366 : 365);
export function nextDate(date: WorldDate): WorldDate {
  return date.day + 1 >= daysInYear(date.year)
    ? { year: date.year + 1, day: 0 }
    : { ...date, day: date.day + 1 };
}
export function formatDate(date: WorldDate): string {
  const months = [
    31,
    leap(date.year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  let day = date.day;
  let month = 0;
  while (day >= months[month] && month < 11) day -= months[month++];
  const year = date.year > 0 ? `${date.year}` : `${1 - date.year} BCE`;
  return `${day + 1} ${names[month]} ${year}`;
}
export function ageLabel(days: number): string {
  if (days < 365) return `${days} day${days === 1 ? "" : "s"}`;
  const years = Math.floor(days / 365);
  return `${years} yr${years === 1 ? "" : "s"}${days % 365 ? ` · ${days % 365} d` : ""}`;
}
