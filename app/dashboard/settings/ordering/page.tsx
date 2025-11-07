'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Award, Settings as SettingsIcon } from 'lucide-react';

export default function OrderingSettings() {
  const [settings, setSettings] = useState({
    ordering: {
      enabled: true,
      requiresApproval: false
    },
    loyalty: {
      enabled: false,
      required: false,
      label: 'Loyalty Number',
      placeholder: 'Enter your loyalty number',
      helpText: ''
    }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings/ordering');
      const data = await response.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/ordering', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      if (data.success) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900">Ordering & Loyalty Settings</h1>
        </div>

        {/* Ordering Settings */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Online Ordering</h2>
          </div>
          
          <div className="space-y-4 ml-8">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.ordering.enabled}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  ordering: { ...prev.ordering, enabled: e.target.checked }
                }))}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <div>
                <span className="font-medium text-gray-900">Enable Online Ordering</span>
                <p className="text-sm text-gray-500">Allow customers to place orders directly from the menu</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.ordering.requiresApproval}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  ordering: { ...prev.ordering, requiresApproval: e.target.checked }
                }))}
                disabled={!settings.ordering.enabled}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 disabled:opacity-50"
              />
              <div>
                <span className="font-medium text-gray-900">Require Order Approval</span>
                <p className="text-sm text-gray-500">Orders need manual confirmation before processing</p>
              </div>
            </label>
          </div>
        </div>

        {/* Loyalty Program Settings */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Loyalty Program</h2>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
              Enterprise
            </span>
          </div>
          
          <div className="space-y-4 ml-8">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.loyalty.enabled}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  loyalty: { ...prev.loyalty, enabled: e.target.checked }
                }))}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <div>
                <span className="font-medium text-gray-900">Enable Loyalty Program</span>
                <p className="text-sm text-gray-500">Track customer loyalty numbers with orders</p>
              </div>
            </label>

            {settings.loyalty.enabled && (
              <>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.loyalty.required}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      loyalty: { ...prev.loyalty, required: e.target.checked }
                    }))}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Require Loyalty Number</span>
                    <p className="text-sm text-gray-500">Customers must provide loyalty number to place orders</p>
                  </div>
                </label>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field Label
                    </label>
                    <input
                      type="text"
                      value={settings.loyalty.label}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        loyalty: { ...prev.loyalty, label: e.target.value }
                      }))}
                      placeholder="Loyalty Number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Examples: "Member Number", "Rewards Card", "Loyalty ID"
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placeholder Text
                    </label>
                    <input
                      type="text"
                      value={settings.loyalty.placeholder}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        loyalty: { ...prev.loyalty, placeholder: e.target.value }
                      }))}
                      placeholder="Enter your loyalty number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Help Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={settings.loyalty.helpText}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        loyalty: { ...prev.loyalty, helpText: e.target.value }
                      }))}
                      placeholder="e.g., Earn 10 points for every $1 spent"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Preview */}
        {settings.loyalty.enabled && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Preview</h3>
            <div className="bg-white rounded-lg p-4 border">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Award className="w-4 h-4 inline mr-2" />
                {settings.loyalty.label} {settings.loyalty.required && '*'}
              </label>
              <input
                type="text"
                placeholder={settings.loyalty.placeholder}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              {settings.loyalty.helpText && (
                <p className="text-xs text-gray-500 mt-1">{settings.loyalty.helpText}</p>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 How This Works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Online Ordering</strong>: Requires Pro or Enterprise subscription</li>
          <li>• <strong>Loyalty Program</strong>: Enterprise feature for tracking customer rewards</li>
          <li>• Settings apply to all menus at this location</li>
          <li>• Changes take effect immediately for new orders</li>
        </ul>
      </div>
    </div>
  );
}
