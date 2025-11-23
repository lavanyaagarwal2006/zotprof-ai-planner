import { useState } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const handleSearch = (query: string, type: "class" | "professor") => {
    navigate(`/search?q=${encodeURIComponent(query)}&type=${type}`);
  };

  const handleAIPlanning = () => {
    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 md:px-8">
        {/* Hero Section */}
        <section className="py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 gradient-text">
            Your Intelligent UCI Course Planner
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Search any class or professor, then let AI build your perfect schedule
          </p>
        </section>

        {/* Search Section */}
        <section className="pb-12">
          <SearchBar onSearch={handleSearch} />
        </section>

        {/* Divider */}
        <div className="relative flex items-center justify-center py-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative bg-background px-4">
            <span className="text-sm text-muted-foreground font-medium">OR</span>
          </div>
        </div>

        {/* AI Planning CTA */}
        <section className="pb-24 flex justify-center">
          <Button
            size="lg"
            onClick={handleAIPlanning}
            className="w-full md:w-auto md:min-w-[300px] h-14 text-lg bg-accent text-accent-foreground hover:bg-accent/90 hover-lift shadow-lg"
          >
            💬 Plan My Schedule with AI
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Made for UCI students by UCI students
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
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
