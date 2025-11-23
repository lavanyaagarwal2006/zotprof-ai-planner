import { useState } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const handleSearch = (query: string, type: "class" | "professor") => {
    navigate(`/search?q=${encodeURIComponent(query)}&type=${type}`);
  };

  const handleAIPlanning = () => {
    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradient mesh */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(251,191,36,0.05),transparent_50%)]" />
        
        {/* Dotted grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <Header />
      
      <main className="container mx-auto px-4 md:px-8 pt-16">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center -mt-16">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-[1.1]">
              <span className="gradient-text-primary">Find Your Perfect</span>
              <br />
              <span className="gradient-text-gold">Professor</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              AI-powered course planning with real grade data, student reviews, and personalized recommendations
            </p>

            {/* Search Bar */}
            <div className="mb-20">
              <SearchBar onSearch={handleSearch} />
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-16">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative bg-background px-6">
                <span className="text-sm font-semibold text-accent tracking-wider">OR BUILD WITH AI</span>
              </div>
            </div>

            {/* AI Planning CTA */}
            <div className="flex flex-col items-center gap-6">
              <button
                onClick={handleAIPlanning}
                className="group relative w-full md:w-auto md:min-w-[320px] h-16 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:-translate-y-1"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple to-accent animate-gradient bg-[length:200%_200%]" />
                
                {/* Button content */}
                <div className="relative h-full flex items-center justify-center gap-3 px-8">
                  <Sparkles className="h-5 w-5 text-white transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                  <span className="text-lg font-semibold text-white">Plan My Schedule with AI</span>
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                     style={{ boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' }} />
              </button>

              {/* Feature badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
                  <span className="text-success">✓</span>
                  <span className="text-muted-foreground">Real Grade Data</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
                  <span className="text-success">✓</span>
                  <span className="text-muted-foreground">10,000+ Reviews</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
                  <span className="text-success">✓</span>
                  <span className="text-muted-foreground">AI-Powered</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-auto">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Made for UCI students by UCI students
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors duration-300">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors duration-300">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
