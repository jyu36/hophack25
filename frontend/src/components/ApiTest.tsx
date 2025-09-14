import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';

/**
 * Simple API Test Component
 * Add this to your App.tsx to test both APIs:
 *
 * import ApiTest from './components/ApiTest';
 *
 * function App() {
 *   return (
 *     <div>
 *       <ApiTest />
 *       {/* your other components *\/}
 *     </div>
 *   );
 * }
 */

interface ApiStatus {
  backend: {
    status: 'checking' | 'online' | 'offline';
    data?: any;
    error?: string;
  };
  assistant: {
    status: 'checking' | 'online' | 'offline';
    data?: any;
    error?: string;
  };
}

const ApiTest: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    backend: { status: 'checking' },
    assistant: { status: 'checking' }
  });

  const checkBackendAPI = async () => {
    try {
      const response = await fetch('http://localhost:8000/graph/overview');
      if (response.ok) {
        const data = await response.json();
        setApiStatus(prev => ({
          ...prev,
          backend: {
            status: 'online',
            data: {
              experiments: data.nodes?.length || 0,
              relationships: data.edges?.length || 0
            }
          }
        }));
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setApiStatus(prev => ({
        ...prev,
        backend: {
          status: 'offline',
          error: error instanceof Error ? error.message : 'Connection failed'
        }
      }));
    }
  };

  const checkAssistantAPI = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health');
      if (response.ok) {
        const data = await response.json();
        setApiStatus(prev => ({
          ...prev,
          assistant: { status: 'online', data }
        }));
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setApiStatus(prev => ({
        ...prev,
        assistant: {
          status: 'offline',
          error: error instanceof Error ? error.message : 'Connection failed'
        }
      }));
    }
  };

  const checkAllAPIs = () => {
    setApiStatus({
      backend: { status: 'checking' },
      assistant: { status: 'checking' }
    });

    checkBackendAPI();
    checkAssistantAPI();
  };

  useEffect(() => {
    checkAllAPIs();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'offline':
        return <XCircle className="text-red-500" size={20} />;
      case 'checking':
        return <RefreshCw className="text-blue-500 animate-spin" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  return (
    <div className="fixed z-50 p-4 bg-white border border-gray-200 rounded-lg shadow-lg top-4 right-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">API Status</h3>
        <button
          onClick={checkAllAPIs}
          className="p-1 rounded hover:bg-gray-100"
          title="Refresh API status"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Backend API Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(apiStatus.backend.status)}
            <div>
              <div className="text-sm font-medium">Backend API</div>
              <div className="text-xs text-gray-500">localhost:8000</div>
            </div>
          </div>

          <div className="text-xs text-right">
            {apiStatus.backend.status === 'online' && apiStatus.backend.data && (
              <div className="text-green-600">
                {apiStatus.backend.data.experiments} experiments
              </div>
            )}
            {apiStatus.backend.status === 'offline' && (
              <div className="text-red-600">
                {apiStatus.backend.error}
              </div>
            )}
          </div>
        </div>

        {/* Assistant API Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(apiStatus.assistant.status)}
            <div>
              <div className="text-sm font-medium">Assistant API</div>
              <div className="text-xs text-gray-500">localhost:3001</div>
            </div>
          </div>

          <div className="text-xs text-right">
            {apiStatus.assistant.status === 'online' && (
              <div className="text-green-600">Healthy</div>
            )}
            {apiStatus.assistant.status === 'offline' && (
              <div className="text-red-600">
                {apiStatus.assistant.error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      {(apiStatus.backend.status === 'offline' || apiStatus.assistant.status === 'offline') && (
        <div className="p-2 mt-3 text-xs border border-yellow-200 rounded bg-yellow-50">
          <div className="mb-1 font-medium text-yellow-800">Setup Required:</div>
          {apiStatus.backend.status === 'offline' && (
            <div className="text-yellow-700">• Start backend: <code>cd backend && ./start_apis.sh</code></div>
          )}
          {apiStatus.assistant.status === 'offline' && (
            <div className="text-yellow-700">• Start assistant: <code>cd assistant && npm run dev</code></div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiTest;
