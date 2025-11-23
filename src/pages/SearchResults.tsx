import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
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
      <div className="glassmorphic border-b border-white/10 sticky top-16 z-40">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </button>
            
            <div className="flex-1 text-center">
              <span className="text-lg font-bold gradient-text-primary tracking-tight">
                {query} › Winter 2025
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSwitchToAI}
              className="whitespace-nowrap border-accent/30 text-accent hover:bg-accent/10 hover:border-accent/50 transition-all duration-300"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Try AI Advisor
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-8 py-8">
        {/* Course Header Card */}
        <div className="bg-gradient-to-br from-primary/10 via-purple/10 to-transparent border border-white/10 rounded-2xl p-8 mb-8 relative overflow-hidden hover-lift-sm">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />

          <div className="relative flex items-start justify-between flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-accent/20 backdrop-blur-sm text-accent text-sm font-semibold rounded-full border border-accent/30">
                  ICS 33
                </span>
                <span className="px-3 py-1 bg-white/5 backdrop-blur-sm text-muted-foreground text-sm rounded-full border border-white/10">
                  Winter 2025
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">
                Intermediate Programming
              </h1>
              <p className="text-muted-foreground">3 sections available</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-2">Average Grade Distribution</div>
              <div className="text-2xl font-bold gradient-text-primary tabular-nums">
                30% A's • 40% B's
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-background-secondary border border-white/10 rounded-2xl p-7 shimmer"
              >
                <div className="h-6 bg-white/5 rounded w-1/3 mb-4" />
                <div className="h-4 bg-white/5 rounded w-1/2 mb-2" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Professor Cards */}
        {!loading && professors.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
