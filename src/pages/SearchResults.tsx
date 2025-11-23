import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { ProfessorCard, Professor } from "@/components/ProfessorCard";
import { toast } from "sonner";
import { 
  getCourseSections, 
  getGradeDistribution, 
  calculateGradePercentages,
  formatMeetingTime,
  getSeatAvailabilityPercent,
  isAlmostFull,
  parseSearchQuery
} from "@/services/anteaterAPI";
import { generateProfessorSummary } from "@/services/aiService";
import { getRMPData, getRMPSummary, getTopTags, getTopReview } from "@/services/rmpService";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  
  const query = searchParams.get("q") || "";

  useEffect(() => {
    const fetchData = async () => {
      if (!query) return;
      
      setLoading(true);
      try {
        console.log('Searching for:', query);
        
        // Parse the search query
        const parsed = parseSearchQuery(query);
        if (!parsed) {
          toast.error("Invalid search format. Try 'ICS 33' or 'COMPSCI 33'");
          setLoading(false);
          return;
        }
        
        console.log('Parsed:', parsed);
        
        // Fetch course sections from Anteater API (try Winter 2026 first, then Fall 2025)
        let course = await getCourseSections('2026', 'Winter', parsed.department, parsed.courseNumber);
        let quarterText = 'Winter 2026';
        
        // If no results, try Fall 2025
        if (!course || course.sections.length === 0) {
          course = await getCourseSections('2025', 'Fall', parsed.department, parsed.courseNumber);
          quarterText = 'Fall 2025';
        }
        
        if (!course) {
          toast.error(`No results found for ${query}. Try another course.`);
          setLoading(false);
          return;
        }
        
        console.log('Course data:', course);
        setCourseInfo({
          id: `${course.deptCode} ${course.courseNumber}`,
          title: course.courseTitle,
          description: course.courseComment,
          quarter: quarterText
        });
        
        // Process each section with RMP data
        const enrichedSections = await Promise.all(
          course.sections.map(async (section) => {
            const instructor = section.instructors[0];
            
            // Skip if instructor is STAFF or TBA
            if (!instructor || instructor === 'STAFF' || instructor === 'TBA') {
              return {
                name: instructor || 'TBA',
                department: course.deptCode,
                rating: 0,
                difficulty: 0,
                reviewCount: 0,
                grades: { A: 0, B: 0, C: 0, D: 0, F: 0 },
                section: {
                  time: formatMeetingTime(section),
                  seats: {
                    available: section.maxCapacity - section.numCurrentlyEnrolled.totalEnrolled,
                    total: section.maxCapacity,
                  },
                  code: section.sectionCode,
                },
                tags: ['TBA'],
                aiInsight: 'Instructor to be announced.',
              };
            }
            
        // Parallel fetch: grades + RMP data
        const [gradeData, rmpData] = await Promise.all([
          getGradeDistribution(instructor, parsed.courseNumber),
          getRMPData(instructor)
        ]);
        
        const gradePercentages = gradeData ? calculateGradePercentages(gradeData) : null;
        
        // Convert to Professor card format
        const grades = gradePercentages ? {
          A: gradePercentages.aPercent,
          B: gradePercentages.bPercent,
          C: gradePercentages.cPercent,
          D: gradePercentages.dPercent,
          F: gradePercentages.fPercent,
        } : { A: 0, B: 0, C: 0, D: 0, F: 0 };
            
        // Generate AI summary
        let aiInsight = '';
        try {
          aiInsight = await generateProfessorSummary(instructor, gradePercentages);
        } catch (error) {
          console.error('Error generating AI insight:', error);
          aiInsight = `Professor ${instructor} teaches this course. ${gradePercentages ? `Grade distribution: ${gradePercentages.aPercent}% A's, ${gradePercentages.bPercent}% B's.` : 'Historical data unavailable.'}`;
        }
            
            const seatPercent = getSeatAvailabilityPercent(section);
            const almostFull = isAlmostFull(section);
            
        // Build enhanced tags with RMP data
        const enhancedTags = [
          almostFull ? '⚠️ Almost Full' : `${seatPercent}% Full`,
          gradePercentages ? `${gradePercentages.aPercent}% A's` : 'No grades',
          section.meetings[0]?.bldg?.[0] || 'TBA'
        ];
            
            // Add RMP tags if available
            if (rmpData) {
              const rmpTags = getTopTags(rmpData);
              enhancedTags.push(...rmpTags.slice(0, 2)); // Add top 2 RMP tags
            }
            
        return {
          name: instructor,
          department: course.deptCode,
          rating: rmpData?.avgRating || 0,
          difficulty: rmpData?.avgDifficulty || (gradePercentages ? (gradePercentages.fPercent > 20 ? 4.5 : 3.5) : 0),
          reviewCount: rmpData?.numRatings || (gradePercentages ? gradePercentages.totalGrades : 0),
          grades,
              section: {
                time: formatMeetingTime(section),
                seats: {
                  available: section.maxCapacity - section.numCurrentlyEnrolled.totalEnrolled,
                  total: section.maxCapacity,
                },
                code: section.sectionCode,
              },
              tags: enhancedTags,
              aiInsight: rmpData 
                ? `${getRMPSummary(rmpData)}\n\n💬 Top Review: "${getTopReview(rmpData)}"\n\n${aiInsight}`
                : aiInsight,
            };
          })
        );
        
        // Filter out any null results and set
        setProfessors(enrichedSections.filter(p => p !== null) as Professor[]);
        
        toast.success(`Found ${enrichedSections.length} section${enrichedSections.length !== 1 ? 's' : ''} for ${course.courseTitle}`);
        
      } catch (error) {
        console.error('Error fetching search results:', error);
        toast.error("Failed to load course data. Please try again.");
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
                <p className="text-muted-foreground">{professors.length} section{professors.length !== 1 ? 's' : ''} available for {courseInfo.quarter}</p>
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
        {!loading && professors.length === 0 && courseInfo && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-heading font-semibold mb-2">
              No sections available
            </h2>
            <p className="text-muted-foreground mb-6">
              This course may not be offered this quarter. Try searching for another course.
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
