import { useState } from 'react';

export const useLocalStorage = <ValueType>(
  keyName: string,
  defaultValue?: ValueType,
  deserialize = JSON.parse,
  serialize = JSON.stringify
): [ValueType | undefined, (newValue: ValueType) => void] => {
  const [storedValue, setStoredValue] = useState<ValueType | undefined>(() => {
    const value = globalThis.localStorage?.getItem(keyName);

    if (value !== null) {
      try {
        return deserialize(value) as ValueType;
      } catch {
        return defaultValue;
      }
    }

    if (typeof defaultValue !== 'undefined') {
      globalThis.localStorage?.setItem(keyName, serialize(defaultValue));
    }

    return defaultValue;
  });

  const setValue = (newValue: ValueType): void => {
    if (typeof newValue === 'string') {
      globalThis.localStorage?.setItem(keyName, newValue);
    } else {
      try {
        globalThis.localStorage?.setItem(keyName, serialize(newValue));
      } catch {
        throw new Error(`Failed to set ${keyName} in local storage.`);
      }
    }

    setStoredValue(newValue);
  };

  return [storedValue, setValue];
};