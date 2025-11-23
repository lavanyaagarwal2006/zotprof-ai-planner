import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glassmorphic border-b border-white/10">
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold gradient-text-primary tracking-tight">
            ZotProf AI
          </span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <a 
            href="#about" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            About
          </a>
          <a 
            href="#contact" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
};
