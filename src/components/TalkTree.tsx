'use client';

import { TalkNode } from '@/types';
import { useState } from 'react';

interface TalkTreeProps {
  tree: TalkNode;
  selectedNode: TalkNode | null;
  onSelectNode: (node: TalkNode) => void;
}

export default function TalkTree({ tree, selectedNode, onSelectNode }: TalkTreeProps) {
  const [isOpen, setIsOpen] = useState(true);

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

  const handleNodeClick = (node: TalkNode) => {
    onSelectNode(node);
  };

  const getNodeTypeClass = (type: string) => {
    switch (type) {
      case 'schedule': return 'node-schedule';
      case 'yes': return 'node-success';
      case 'no': return 'node-danger';
      case 'objection': return 'node-warning';
      default: return 'node-default';
    }
  };

  // 3段階のツリー構造をレンダリング
  const renderTreeStructure = () => {
    if (!objectionTreeRoot) return null;

    const yesNode = objectionTreeRoot.children?.yes;
    const noNode = objectionTreeRoot.children?.no;

    return (
      <div className="visual-tree">
        {/* Level 1: Root Node */}
        <div className="tree-level tree-level-1">
          <div
            className={`tree-card tree-card-root ${selectedNode?.id === objectionTreeRoot.id ? 'selected' : ''}`}
            onClick={() => handleNodeClick(objectionTreeRoot)}
          >
            <div className="tree-card-label">{objectionTreeRoot.label}</div>
            <div className="tree-card-preview">{objectionTreeRoot.script.slice(0, 40)}...</div>
          </div>
        </div>

        {/* Connector from Level 1 to Level 2 */}
        <div className="tree-connector">
          <div className="tree-connector-line"></div>
          <div className="tree-connector-split"></div>
        </div>

        {/* Level 2: YES/NO Branches */}
        <div className="tree-level tree-level-2">
          {/* YES Branch */}
          {yesNode && (
            <div className="tree-branch-group tree-branch-yes">
              <div className="tree-branch-label-top yes">YES</div>
              <div
                className={`tree-card tree-card-yes ${selectedNode?.id === yesNode.id ? 'selected' : ''}`}
                onClick={() => handleNodeClick(yesNode)}
              >
                <div className="tree-card-label">{yesNode.label}</div>
                <div className="tree-card-preview">{yesNode.script.slice(0, 30)}...</div>
              </div>

              {/* Level 3 from YES */}
              {yesNode.children?.yes && (
                <>
                  <div className="tree-connector-down">
                    <div className="tree-connector-arrow yes"></div>
                  </div>
                  <div
                    className={`tree-card tree-card-success ${selectedNode?.id === yesNode.children.yes.id ? 'selected' : ''}`}
                    onClick={() => handleNodeClick(yesNode.children!.yes!)}
                  >
                    <div className="tree-card-icon">✓</div>
                    <div className="tree-card-label">{yesNode.children.yes.label}</div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* NO Branch */}
          {noNode && (
            <div className="tree-branch-group tree-branch-no">
              <div className="tree-branch-label-top no">NO</div>
              <div
                className={`tree-card tree-card-no ${selectedNode?.id === noNode.id ? 'selected' : ''}`}
                onClick={() => handleNodeClick(noNode)}
              >
                <div className="tree-card-label">{noNode.label}</div>
                <div className="tree-card-preview">{noNode.script.slice(0, 30)}...</div>
              </div>

              {/* Level 3: Objection handlers */}
              {noNode.children?.objections && noNode.children.objections.length > 0 && (
                <>
                  <div className="tree-connector-down">
                    <div className="tree-connector-arrow no"></div>
                  </div>
                  <div className="tree-objection-grid">
                    {noNode.children.objections.map((obj, idx) => (
                      <div key={idx} className="tree-objection-item">
                        <div
                          className={`tree-card tree-card-objection ${selectedNode?.id === obj.id ? 'selected' : ''}`}
                          onClick={() => handleNodeClick(obj)}
                        >
                          <div className="tree-card-label">{obj.label}</div>
                        </div>

                        {/* Sub-branches for each objection */}
                        <div className="tree-objection-branches">
                          {obj.children?.yes && (
                            <div
                              className={`tree-mini-card yes ${selectedNode?.id === obj.children.yes.id ? 'selected' : ''}`}
                              onClick={() => handleNodeClick(obj.children!.yes!)}
                            >
                              <span className="tree-mini-label">→ {obj.children.yes.label}</span>
                            </div>
                          )}
                          {obj.children?.no && (
                            <div
                              className={`tree-mini-card no ${selectedNode?.id === obj.children.no.id ? 'selected' : ''}`}
                              onClick={() => handleNodeClick(obj.children!.no!)}
                            >
                              <span className="tree-mini-label">→ {obj.children.no.label}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
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
            <p className="tree-subtitle">⑥以降 お断り対応フロー</p>
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
        <div className="tree-scroll">
          {renderTreeStructure()}
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
