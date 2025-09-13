import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AIChatResearchAssistant from './components/AIChatResearchAssistant';
import Dashboard from './components/Dashboard/Dashboard';
import { useExperiments } from './hooks/useExperiments';
import { ExperimentSuggestion } from './types/research';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [showChat, setShowChat] = useState(false);
  const [initialSuggestions, setInitialSuggestions] = useState<ExperimentSuggestion[]>([]);
  const { experiments } = useExperiments();

  const handleSuggestionsGenerated = (suggestions: ExperimentSuggestion[]) => {
    setInitialSuggestions(suggestions);
    setShowChat(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex flex-col">
        {showChat ? (
          <AIChatResearchAssistant
            initialSuggestions={initialSuggestions}
            onBackToDashboard={() => setShowChat(false)}
          />
        ) : (
          <Dashboard
            experiments={experiments}
            onNewExperiment={() => setShowChat(true)}
            onViewGraph={() => setShowChat(true)}
            onSuggestionsGenerated={handleSuggestionsGenerated}
          />
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;