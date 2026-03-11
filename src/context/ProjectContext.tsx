'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ProjectConfig } from '@/types';
import { parseProjectExcel, getDefaultProjectConfig } from '@/lib/excelParser';

interface ProjectContextType {
  config: ProjectConfig | null;
  isConfigured: boolean;
  loadFromExcel: (file: File) => Promise<void>;
  loadDefault: () => void;
  reset: () => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

const STORAGE_KEY = 'is-talk-tree-project-config';

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ProjectConfig | null>(null);

  // 起動時にlocalStorageから設定を読み込む
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load project config:', e);
    }
  }, []);

  // 設定を保存
  const saveConfig = useCallback((newConfig: ProjectConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save project config:', e);
    }
  }, []);

  // Excelファイルから読み込み
  const loadFromExcel = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer();
    const parsed = parseProjectExcel(buffer);
    saveConfig(parsed);
  }, [saveConfig]);

  // デフォルト設定を読み込み
  const loadDefault = useCallback(() => {
    const defaultConfig = getDefaultProjectConfig();
    // デフォルトの導入事例を追加
    defaultConfig.caseStudies = [
      {
        id: 'panasonic',
        companyName: 'パナソニック',
        industry: '製造',
        challenge: '複数の事業部門にまたがるデータの統合と可視化が困難だった',
        solution: 'DOMOを導入し、全社横断的なデータプラットフォームを構築',
        result: 'データドリブンな意思決定が可能になり、レポート作成時間を80%削減',
        url: 'https://www.domo.com/jp/customers/panasonic',
      },
      {
        id: 'kddi',
        companyName: 'KDDI',
        industry: '通信',
        challenge: '膨大な顧客データと通信データの分析に時間がかかっていた',
        solution: 'DOMOによるリアルタイムダッシュボードを構築',
        result: '顧客行動の即時把握が可能になり、解約率を15%改善',
        url: 'https://www.domo.com/jp/customers/kddi',
      },
      {
        id: 'softbank',
        companyName: 'ソフトバンク',
        industry: '通信',
        challenge: '多角化した事業のKPI管理が複雑化していた',
        solution: 'DOMO導入により統合的なKPIダッシュボードを構築',
        result: '経営会議の準備時間を90%削減、リアルタイム経営を実現',
        url: 'https://www.domo.com/jp/customers/softbank',
      },
    ];
    saveConfig(defaultConfig);
  }, [saveConfig]);

  // 設定をリセット
  const reset = useCallback(() => {
    setConfig(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to remove project config:', e);
    }
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        config,
        isConfigured: config !== null,
        loadFromExcel,
        loadDefault,
        reset,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
