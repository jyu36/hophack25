import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

/**
 * Simple component to test both existing APIs
 * Can be easily added to App.tsx for testing
 */

const SimpleAPITest: React.FC = () => {
  const [results, setResults] = useState<{
    backend: { status: 'idle' | 'loading' | 'success' | 'error'; data?: any; error?: string };
    assistant: { status: 'idle' | 'loading' | 'success' | 'error'; data?: any; error?: string };
  }>({
    backend: { status: 'idle' },
    assistant: { status: 'idle' }
  });

  const testBackendAPI = async () => {
    setResults(prev => ({
      ...prev,
      backend: { status: 'loading' }
    }));

    try {
      const response = await fetch('http://localhost:8000/graph/overview');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setResults(prev => ({
        ...prev,
        backend: { status: 'success', data }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        backend: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };

  const testAssistantAPI = async () => {
    setResults(prev => ({
      ...prev,
      assistant: { status: 'loading' }
    }));

    try {
      // Start conversation
      const startResponse = await fetch('http://localhost:3001/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useContext: true })
      });

      if (!startResponse.ok) throw new Error(`HTTP ${startResponse.status}`);

      const startData = await startResponse.json();

      // Send test message
      const messageResponse = await fetch(`http://localhost:3001/api/conversations/${startData.sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello, can you help me?' })
      });

      if (!messageResponse.ok) throw new Error(`HTTP ${messageResponse.status}`);

      const messageData = await messageResponse.json();

      setResults(prev => ({
        ...prev,
        assistant: {
          status: 'success',
          data: { sessionId: startData.sessionId, response: messageData.response }
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        assistant: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };

  const testBothAPIs = async () => {
    await Promise.all([testBackendAPI(), testAssistantAPI()]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading': return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />;
      case 'success': return <CheckCircle className="text-green-500" size={16} />;
      case 'error': return <XCircle className="text-red-500" size={16} />;
      default: return <AlertCircle className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4">API Connection Test</h2>

      <div className="space-y-4">
        {/* Test Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={testBackendAPI}
            disabled={results.backend.status === 'loading'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test Backend API
          </button>
          <button
            onClick={testAssistantAPI}
            disabled={results.assistant.status === 'loading'}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Test Assistant API
          </button>
          <button
            onClick={testBothAPIs}
            disabled={results.backend.status === 'loading' || results.assistant.status === 'loading'}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
          >
            <Play size={16} />
            <span>Test Both</span>
          </button>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Backend Results */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon(results.backend.status)}
              <h3 className="font-medium">Backend API</h3>
              <code className="text-xs bg-gray-100 px-1 rounded">:8000</code>
            </div>

            {results.backend.status === 'success' && (
              <div className="text-sm text-green-700">
                ✅ Found {results.backend.data?.nodes?.length || 0} experiments
              </div>
            )}

            {results.backend.status === 'error' && (
              <div className="text-sm text-red-700">
                ❌ {results.backend.error}
              </div>
            )}
          </div>

          {/* Assistant Results */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon(results.assistant.status)}
              <h3 className="font-medium">Assistant API</h3>
              <code className="text-xs bg-gray-100 px-1 rounded">:3001</code>
            </div>

            {results.assistant.status === 'success' && (
              <div className="text-sm text-green-700">
                ✅ Session: {results.assistant.data?.sessionId?.substring(0, 8)}...
              </div>
            )}

            {results.assistant.status === 'error' && (
              <div className="text-sm text-red-700">
                ❌ {results.assistant.error}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Make sure both services are running:</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div>📁 Backend: <code>cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000</code></div>
            <div>📁 Assistant: <code>cd assistant && npm run dev</code></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleAPITest;
