'use client';

import { TalkNode, GeneratedRedirect } from '@/types';
import { useState, useMemo } from 'react';

interface TalkTreeProps {
  tree: TalkNode;
  selectedNode: TalkNode | null;
  onSelectNode: (node: TalkNode) => void;
  aiRedirects?: GeneratedRedirect[];
  aiRedirectsLoading?: boolean;
  companyName?: string;
  meetingDuration?: string;
  slackChannelUrl?: string;
}

interface Branch {
  label: string;
  color: string;
  node: TalkNode;
}

export default function TalkTree({
  tree,
  selectedNode,
  onSelectNode,
  aiRedirects,
  aiRedirectsLoading,
  companyName,
  meetingDuration,
  slackChannelUrl,
}: TalkTreeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['step6']));

  // AI「ちなみに」リダイレクトをTalkNode形式に変換
  // フロー: ⑥ → お断り → 「ちなみに」質問 → 事例紹介 → アポ取得
  // NOの場合は次のパターンへ横展開
  const enhancedTree = useMemo(() => {
    if (!aiRedirects || aiRedirects.length === 0) {
      return tree;
    }

    // ツリーをディープコピー
    const cloneTree = (node: TalkNode): TalkNode => {
      const cloned: TalkNode = { ...node };
      if (node.children) {
        cloned.children = {};
        if (node.children.yes) cloned.children.yes = cloneTree(node.children.yes);
        if (node.children.no) cloned.children.no = cloneTree(node.children.no);
        if (node.children.objections) {
          cloned.children.objections = node.children.objections.map(o => cloneTree(o));
        }
      }
      return cloned;
    };

    const newTree = cloneTree(tree);

    const confirmScript = `ありがとうございます！

○月○日（○曜日）○時〜の${meetingDuration || '30分'}で確定させていただきます。
本日中にカレンダー招待をお送りいたします。

当日は、${companyName || '御社'}様の課題解決に向けた具体的なご提案をさせていただきます。
本日はお時間いただきありがとうございました。`;

    const endScript = `承知いたしました。

${companyName || '御社'}様のタイミングが合いましたら、ぜひまたお声がけください。
資料だけでもお送りしておきますので、ご検討の際にご覧いただければ幸いです。

本日はお忙しい中、お時間いただきありがとうございました。

【資料送付へ進む】`;

    // 再帰的に「ちなみに」ツリーを構築（アポ取得まで横展開）
    const buildRedirectChain = (redirects: typeof aiRedirects, depth: number, usedTypes: Set<string>): TalkNode | undefined => {
      // 使用可能なリダイレクトを取得
      const availableRedirects = redirects.filter(r => !usedTypes.has(r.type));

      if (availableRedirects.length === 0 || depth > 5) {
        // これ以上パターンがない場合は終了
        return {
          id: `end-${depth}`,
          type: 'no' as const,
          label: '終話',
          script: endScript,
          tips: '資料送付を約束して印象を残す',
        };
      }

      const redirect = availableRedirects[0];
      const newUsedTypes = new Set(usedTypes);
      newUsedTypes.add(redirect.type);

      // 次のパターンへの分岐を再帰的に構築
      const nextBranch = buildRedirectChain(redirects, depth + 1, newUsedTypes);

      return {
        id: `chinami-${depth}-${redirect.type}`,
        type: 'case' as const,
        label: `ちなみに：${redirect.label}`,
        script: redirect.question,
        tips: redirect.questionTips,
        children: {
          yes: {
            id: `chinami-${depth}-${redirect.type}-case`,
            type: 'demo' as const,
            label: '事例紹介',
            script: redirect.caseIntro,
            tips: redirect.caseTips,
            children: {
              yes: {
                id: `chinami-${depth}-${redirect.type}-appoint`,
                type: 'schedule' as const,
                label: 'アポ提案',
                script: redirect.appointmentScript,
                tips: redirect.appointmentTips,
                children: {
                  yes: {
                    id: `chinami-${depth}-${redirect.type}-confirm`,
                    type: 'yes' as const,
                    label: 'アポ確定',
                    script: confirmScript,
                    tips: '当日中にカレンダー招待を送付',
                  },
                  no: nextBranch ? {
                    id: `chinami-${depth}-${redirect.type}-next`,
                    type: 'no' as const,
                    label: '次の切り口へ',
                    script: `承知いたしました。では、もう1点だけお伺いしてもよろしいでしょうか？`,
                    tips: '粘り強く次のパターンへ',
                    children: {
                      yes: nextBranch,
                    },
                  } : {
                    id: `chinami-${depth}-${redirect.type}-end`,
                    type: 'no' as const,
                    label: '終話',
                    script: endScript,
                    tips: '資料送付を約束して印象を残す',
                  },
                },
              },
              no: nextBranch ? {
                id: `chinami-${depth}-${redirect.type}-case-next`,
                type: 'no' as const,
                label: '別の観点へ',
                script: `なるほど、そうですか。では別の観点でお伺いしてもよろしいでしょうか？`,
                tips: '切り口を変えて再アプローチ',
                children: {
                  yes: nextBranch,
                },
              } : {
                id: `chinami-${depth}-${redirect.type}-case-end`,
                type: 'no' as const,
                label: '終話',
                script: endScript,
                tips: '資料送付を約束して印象を残す',
              },
            },
          },
          no: nextBranch ? {
            id: `chinami-${depth}-${redirect.type}-q-next`,
            type: 'no' as const,
            label: '別の質問へ',
            script: `そうですか。では別の観点でお伺いしてもよろしいでしょうか？`,
            tips: '質問を変えて切り口を探る',
            children: {
              yes: nextBranch,
            },
          } : {
            id: `chinami-${depth}-${redirect.type}-q-end`,
            type: 'no' as const,
            label: '終話',
            script: endScript,
            tips: '資料送付を約束して印象を残す',
          },
        },
      };
    };

    // ⑥のノード（NO分岐がある場所）を探して、お断り→ちなみにフローに置き換え
    const findAndReplaceWithRedirectFlow = (node: TalkNode) => {
      if (node.children?.no) {
        const firstRedirect = buildRedirectChain(aiRedirects, 1, new Set());

        node.children.no = {
          id: 'rejection',
          type: 'no' as const,
          label: 'お断り',
          script: `そうでしたか、承知いたしました。

ただ、1点だけお伺いしてもよろしいでしょうか？`,
          tips: 'お断りを受け入れつつ、「ちなみに」への布石を打つ',
          children: firstRedirect ? {
            yes: firstRedirect,
            no: {
              id: 'rejection-end',
              type: 'no' as const,
              label: '終話',
              script: endScript,
              tips: '資料送付を約束して印象を残す',
            },
          } : undefined,
        };
      }
      if (node.children?.yes) findAndReplaceWithRedirectFlow(node.children.yes);
    };

    findAndReplaceWithRedirectFlow(newTree);
    return newTree;
  }, [tree, aiRedirects, companyName, meetingDuration]);

  // ⑥以降のツリー（お断り分岐）を取得
  const getObjectionTree = (): TalkNode | null => {
    let current = enhancedTree;
    while (current.children?.yes) {
      if (current.children.no) {
        return current;
      }
      current = current.children.yes;
    }
    return null;
  };

  const objectionTreeRoot = getObjectionTree();
  const hasAiRedirects = aiRedirects && aiRedirects.length > 0;

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
      <div key={path} className="htree-row">
        {/* ノードボックス */}
        <div
          onClick={() => handleNodeClick(node)}
          className={`htree-node ${isSelected ? 'htree-node-selected' : ''} ${hasBranches ? 'htree-node-expandable' : ''}`}
        >
          <div className="htree-node-title">{node.label}</div>
          <div className="htree-node-text">{node.script.slice(0, 40)}...</div>
          {hasBranches && (
            <div className="htree-node-footer">
              <span className="htree-node-badge">{branches.length}分岐</span>
              <div className={`htree-node-expand ${isExpanded ? 'expanded' : ''}`}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* 分岐がある場合（展開時のみ表示） */}
        {hasBranches && isExpanded && (
          <div className="htree-children animate-in">
            {/* 横線コネクタ */}
            <div className="htree-connector">
              <div className="htree-connector-h"></div>
              <div className="htree-connector-v"></div>
            </div>

            {/* 子ノード群 */}
            <div className="htree-branches">
              {branches.map((branch, idx) => (
                <div key={idx} className="htree-branch">
                  {/* ラベル付きコネクタ */}
                  <div className="htree-branch-connector">
                    <div
                      className="htree-branch-line"
                      style={{ background: branch.color }}
                    ></div>
                    <span
                      className="htree-branch-label"
                      style={{ color: branch.color, borderColor: branch.color }}
                    >
                      {branch.label}
                    </span>
                    <div
                      className="htree-branch-arrow"
                      style={{ borderLeftColor: branch.color }}
                    ></div>
                  </div>
                  {/* 子ノード */}
                  {renderNode(branch.node, `${path}-${idx}`, depth + 1)}
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
            <h3 className="tree-title">
              トークツリー
              {hasAiRedirects && (
                <span className="tree-ai-badge">AI生成</span>
              )}
              {aiRedirectsLoading && (
                <span className="tree-ai-badge tree-ai-loading">AI分析中...</span>
              )}
            </h3>
            <p className="tree-subtitle">お断り→「ちなみに」質問→事例紹介→アポ</p>
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
          <div className="htree-container">
            {objectionTreeRoot && renderNode(objectionTreeRoot)}
          </div>
        </div>

        {/* スクリプト表示エリア */}
        {selectedNode && (
          <div className="tree-script">
            <div className="tree-script-header">
              <span className="tree-script-title">{selectedNode.label}</span>
            </div>
            <div className="tree-script-body">
              {selectedNode.script.replace('【資料送付へ進む】', '')}
            </div>
            {selectedNode.tips && (
              <div className="tree-script-tips">
                <span className="tree-script-tips-icon">TIP</span>
                {selectedNode.tips}
              </div>
            )}
            {selectedNode.script.includes('【資料送付へ進む】') && (
              <div className="tree-script-action">
                <a
                  href={slackChannelUrl || 'https://slack.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tree-slack-button"
                  onClick={(e) => {
                    if (!slackChannelUrl) {
                      e.preventDefault();
                      alert(`資料送付先：${companyName || '企業名'}\n\nSlackチャネルURLが設定されていません。\n案件設定で設定してください。`);
                    }
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                  </svg>
                  資料送付（Slackへ）
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
