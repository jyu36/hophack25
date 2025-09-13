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
    <div className="bg-white rounded-lg border border-gray-200 p-2.5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{suggestion.title}</h4>
          <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{suggestion.description}</p>

          {suggestion.reasoning && (
            <p className="mt-1 text-xs text-blue-600 italic line-clamp-1">
              💡 {suggestion.reasoning}
            </p>
          )}

          {suggestion.keywords && suggestion.keywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {suggestion.keywords.slice(0, 3).map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                >
                  {keyword}
                </span>
              ))}
              {suggestion.keywords.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{suggestion.keywords.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex gap-1.5">
        <Button
          variant="success"
          size="sm"
          className="flex-1 py-1 text-xs"
          onClick={() => onAccept(suggestion)}
        >
          <Check className="mr-1 h-3 w-3" />
          Accept
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 py-1 text-xs"
          onClick={() => onDecline(suggestion)}
        >
          <Clock className="mr-1 h-3 w-3" />
          Later
        </Button>
      </div>
    </div>
  );
};

export default SuggestionCard;