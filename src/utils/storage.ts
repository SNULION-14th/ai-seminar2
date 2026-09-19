/**
 * Safe LocalStorage getter with fallback and raw string tolerance
 */
export function getStorageItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;

    try {
      return JSON.parse(item) as T;
    } catch {
      // Graceful fallback for non-JSON string values (e.g. raw "light" or "dark")
      return item as unknown as T;
    }
  } catch (error) {
    console.error(`Error reading key "${key}" from localStorage:`, error);
    return fallback;
  }
}

/**
 * Safe LocalStorage setter
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing key "${key}" to localStorage:`, error);
  }
}
