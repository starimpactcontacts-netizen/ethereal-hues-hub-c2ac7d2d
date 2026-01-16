import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'moderator' | 'user' | 'judge' | 'dev' | 'enterprise';

interface UserRolesResult {
  roles: AppRole[];
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  isAuthority: boolean; // Has judge or dev role
  isAdmin: boolean;
  isJudge: boolean;
  isDev: boolean;
  isEnterprise: boolean;
}

// Hook to fetch roles for a specific user
export function useUserRoles(userId: string | undefined): UserRolesResult {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      setRoles((data || []).map(r => r.role as AppRole));
      setLoading(false);
    };

    fetchRoles();
  }, [userId]);

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  return {
    roles,
    loading,
    hasRole,
    isAuthority: roles.includes('judge') || roles.includes('dev'),
    isAdmin: roles.includes('admin'),
    isJudge: roles.includes('judge'),
    isDev: roles.includes('dev'),
    isEnterprise: roles.includes('enterprise'),
  };
}

// Cache for batch role lookups (for lists)
const roleCache = new Map<string, AppRole[]>();

// Batch fetch roles for multiple users (for lists like Index)
export async function fetchUserRolesBatch(userIds: string[]): Promise<Map<string, AppRole[]>> {
  if (userIds.length === 0) return new Map();

  // Check cache first
  const uncachedIds = userIds.filter(id => !roleCache.has(id));
  
  if (uncachedIds.length > 0) {
    const { data } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', uncachedIds);

    // Initialize all uncached users with empty arrays
    uncachedIds.forEach(id => roleCache.set(id, []));

    // Fill in actual roles
    (data || []).forEach(row => {
      const existing = roleCache.get(row.user_id) || [];
      existing.push(row.role as AppRole);
      roleCache.set(row.user_id, existing);
    });
  }

  // Return all requested roles from cache
  const result = new Map<string, AppRole[]>();
  userIds.forEach(id => result.set(id, roleCache.get(id) || []));
  return result;
}

// Get authority role for display (prioritize dev over judge)
export function getAuthorityRole(roles: AppRole[]): 'dev' | 'judge' | null {
  if (roles.includes('dev')) return 'dev';
  if (roles.includes('judge')) return 'judge';
  return null;
}
