import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { ProfessorCard, Professor } from "@/components/ProfessorCard";
import { toast } from "sonner";
import { parseSearchIntent, fetchCourseData, generateAISummary } from "@/lib/api";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [courseInfo, setCourseInfo] = useState<any>(null);
  
  const query = searchParams.get("q") || "";

  useEffect(() => {
    const fetchData = async () => {
      if (!query) return;
      
      setLoading(true);
      try {
        // Step 1: Parse search intent using AI
        console.log('Parsing search intent for:', query);
        const intent = await parseSearchIntent(query);
        console.log('Search intent:', intent);
        
        if (intent.type === "class" && intent.department && intent.courseNumber) {
          // Step 2: Fetch course data from PeterAPI
          const courseData = await fetchCourseData(
            intent.department,
            intent.courseNumber,
            intent.term || undefined
          );
          
          console.log('Course data:', courseData);
          
          // Check if we're using mock data (happens in preview environment)
          const isUsingMockData = courseData.course?.description?.includes('unavailable in preview');
          if (isUsingMockData) {
            toast.info("📋 Showing demo data in preview. Real data will load in production.");
          }
          
          setCourseInfo(courseData.course);
          
          // Step 3: Transform API data into Professor cards format
          const professorCards: Professor[] = await Promise.all(
            courseData.instructors.map(async (instructor: any) => {
              // Find sections for this instructor
              const instructorSections = courseData.sections.filter((section: any) =>
                section.meetings?.some((meeting: any) =>
                  meeting.instructors?.includes(instructor.name)
                )
              );
              
              // Get grade data for this instructor
              const gradeData = courseData.grades[instructor.name] || [];
              let grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
              
              if (gradeData.length > 0) {
                const totals = gradeData.reduce((acc: any, term: any) => ({
                  A: acc.A + (term.gradeACount || 0),
                  B: acc.B + (term.gradeBCount || 0),
                  C: acc.C + (term.gradeCCount || 0),
                  D: acc.D + (term.gradeDCount || 0),
                  F: acc.F + (term.gradeFCount || 0),
                }), { A: 0, B: 0, C: 0, D: 0, F: 0 });
                
                const total = totals.A + totals.B + totals.C + totals.D + totals.F;
                if (total > 0) {
                  grades = {
                    A: Math.round((totals.A / total) * 100),
                    B: Math.round((totals.B / total) * 100),
                    C: Math.round((totals.C / total) * 100),
                    D: Math.round((totals.D / total) * 100),
                    F: Math.round((totals.F / total) * 100),
                  };
                }
              }
              
              // Get first section info
              const firstSection = instructorSections[0];
              const firstMeeting = firstSection?.meetings?.[0];
              
              // Generate AI insight for this professor (in parallel)
              let aiInsight = "";
              try {
                const summaryResult = await generateAISummary('professor-insight', {
                  name: instructor.name,
                  rmpData: { avgRating: 0, avgDifficulty: 0 }, // We'll add RMP data later
                  reviews: []
                });
                aiInsight = summaryResult.summary;
              } catch (error) {
                console.error('Error generating AI insight:', error);
                aiInsight = `Professor in the ${instructor.department || 'department'}.`;
              }
              
              return {
                name: instructor.name,
                department: instructor.department || "Computer Science",
                rating: 0, // Will be populated when we add RMP data
                difficulty: 0,
                reviewCount: 0,
                grades,
                section: {
                  time: firstMeeting ? `${firstMeeting.days || 'TBA'} ${firstMeeting.time || ''}`.trim() : 'TBA',
                  seats: {
                    available: firstSection?.numCurrentlyEnrolled?.totalEnrolled 
                      ? (firstSection.maxCapacity - firstSection.numCurrentlyEnrolled.totalEnrolled)
                      : 0,
                    total: firstSection?.maxCapacity || 0,
                  },
                  code: firstSection?.sectionCode || 'N/A',
                },
                tags: [],
                aiInsight,
              };
            })
          );
          
          setProfessors(professorCards);
          
          // Generate course recommendation if multiple professors
          if (professorCards.length > 1) {
            try {
              const recommendation = await generateAISummary('course-recommendation', {
                course: `${intent.department} ${intent.courseNumber}`,
                professors: professorCards.map(p => ({
                  name: p.name,
                  rmpData: { avgRating: p.rating, avgDifficulty: p.difficulty, wouldTakeAgainPercent: 0 },
                  topTags: p.tags,
                  sections: [p.section]
                })),
                userProfile: null
              });
              setAiRecommendation(recommendation.summary);
            } catch (error) {
              console.error('Error generating recommendation:', error);
            }
          }
        } else {
          toast.error("Unable to parse search query. Try: 'ICS 33 winter 2025' or 'Professor Pattis'");
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
        toast.error("Failed to load search results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

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
                {query}
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
        {/* AI Recommendation Card (if available) */}
        {!loading && aiRecommendation && professors.length > 1 && (
          <div className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30 rounded-2xl p-6 mb-8 hover-lift-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-2">🎯 AI Recommendation</h3>
                <p className="text-muted-foreground leading-relaxed">{aiRecommendation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Course Header Card */}
        {!loading && courseInfo && (
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
                    {courseInfo.id || query}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">
                  {courseInfo.title || "Course Information"}
                </h1>
                <p className="text-muted-foreground">{professors.length} professor{professors.length !== 1 ? 's' : ''} teaching this course</p>
              </div>
            </div>
          </div>
        )}

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
