import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { ShopsList } from '@/components/ShopsList';
import { OrdersList } from '@/components/OrdersList';
import { BankAccountsList } from '@/components/BankAccountsList';
import { PaymentMethodsList } from '@/components/PaymentMethodsList';
import { ResendConfigsList } from '@/components/ResendConfigsList';
import { InvoicePreview } from '@/components/InvoicePreview';
import { WrongOrdersList } from '@/components/WrongOrdersList';
import { ShopPerformanceTables } from '@/components/ShopPerformanceTables';
import { BankAccountPerformance } from '@/components/BankAccountPerformance';
import { PaymentMethodAnalysis } from '@/components/PaymentMethodAnalysis';
import { StatusPipelineAnalysis } from '@/components/StatusPipelineAnalysis';
import { RevenueCharts } from '@/components/RevenueCharts';
import { DashboardStats } from '@/components/DashboardStats';
import { EmployeeManagement } from '@/components/EmployeeManagement';
import { useUserRole } from '@/hooks/useUserRole';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const navigate = useNavigate();
  
  const { isCaller, loading: roleLoading } = useUserRole();
  
  // Force caller to only see Orders tab
  const effectiveActiveTab = isCaller ? "orders" : activeTab;

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthReady(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setAuthReady(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Show loading screen until auth state is ready
  if (!authReady || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="animate-spin h-10 w-10 rounded-full border-[3px] border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const renderContent = () => {
    switch (effectiveActiveTab) {
      case 'shops':
        return <ShopsList />;
      case 'orders':
        return <OrdersList />;
      case 'bank-accounts':
        return <BankAccountsList />;
      case 'payment-methods':
        return <PaymentMethodsList />;
      case 'resend-configs':
        return <ResendConfigsList />;
      case 'preview':
        return <InvoicePreview />;
      case 'security-check':
        return <WrongOrdersList />;
      case 'bank-analytics':
        return <BankAccountPerformance />;
      case 'payment-analytics':
        return <PaymentMethodAnalysis />;
      case 'status-analytics':
        return <StatusPipelineAnalysis />;
      case 'employees':
        return <EmployeeManagement />;
      default:
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-gray-500 mt-2">Welcome to your heating oil admin dashboard</p>
            </div>

            <DashboardStats />

            <ShopPerformanceTables />

            <RevenueCharts />
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <DashboardContent 
        effectiveActiveTab={effectiveActiveTab}
        isCaller={isCaller}
        setActiveTab={setActiveTab}
        user={user}
        handleSignOut={handleSignOut}
        renderContent={renderContent}
      />
    </SidebarProvider>
  );
};

// Separate component to use useSidebar hook inside SidebarProvider
const DashboardContent = ({ 
  effectiveActiveTab, 
  isCaller, 
  setActiveTab, 
  user, 
  handleSignOut, 
  renderContent 
}: {
  effectiveActiveTab: string;
  isCaller: boolean;
  setActiveTab: (tab: string) => void;
  user: User | null;
  handleSignOut: () => Promise<void>;
  renderContent: () => React.ReactNode;
}) => {
  const { toggleSidebar, open } = useSidebar();

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <AppSidebar 
        activeTab={effectiveActiveTab} 
        onTabChange={isCaller ? () => {} : setActiveTab}
        user={user}
        onSignOut={handleSignOut}
        isCaller={isCaller}
      />
      <SidebarInset className="flex-1">
        <div className="flex h-16 items-center gap-4 border-b border-gray-100 bg-white/70 backdrop-blur-md px-6 shadow-sm">
          <button 
            onClick={toggleSidebar}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-orange-100 hover:bg-orange-200 transition-all duration-200"
          >
            {open ? (
              <ChevronLeft className="h-5 w-5 text-orange-600" />
            ) : (
              <ChevronRight className="h-5 w-5 text-orange-600" />
            )}
          </button>
            <div className="h-6 w-px bg-gray-200" />
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              {isCaller ? 'Orders' :
               effectiveActiveTab === 'overview' ? 'Dashboard' : 
               effectiveActiveTab === 'resend-configs' ? 'Resend Configuration' :
               effectiveActiveTab === 'payment-methods' ? 'Payment Methods' :
               effectiveActiveTab === 'preview' ? 'Invoice Preview' :
               effectiveActiveTab === 'security-check' ? 'Sicherheitscheck' :
               effectiveActiveTab === 'bank-analytics' ? 'Bank Performance' :
               effectiveActiveTab === 'payment-analytics' ? 'Payment Analysis' :
               effectiveActiveTab === 'status-analytics' ? 'Status Pipeline' :
               effectiveActiveTab === 'employees' ? 'Mitarbeiterverwaltung' :
               effectiveActiveTab.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex-1 p-6">
            {renderContent()}
          </div>
        </SidebarInset>
      </div>
    );
  };

export default Dashboard;
