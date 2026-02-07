'use client';

import { ReactNode } from 'react';

export default function IssoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-isso-teal/20 to-isso-coral/10">
      {/* Responsive container - full width on mobile, centered card on desktop */}
      <div className="w-full lg:max-w-6xl xl:max-w-7xl mx-auto bg-white min-h-screen lg:my-0 lg:shadow-2xl lg:rounded-none">
        {children}
      </div>
    </div>
  );
}
