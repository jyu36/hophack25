import React, { useState } from 'react';
import { FileText, Loader } from 'lucide-react';
import FileUpload from '../Common/FileUpload';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import { ExperimentSuggestion } from '../../types/research';

interface TopicExtractorProps {
  onTopicsGenerated: (suggestions: ExperimentSuggestion[]) => void;
  onClose: () => void;
}

interface ExtractedTopic {
  keyword: string;
  relevance: number;
  context: string;
}

const TopicExtractor: React.FC<TopicExtractorProps> = ({
  onTopicsGenerated,
  onClose,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedTopics, setExtractedTopics] = useState<ExtractedTopic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError('');

    try {
      // Mock file processing and keyword extraction
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate extracted topics
      const mockTopics: ExtractedTopic[] = [
        {
          keyword: 'Machine Learning',
          relevance: 0.95,
          context: 'Deep learning applications in research',
        },
        {
          keyword: 'Neural Networks',
          relevance: 0.88,
          context: 'Architecture optimization for specific tasks',
        },
        {
          keyword: 'Data Preprocessing',
          relevance: 0.82,
          context: 'Techniques for improving data quality',
        },
        {
          keyword: 'Model Evaluation',
          relevance: 0.78,
          context: 'Performance metrics and validation methods',
        },
      ];

      setExtractedTopics(mockTopics);
    } catch (err) {
      setError('Failed to process file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTopicSelect = (keyword: string) => {
    setSelectedTopics(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleGenerateExperiments = () => {
    if (selectedTopics.length === 0) {
      setError('Please select at least one topic');
      return;
    }

    // Convert selected topics to experiment suggestions
    const suggestions: ExperimentSuggestion[] = selectedTopics.map(topic => ({
      title: `Research on ${topic}`,
      description: `Investigate and analyze ${topic.toLowerCase()} applications and methodologies`,
      type: 'experiment',
      motivation: `Understand and advance ${topic.toLowerCase()} techniques`,
      expectations: 'Develop novel approaches and insights',
      reasoning: `${topic} is a key area identified in your document`,
      keywords: [topic.toLowerCase(), 'research', 'analysis'],
    }));

    onTopicsGenerated(suggestions);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Extract Research Topics"
      size="lg"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Upload Research Document
          </h3>
          <FileUpload onFileSelect={handleFileSelect} />
        </div>

        {isProcessing && (
          <div className="text-center py-8">
            <Loader className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Processing document...</p>
          </div>
        )}

        {extractedTopics.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Extracted Topics
            </h3>
            <div className="space-y-3">
              {extractedTopics.map(topic => (
                <div
                  key={topic.keyword}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTopics.includes(topic.keyword)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleTopicSelect(topic.keyword)}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className={`h-5 w-5 ${
                      selectedTopics.includes(topic.keyword)
                        ? 'text-blue-500'
                        : 'text-gray-400'
                    }`} />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {topic.keyword}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {topic.context}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.round(topic.relevance * 100)}% relevant
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerateExperiments}
            disabled={selectedTopics.length === 0 || isProcessing}
          >
            Generate Experiments
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TopicExtractor;