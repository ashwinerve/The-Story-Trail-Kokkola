/**
 * BigInt serialization utilities for localStorage and JSON operations
 * This fixes "JSON.stringify cannot serialize BigInt" errors
 * 
 * Note: BigInt.prototype.toJSON polyfill is set in main.tsx for global JSON operations
 * These utilities provide additional control for specific serialization needs
 */

// Custom JSON replacer for BigInt serialization
export const bigIntReplacer = (_key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

// Custom JSON reviver for BigInt deserialization
export const bigIntReviver = (_key: string, value: any) => {
  // Check if the value looks like a BigInt string (numeric string)
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    // Only convert if it's a known BigInt field
    const bigIntFields = ['sequenceNumber', 'lastCompletedLocation', 'totalLocations', 'completedLocations', 'currentSequences'];
    if (bigIntFields.some(field => _key.includes(field))) {
      try {
        return BigInt(value);
      } catch {
        return value;
      }
    }
  }
  // Handle arrays of BigInt strings
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'string' && /^\d+$/.test(item)) {
        try {
          return BigInt(item);
        } catch {
          return item;
        }
      }
      return item;
    });
  }
  return value;
};

