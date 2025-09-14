import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import AIChatResearchAssistant from "./components/AIChatResearchAssistant";
import Dashboard from "./components/Dashboard/Dashboard";
import Communication from "./components/Communication/Communication";
import MainLayout from "./components/Common/Layout";
import { ExperimentSuggestion } from "./types/research";

const DashboardWrapper: React.FC = () => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<ExperimentSuggestion[]>([]);

  const handleSuggestionsGenerated = (
    newSuggestions: ExperimentSuggestion[]
  ) => {
    setSuggestions(newSuggestions);
    navigate("/research", { state: { suggestions: newSuggestions } });
  };

  return (
    <Dashboard
      onNewExperiment={() => navigate("/research")}
      onViewGraph={() => navigate("/research")}
      onSuggestionsGenerated={handleSuggestionsGenerated}
    />
  );
};

// Create a stable empty array to prevent unnecessary re-renders
const EMPTY_SUGGESTIONS: ExperimentSuggestion[] = [];

const ResearchAssistantWrapper: React.FC = () => {
  return (
    <AIChatResearchAssistant
      initialSuggestions={EMPTY_SUGGESTIONS}
    />
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<DashboardWrapper />} />
          <Route path="/research" element={<ResearchAssistantWrapper />} />
          <Route path="/communication" element={<Communication />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};

export default App;
