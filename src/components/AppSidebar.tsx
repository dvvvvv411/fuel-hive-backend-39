import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Store, FileText, CreditCard, LayoutDashboard, LogOut, Fuel, Mail, Banknote, Eye, Users } from 'lucide-react';

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    value: "dashboard"
  },
  {
    title: "Shops",
    url: "/dashboard",
    icon: Store,
    value: "shops"
  },
  {
    title: "Orders",
    url: "/dashboard",
    icon: FileText,
    value: "orders"
  },
  {
    title: "Bank Accounts",
    url: "/dashboard",
    icon: CreditCard,
    value: "bank-accounts"
  },
  {
    title: "Payment Methods",
    url: "/dashboard",
    icon: Banknote,
    value: "payment-methods"
  },
  {
    title: "Resend Config",
    url: "/dashboard",
    icon: Mail,
    value: "resend-configs"
  },
  {
    title: "Invoice Preview",
    url: "/dashboard",
    icon: Eye,
    value: "preview"
  },
  {
    title: "Sicherheitscheck",
    url: "/dashboard",
    icon: FileText,
    value: "security-check"
  },
  {
    title: "Mitarbeiter",
    url: "/dashboard",
    icon: Users,
    value: "employees"
  },
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: User | null;
  onSignOut: () => Promise<void>;
  isCaller?: boolean;
}

export function AppSidebar({ activeTab, onTabChange, user, onSignOut, isCaller = false }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Filter navigation items for caller
  const visibleNavigationItems = isCaller 
    ? navigationItems.filter(item => item.value === "orders")
    : navigationItems;

  const handleSignOut = async () => {
    await onSignOut();
    navigate('/auth');
  };

  const handleNavigation = (item: typeof navigationItems[0]) => {
    if (item.value === "dashboard") {
      onTabChange("overview");
    } else {
      onTabChange(item.value);
    }
  };

  return (
    <Sidebar className="border-r border-gray-100 bg-white/80 backdrop-blur-sm shadow-xl">
      <SidebarHeader className="border-b border-gray-100 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
            <Fuel className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Heating Oil</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {visibleNavigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item)}
                    isActive={
                      (item.value === "dashboard" && activeTab === "overview") ||
                      activeTab === item.value
                    }
                    className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-gray-100/80 data-[active=true]:bg-gradient-to-r data-[active=true]:from-orange-50 data-[active=true]:to-orange-100/80 data-[active=true]:text-orange-700 data-[active=true]:shadow-sm data-[active=true]:border-l-2 data-[active=true]:border-orange-500"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-gray-100 p-4">
        <div className="space-y-3">
          <div className="px-3 py-2 bg-gray-50/80 rounded-xl">
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            <p className="text-xs text-gray-500">{isCaller ? 'Caller' : 'Administrator'}</p>
          </div>
          <Button 
            onClick={handleSignOut} 
            variant="ghost" 
            className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
