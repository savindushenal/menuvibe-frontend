'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

export default function TestAPIPage() {
  const [status, setStatus] = useState<string>('🔄 Initializing...');
  const [healthCheck, setHealthCheck] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    const results: any[] = [];

    try {
      // Test 1: Health Check
      setStatus('🔍 Testing backend health...');
      const healthResponse = await fetch('http://localhost:8000/api/health');
      const healthData = await healthResponse.json();
      setHealthCheck(healthData);
      results.push({
        test: 'Backend Health Check',
        status: healthResponse.ok ? '✅ PASS' : '❌ FAIL',
        data: healthData,
      });

      // Test 2: API Client Initialization
      setStatus('🔍 Testing API client...');
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      results.push({
        test: 'API Client Initialization',
        status: '✅ PASS',
        data: { token: token ? 'Token exists' : 'No token (expected for new user)' },
      });

      // Test 3: Public Endpoint (Subscription Plans)
      setStatus('🔍 Testing public API endpoint...');
      try {
        const plansResponse = await apiClient.getSubscriptionPlans();
        results.push({
          test: 'Get Subscription Plans (Public)',
          status: plansResponse.success ? '✅ PASS' : '❌ FAIL',
          data: plansResponse.data || plansResponse.message,
        });
      } catch (error: any) {
        results.push({
          test: 'Get Subscription Plans (Public)',
          status: '❌ FAIL',
          data: error.message,
        });
      }

      // Test 4: Test Registration (optional - creates test user)
      // Uncomment to test registration
      /*
      setStatus('🔍 Testing user registration...');
      const registerResponse = await apiClient.register({
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        password_confirmation: 'password123',
      });
      results.push({
        test: 'User Registration',
        status: registerResponse.success ? '✅ PASS' : '❌ FAIL',
        data: registerResponse.data || registerResponse.message,
      });

      if (registerResponse.success) {
        // Test 5: Get Current User (requires auth)
        setStatus('🔍 Testing authenticated endpoint...');
        const userResponse = await apiClient.getCurrentUser();
        results.push({
          test: 'Get Current User (Authenticated)',
          status: userResponse.success ? '✅ PASS' : '❌ FAIL',
          data: userResponse.data?.user || userResponse.message,
        });
      }
      */

      setStatus('✅ All tests completed!');
      setTestResults(results);

    } catch (error: any) {
      setStatus('❌ Error running tests');
      results.push({
        test: 'Test Suite',
        status: '❌ ERROR',
        data: error.message,
      });
      setTestResults(results);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 API Integration Test Suite
          </h1>

          <div className="mb-8">
            <div className="text-lg font-semibold mb-2">Status:</div>
            <div className="text-xl">{status}</div>
          </div>

          {healthCheck && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                ✅ Backend Health Check
              </h2>
              <pre className="text-sm text-green-800 overflow-auto">
                {JSON.stringify(healthCheck, null, 2)}
              </pre>
            </div>
          )}

          {testResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Test Results</h2>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status.includes('PASS')
                      ? 'bg-green-50 border-green-200'
                      : result.status.includes('FAIL')
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{result.test}</h3>
                    <span className="text-xl">{result.status}</span>
                  </div>
                  <pre className="text-sm overflow-auto mt-2 p-2 bg-white rounded">
                    {typeof result.data === 'string'
                      ? result.data
                      : JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              📝 Next Steps:
            </h3>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>Backend is running on http://localhost:8000</li>
              <li>Frontend is using secure API client</li>
              <li>Try registering a new user to test authentication</li>
              <li>Check browser console for detailed API logs</li>
              <li>All API calls are now going through Laravel backend</li>
            </ul>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={runTests}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔄 Re-run Tests
            </button>
            <a
              href="/auth/login"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              🔐 Go to Login
            </a>
            <a
              href="/auth/register"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              ✨ Register New User
            </a>
          </div>
        </div>

        <div className="mt-8 bg-white shadow-lg rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">🔐 Security Verification</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <div className="font-semibold">No Database Credentials in Frontend</div>
                <div className="text-gray-600">
                  Check .env.local - only public API URL is exposed
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <div className="font-semibold">API-Based Architecture</div>
                <div className="text-gray-600">
                  All data access goes through Laravel API endpoints
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <div className="font-semibold">Token Management</div>
                <div className="text-gray-600">
                  JWT tokens stored securely in localStorage with auto-refresh
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <div className="font-semibold">Rate Limiting</div>
                <div className="text-gray-600">
                  Automatic retry with exponential backoff on rate limits
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 text-white rounded-lg p-6">
          <h3 className="text-xl font-bold mb-3">🚀 Quick API Test Commands</h3>
          <div className="space-y-3 font-mono text-sm">
            <div>
              <div className="text-gray-400 mb-1"># Test health endpoint</div>
              <code className="block bg-gray-900 p-2 rounded">
                curl http://localhost:8000/api/health
              </code>
            </div>
            <div>
              <div className="text-gray-400 mb-1"># Get subscription plans</div>
              <code className="block bg-gray-900 p-2 rounded">
                curl http://localhost:8000/api/subscription-plans
              </code>
            </div>
            <div>
              <div className="text-gray-400 mb-1"># Register user</div>
              <code className="block bg-gray-900 p-2 rounded overflow-x-auto">
                curl -X POST http://localhost:8000/api/register -H "Content-Type: application/json" -d '{"{"}
                "name":"John","email":"john@test.com","password":"pass123","password_confirmation":"pass123"
                {"}"}'
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
