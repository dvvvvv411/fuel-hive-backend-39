import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserRoleState {
  role: 'admin' | 'caller' | null;
  isCaller: boolean;
  isAdmin: boolean;
  allowedShopIds: string[];
  hasAllShopsAccess: boolean;
  visibleFromDate: string | null;
  loading: boolean;
}

export function useUserRole(): UserRoleState {
  const [role, setRole] = useState<'admin' | 'caller' | null>(null);
  const [allowedShopIds, setAllowedShopIds] = useState<string[]>([]);
  const [visibleFromDate, setVisibleFromDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setAllowedShopIds([]);
          setVisibleFromDate(null);
          setLoading(false);
          return;
        }

        // Fetch user's role from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role, visible_from_date')
          .eq('user_id', user.id);

        if (roleError) {
          console.error('Error fetching user role:', roleError);
        }

        // Determine role (admin takes priority)
        if (roleData && roleData.length > 0) {
          const roles = roleData.map(r => r.role);
          if (roles.includes('admin')) {
            setRole('admin');
            setVisibleFromDate(null);
          } else if (roles.includes('caller')) {
            setRole('caller');
            
            // Get visible_from_date for caller
            const callerRole = roleData.find(r => r.role === 'caller');
            setVisibleFromDate(callerRole?.visible_from_date || null);
            
            // Fetch allowed shops for caller
            const { data: shopData, error: shopError } = await supabase
              .from('caller_shops')
              .select('shop_id')
              .eq('user_id', user.id);

            if (shopError) {
              console.error('Error fetching caller shops:', shopError);
            } else {
              setAllowedShopIds(shopData?.map(s => s.shop_id) || []);
            }
          }
        } else {
          setRole(null);
          setVisibleFromDate(null);
        }
      } catch (error) {
        console.error('Error in useUserRole:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    role,
    isCaller: role === 'caller',
    isAdmin: role === 'admin',
    allowedShopIds,
    hasAllShopsAccess: allowedShopIds.length === 0,
    visibleFromDate,
    loading
  };
}
