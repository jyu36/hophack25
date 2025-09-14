import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils/helpers'; // Corrected import path

interface Keyword {
  text: string;
  isUsed: boolean;
  timestamp: Date;
}

interface KeywordListProps {
  keywords: Keyword[];
  onKeywordClick: (keyword: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const KeywordList: React.FC<KeywordListProps> = ({
  keywords,
  onKeywordClick,
  isCollapsed,
  onToggle,
}) => {
  return (
    <div
      className={`absolute top-4 right-4 bg-white rounded-lg shadow-lg border transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center">
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform duration-300 ${
                isCollapsed ? '' : 'rotate-180'
              }`}
            />
          </button>
          {!isCollapsed && (
            <h4 className="text-sm font-medium text-gray-900 ml-2">
              Extracted Keywords
            </h4>
          )}
        </div>
      </div>

      {/* Keyword List */}
      {!isCollapsed && (
        <div className="p-3 max-h-[500px] overflow-y-auto">
          <div className="space-y-2">
            {keywords.map((keyword) => (
              <div
                key={keyword.text}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center">
                  {keyword.isUsed ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <span
                    className={`ml-2 text-sm ${
                      keyword.isUsed
                        ? 'line-through text-gray-400'
                        : 'text-gray-700 hover:text-blue-600 cursor-pointer'
                    }`}
                    onClick={() => !keyword.isUsed && onKeywordClick(keyword.text)}
                  >
                    {keyword.text}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    Added: {formatDate(keyword.timestamp.toISOString())} {/* Convert Date to string */}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {keywords.length === 0 && (
            <p className="text-sm text-gray-500 text-center">
              No keywords extracted yet
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default KeywordList;