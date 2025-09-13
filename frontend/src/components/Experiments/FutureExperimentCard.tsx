import React, { useState } from 'react';
import { Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Experiment } from '../../types/research';
import { formatDate } from '../../utils/helpers';

interface FutureExperimentCardProps {
  experiment: Experiment;
}

const FutureExperimentCard: React.FC<FutureExperimentCardProps> = ({ experiment }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-purple-100 p-1">
            <Calendar className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{experiment.title}</h4>
            <div className="mt-1 flex items-center text-sm text-gray-500">
              <Clock className="mr-1 h-4 w-4" />
              Planned for: {formatDate(experiment.plannedDate || experiment.createdAt)}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-full p-1 hover:bg-gray-100"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700">Research Goals</h5>
              <p className="mt-1 text-sm text-gray-600">
                {experiment.goals || 'No goals specified yet'}
              </p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700">Proposed Methodology</h5>
              <p className="mt-1 text-sm text-gray-600">
                {experiment.methodology || 'Methodology to be determined'}
              </p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700">Required Resources</h5>
              <p className="mt-1 text-sm text-gray-600">
                {experiment.resources || 'Resource requirements not specified'}
              </p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700">Keywords</h5>
              <div className="mt-2 flex flex-wrap gap-2">
                {experiment.keywords.map((keyword: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FutureExperimentCard;
