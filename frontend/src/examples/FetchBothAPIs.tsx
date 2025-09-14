import React, { useState } from 'react';
import { Database, MessageCircle, Play, CheckCircle, XCircle } from 'lucide-react';

/**
 * Example component showing how to fetch from both existing APIs:
 * - Backend API (FastAPI) on localhost:8000
 * - Assistant API (Express.js) on localhost:3001
 */

interface BackendData {
  experiments?: any[];
  relationships?: any[];
  error?: string;
}

interface AssistantData {
  sessionId?: string;
  response?: string;
  error?: string;
}

const FetchBothAPIs: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [backendData, setBackendData] = useState<BackendData>({});
  const [assistantData, setAssistantData] = useState<AssistantData>({});
  const [message, setMessage] = useState('Hello! Can you help me analyze my research?');

  // Fetch from Backend API (FastAPI)
  const fetchBackendAPI = async () => {
    try {
      console.log('🔄 Fetching from Backend API (localhost:8000)...');

      // Fetch experiments and relationships
      const response = await fetch('http://localhost:8000/graph/overview');

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const data = await response.json();

      setBackendData({
        experiments: data.nodes || [],
        relationships: data.edges || []
      });

      console.log('✅ Backend API success:', data);
      return data;

    } catch (error) {
      console.error('❌ Backend API error:', error);
      setBackendData({
        error: error instanceof Error ? error.message : 'Failed to fetch backend data'
      });
      throw error;
    }
  };

  // Fetch from Assistant API (Express.js)
  const fetchAssistantAPI = async () => {
    try {
      console.log('🔄 Fetching from Assistant API (localhost:3001)...');

      // First, start a conversation
      const startResponse = await fetch('http://localhost:3001/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          useContext: true
        })
      });

      if (!startResponse.ok) {
        throw new Error(`Assistant API error: ${startResponse.status}`);
      }

      const startData = await startResponse.json();
      const sessionId = startData.sessionId;

      console.log('✅ Assistant conversation started:', sessionId);

      // Send a message
      const messageResponse = await fetch(`http://localhost:3001/api/conversations/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message
        })
      });

      if (!messageResponse.ok) {
        throw new Error(`Assistant message error: ${messageResponse.status}`);
      }

      const messageData = await messageResponse.json();

      setAssistantData({
        sessionId: sessionId,
        response: messageData.response
      });

      console.log('✅ Assistant API success:', messageData);
      return { sessionId, messageData };

    } catch (error) {
      console.error('❌ Assistant API error:', error);
      setAssistantData({
        error: error instanceof Error ? error.message : 'Failed to fetch assistant data'
      });
      throw error;
    }
  };

  // Fetch from both APIs
  const fetchBothAPIs = async () => {
    setIsLoading(true);
    setBackendData({});
    setAssistantData({});

    try {
      console.log('🚀 Starting to fetch from both APIs...');

      // Fetch from both APIs in parallel
      const [backendResult, assistantResult] = await Promise.allSettled([
        fetchBackendAPI(),
        fetchAssistantAPI()
      ]);

      console.log('📊 Results:');
      console.log('Backend:', backendResult.status === 'fulfilled' ? '✅' : '❌');
      console.log('Assistant:', assistantResult.status === 'fulfilled' ? '✅' : '❌');

    } catch (error) {
      console.error('❌ Failed to fetch from APIs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasBackendData = backendData.experiments && backendData.experiments.length > 0;
  const hasAssistantData = assistantData.sessionId && assistantData.response;
  const hasBackendError = !!backendData.error;
  const hasAssistantError = !!assistantData.error;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Fetch from Both Existing APIs Demo
      </h1>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-semibold text-blue-900 mb-2">API Endpoints</h2>
        <div className="text-sm text-blue-800 space-y-1">
          <div>🔗 Backend API: <code>http://localhost:8000</code> (FastAPI)</div>
          <div>🔗 Assistant API: <code>http://localhost:3001</code> (Express.js)</div>
        </div>
      </div>

      {/* Message Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message for Assistant API
        </label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter message for assistant..."
        />
      </div>

      {/* Fetch Button */}
      <div className="mb-6">
        <button
          onClick={fetchBothAPIs}
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={20} />
          <span>{isLoading ? 'Fetching...' : 'Fetch from Both APIs'}</span>
        </button>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend API Results */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Database className="text-blue-600" size={20} />
            <h3 className="font-semibold">Backend API Results</h3>
            {hasBackendData && <CheckCircle className="text-green-500" size={16} />}
            {hasBackendError && <XCircle className="text-red-500" size={16} />}
          </div>

          {hasBackendError ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {backendData.error}
            </div>
          ) : hasBackendData ? (
            <div className="space-y-2">
              <div className="p-2 bg-gray-50 rounded text-sm">
                <strong>Experiments:</strong> {backendData.experiments?.length || 0}
              </div>
              <div className="p-2 bg-gray-50 rounded text-sm">
                <strong>Relationships:</strong> {backendData.relationships?.length || 0}
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-blue-600">View Raw Data</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(backendData, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No data fetched yet</div>
          )}
        </div>

        {/* Assistant API Results */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <MessageCircle className="text-purple-600" size={20} />
            <h3 className="font-semibold">Assistant API Results</h3>
            {hasAssistantData && <CheckCircle className="text-green-500" size={16} />}
            {hasAssistantError && <XCircle className="text-red-500" size={16} />}
          </div>

          {hasAssistantError ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {assistantData.error}
            </div>
          ) : hasAssistantData ? (
            <div className="space-y-2">
              <div className="p-2 bg-gray-50 rounded text-sm">
                <strong>Session ID:</strong> {assistantData.sessionId}
              </div>
              <div className="p-2 bg-gray-50 rounded text-sm">
                <strong>Response:</strong>
                <div className="mt-1 text-gray-700">
                  {assistantData.response}
                </div>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-purple-600">View Raw Data</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(assistantData, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No data fetched yet</div>
          )}
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">How to Use This in Your Components</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>1. Backend API:</strong> Use <code>fetch('http://localhost:8000/graph/overview')</code> to get experiments and relationships</p>
          <p><strong>2. Assistant API:</strong> POST to <code>http://localhost:3001/api/conversations</code> to start, then POST messages to the session</p>
          <p><strong>3. Integration:</strong> You can call both APIs and pass the backend data to GraphPanel as props</p>
        </div>
      </div>
    </div>
  );
};

export default FetchBothAPIs;
