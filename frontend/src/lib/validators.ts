export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isPhone(value: string) {
  return /^\+?[0-9]{10,15}$/.test(value.trim());
}

export function checkReason(reason: string, message = "Give a reason of at least 10 characters.") {
  return reason.trim().length < 10 ? message : undefined;
}
