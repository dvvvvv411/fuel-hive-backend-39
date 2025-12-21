
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, Shield, Lock } from 'lucide-react';

interface CryptoPrice {
  eur: number;
  eur_24h_change: number;
}

interface CryptoPrices {
  bitcoin?: CryptoPrice;
  ethereum?: CryptoPrice;
  monero?: CryptoPrice;
  solana?: CryptoPrice;
}

const CRYPTO_CONFIG = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ' },
  { id: 'monero', name: 'Monero', symbol: 'XMR', icon: 'ɱ' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', icon: '◎' },
];

const Auth = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrices>({});
  const [cryptoLoading, setCryptoLoading] = useState(true);
  const [cryptoError, setCryptoError] = useState(false);

  useEffect(() => {
    const fetchCryptoPrices = async () => {
      try {
        setCryptoLoading(true);
        setCryptoError(false);
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,monero,solana&vs_currencies=eur&include_24hr_change=true'
        );
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setCryptoPrices(data);
      } catch (error) {
        console.error('Error fetching crypto prices:', error);
        setCryptoError(true);
      } finally {
        setCryptoLoading(false);
      }
    };

    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: price < 10 ? 2 : 0,
    }).format(price);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Fehler",
        description: "Bitte E-Mail und Passwort eingeben",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Anmeldefehler",
        description: error.message || "Ungültige Anmeldedaten",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background Effects - Same as Landing Page */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Violet Orb */}
        <div 
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-20 blur-[150px]"
          style={{
            background: 'radial-gradient(circle, #5B21B6 0%, transparent 70%)',
          }}
        />
        
        {/* Orange Orb - Bottom Left */}
        <div 
          className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] animate-float"
          style={{
            background: 'radial-gradient(circle, #F97316 0%, #FB923C 40%, transparent 70%)',
          }}
        />
        
        {/* Orange Orb - Right */}
        <div 
          className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] animate-float-reverse"
          style={{
            background: 'radial-gradient(circle, #FBBF24 0%, #F97316 50%, transparent 70%)',
          }}
        />

        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-particle"
            style={{
              width: `${3 + Math.random() * 4}px`,
              height: `${3 + Math.random() * 4}px`,
              left: `${10 + i * 15}%`,
              bottom: '-20px',
              background: '#F97316',
              opacity: 0.3,
              animationDelay: `${i * 2.5}s`,
              animationDuration: `${12 + Math.random() * 8}s`,
            }}
          />
        ))}
      </div>

      {/* Back Button */}
      <Button
        variant="ghost"
        className="absolute top-6 left-6 text-white/60 hover:text-white hover:bg-white/5 z-20"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Zurück
      </Button>

      {/* Main Card */}
      <Card 
        className="w-full max-w-4xl bg-black/40 backdrop-blur-xl border border-white/20 shadow-[0_0_80px_rgba(249,115,22,0.08)] ring-1 ring-white/5 rounded-2xl overflow-hidden relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Side - Login */}
          <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-center">
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-xs text-[#F97316] font-medium tracking-wider mb-2">
                  ANMELDEN
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  SHOP
                </h1>
                <h2 className="text-2xl md:text-3xl font-bold text-white/60 tracking-tight">
                  MANAGEMENT
                </h2>
              </div>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-white/60">E-Mail</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F97316]/50 focus:ring-[#F97316]/20"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/60">Passwort</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F97316]/50 focus:ring-[#F97316]/20"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-medium py-5 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird angemeldet...
                  </>
                ) : (
                  'Anmelden'
                )}
              </Button>
            </form>

            {/* Trust Indicators */}
            <div className="mt-6 pt-4 border-t border-white/5">
              <div className="flex items-center justify-center gap-6 text-white/30 text-xs">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>SSL Verschlüsselt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sichere Daten</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Crypto Prices */}
          <div className="p-6 md:p-8 bg-white/[0.02] flex flex-col justify-center">
            {/* Header */}
            <div className="mb-6">
              <span className="text-xs text-[#F97316] font-medium tracking-wider">
                LIVE KURSE
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Krypto Preise
              </h3>
            </div>

            {/* Crypto Cards */}
            <div className="space-y-3">
              {CRYPTO_CONFIG.map((crypto) => {
                const priceData = cryptoPrices[crypto.id as keyof CryptoPrices];
                const isPositive = priceData && priceData.eur_24h_change > 0;
                
                return (
                  <div
                    key={crypto.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg">
                        {crypto.icon}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{crypto.name}</p>
                        <p className="text-white/40 text-xs">{crypto.symbol}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {cryptoLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin text-white/40" />
                          <span className="text-white/40 text-sm">Laden...</span>
                        </div>
                      ) : cryptoError ? (
                        <span className="text-white/40 text-sm">--</span>
                      ) : priceData ? (
                        <>
                          <p className="text-white font-medium text-sm">
                            {formatPrice(priceData.eur)}
                          </p>
                          <div className={`flex items-center justify-end gap-1 text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>
                              {isPositive ? '+' : ''}{priceData.eur_24h_change.toFixed(2)}%
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-white/40 text-sm">--</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
