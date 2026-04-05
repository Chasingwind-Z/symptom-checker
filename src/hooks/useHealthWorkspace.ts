import { useCallback, useEffect, useState } from 'react';
import {
  getDefaultProfileDraft,
  loadHealthWorkspace,
  saveProfileDraft,
  subscribeHealthWorkspace,
  type HealthWorkspaceSnapshot,
  type ProfileDraft,
} from '../lib/healthData';
import { subscribeToSupabaseAuth } from '../lib/supabase';

const INITIAL_WORKSPACE: HealthWorkspaceSnapshot = {
  mode: 'local',
  statusLabel: '正在检查云端状态…',
  helperText: '首次加载时会读取本机草稿和历史缓存。',
  profile: getDefaultProfileDraft(),
  recentCases: [],
  sessionEmail: null,
};

export function useHealthWorkspace() {
  const [workspace, setWorkspace] = useState<HealthWorkspaceSnapshot>(INITIAL_WORKSPACE);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const snapshot = await loadHealthWorkspace();
      setWorkspace(snapshot);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const unsubscribeWorkspace = subscribeHealthWorkspace(() => {
      void refresh();
    });
    const unsubscribeAuth = subscribeToSupabaseAuth(() => {
      void refresh();
    });

    return () => {
      unsubscribeWorkspace();
      unsubscribeAuth();
    };
  }, [refresh]);

  const updateProfile = useCallback(
    async (patch: Partial<ProfileDraft>) => {
      const nextDraft = {
        ...workspace.profile,
        ...patch,
      };

      const result = await saveProfileDraft(nextDraft);
      setWorkspace((prev) => ({
        ...prev,
        profile: nextDraft,
        statusLabel: result.statusLabel,
        helperText: result.helperText,
      }));
      return result;
    },
    [workspace.profile]
  );

  return {
    ...workspace,
    isRefreshing,
    refresh,
    updateProfile,
  };
}
