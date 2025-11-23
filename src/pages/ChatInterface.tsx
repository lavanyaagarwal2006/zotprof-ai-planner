import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  parseSearchQuery,
  getCourseSections,
  getGradeDistribution,
  calculateGradePercentages,
  formatMeetingTime,
  getSeatAvailabilityPercent
} from '@/services/anteaterAPI';
import { getRMPData, getRMPSummary, getTopTags } from '@/services/rmpService';
import { analyzeProfessorOptions, ProfessorOption } from '@/services/aiService';

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationState {
  stage: 'greeting' | 'collect-quarter' | 'collect-courses' | 'collect-goals' | 'analyzing' | 'done';
  quarter: string;
  year: string;
  courses: string[];
  goals: string;
  analyzedData: any[];
}

const ChatInterface = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm your ZotProf AI advisor. Let's build your perfect schedule!\n\nWhat quarter are you planning for? (e.g., Winter 2026, Spring 2026)"
    }
  ]);
  
  const [state, setState] = useState<ConversationState>({
    stage: 'collect-quarter',
    quarter: '',
    year: '',
    courses: [],
    goals: '',
    analyzedData: []
  });
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const context = searchParams.get("context");

  useEffect(() => {
    // Initialize with context if provided
    if (context) {
      setMessages([{
        role: 'assistant',
        content: `I see you were searching for ${context}. Let's help you build your perfect schedule around this course!\n\nWhat quarter are you planning for? (e.g., Winter 2026, Spring 2026)`
      }]);
    }
  }, [context]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Extract quarter from message
  function extractQuarter(msg: string): { quarter: string; year: string } | null {
    const lower = msg.toLowerCase();
    const match = lower.match(/(winter|spring|summer|fall)\s*(20)?(\d{2})/);
    
    if (match) {
      const quarter = match[1].charAt(0).toUpperCase() + match[1].slice(1);
      const year = match[2] ? match[2] + match[3] : '20' + match[3];
      return { quarter, year };
    }
    return null;
  }
  
  // Extract courses from message
  function extractCourses(msg: string): string[] {
    const courses: string[] = [];
    const matches = msg.matchAll(/([A-Z&\s]+?)\s*(\d+[A-Z]*)/gi);
    
    for (const match of matches) {
      courses.push(`${match[1].trim()} ${match[2]}`);
    }
    return courses;
  }

  // Main analysis function
  async function analyzeCoursesWithData() {
    const allData: ProfessorOption[] = [];
    
    for (const courseName of state.courses) {
      const parsed = parseSearchQuery(courseName);
      if (!parsed) continue;
      
      try {
        const course = await getCourseSections(
          state.year,
          state.quarter,
          parsed.department,
          parsed.courseNumber
        );
        
        if (!course) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `⚠️ ${courseName} not found for ${state.quarter} ${state.year}`
          }]);
          continue;
        }
        
        // Process each section
        for (const section of course.sections) {
          const instructor = section.instructors[0];
          if (instructor === 'STAFF') continue;
          
          const [gradeData, rmpData] = await Promise.all([
            getGradeDistribution(instructor, parsed.courseNumber),
            getRMPData(instructor)
          ]);
          
          const grades = gradeData ? calculateGradePercentages(gradeData) : null;
          
          allData.push({
            courseName: `${parsed.department} ${parsed.courseNumber}`,
            courseTitle: course.courseTitle,
            name: instructor,
            section: section,
            grades: grades,
            rmpData: rmpData,
            rmpSummary: getRMPSummary(rmpData),
            topTags: getTopTags(rmpData),
            meetingTime: formatMeetingTime(section),
            seats: `${section.numCurrentlyEnrolled.totalEnrolled}/${section.maxCapacity}`,
            seatPercent: getSeatAvailabilityPercent(section)
          });
        }
      } catch (error) {
        console.error(`Error analyzing ${courseName}:`, error);
      }
    }
    
    if (allData.length === 0) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Couldn't find available sections. They might not be offered this quarter."
      }]);
      setState(prev => ({ ...prev, stage: 'done' }));
      return;
    }
    
    // Group by course
    const grouped = allData.reduce((acc, item) => {
      const key = item.courseName || 'Unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, ProfessorOption[]>);
    
    // Generate recommendations for each course
    for (const [courseName, professors] of Object.entries(grouped)) {
      try {
        const recommendation = await analyzeProfessorOptions(
          {
            quarter: `${state.quarter} ${state.year}`,
            courses: state.courses,
            goals: state.goals,
            preferences: ''
          },
          professors
        );
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `📚 **${courseName} - ${professors[0].courseTitle}**\n\n${recommendation}`
        }]);
      } catch (error) {
        console.error('Error generating recommendation:', error);
        // Show basic info if AI fails
        const profList = professors.map((p: ProfessorOption) => 
          `• ${p.name} - ${p.meetingTime} | ${p.rmpSummary || 'No RMP data'}`
        ).join('\n');
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `📚 **${courseName}**\n\nAvailable professors:\n${profList}`
        }]);
      }
    }
    
    // Final message
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: "Those are your best options! Need help deciding on specific professors?"
    }]);
    
    setState(prev => ({ ...prev, stage: 'done', analyzedData: allData }));
  }

  // Process message based on conversation stage
  async function processMessage(userMsg: string) {
    let response = '';
    
    switch (state.stage) {
      case 'collect-quarter':
        const quarterInfo = extractQuarter(userMsg);
        if (quarterInfo) {
          setState(prev => ({ 
            ...prev, 
            quarter: quarterInfo.quarter,
            year: quarterInfo.year,
            stage: 'collect-courses' 
          }));
          response = `Perfect! Planning for ${quarterInfo.quarter} ${quarterInfo.year}. 📚\n\nWhat courses do you need to take?\n\n(List them like: ICS 33, MATH 3A, WRITING 39B)`;
        } else {
          response = "I didn't catch that quarter. Please specify like 'Winter 2026' or 'Spring 2026'.";
        }
        break;
        
      case 'collect-courses':
        const courses = extractCourses(userMsg);
        if (courses.length > 0) {
          setState(prev => ({ 
            ...prev, 
            courses,
            stage: 'collect-goals' 
          }));
          response = `Got it! You need:\n${courses.map(c => `• ${c}`).join('\n')}\n\nWhat matters most to you this quarter?\n\n• High GPA\n• Deep learning\n• Balanced approach\n• Light workload`;
        } else {
          response = "I couldn't find courses in that message. Try: ICS 33, MATH 3A";
        }
        break;
        
      case 'collect-goals':
        setState(prev => ({ ...prev, goals: userMsg, stage: 'analyzing' }));
        response = `Perfect! Focusing on: ${userMsg}\n\n🔍 Analyzing your options for ${state.quarter} ${state.year}...\n\nThis may take a moment...`;
        
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        
        // Start analysis
        await analyzeCoursesWithData();
        return; // Exit early - analysis adds its own messages
        
      case 'done':
        // Free-form conversation after analysis
        response = "I can help you compare specific professors or explore other courses. What would you like to know?";
        break;
        
      default:
        response = "Let's start over. What quarter are you planning for?";
        setState(prev => ({ ...prev, stage: 'collect-quarter' }));
    }
    
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput("");
    
    // Add user message
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      await processMessage(userMsg);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error("Sorry, I ran into an issue. Could you try rephrasing that?");
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I ran into an issue. Could you try rephrasing that?'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSwitchToSearch = () => {
    navigate("/");
  };

  const quickActions = [
    "Winter 2026",
    "ICS 33",
    "High GPA",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Top Navigation */}
      <div className="glassmorphic border-b border-white/10 sticky top-16 z-40">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <span className="text-lg font-bold gradient-text-primary tracking-tight">
                AI Academic Advisor
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSwitchToSearch}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              <Search className="h-4 w-4 mr-2" />
              Search Mode
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 container mx-auto px-4 md:px-8 py-8 max-w-4xl overflow-y-auto">
        <div className="space-y-6">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-4 animate-fade-in",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🤖</span>
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-6 py-4 shadow-lg",
                  message.role === "user"
                    ? "bg-gradient-to-r from-primary to-purple text-white"
                    : "bg-background-secondary border border-white/10 text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>

              {message.role === "user" && (
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">👤</span>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-4 animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🤖</span>
              </div>
              <div className="bg-background-secondary border border-white/10 rounded-2xl px-6 py-4 shadow-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="glassmorphic border-t border-white/10 sticky bottom-0">
        <div className="container mx-auto px-4 md:px-8 py-6 max-w-4xl">
          {/* Quick Actions (only show at start of conversation) */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(action)}
                  className="px-4 py-2 text-sm rounded-full bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all duration-300 border border-white/10"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-purple to-accent rounded-3xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 blur transition duration-300" />
            
            <div className="relative bg-background-secondary rounded-3xl border-2 border-white/10 group-focus-within:border-transparent transition-all duration-300 shadow-lg">
              <div className="flex items-end gap-3 px-6 py-4">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your response..."
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none text-foreground text-base placeholder:text-muted-foreground resize-none max-h-32"
                  style={{ minHeight: '24px' }}
                  disabled={isTyping}
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isTyping}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-purple text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
