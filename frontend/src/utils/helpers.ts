import { Node } from 'reactflow';
import { Experiment } from '../types/research';

export function generateNodeId() {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateEdgeId() {
  return `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function experimentsToNodes(experiments: Experiment[]): Node[] {
  return experiments.map((exp) => ({
    id: exp.id,
    type: 'custom',
    position: { x: Math.random() * 500, y: Math.random() * 500 }, // You might want to use a proper layout algorithm
    data: {
      title: exp.title,
      type: exp.type,
      status: exp.status,
      description: exp.description,
    },
  }));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'accepted':
      return 'bg-green-500 text-white';
    case 'pending':
      return 'bg-yellow-500 text-white';
    case 'rejected':
      return 'bg-red-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

export function getTypeIcon(type: string) {
  switch (type) {
    case 'hypothesis':
      return '🤔';
    case 'experiment':
      return '🧪';
    case 'result':
      return '📊';
    case 'analysis':
      return '📝';
    default:
      return '📋';
  }
}