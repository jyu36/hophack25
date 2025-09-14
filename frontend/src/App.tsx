import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import AIChatResearchAssistant from "./components/AIChatResearchAssistant";
import Dashboard from "./components/Dashboard/Dashboard";
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

const ResearchAssistantWrapper: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AIChatResearchAssistant
      initialSuggestions={[]}
      onBackToDashboard={() => navigate("/")}
    />
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="h-screen">
        <Routes>
          <Route path="/" element={<DashboardWrapper />} />
          <Route path="/research" element={<ResearchAssistantWrapper />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
