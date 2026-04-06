import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyDemoPersona,
  getDefaultProfileDraft,
  loadHealthWorkspace,
  saveProfileDraft,
  subscribeHealthWorkspace,
  type HealthWorkspaceSnapshot,
  type ProfileDraft,
} from '../lib/healthData';
import {
  readHouseholdProfiles,
  removeHouseholdProfile,
  upsertHouseholdProfile,
  type HouseholdProfileRecord,
} from '../lib/healthWorkspaceInsights';
import { subscribeToSupabaseAuth } from '../lib/supabase';

const INITIAL_WORKSPACE: HealthWorkspaceSnapshot = {
  mode: 'local',
  statusLabel: '正在准备个人空间…',
  helperText: '首次打开会先读取本机草稿和最近记录。',
  profile: getDefaultProfileDraft(),
  recentCases: [],
  sessionEmail: null,
};

export function useHealthWorkspace() {
  const [workspace, setWorkspace] = useState<HealthWorkspaceSnapshot>(INITIAL_WORKSPACE);
  const [householdProfiles, setHouseholdProfiles] = useState<HouseholdProfileRecord[]>(() =>
    readHouseholdProfiles()
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshRequestRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = refreshRequestRef.current + 1;
    refreshRequestRef.current = requestId;
    setIsRefreshing(true);

    try {
      const snapshot = await loadHealthWorkspace();
      if (refreshRequestRef.current === requestId) {
        setWorkspace(snapshot);
        setHouseholdProfiles(readHouseholdProfiles());
      }
    } catch {
      if (refreshRequestRef.current === requestId) {
        setHouseholdProfiles(readHouseholdProfiles());
        setWorkspace((prev) => ({
          ...prev,
          mode: 'error',
          statusLabel: '个人空间刷新失败',
          helperText: '这次没有成功读取邮箱同步状态，已保留当前资料和本机缓存，可稍后重试。',
        }));
      }
    } finally {
      if (refreshRequestRef.current === requestId) {
        setIsRefreshing(false);
      }
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
        profileMode: 'custom' as const,
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

  const loadDemoPersona = useCallback(
    async (personaId: string) => {
      const result = await applyDemoPersona(personaId);
      await refresh();
      return result;
    },
    [refresh]
  );

  const saveHouseholdProfile = useCallback(
    (input: {
      id?: string;
      label: string;
      relationship: string;
      profile: ProfileDraft;
    }) => {
      const nextProfiles = upsertHouseholdProfile(input);
      setHouseholdProfiles(nextProfiles);
      return nextProfiles;
    },
    []
  );

  const deleteHouseholdProfile = useCallback((id: string) => {
    const nextProfiles = removeHouseholdProfile(id);
    setHouseholdProfiles(nextProfiles);
    return nextProfiles;
  }, []);

  return {
    ...workspace,
    householdProfiles,
    isRefreshing,
    refresh,
    updateProfile,
    loadDemoPersona,
    saveHouseholdProfile,
    deleteHouseholdProfile,
  };
}
