'use client';

import { useEffect } from 'react';

export function ConsoleCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Suppress specific React DevTools warning
      const originalWarn = console.warn;
      console.warn = (...args) => {
        if (
          typeof args[0] === 'string' && 
          (args[0].includes('Download the React DevTools') ||
           args[0].includes('Extra attributes from the server'))
        ) {
          return;
        }
        originalWarn.apply(console, args);
      };

      // Suppress hydration warnings
      const originalError = console.error;
      console.error = (...args) => {
        if (
          typeof args[0] === 'string' && 
          args[0].includes('Warning: Extra attributes from the server')
        ) {
          return;
        }
        originalError.apply(console, args);
      };
    }
  }, []);

  return null;
}