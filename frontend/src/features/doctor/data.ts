export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const SLOT_LENGTHS = [5, 10, 15, 20, 30];

export function shortTime(time: string) {
  return time.slice(0, 5);
}
