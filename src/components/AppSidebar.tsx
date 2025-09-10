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
import { Store, FileText, CreditCard, LayoutDashboard, LogOut, Fuel, Mail, Banknote, Eye } from 'lucide-react';

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
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: User | null;
  onSignOut: () => Promise<void>;
}

export function AppSidebar({ activeTab, onTabChange, user, onSignOut }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current user is restricted to only Orders
  const isRestrictedUser = user?.id === "3338709d-0620-4384-8705-f6b4e9bf8be6";
  
  // Filter navigation items for restricted user
  const visibleNavigationItems = isRestrictedUser 
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
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <Fuel className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Heating Oil</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
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
                    className="w-full justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700 data-[active=true]:border-blue-200"
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
      
      <SidebarFooter className="border-t border-gray-200 p-4">
        <div className="space-y-3">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
          <Button 
            onClick={handleSignOut} 
            variant="ghost" 
            className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
