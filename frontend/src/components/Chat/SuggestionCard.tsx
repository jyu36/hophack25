import React from 'react';
import { Check, Clock } from 'lucide-react';
import { ExperimentSuggestion } from '../../types/research';
import Button from '../Common/Button';

interface SuggestionCardProps {
  suggestion: ExperimentSuggestion;
  onAccept: (suggestion: ExperimentSuggestion) => void;
  onDecline: (suggestion: ExperimentSuggestion) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onDecline,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-medium text-gray-900">{suggestion.title}</h4>
          <p className="mt-1 text-sm text-gray-600">{suggestion.description}</p>

          {suggestion.reasoning && (
            <p className="mt-2 text-sm text-blue-600 italic">
              💡 {suggestion.reasoning}
            </p>
          )}

          {suggestion.keywords && suggestion.keywords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestion.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="success"
          size="sm"
          className="flex-1"
          onClick={() => onAccept(suggestion)}
        >
          <Check className="mr-1 h-4 w-4" />
          Accept
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => onDecline(suggestion)}
        >
          <Clock className="mr-1 h-4 w-4" />
          Keep for Later
        </Button>
      </div>
    </div>
  );
};

export default SuggestionCard;