import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string, type: "class" | "professor") => void;
}

export const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"class" | "professor">("class");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, searchType);
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
              placeholder="Search ICS 33, Professor Pattis, or explore courses..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
            />

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSearchType("class")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                  searchType === "class"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Class
              </button>
              <button
                type="button"
                onClick={() => setSearchType("professor")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                  searchType === "professor"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Professor
              </button>

              <button
                type="submit"
                disabled={!query.trim()}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-purple text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          type="button"
          onClick={() => setQuery("ICS 33")}
          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 underline-offset-4 hover:underline"
        >
          ICS 33
        </button>
        <span className="text-muted-foreground">•</span>
        <button
          type="button"
          onClick={() => setQuery("Richard Pattis")}
          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 underline-offset-4 hover:underline"
        >
          Richard Pattis
        </button>
        <span className="text-muted-foreground">•</span>
        <button
          type="button"
          onClick={() => setQuery("Computer Science")}
          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 underline-offset-4 hover:underline"
        >
          Computer Science
        </button>
      </div>
    </form>
  );
};
