import React, { useState } from 'react';
import { Brain, Calendar, Presentation, RefreshCw, Maximize2, X } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

interface AISummaryProps {
  projectSummary: string;
  weeklyUpdate: string;
  lastUpdated: string | Date;
}

interface FullViewModalProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  colorScheme: 'blue' | 'purple';
}

const FullViewModal: React.FC<FullViewModalProps> = ({ title, content, icon, isOpen, onClose, colorScheme }) => {
  if (!isOpen) return null;

  const colors = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-900',
      iconText: 'text-blue-600',
      contentText: 'text-blue-800',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      text: 'text-purple-900',
      iconText: 'text-purple-600',
      contentText: 'text-purple-800',
    },
  };

  const currentColors = colors[colorScheme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`relative w-full max-w-2xl rounded-xl ${currentColors.bg} ${currentColors.border} border shadow-xl`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-opacity-20">
          <div className="flex items-center space-x-2">
            <div className={currentColors.iconText}>
              {icon}
            </div>
            <h3 className={`font-medium ${currentColors.text}`}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full hover:bg-white hover:bg-opacity-20 ${currentColors.iconText}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <p className={`text-sm whitespace-pre-wrap ${currentColors.contentText}`}>
            {content}
          </p>
        </div>
      </div>
    </div>
  );
};

const AISummary: React.FC<AISummaryProps> = ({
  projectSummary = "AI is analyzing your project...",
  weeklyUpdate = "Generating weekly insights...",
  lastUpdated = "Just now"
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // TODO: Implement refresh logic
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  return (
    <>
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">AI Research Assistant</h2>
          <button
            onClick={handleRefresh}
            className={`rounded-full p-2 text-gray-500 hover:bg-gray-100 ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Project Overview */}
          <div className="rounded-lg border border-blue-100 bg-blue-50">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Project Overview</h3>
                </div>
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="flex items-center rounded-md bg-blue-100 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                  View Full
                </button>
              </div>
            </div>
            <div className="px-4 pb-4">
              <p className="text-sm text-blue-800 whitespace-pre-wrap line-clamp-3">{projectSummary}</p>
            </div>
          </div>

          {/* Weekly Update */}
          <div className="rounded-lg border border-purple-100 bg-purple-50">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-purple-600" />
                  <h3 className="font-medium text-purple-900">Weekly Update</h3>
                </div>
                <button
                  onClick={() => setIsWeeklyModalOpen(true)}
                  className="flex items-center rounded-md bg-purple-100 px-2.5 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-200 transition-colors"
                >
                  <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                  View Full
                </button>
              </div>
            </div>
            <div className="px-4 pb-4">
              <p className="text-sm text-purple-800 whitespace-pre-wrap line-clamp-3">{weeklyUpdate}</p>
            </div>
          </div>

          {/* Download Presentation */}
          <button className="flex w-full items-center justify-center space-x-2 rounded-lg border border-gray-200 bg-white p-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <Presentation className="h-5 w-5" />
            <span>Download Latest Presentation</span>
          </button>
        </div>

        <div className="mt-4 text-right text-xs text-gray-500">
          Last updated: {formatDate(lastUpdated)}
        </div>
      </div>

      {/* Full View Modals */}
      <FullViewModal
        title="Project Overview"
        content={projectSummary}
        icon={<Brain className="h-5 w-5" />}
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        colorScheme="blue"
      />

      <FullViewModal
        title="Weekly Update"
        content={weeklyUpdate}
        icon={<Calendar className="h-5 w-5" />}
        isOpen={isWeeklyModalOpen}
        onClose={() => setIsWeeklyModalOpen(false)}
        colorScheme="purple"
      />
    </>
  );
};

export default AISummary;