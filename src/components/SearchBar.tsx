import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <form onSubmit={handleSubmit} className="w-full max-w-[600px] mx-auto space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for classes (ICS 33) or professors (Pattis)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 pl-12 pr-4 text-base bg-card border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setSearchType("class")}
          className={cn(
            "px-6 py-2 rounded-full text-sm font-medium transition-all",
            searchType === "class"
              ? "bg-primary text-primary-foreground"
              : "bg-transparent border border-border text-foreground hover:border-primary"
          )}
        >
          Class
        </button>
        <button
          type="button"
          onClick={() => setSearchType("professor")}
          className={cn(
            "px-6 py-2 rounded-full text-sm font-medium transition-all",
            searchType === "professor"
              ? "bg-primary text-primary-foreground"
              : "bg-transparent border border-border text-foreground hover:border-primary"
          )}
        >
          Professor
        </button>
      </div>

      <div className="flex justify-center">
        <Button
          type="submit"
          size="lg"
          className="w-[200px] h-12"
        >
          Search
        </Button>
      </div>
    </form>
  );
};
