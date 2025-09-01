
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, CreditCard, FileText, Shield, ArrowRight, TrendingUp, Users, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10"></div>
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-8 leading-tight">
              Business Management
              <span className="block text-4xl md:text-6xl mt-2">Dashboard</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Professionelles E-Commerce Management System für Multi-Shop Verwaltung, 
              Bestellabwicklung und Zahlungsverarbeitung.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white border-0 shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 group">
                  Dashboard öffnen
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
                  Anmelden
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gradient-to-b from-transparent to-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fade-in">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">500+</div>
              <div className="text-slate-400">Bestellungen</div>
            </div>
            <div className="animate-fade-in">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div>
              <div className="text-slate-400">Shops</div>
            </div>
            <div className="animate-fade-in">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-slate-400">Verfügbarkeit</div>
            </div>
            <div className="animate-fade-in">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-slate-400">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-slate-800/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Alles was Sie brauchen
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Vollständige Business-Lösung für moderne E-Commerce Verwaltung
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-900/50 border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 group backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Store className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Multi-Shop Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 text-center">
                  Verwalten Sie mehrere Shops zentral über ein einziges Dashboard
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 group backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Bestellabwicklung</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 text-center">
                  Automatisierte Workflows für effiziente Bestellverwaltung
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 group backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Zahlungsintegration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 text-center">
                  Sichere Bankkonto- und Zahlungsabwicklung
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700 hover:border-red-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 group backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Sicher & Zuverlässig</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 text-center">
                  Entwickelt mit Fokus auf Sicherheit und Zuverlässigkeit
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Showcase Section */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-2 items-center">
                <div className="p-8 md:p-12">
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    Moderne Benutzeroberfläche
                  </h3>
                  <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                    Intuitive Bedienung mit responsivem Design für optimale 
                    Produktivität auf allen Geräten.
                  </p>
                  <div className="flex items-center gap-4 text-slate-400">
                    <Zap className="h-5 w-5 text-purple-400" />
                    <span>Blitzschnelle Performance</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 mt-3">
                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                    <span>Erweiterte Analytics</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 mt-3">
                    <Users className="h-5 w-5 text-emerald-400" />
                    <span>Multi-User Support</span>
                  </div>
                </div>
                <div className="p-8 md:p-12">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 rounded-xl"></div>
                    <img 
                      src="/placeholder.svg" 
                      alt="Dashboard Preview" 
                      className="w-full h-64 object-cover rounded-xl border border-slate-600/50 shadow-xl"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 bg-gradient-to-t from-slate-900 to-transparent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Bereit für effizientes Business Management?
          </h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Starten Sie jetzt und optimieren Sie Ihre Geschäftsprozesse
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-xl px-12 py-6 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white border-0 shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 group">
              Admin Dashboard öffnen
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
