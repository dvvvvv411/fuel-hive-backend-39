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
import { DashboardStats } from '@/components/DashboardStats';
import { Store, CreditCard, FileText, TrendingUp, Mail, Banknote, Eye } from 'lucide-react';
import { ShopPerformanceTables } from '@/components/ShopPerformanceTables';
import { BankAccountPerformance } from '@/components/BankAccountPerformance';
import { PaymentMethodAnalysis } from '@/components/PaymentMethodAnalysis';
import { StatusPipelineAnalysis } from '@/components/StatusPipelineAnalysis';
import { RevenueCharts } from '@/components/RevenueCharts';
import { BarChart3 } from 'lucide-react';

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
      case 'revenue-charts':
        return <RevenueCharts />;
      default:
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
              <p className="text-gray-600 mt-2">Welcome to your heating oil admin dashboard</p>
            </div>

            <DashboardStats />

            <ShopPerformanceTables />

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
                    <button 
                      onClick={() => setActiveTab('preview')}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5 text-teal-600" />
                        <span className="font-medium">Invoice Preview</span>
                      </div>
                    </button>
                    
                    {/* New Analytics Actions */}
                    <div className="pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Analytics & Reports</h4>
                      <div className="space-y-2">
                        <button 
                          onClick={() => setActiveTab('bank-analytics')}
                          className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">Bank Performance</span>
                          </div>
                        </button>
                        <button 
                          onClick={() => setActiveTab('payment-analytics')}
                          className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <BarChart3 className="h-5 w-5 text-purple-600" />
                            <span className="font-medium">Payment Analysis</span>
                          </div>
                        </button>
                        <button 
                          onClick={() => setActiveTab('status-analytics')}
                          className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <span className="font-medium">Status Pipeline</span>
                          </div>
                        </button>
                        <button 
                          onClick={() => setActiveTab('revenue-charts')}
                          className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-5 w-5 text-indigo-600" />
                            <span className="font-medium">Revenue Charts</span>
                          </div>
                        </button>
                      </div>
                    </div>
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
               activeTab === 'preview' ? 'Invoice Preview' :
               activeTab === 'bank-analytics' ? 'Bank Performance' :
               activeTab === 'payment-analytics' ? 'Payment Analysis' :
               activeTab === 'status-analytics' ? 'Status Pipeline' :
               activeTab === 'revenue-charts' ? 'Revenue Charts' :
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
