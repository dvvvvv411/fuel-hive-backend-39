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
import { ShopPerformanceTables } from '@/components/ShopPerformanceTables';
import { BankAccountPerformance } from '@/components/BankAccountPerformance';
import { PaymentMethodAnalysis } from '@/components/PaymentMethodAnalysis';
import { StatusPipelineAnalysis } from '@/components/StatusPipelineAnalysis';
import { RevenueCharts } from '@/components/RevenueCharts';
import { DashboardStats } from '@/components/DashboardStats';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const renderContent = () => {
    switch (activeTab) {
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
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          user={user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1">
          <div className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6">
            <SidebarTrigger className="h-8 w-8" />
            <div className="h-6 w-px bg-gray-200" />
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              {activeTab === 'overview' ? 'Dashboard' : 
               activeTab === 'resend-configs' ? 'Resend Configuration' :
               activeTab === 'payment-methods' ? 'Payment Methods' :
               activeTab === 'preview' ? 'Invoice Preview' :
               activeTab === 'bank-analytics' ? 'Bank Performance' :
               activeTab === 'payment-analytics' ? 'Payment Analysis' :
               activeTab === 'status-analytics' ? 'Status Pipeline' :
               activeTab.replace('-', ' ')}
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
