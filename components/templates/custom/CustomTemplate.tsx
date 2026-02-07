'use client';

import { 
  MenuItem, 
  FranchiseInfo, 
  LocationInfo 
} from '../premium/types';

interface CustomTemplateProps {
  franchise: FranchiseInfo;
  location: LocationInfo;
  menuItems: MenuItem[];
}

/**
 * Custom Template - For franchises with special requirements
 * 
 * This template serves as a starting point for franchise-specific implementations.
 * 
 * Use cases:
 * - Franchise has their own payment gateway
 * - Franchise has loyalty/rewards program
 * - Franchise needs user authentication
 * - Franchise has custom ordering flow
 * - Franchise needs integration with POS systems
 * 
 * How to customize for a specific franchise:
 * 1. Create a new file: CustomTemplate_[FranchiseSlug].tsx
 * 2. Import and extend this base template
 * 3. Override specific components as needed
 * 4. Add franchise-specific logic
 * 
 * Example:
 * ```
 * // CustomTemplate_CoffeeHouse.tsx
 * import CustomTemplate from './CustomTemplate';
 * 
 * export default function CoffeeHouseTemplate(props) {
 *   return (
 *     <CustomTemplate 
 *       {...props}
 *       customPayment={<CoffeeHousePayment />}
 *       customHeader={<CoffeeHouseLoyaltyHeader />}
 *     />
 *   );
 * }
 * ```
 */
export default function CustomTemplate({ 
  franchise, 
  location, 
  menuItems 
}: CustomTemplateProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* ============================================
          CUSTOM TEMPLATE PLACEHOLDER
          
          This template needs to be customized based on
          the specific franchise requirements.
          
          Contact dev team to implement:
          - Custom payment integration
          - User authentication
          - Loyalty programs
          - External ordering systems
          ============================================ */}
      
      <header className="bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">{franchise.name}</h1>
          <p className="text-gray-400">{location.name}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            🛠️ Custom Template
          </h2>
          <p className="text-yellow-700 text-sm">
            This franchise uses a custom template. Contact your development team 
            to implement the specific features required for this franchise.
          </p>
        </div>

        <h2 className="text-xl font-bold mb-4">Menu Items ({menuItems.length})</h2>
        
        <div className="space-y-4">
          {menuItems.map(item => (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <span className="font-bold">Rs. {item.price.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-gray-100 p-6 text-center text-sm text-gray-500">
        <p>Custom Template - Powered by MenuVibe</p>
      </footer>
    </div>
  );
}
