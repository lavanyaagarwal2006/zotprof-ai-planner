import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[700px] mx-auto">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-purple to-accent rounded-2xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 blur transition duration-300" />
        
        <div className="relative bg-background-secondary rounded-2xl border-2 border-white/10 group-focus-within:border-transparent transition-all duration-300 shadow-[0_20px_60px_-10px_rgba(59,130,246,0.3)]">
          <div className="flex items-center gap-3 px-6 py-4">
            <Search className="h-6 w-6 text-primary/70 flex-shrink-0" />
            
            <input
              type="text"
              placeholder="Ask anything: ICS 33 winter 2025, Professor Pattis, easiest math class..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
            />

            <button
              type="submit"
              disabled={!query.trim()}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-purple text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          type="button"
          onClick={() => setQuery("ICS 33 winter 2025")}
          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 underline-offset-4 hover:underline"
        >
          ICS 33 Winter 2025
        </button>
        <span className="text-muted-foreground">•</span>
        <button
          type="button"
          onClick={() => setQuery("Professor Pattis")}
          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 underline-offset-4 hover:underline"
        >
          Professor Pattis
        </button>
        <span className="text-muted-foreground">•</span>
        <button
          type="button"
          onClick={() => setQuery("Thornton vs Pattis")}
          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 underline-offset-4 hover:underline"
        >
          Thornton vs Pattis
        </button>
        <span className="text-muted-foreground">•</span>
        <button
          type="button"
          onClick={() => setQuery("easiest writing class")}
          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 underline-offset-4 hover:underline"
        >
          Easiest Writing
        </button>
      </div>
    </form>
  );
};
