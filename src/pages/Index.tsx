import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flame, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0f]">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large purple orb - top right */}
        <div 
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-30 blur-[120px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, #6366f1 50%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite'
          }}
        />
        
        {/* Cyan orb - bottom left */}
        <div 
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-25 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #06b6d4 0%, #0891b2 50%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse'
          }}
        />
        
        {/* Small accent orb - center */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-[150px]"
          style={{
            background: 'radial-gradient(circle, #a855f7 0%, #6366f1 30%, transparent 60%)',
            animation: 'pulse 6s ease-in-out infinite'
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Animated icon */}
        <div 
          className="mb-8 animate-fade-in"
          style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
        >
          <div className="relative">
            <div 
              className="absolute inset-0 blur-xl opacity-60"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                borderRadius: '50%',
                transform: 'scale(1.5)'
              }}
            />
            <Flame className="relative w-16 h-16 md:w-20 md:h-20 text-orange-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Main headline with gradient */}
        <h1 
          className="mb-6 text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-fade-in"
          style={{ 
            animationDelay: '0.2s', 
            animationFillMode: 'both',
            background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 25%, #a855f7 50%, #06b6d4 75%, #ffffff 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'fade-in 0.5s ease-out 0.2s both, gradient-shift 8s ease-in-out infinite'
          }}
        >
          HEIZÖL
          <br />
          <span className="text-4xl md:text-5xl lg:text-6xl font-light tracking-widest opacity-90">
            MANAGEMENT
          </span>
        </h1>

        {/* Subheadline */}
        <p 
          className="mb-4 text-xl md:text-2xl lg:text-3xl font-light text-white/80 max-w-2xl animate-fade-in"
          style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
        >
          Die Zukunft der Heizöl-Verwaltung
        </p>

        {/* Description */}
        <p 
          className="mb-12 text-base md:text-lg text-white/50 max-w-xl animate-fade-in"
          style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
        >
          Moderne Plattform für effizientes Multi-Shop Management, 
          automatisierte Bestellabwicklung und intelligente Analysen.
        </p>

        {/* CTA Button with glow effect */}
        <div 
          className="animate-fade-in"
          style={{ animationDelay: '0.6s', animationFillMode: 'both' }}
        >
          <Link to="/auth">
            <Button 
              size="lg" 
              className="group relative px-10 py-7 text-lg font-medium text-white border-0 rounded-full overflow-hidden transition-all duration-500 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 40px rgba(139, 92, 246, 0.3), 0 0 80px rgba(6, 182, 212, 0.2), inset 0 0 60px rgba(255, 255, 255, 0.05)'
              }}
            >
              {/* Animated border gradient */}
              <span 
                className="absolute inset-0 rounded-full p-[1px]"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 50%, #a855f7 100%)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude'
                }}
              />
              
              {/* Pulsing glow behind button */}
              <span 
                className="absolute inset-0 rounded-full opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                  filter: 'blur(20px)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              />
              
              <span className="relative flex items-center gap-3">
                Jetzt starten
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Button>
          </Link>
        </div>

        {/* Bottom accent line */}
        <div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-[1px] animate-fade-in"
          style={{ 
            animationDelay: '0.8s', 
            animationFillMode: 'both',
            background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.5) 50%, transparent 100%)'
          }}
        />
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.05);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.95);
          }
        }
        
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% center;
          }
          50% {
            background-position: 200% center;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default Index;
