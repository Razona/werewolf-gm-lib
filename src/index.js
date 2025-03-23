// Entry point for the library

// We'll export everything here as the library grows
export const VERSION = '0.1.0';

export function createGame(options = {}) {
  // This will be implemented later
  console.log('Game creation with options:', options);
  return { version: VERSION };
}