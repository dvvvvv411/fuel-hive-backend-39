
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  FileText, 
  CreditCard, 
  LayoutDashboard, 
  LogOut, 
  Fuel, 
  Mail, 
  Banknote, 
  Eye, 
  BarChart3,
  PieChart,
  TrendingUp,
  Settings,
  User as UserIcon
} from 'lucide-react';

const mainItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    value: "dashboard",
    description: "Übersicht & Statistiken"
  },
  {
    title: "Shops",
    url: "/dashboard",
    icon: Store,
    value: "shops",
    description: "Shop-Verwaltung"
  },
  {
    title: "Bestellungen",
    url: "/dashboard",
    icon: FileText,
    value: "orders",
    description: "Bestellübersicht"
  },
];

const financeItems = [
  {
    title: "Bankkonten",
    url: "/dashboard",
    icon: CreditCard,
    value: "bank-accounts",
    description: "Konten verwalten"
  },
  {
    title: "Zahlungsmethoden",
    url: "/dashboard",
    icon: Banknote,
    value: "payment-methods",
    description: "Zahlungsoptionen"
  },
];

const analyticsItems = [
  {
    title: "Bank Performance",
    url: "/dashboard",
    icon: BarChart3,
    value: "bank-analytics",
    description: "Bankanalyse"
  },
  {
    title: "Zahlungsanalyse",
    url: "/dashboard",
    icon: PieChart,
    value: "payment-analytics",
    description: "Payment-Insights"
  },
  {
    title: "Status Pipeline",
    url: "/dashboard",
    icon: TrendingUp,
    value: "status-analytics",
    description: "Workflow-Analyse"
  },
];

const configItems = [
  {
    title: "E-Mail Konfiguration",
    url: "/dashboard",
    icon: Mail,
    value: "resend-configs",
    description: "E-Mail Setup"
  },
  {
    title: "Rechnungsvorschau",
    url: "/dashboard",
    icon: Eye,
    value: "preview",
    description: "PDF-Vorschau"
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

  const handleSignOut = async () => {
    await onSignOut();
    navigate('/auth');
  };

  const handleNavigation = (item: typeof mainItems[0]) => {
    if (item.value === "dashboard") {
      onTabChange("overview");
    } else {
      onTabChange(item.value);
    }
  };

  const isActive = (itemValue: string) => {
    return (itemValue === "dashboard" && activeTab === "overview") || activeTab === itemValue;
  };

  return (
    <Sidebar className="border-r border-gray-200/80 bg-white/95 backdrop-blur-sm">
      <SidebarHeader className="border-b border-gray-200/50 p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
            <Fuel className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Heating Oil</h1>
            <p className="text-sm text-gray-600 font-medium">Admin Panel</p>
          </div>
          <Badge variant="secondary" className="text-xs px-2 py-1">
            Pro
          </Badge>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-6 space-y-6">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Hauptbereich
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item)}
                    isActive={isActive(item.value)}
                    className="w-full justify-start gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-800 data-[active=true]:shadow-sm group"
                  >
                    <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-gray-500 group-hover:text-blue-600 data-[active=true]:text-blue-600">
                        {item.description}
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-2" />

        {/* Finance Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Finanzen
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {financeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item)}
                    isActive={isActive(item.value)}
                    className="w-full justify-start gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-green-50 hover:text-green-700 data-[active=true]:bg-green-100 data-[active=true]:text-green-800 data-[active=true]:shadow-sm group"
                  >
                    <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-gray-500 group-hover:text-green-600 data-[active=true]:text-green-600">
                        {item.description}
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-2" />

        {/* Analytics Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Analytics
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item)}
                    isActive={isActive(item.value)}
                    className="w-full justify-start gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-purple-50 hover:text-purple-700 data-[active=true]:bg-purple-100 data-[active=true]:text-purple-800 data-[active=true]:shadow-sm group"
                  >
                    <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-gray-500 group-hover:text-purple-600 data-[active=true]:text-purple-600">
                        {item.description}
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-2" />

        {/* Configuration Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Konfiguration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item)}
                    isActive={isActive(item.value)}
                    className="w-full justify-start gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-orange-50 hover:text-orange-700 data-[active=true]:bg-orange-100 data-[active=true]:text-orange-800 data-[active=true]:shadow-sm group"
                  >
                    <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-gray-500 group-hover:text-orange-600 data-[active=true]:text-orange-600">
                        {item.description}
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-gray-200/50 p-4 bg-gray-50/50">
        <div className="space-y-4">
          {/* User Profile */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-gray-200 shadow-sm">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email || 'Administrator'}
              </p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Online"></div>
          </div>

          {/* Sign Out Button */}
          <Button 
            onClick={handleSignOut} 
            variant="ghost" 
            className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-xl group"
          >
            <LogOut className="h-4 w-4 transition-transform group-hover:scale-110" />
            Abmelden
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
