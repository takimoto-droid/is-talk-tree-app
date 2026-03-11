'use client';

import { TalkNode } from '@/types';

interface TreeNodeProps {
  node: TalkNode;
  onSelect: (node: TalkNode) => void;
  isSelected: boolean;
}

export default function TreeNode({ node, onSelect, isSelected }: TreeNodeProps) {
  const getNodeStyle = () => {
    switch (node.type) {
      case 'start': return 'tree-node-start';
      case 'yes':
      case 'case':
      case 'demo': return 'tree-node-yes';
      case 'no':
      case 'objection': return 'tree-node-no';
      case 'schedule': return 'tree-node-schedule';
      default: return 'tree-node-yes';
    }
  };

  const getTagStyle = () => {
    switch (node.type) {
      case 'start': return 'tag-purple';
      case 'no':
      case 'objection': return 'tag-red';
      case 'schedule': return 'tag-blue';
      default: return 'tag-green';
    }
  };

  return (
    <div
      onClick={() => onSelect(node)}
      className={`tree-node ${getNodeStyle()} ${isSelected ? 'selected' : ''}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-white text-sm font-medium truncate">{node.label}</span>
      </div>
      <p className="text-xs text-zinc-500 line-clamp-2">{node.script.slice(0, 50)}...</p>
    </div>
  );
}
