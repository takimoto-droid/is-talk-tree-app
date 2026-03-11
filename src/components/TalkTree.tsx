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
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['step6']));

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

  const handleNodeClick = (node: TalkNode) => {
    onSelectNode(node);
    // 子ノードがある場合は展開/折りたたみ
    const hasChildren = node.children?.yes || node.children?.no || (node.children?.objections && node.children.objections.length > 0);
    if (hasChildren) {
      toggleExpand(node.id);
    }
  };

  const renderNode = (node: TalkNode, path: string = 'root', depth: number = 0): React.ReactNode => {
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
      <div key={path} className="tree-row">
        {/* ノードボックス */}
        <div
          onClick={() => handleNodeClick(node)}
          className={`tree-node ${isSelected ? 'tree-node-selected' : ''} ${hasBranches ? 'tree-node-expandable' : ''}`}
        >
          <div className="tree-node-header">
            <div className="tree-node-title">{node.label}</div>
            {hasBranches && (
              <div className={`tree-node-expand ${isExpanded ? 'expanded' : ''}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            )}
          </div>
          <div className="tree-node-text">{node.script.slice(0, 60)}...</div>
          {hasBranches && (
            <div className="tree-node-badge">
              {branches.length}つの分岐
            </div>
          )}
        </div>

        {/* 分岐がある場合（展開時のみ表示） */}
        {hasBranches && isExpanded && (
          <div className="tree-branch-container animate-in">
            {/* 親からの横線 */}
            <div className="tree-hline" />

            {/* 縦線と分岐 */}
            <div className="tree-vline-container">
              {/* 縦線 */}
              {branches.length > 1 && <div className="tree-vline" />}

              {/* 各分岐 */}
              <div className="tree-branches">
                {branches.map((branch, idx) => (
                  <div key={idx} className="tree-branch">
                    {/* 横線 + ラベル + 矢印 */}
                    <div className="tree-branch-line">
                      <span
                        className="tree-branch-label"
                        style={{ color: branch.color }}
                      >
                        {branch.label}
                      </span>
                      <div className="tree-arrow-line" />
                      <div
                        className="tree-arrow"
                        style={{ borderLeftColor: branch.color }}
                      />
                    </div>
                    {/* 子ノード */}
                    {renderNode(branch.node, `${path}-${idx}`, depth + 1)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tree-panel animate-in">
      {/* ヘッダー（クリックで開閉） */}
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

      {/* ツリーコンテンツ（トグル） */}
      <div className={`tree-content ${isOpen ? 'open' : ''}`}>
        <div className="tree-scroll">
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
