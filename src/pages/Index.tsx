import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

const phrases = [
  "LETS MAKE SOME MONEY",
  "ITS FREEZING OUTSIDE",
  "TODAY IS A GOOD DAY TO DIE"
];

const Index = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (displayText.length < currentPhrase.length) {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        } else {
          // Finished typing, pause then start deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          // Finished deleting, move to next phrase
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, phraseIndex]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Single subtle gradient glow - top center */}
      <div 
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-20 blur-[150px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #5B21B6 0%, transparent 70%)',
        }}
      />

      {/* Orange gradient orb - bottom left */}
      <div 
        className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none animate-float"
        style={{
          background: 'radial-gradient(circle, #F97316 0%, #FB923C 40%, transparent 70%)',
        }}
      />

      {/* Orange gradient orb - right middle */}
      <div 
        className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none animate-float-reverse"
        style={{
          background: 'radial-gradient(circle, #FBBF24 0%, #F97316 50%, transparent 70%)',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Typewriter text */}
        <div 
          className="h-8 mb-4 md:mb-6 animate-fade-in"
          style={{ animationDelay: '0ms', animationFillMode: 'both' }}
        >
        <span 
            className={`text-sm sm:text-base md:text-lg font-medium tracking-wider transition-colors duration-300 ${isButtonHovered ? 'text-white' : 'text-[#F97316]'}`}
          >
            {displayText}
            <span className="animate-pulse">|</span>
          </span>
        </div>

        {/* Headline */}
        <h1 
          className="text-center animate-fade-in"
          style={{ animationDelay: '0ms', animationFillMode: 'both' }}
        >
          <span className={`block text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-bold tracking-tighter leading-none transition-colors duration-300 ${isButtonHovered ? 'text-[#F97316]' : 'text-white'}`}>
            SHOP
          </span>
          <span className={`block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extralight tracking-[0.2em] sm:tracking-[0.3em] mt-2 md:mt-4 transition-colors duration-300 ${isButtonHovered ? 'text-[#F97316]' : 'text-white/80'}`}>
            MANAGEMENT
          </span>
        </h1>

        {/* Subtext */}
        <p 
          className={`mt-8 md:mt-12 text-base sm:text-lg md:text-xl text-center whitespace-nowrap animate-fade-in transition-colors duration-300 ${isButtonHovered ? 'text-[#F97316]' : 'text-neutral-500'}`}
          style={{ animationDelay: '150ms', animationFillMode: 'both' }}
        >
          Die intelligente Plattform für Multi-Shop Management.
        </p>

        {/* CTA Button */}
        <div 
          className="mt-10 md:mt-14 animate-fade-in"
          style={{ animationDelay: '300ms', animationFillMode: 'both' }}
        >
          <Link to="/auth">
            <button 
              onMouseEnter={() => setIsButtonHovered(true)}
              onMouseLeave={() => setIsButtonHovered(false)}
              className={`group px-8 py-4 font-medium text-base rounded-full transition-all duration-300 hover:scale-105 flex items-center gap-2 ${isButtonHovered ? 'bg-[#F97316] text-white shadow-[0_0_60px_rgba(249,115,22,0.3)]' : 'bg-white text-black shadow-[0_0_60px_rgba(255,255,255,0.12)]'}`}
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
