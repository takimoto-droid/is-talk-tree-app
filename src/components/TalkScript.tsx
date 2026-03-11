'use client';

import { TalkNode } from '@/types';

interface TalkScriptProps {
  node: TalkNode;
  onNavigate: (direction: 'yes' | 'no' | 'objection', index?: number) => void;
  onSchedule: () => void;
}

export default function TalkScript({ node, onNavigate, onSchedule }: TalkScriptProps) {
  const getTagStyle = () => {
    switch (node.type) {
      case 'start': return 'tag-purple';
      case 'yes': return 'tag-green';
      case 'no': return 'tag-red';
      case 'case': return 'tag-green';
      case 'demo': return 'tag-blue';
      case 'schedule': return 'tag-blue';
      case 'objection': return 'tag-orange';
      default: return 'tag-blue';
    }
  };

  const getTypeLabel = () => {
    switch (node.type) {
      case 'start': return '開始';
      case 'yes': return 'YES';
      case 'no': return 'NO';
      case 'case': return '事例';
      case 'demo': return 'デモ';
      case 'schedule': return '日程';
      case 'objection': return '切返';
      default: return '';
    }
  };

  return (
    <div className="card h-full flex flex-col animate-in">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <h3 className="text-base font-semibold text-white">{node.label}</h3>
        <span className={`tag ${getTagStyle()}`}>{getTypeLabel()}</span>
      </div>

      {/* スクリプト */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-zinc-900/50 rounded-lg p-4">
          <p className="section-title">トークスクリプト</p>
          <p className="text-zinc-200 whitespace-pre-line text-[15px] leading-7">
            {node.script}
          </p>
        </div>

        {node.tips && (
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
            <p className="text-amber-400 text-sm">💡 {node.tips}</p>
          </div>
        )}
      </div>

      {/* ボタン */}
      <div className="p-4 border-t border-zinc-800 space-y-2">
        {node.children?.yes && (
          <button
            onClick={() => onNavigate('yes')}
            className="btn btn-yes w-full h-10"
          >
            ✓ YES: {node.children.yes.label}
          </button>
        )}

        {node.children?.no && (
          <button
            onClick={() => onNavigate('no')}
            className="btn btn-no w-full h-10"
          >
            ✗ NO: {node.children.no.label}
          </button>
        )}

        {node.children?.objections && node.children.objections.length > 0 && (
          <div className="pt-2">
            <p className="section-title">反論パターン</p>
            <div className="grid grid-cols-2 gap-2">
              {node.children.objections.map((obj, index) => (
                <button
                  key={obj.id}
                  onClick={() => onNavigate('objection', index)}
                  className="btn btn-no h-9 text-sm"
                >
                  {obj.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {node.type === 'schedule' && (
          <button onClick={onSchedule} className="btn btn-primary w-full h-10">
            📅 日程調整を開始
          </button>
        )}
      </div>
    </div>
  );
}
