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
    id: exp.id.toString(),
    type: 'custom',
    position: { x: 0, y: 0 }, // Let dagre layout handle positioning
    data: {
      ...exp, // Include all experiment data
      onNodeDoubleClick: () => {}, // Will be set by GraphView
    },
  }));
}

export function formatDate(date: string | Date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  return `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-500 text-white';
    case 'planned':
      return 'bg-yellow-500 text-white';
    case 'postponed':
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