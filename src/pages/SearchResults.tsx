import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { ProfessorCard, Professor } from "@/components/ProfessorCard";
import { toast } from "sonner";

// Mock data - will be replaced with API calls
const mockProfessors: Professor[] = [
  {
    name: "Richard Pattis",
    department: "Computer Science",
    rating: 4.2,
    difficulty: 3.8,
    reviewCount: 156,
    grades: { A: 35, B: 40, C: 15, D: 7, F: 3 },
    section: {
      time: "MWF 10:00-10:50am",
      seats: { available: 280, total: 300 },
      code: "36560",
    },
    tags: ["Clear lectures", "Tough grader", "Curves help"],
    aiInsight:
      "Professor Pattis is known for thorough lectures and fair grading with generous curves. Best for students who attend class regularly and complete assignments.",
  },
  {
    name: "Alex Thornton",
    department: "Computer Science",
    rating: 4.8,
    difficulty: 4.2,
    reviewCount: 203,
    grades: { A: 25, B: 35, C: 25, D: 10, F: 5 },
    section: {
      time: "TuTh 2:00-3:20pm",
      seats: { available: 5, total: 150 },
      code: "36565",
    },
    tags: ["Excellent teacher", "Challenging", "Helpful"],
    aiInsight:
      "Professor Thornton delivers engaging lectures with real-world examples. Challenging but rewarding for dedicated students seeking deep understanding.",
  },
  {
    name: "Shannon Alfaro",
    department: "Computer Science", 
    rating: 4.5,
    difficulty: 3.5,
    reviewCount: 89,
    grades: { A: 30, B: 45, C: 18, D: 5, F: 2 },
    section: {
      time: "MWF 2:00-2:50pm",
      seats: { available: 120, total: 200 },
      code: "36570",
    },
    tags: ["Organized", "Fair exams", "Approachable"],
    aiInsight:
      "Professor Alfaro structures the course well with clear expectations. Great balance between rigor and support for student success.",
  },
];

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [professors, setProfessors] = useState<Professor[]>([]);
  
  const query = searchParams.get("q") || "";
  const searchType = searchParams.get("type") || "class";

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setProfessors(mockProfessors);
      setLoading(false);
    }, 800);
  }, [query, searchType]);

  const handleBack = () => {
    navigate("/");
  };

  const handleSwitchToAI = () => {
    navigate(`/chat?context=${encodeURIComponent(query)}`);
  };

  const handleViewReviews = (professor: Professor) => {
    toast.info(`Full reviews for ${professor.name} coming soon!`);
  };

  const handleAskAI = (professor: Professor) => {
    navigate(`/chat?professor=${encodeURIComponent(professor.name)}&course=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Top Navigation */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-16 z-40">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </button>
            
            <div className="flex-1 text-center">
              <span className="text-lg font-heading font-semibold">
                {query} - Winter 2025
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSwitchToAI}
              className="whitespace-nowrap"
            >
              💬 Switch to AI Planning
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-8 py-8">
        {/* Course Header Card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">
                ICS 33 - Intermediate Programming
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full">
                  Winter 2025
                </span>
                <span className="text-sm text-muted-foreground">
                  3 sections available
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Average Grade Distribution</div>
              <div className="text-lg font-semibold">30% A's • 40% B's</div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-6 animate-pulse"
              >
                <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Professor Cards */}
        {!loading && professors.length > 0 && (
          <div className="space-y-6">
            {professors.map((professor, idx) => (
              <ProfessorCard
                key={idx}
                professor={professor}
                onViewReviews={() => handleViewReviews(professor)}
                onAskAI={() => handleAskAI(professor)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && professors.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-heading font-semibold mb-2">
              No professors found
            </h2>
            <p className="text-muted-foreground mb-6">
              No results for "{query}". Try searching for ICS 33 or Professor Pattis
            </p>
            <Button onClick={handleBack}>
              Back to Search
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResults;
