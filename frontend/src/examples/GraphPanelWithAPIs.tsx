import React, { useState, useEffect } from 'react';
import GraphPanel from '../components/Graph/GraphPanel';
import { RefreshCw, MessageCircle, Database } from 'lucide-react';

/**
 * Example showing how to integrate existing GraphPanel with both APIs:
 * - Fetch experiments and relationships from Backend API
 * - Send messages to Assistant API
 * - Display everything together
 */

interface ApiData {
  experiments: any[];
  relationships: any[];
  isLoading: boolean;
  error: string | null;
}

interface AssistantState {
  sessionId: string | null;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  isLoading: boolean;
  error: string | null;
}

const GraphPanelWithAPIs: React.FC = () => {
  const [apiData, setApiData] = useState<ApiData>({
    experiments: [],
    relationships: [],
    isLoading: false,
    error: null
  });

  const [assistant, setAssistant] = useState<AssistantState>({
    sessionId: null,
    messages: [],
    isLoading: false,
    error: null
  });

  const [messageInput, setMessageInput] = useState('');

  // Fetch experiments and relationships from Backend API
  const fetchBackendData = async () => {
    setApiData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Fetching from Backend API...');

      const response = await fetch('http://localhost:8000/graph/overview');

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const data = await response.json();

      // Convert the data to the format expected by GraphPanel
      const experiments = data.nodes.map((node: any) => ({
        ...node,
        type: node.type || 'experiment',
        status: node.status || 'planned',
        keywords: [],
        aiGenerated: false,
        level: 0
      }));

      const relationships = data.edges.map((edge: any) => ({
        id: edge.id,
        from: edge.from_experiment_id,
        to: edge.to_experiment_id,
        type: edge.relationship_type,
        label: edge.label
      }));

      setApiData({
        experiments,
        relationships,
        isLoading: false,
        error: null
      });

      console.log(`✅ Loaded ${experiments.length} experiments and ${relationships.length} relationships`);

    } catch (error) {
      console.error('❌ Backend API error:', error);
      setApiData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data'
      }));
    }
  };

  // Start assistant conversation
  const startAssistantConversation = async () => {
    if (assistant.sessionId) return; // Already started

    setAssistant(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Starting Assistant conversation...');

      const response = await fetch('http://localhost:3001/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useContext: true })
      });

      if (!response.ok) {
        throw new Error(`Assistant API error: ${response.status}`);
      }

      const data = await response.json();

      setAssistant(prev => ({
        ...prev,
        sessionId: data.sessionId,
        messages: [{ role: 'assistant', content: 'Hello! I\'m ready to help you analyze your research.' }],
        isLoading: false,
        error: null
      }));

      console.log('✅ Assistant conversation started:', data.sessionId);

    } catch (error) {
      console.error('❌ Assistant API error:', error);
      setAssistant(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start conversation'
      }));
    }
  };

  // Send message to assistant
  const sendMessage = async () => {
    if (!messageInput.trim() || !assistant.sessionId) return;

    const message = messageInput.trim();
    setMessageInput('');

    // Add user message
    setAssistant(prev => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content: message }],
      isLoading: true,
      error: null
    }));

    try {
      console.log('Sending message to Assistant...');

      const response = await fetch(`http://localhost:3001/api/conversations/${assistant.sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error(`Assistant message error: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant response
      setAssistant(prev => ({
        ...prev,
        messages: [...prev.messages, { role: 'assistant', content: data.response }],
        isLoading: false,
        error: null
      }));

      console.log('✅ Assistant responded');

    } catch (error) {
      console.error('❌ Assistant message error:', error);
      setAssistant(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }));
    }
  };

  // Auto-fetch data on component mount
  useEffect(() => {
    fetchBackendData();
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Research Graph with API Integration
          </h1>

          <div className="flex items-center space-x-4">
            {/* API Status */}
            <div className="flex items-center space-x-2 text-sm">
              <Database size={16} className="text-blue-600" />
              <span className={`${apiData.error ? 'text-red-600' : 'text-green-600'}`}>
                Backend: {apiData.experiments.length} experiments
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <MessageCircle size={16} className="text-purple-600" />
              <span className={`${assistant.sessionId ? 'text-green-600' : 'text-gray-500'}`}>
                Assistant: {assistant.sessionId ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchBackendData}
              disabled={apiData.isLoading}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={apiData.isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {(apiData.error || assistant.error) && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {apiData.error || assistant.error}
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Graph Panel - Main Content */}
        <div className="flex-1">
          <GraphPanel
            experiments={apiData.experiments}
            relationships={apiData.relationships}
            extractedKeywords={[]}
            onKeywordSelect={() => {}}
          />
        </div>

        {/* Assistant Chat Panel */}
        <div className="w-80 border-l bg-white flex flex-col">
          <div className="p-3 border-b bg-gray-50">
            <h3 className="font-medium text-gray-900">AI Assistant</h3>
            {!assistant.sessionId && (
              <button
                onClick={startAssistantConversation}
                disabled={assistant.isLoading}
                className="mt-2 w-full px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Start Conversation
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {assistant.messages.map((msg, index) => (
              <div key={index} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-2 rounded max-w-xs ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}>
                  <div className="text-xs font-medium mb-1">
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <div className="text-sm">{msg.content}</div>
                </div>
              </div>
            ))}

            {assistant.isLoading && (
              <div className="text-center">
                <div className="inline-block p-2 bg-gray-100 rounded">
                  <div className="text-sm text-gray-600">Assistant is typing...</div>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          {assistant.sessionId && (
            <div className="p-3 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about your research..."
                  className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  disabled={assistant.isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={assistant.isLoading || !messageInput.trim()}
                  className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraphPanelWithAPIs;
