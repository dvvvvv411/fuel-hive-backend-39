
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
import { Store, CreditCard, FileText, TrendingUp, Mail, Banknote } from 'lucide-react';

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
      default:
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
              <p className="text-gray-600 mt-2">Welcome to your heating oil admin dashboard</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Shops</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Store className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-3xl font-bold text-gray-900">0</div>
                  <p className="text-sm text-gray-500 mt-1">Active heating oil shops</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-3xl font-bold text-gray-900">0</div>
                  <p className="text-sm text-gray-500 mt-1">Orders processed</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Bank Accounts</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-3xl font-bold text-gray-900">0</div>
                  <p className="text-sm text-gray-500 mt-1">Connected accounts</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-3xl font-bold text-gray-900">€0</div>
                  <p className="text-sm text-gray-500 mt-1">Total revenue</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
                  <CardDescription>Latest updates from your heating oil business</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setActiveTab('shops')}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Store className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Manage Shops</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="font-medium">View Orders</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveTab('bank-accounts')}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        <span className="font-medium">Manage Bank Accounts</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveTab('payment-methods')}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Banknote className="h-5 w-5 text-indigo-600" />
                        <span className="font-medium">Payment Methods</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveTab('resend-configs')}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-orange-600" />
                        <span className="font-medium">Email Configuration</span>
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
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
