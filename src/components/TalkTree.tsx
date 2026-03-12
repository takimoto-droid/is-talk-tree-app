'use client';

import { TalkNode } from '@/types';
import { useState } from 'react';

interface TalkTreeProps {
  tree: TalkNode;
  selectedNode: TalkNode | null;
  onSelectNode: (node: TalkNode) => void;
}

interface Branch {
  label: string;
  color: string;
  node: TalkNode;
}

export default function TalkTree({ tree, selectedNode, onSelectNode }: TalkTreeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['step6', 'schedule', 'objection-start']));

  // ⑥以降のツリー（お断り分岐）を取得
  const getObjectionTree = (): TalkNode | null => {
    let current = tree;
    while (current.children?.yes) {
      if (current.children.no) {
        return current;
      }
      current = current.children.yes;
    }
    return null;
  };

  const objectionTreeRoot = getObjectionTree();

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleNodeClick = (node: TalkNode, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectNode(node);
  };

  const handleExpandClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpand(nodeId);
  };

  const renderNode = (node: TalkNode, depth: number = 0): React.ReactNode => {
    const isSelected = selectedNode?.id === node.id;
    const isExpanded = expandedNodes.has(node.id);

    // 子ノードを収集
    const branches: Branch[] = [];
    if (node.children?.yes) {
      branches.push({ label: 'YES', color: '#22c55e', node: node.children.yes });
    }
    if (node.children?.no) {
      branches.push({ label: 'NO', color: '#ef4444', node: node.children.no });
    }
    if (node.children?.objections) {
      node.children.objections.forEach((obj) => {
        branches.push({ label: obj.label, color: '#f97316', node: obj });
      });
    }

    const hasBranches = branches.length > 0;

    return (
      <div className="htree-node-wrapper">
        {/* ノードカード */}
        <div
          onClick={(e) => handleNodeClick(node, e)}
          className={`htree-node ${isSelected ? 'htree-node-selected' : ''} ${hasBranches ? 'htree-node-expandable' : ''}`}
        >
          <div className="htree-node-label">{node.label}</div>
          <div className="htree-node-preview">{node.script.slice(0, 50)}...</div>
          {hasBranches && (
            <button
              className={`htree-expand-btn ${isExpanded ? 'expanded' : ''}`}
              onClick={(e) => handleExpandClick(node.id, e)}
            >
              {isExpanded ? '−' : '+'}
              <span>{branches.length}</span>
            </button>
          )}
        </div>

        {/* 子ノード（横に展開） */}
        {hasBranches && isExpanded && (
          <div className="htree-children">
            {/* 接続線 */}
            <div className="htree-connector">
              <div className="htree-hline"></div>
              {branches.length > 1 && <div className="htree-vline"></div>}
            </div>

            {/* 分岐 */}
            <div className="htree-branches">
              {branches.map((branch, idx) => (
                <div key={idx} className="htree-branch">
                  {/* ラベル付き矢印 */}
                  <div className="htree-arrow-wrapper">
                    <span className="htree-branch-label" style={{ backgroundColor: branch.color }}>
                      {branch.label}
                    </span>
                    <div className="htree-arrow" style={{ borderLeftColor: branch.color }}></div>
                  </div>
                  {/* 再帰的に子ノードをレンダリング */}
                  {renderNode(branch.node, depth + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tree-panel animate-in">
      {/* ヘッダー */}
      <div className="tree-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="tree-header-left">
          <div className="tree-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <h3 className="tree-title">トークツリー</h3>
            <p className="tree-subtitle">⑥以降 お断り対応フロー（クリックで展開）</p>
          </div>
        </div>
        <div className="tree-header-right">
          <div className={`tree-toggle ${isOpen ? 'open' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* ツリーコンテンツ */}
      <div className={`tree-content ${isOpen ? 'open' : ''}`}>
        <div className="htree-scroll">
          {objectionTreeRoot && renderNode(objectionTreeRoot)}
        </div>

        {/* スクリプト表示エリア */}
        {selectedNode && (
          <div className="tree-script">
            <div className="tree-script-header">
              <span className="tree-script-title">{selectedNode.label}</span>
            </div>
            <div className="tree-script-body">
              {selectedNode.script}
            </div>
            {selectedNode.tips && (
              <div className="tree-script-tips">
                <span className="tree-script-tips-icon">TIP</span>
                {selectedNode.tips}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
