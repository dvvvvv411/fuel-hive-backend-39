import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Single subtle gradient glow - top center */}
      <div 
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-20 blur-[150px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #5B21B6 0%, transparent 70%)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Headline */}
        <h1 
          className="text-center animate-fade-in"
          style={{ animationDelay: '0ms', animationFillMode: 'both' }}
        >
          <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-bold tracking-tighter text-white leading-none">
            HEIZÖL
          </span>
          <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extralight tracking-[0.2em] sm:tracking-[0.3em] text-white/80 mt-2 md:mt-4">
            MANAGEMENT
          </span>
        </h1>

        {/* Subtext */}
        <p 
          className="mt-8 md:mt-12 text-base sm:text-lg md:text-xl text-neutral-500 text-center max-w-md animate-fade-in"
          style={{ animationDelay: '150ms', animationFillMode: 'both' }}
        >
          Die intelligente Plattform für Heizölhändler.
        </p>

        {/* CTA Button */}
        <div 
          className="mt-10 md:mt-14 animate-fade-in"
          style={{ animationDelay: '300ms', animationFillMode: 'both' }}
        >
          <Link to="/auth">
            <button 
              className="group px-8 py-4 bg-white text-black font-medium text-base rounded-full transition-all duration-300 hover:bg-white/90 hover:scale-105 shadow-[0_0_60px_rgba(255,255,255,0.12)] flex items-center gap-2"
            >
              Jetzt starten
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </Link>
        </div>

        {/* Bottom accent line */}
        <div 
          className="absolute bottom-16 left-1/2 -translate-x-1/2 w-24 h-px bg-white/10 animate-fade-in"
          style={{ animationDelay: '500ms', animationFillMode: 'both' }}
        />
      </div>
    </div>
  );
};

export default Index;
