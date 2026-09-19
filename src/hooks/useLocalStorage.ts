import { useState, useEffect } from 'react';
import { getStorageItem, setStorageItem } from '../utils/storage';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getStorageItem<T>(key, initialValue);
  });

  useEffect(() => {
    setStorageItem<T>(key, storedValue);
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
