import React from 'react';
import { Check, Clock } from 'lucide-react';
import { Experiment } from '../../types/research';
import { formatDate } from '../../utils/helpers';

interface RecentExperimentsProps {
  experiments: Experiment[];
}

const RecentExperiments: React.FC<RecentExperimentsProps> = ({ experiments }) => {
  if (experiments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No experiments yet. Start by adding one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {experiments.map((experiment) => (
        <div
          key={experiment.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
        >
          <div className="flex items-start space-x-3">
            <div className={`mt-1 rounded-full p-1 ${
              experiment.status === 'accepted' ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {experiment.status === 'accepted' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-yellow-600" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{experiment.title}</h4>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {experiment.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {experiment.keywords.map((keyword: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <span className="text-sm text-gray-500">
              {formatDate(experiment.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentExperiments;