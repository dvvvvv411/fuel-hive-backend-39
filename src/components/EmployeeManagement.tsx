import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Users, Store, RefreshCw } from 'lucide-react';

interface Profile {
  id: string;
  email: string | null;
  created_at: string | null;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'caller';
}

interface CallerShop {
  user_id: string;
  shop_id: string;
}

interface Shop {
  id: string;
  name: string;
}

export function EmployeeManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [callerShops, setCallerShops] = useState<CallerShop[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopDialogOpen, setShopDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedShops, setSelectedShops] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .order('email');

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch all caller shops
      const { data: callerShopsData, error: callerShopsError } = await supabase
        .from('caller_shops')
        .select('user_id, shop_id');

      if (callerShopsError) throw callerShopsError;

      // Fetch all shops
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (shopsError) throw shopsError;

      setProfiles(profilesData || []);
      setUserRoles(rolesData || []);
      setCallerShops(callerShopsData || []);
      setShops(shopsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Fehler',
        description: 'Daten konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = (userId: string): 'admin' | 'caller' | null => {
    const roles = userRoles.filter(r => r.user_id === userId);
    if (roles.some(r => r.role === 'admin')) return 'admin';
    if (roles.some(r => r.role === 'caller')) return 'caller';
    return null;
  };

  const getUserShops = (userId: string): string[] => {
    return callerShops.filter(cs => cs.user_id === userId).map(cs => cs.shop_id);
  };

  const toggleCallerRole = async (userId: string) => {
    const currentRole = getUserRole(userId);
    
    try {
      if (currentRole === 'caller') {
        // Remove caller role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'caller');

        if (error) throw error;

        // Also remove shop assignments
        await supabase
          .from('caller_shops')
          .delete()
          .eq('user_id', userId);

        setUserRoles(prev => prev.filter(r => !(r.user_id === userId && r.role === 'caller')));
        setCallerShops(prev => prev.filter(cs => cs.user_id !== userId));

        toast({
          title: 'Erfolg',
          description: 'Caller-Rolle wurde entfernt',
        });
      } else if (currentRole !== 'admin') {
        // Add caller role (only if not admin)
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'caller' });

        if (error) throw error;

        setUserRoles(prev => [...prev, { user_id: userId, role: 'caller' }]);

        toast({
          title: 'Erfolg',
          description: 'Caller-Rolle wurde zugewiesen',
        });
      }
    } catch (error) {
      console.error('Error toggling role:', error);
      toast({
        title: 'Fehler',
        description: 'Rolle konnte nicht geändert werden',
        variant: 'destructive',
      });
    }
  };

  const openShopDialog = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedShops(getUserShops(userId));
    setShopDialogOpen(true);
  };

  const handleShopToggle = (shopId: string, checked: boolean) => {
    if (checked) {
      setSelectedShops(prev => [...prev, shopId]);
    } else {
      setSelectedShops(prev => prev.filter(id => id !== shopId));
    }
  };

  const saveShopAssignments = async () => {
    if (!selectedUserId) return;

    try {
      // Delete all existing shop assignments for this user
      const { error: deleteError } = await supabase
        .from('caller_shops')
        .delete()
        .eq('user_id', selectedUserId);

      if (deleteError) throw deleteError;

      // Insert new shop assignments
      if (selectedShops.length > 0) {
        const { error: insertError } = await supabase
          .from('caller_shops')
          .insert(selectedShops.map(shopId => ({
            user_id: selectedUserId,
            shop_id: shopId
          })));

        if (insertError) throw insertError;
      }

      // Update local state
      setCallerShops(prev => [
        ...prev.filter(cs => cs.user_id !== selectedUserId),
        ...selectedShops.map(shopId => ({ user_id: selectedUserId, shop_id: shopId }))
      ]);

      setShopDialogOpen(false);
      toast({
        title: 'Erfolg',
        description: selectedShops.length === 0 
          ? 'Caller sieht alle Shops' 
          : `${selectedShops.length} Shop(s) zugewiesen`,
      });
    } catch (error) {
      console.error('Error saving shop assignments:', error);
      toast({
        title: 'Fehler',
        description: 'Shop-Zuordnung konnte nicht gespeichert werden',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: 'admin' | 'caller' | null) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Admin</Badge>;
      case 'caller':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Caller</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-500">Keine Rolle</Badge>;
    }
  };

  const getShopCount = (userId: string) => {
    const userShops = getUserShops(userId);
    if (userShops.length === 0) return 'Alle Shops';
    return `${userShops.length} Shop(s)`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mitarbeiterverwaltung
              </CardTitle>
              <CardDescription>
                Verwalten Sie Benutzerrollen und Shop-Zuordnungen
              </CardDescription>
            </div>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Lade Daten...</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Shops</TableHead>
                    <TableHead>Caller-Rolle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => {
                    const role = getUserRole(profile.id);
                    const isCaller = role === 'caller';
                    const isAdmin = role === 'admin';

                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.email || 'Keine E-Mail'}
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(role)}
                        </TableCell>
                        <TableCell>
                          {isCaller ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openShopDialog(profile.id)}
                            >
                              <Store className="h-4 w-4 mr-2" />
                              {getShopCount(profile.id)}
                            </Button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={isCaller}
                            onCheckedChange={() => toggleCallerRole(profile.id)}
                            disabled={isAdmin}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shop Assignment Dialog */}
      <Dialog open={shopDialogOpen} onOpenChange={setShopDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Shop-Zuordnung</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Wählen Sie die Shops aus, die dieser Caller sehen soll. 
              Wenn keine Shops ausgewählt sind, werden alle Shops angezeigt.
            </p>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {shops.map((shop) => (
                <div key={shop.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`shop-${shop.id}`}
                    checked={selectedShops.includes(shop.id)}
                    onCheckedChange={(checked) => handleShopToggle(shop.id, checked as boolean)}
                  />
                  <label 
                    htmlFor={`shop-${shop.id}`} 
                    className="text-sm cursor-pointer flex-1"
                  >
                    {shop.name}
                  </label>
                </div>
              ))}
            </div>

            {selectedShops.length === 0 && (
              <p className="text-sm text-blue-600 mt-4">
                → Alle Shops werden angezeigt
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShopDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={saveShopAssignments}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
