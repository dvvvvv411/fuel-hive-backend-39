
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

interface CryptoPrice {
  eur: number;
  eur_24h_change: number;
}

interface CryptoPrices {
  bitcoin: CryptoPrice;
  ethereum: CryptoPrice;
  monero: CryptoPrice;
  solana: CryptoPrice;
}

const CRYPTO_CONFIG = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { id: 'monero', name: 'Monero', symbol: 'XMR', icon: 'https://assets.coingecko.com/coins/images/69/small/monero_logo.png' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
];

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrices | null>(null);
  const [cryptoLoading, setCryptoLoading] = useState(true);
  const [cryptoError, setCryptoError] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Fetch crypto prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setCryptoLoading(true);
        setCryptoError(false);
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,monero,solana&vs_currencies=eur&include_24hr_change=true'
        );
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        setCryptoPrices(data);
      } catch (error) {
        console.error('Failed to fetch crypto prices:', error);
        setCryptoError(true);
      } finally {
        setCryptoLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Signed in successfully!',
      });
      navigate('/dashboard');
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Account created successfully! Please check your email for verification.',
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden relative px-4 py-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Violet glow - top center */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        
        {/* Orange glow - bottom left */}
        <div 
          className="absolute bottom-0 left-0 w-[500px] h-[500px] opacity-20 animate-float"
          style={{
            background: 'radial-gradient(circle at center, rgba(249, 115, 22, 0.5) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        
        {/* Orange glow - right center */}
        <div 
          className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[600px] opacity-15 animate-float-reverse"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.4) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: i % 2 === 0 ? 'rgba(249, 115, 22, 0.6)' : 'rgba(139, 92, 246, 0.4)',
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Back to Home Link */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-white/60 hover:text-[#F97316] transition-colors duration-300 z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Zurück</span>
      </Link>

      {/* Main Card */}
      <div 
        className="relative w-full max-w-4xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden animate-fade-in"
        style={{ animationDelay: '100ms', animationFillMode: 'both' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Side - Login/Signup */}
          <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-white/10">
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-xs text-[#F97316] font-medium tracking-wider mb-2">
                  WILLKOMMEN ZURÜCK
                </span>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  SHOP
                </h1>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  MANAGEMENT
                </h2>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 p-1 rounded-lg mb-6">
                <TabsTrigger 
                  value="signin" 
                  className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-[#F97316] rounded-md transition-all duration-300"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-[#F97316] rounded-md transition-all duration-300"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F97316] focus:ring-[#F97316]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F97316] focus:ring-[#F97316]/20"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F97316] focus:ring-[#F97316]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F97316] focus:ring-[#F97316]/20"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Sign Up'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Side - Crypto Prices */}
          <div className="p-6 md:p-8 bg-white/[0.02]">
            {/* Header */}
            <div className="mb-6">
              <span className="text-xs text-[#F97316] font-medium tracking-wider">
                LIVE KURSE
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Krypto Preise
              </h3>
              <p className="text-white/40 text-sm mt-1">
                Aktualisiert alle 60 Sekunden
              </p>
            </div>

            {/* Crypto Cards */}
            <div className="space-y-3">
              {CRYPTO_CONFIG.map((crypto, index) => (
                <div
                  key={crypto.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#F97316]/30 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${200 + index * 100}ms`, animationFillMode: 'both' }}
                >
                  {/* Coin Icon */}
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                    <img 
                      src={crypto.icon} 
                      alt={crypto.name}
                      className="w-7 h-7"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${crypto.symbol}&background=F97316&color=fff&size=28`;
                      }}
                    />
                  </div>

                  {/* Coin Info */}
                  <div className="flex-1">
                    <span className="text-white font-medium block">{crypto.name}</span>
                    <span className="text-white/40 text-xs">{crypto.symbol}</span>
                  </div>

                  {/* Price & Change */}
                  <div className="text-right">
                    {cryptoLoading ? (
                      <div className="space-y-1">
                        <div className="h-5 w-20 bg-white/10 rounded animate-pulse" />
                        <div className="h-4 w-12 bg-white/10 rounded animate-pulse ml-auto" />
                      </div>
                    ) : cryptoError ? (
                      <span className="text-white/40 text-sm">--</span>
                    ) : cryptoPrices && cryptoPrices[crypto.id as keyof CryptoPrices] ? (
                      <>
                        <span className="text-white font-bold block">
                          {formatPrice(cryptoPrices[crypto.id as keyof CryptoPrices].eur)}
                        </span>
                        <span 
                          className={`text-xs flex items-center justify-end gap-1 ${
                            cryptoPrices[crypto.id as keyof CryptoPrices].eur_24h_change >= 0 
                              ? 'text-green-400' 
                              : 'text-red-400'
                          }`}
                        >
                          {cryptoPrices[crypto.id as keyof CryptoPrices].eur_24h_change >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {cryptoPrices[crypto.id as keyof CryptoPrices].eur_24h_change >= 0 ? '+' : ''}
                          {cryptoPrices[crypto.id as keyof CryptoPrices].eur_24h_change.toFixed(2)}%
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Note */}
            <p className="text-white/30 text-xs mt-4 text-center">
              Powered by CoinGecko API
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
