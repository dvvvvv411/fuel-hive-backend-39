
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { 
  Bell, 
  Search, 
  Settings, 
  HelpCircle, 
  ChevronRight,
  Activity,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';

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

  const getPageTitle = () => {
    switch (activeTab) {
      case 'shops': return 'Shop-Verwaltung';
      case 'orders': return 'Bestellungen';
      case 'bank-accounts': return 'Bankkonten';
      case 'payment-methods': return 'Zahlungsmethoden';
      case 'resend-configs': return 'E-Mail Konfiguration';
      case 'preview': return 'Rechnungsvorschau';
      case 'bank-analytics': return 'Bank Performance';
      case 'payment-analytics': return 'Zahlungsanalyse';
      case 'status-analytics': return 'Status Pipeline';
      default: return 'Dashboard';
    }
  };

  const getPageDescription = () => {
    switch (activeTab) {
      case 'shops': return 'Verwalten Sie alle registrierten Shops und deren Einstellungen';
      case 'orders': return 'Übersicht über alle Heizöl-Bestellungen und deren Status';
      case 'bank-accounts': return 'Bankkonten-Verwaltung für Zahlungsabwicklung';
      case 'payment-methods': return 'Konfiguration der verfügbaren Zahlungsmethoden';
      case 'resend-configs': return 'E-Mail-Templates und Versandkonfiguration';
      case 'preview': return 'Vorschau und Test der generierten Rechnungen';
      case 'bank-analytics': return 'Detaillierte Analyse der Bank-Performance';
      case 'payment-analytics': return 'Auswertung der Zahlungsmethoden-Nutzung';
      case 'status-analytics': return 'Analyse der Bestellstatus-Pipeline';
      default: return 'Willkommen im Heating Oil Admin Panel';
    }
  };

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Dashboard', href: '#', active: activeTab === 'overview' }
    ];

    if (activeTab !== 'overview') {
      breadcrumbs.push({ 
        label: getPageTitle(), 
        href: '#', 
        active: true 
      });
    }

    return breadcrumbs;
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
          <div className="space-y-8 animate-fade-in">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass-card border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Aktive Bestellungen
                  </CardTitle>
                  <Activity className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">1,234</div>
                  <p className="text-xs text-green-600 font-medium">
                    +12% vom letzten Monat
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Gesamtumsatz
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">€89,234</div>
                  <p className="text-xs text-green-600 font-medium">
                    +8% vom letzten Monat
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Aktive Shops
                  </CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">45</div>
                  <p className="text-xs text-blue-600 font-medium">
                    +3 neue diese Woche
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Erfolgsrate
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">98.2%</div>
                  <p className="text-xs text-green-600 font-medium">
                    +0.5% Verbesserung
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Tables */}
            <ShopPerformanceTables />

            {/* Revenue Charts */}
            <RevenueCharts />
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-gray-100">
        <AppSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          user={user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1">
          {/* Modern Header */}
          <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-8 w-8 hover:bg-gray-100 rounded-lg transition-colors" />
                <div className="h-6 w-px bg-gray-200" />
                
                {/* Breadcrumbs */}
                <nav className="flex items-center space-x-2 text-sm">
                  {getBreadcrumbs().map((breadcrumb, index) => (
                    <div key={index} className="flex items-center">
                      {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />}
                      <span className={`font-medium ${
                        breadcrumb.active 
                          ? 'text-blue-600' 
                          : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                      }`}>
                        {breadcrumb.label}
                      </span>
                    </div>
                  ))}
                </nav>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-3">
                {/* Search Button */}
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100">
                  <Search className="h-4 w-4" />
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100 relative">
                  <Bell className="h-4 w-4" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 p-0 text-xs">
                    3
                  </Badge>
                </Button>

                {/* Help */}
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100">
                  <HelpCircle className="h-4 w-4" />
                </Button>

                {/* Settings */}
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 p-6">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {getPageTitle()}
                  </h1>
                  <p className="text-gray-600 text-lg">
                    {getPageDescription()}
                  </p>
                </div>

                {/* Quick Actions based on current page */}
                {activeTab === 'overview' && (
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('orders')}
                      className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                    >
                      Bestellungen anzeigen
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('shops')}
                      className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                    >
                      Shops verwalten
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            {renderContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
