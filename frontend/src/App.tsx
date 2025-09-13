import React, { useState } from 'react';
import AIChatResearchAssistant from './components/AIChatResearchAssistant';
import Dashboard from './components/Dashboard/Dashboard';
import { ExperimentSuggestion } from './types/research';
import { useExperiments } from './hooks/useExperiments';

const App: React.FC = () => {
  const [showChat, setShowChat] = useState(false);
  const [suggestions, setSuggestions] = useState<ExperimentSuggestion[]>([]);

  const handleSuggestionsGenerated = (newSuggestions: ExperimentSuggestion[]) => {
    setSuggestions(newSuggestions);
    setShowChat(true);
  };

  return (
    <div className="h-screen flex">
      {showChat ? (
        <AIChatResearchAssistant
          initialSuggestions={suggestions}
          onBackToDashboard={() => setShowChat(false)}
        />
      ) : (
        <Dashboard
          onNewExperiment={() => setShowChat(true)}
          onViewGraph={() => setShowChat(true)}
          onSuggestionsGenerated={handleSuggestionsGenerated}
        />
      )}
    </div>
  );
};

export default App;