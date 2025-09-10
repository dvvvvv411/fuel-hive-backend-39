import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
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

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const navigate = useNavigate();

  // Check if current user is restricted to only Orders
  const isRestrictedUser = user?.id === "3338709d-0620-4384-8705-f6b4e9bf8be6";
  
  // Force restricted user to only see Orders tab
  const effectiveActiveTab = isRestrictedUser ? "orders" : activeTab;

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
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent" />
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
      case 'false-orders':
        return <WrongOrdersList />;
      case 'bank-analytics':
        return <BankAccountPerformance />;
      case 'payment-analytics':
        return <PaymentMethodAnalysis />;
      case 'status-analytics':
        return <StatusPipelineAnalysis />;
      default:
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
              <p className="text-gray-600 mt-2">Welcome to your heating oil admin dashboard</p>
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
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar 
          activeTab={effectiveActiveTab} 
          onTabChange={isRestrictedUser ? () => {} : setActiveTab}
          user={user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1">
          <div className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6">
            <SidebarTrigger className="h-8 w-8" />
            <div className="h-6 w-px bg-gray-200" />
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              {isRestrictedUser ? 'Orders' :
               effectiveActiveTab === 'overview' ? 'Dashboard' : 
               effectiveActiveTab === 'resend-configs' ? 'Resend Configuration' :
               effectiveActiveTab === 'payment-methods' ? 'Payment Methods' :
                effectiveActiveTab === 'preview' ? 'Invoice Preview' :
                effectiveActiveTab === 'false-orders' ? 'FALSCHE ORDERS' :
                effectiveActiveTab === 'bank-analytics' ? 'Bank Performance' :
               effectiveActiveTab === 'payment-analytics' ? 'Payment Analysis' :
               effectiveActiveTab === 'status-analytics' ? 'Status Pipeline' :
               effectiveActiveTab.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex-1 p-6">
            {renderContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
