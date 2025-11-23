import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Send, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatInterface = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const context = searchParams.get("context");
  const professor = searchParams.get("professor");
  const course = searchParams.get("course");

  useEffect(() => {
    // Initialize conversation
    let initialMessage = "Hi! 👋 I'm your ZotProf AI advisor. Let's build your perfect schedule!\n\nWhat quarter are you planning for?";
    
    if (context) {
      initialMessage = `I see you were searching for ${context}. Let me help you choose the best professor for this course!\n\nWhat quarter are you planning for?`;
    } else if (professor && course) {
      initialMessage = `I see you're interested in ${professor} for ${course}. Let me help you decide if this is the right fit!\n\nWhat quarter are you planning for?`;
    }

    setMessages([{ role: "assistant", content: initialMessage }]);
  }, [context, professor, course]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response (will be replaced with actual API call)
    setTimeout(() => {
      const responses = [
        "Great! Let me check who's teaching those courses for Winter 2025...",
        "I found your options! Let me break down each course:\n\n📚 ICS 33 has 3 professors available. Which section time works best for your schedule?",
        "Based on your goals, I recommend Professor Pattis for ICS 33. They have a generous curve and clear lectures. Would you like to add this to your schedule?",
      ];
      
      const aiMessage: Message = {
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSwitchToSearch = () => {
    navigate("/");
  };

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

      {/* Messages Container */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-[900px]">
          <div className="space-y-6">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-3 animate-fade-in",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {/* Bot Avatar */}
                {message.role === "assistant" && (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-2xl">🤖</span>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl p-5 whitespace-pre-wrap transition-all duration-300",
                    message.role === "user"
                      ? "bg-gradient-to-r from-primary to-purple text-white rounded-tr-sm shadow-[0_10px_30px_-10px_rgba(59,130,246,0.4)]"
                      : "bg-background-secondary border border-white/10 text-foreground rounded-tl-sm shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)]"
                  )}
                >
                  <p className="text-base leading-relaxed">{message.content}</p>
                  
                  {/* Timestamp */}
                  <div className={cn(
                    "text-xs mt-2",
                    message.role === "user" ? "text-white/70" : "text-muted-foreground"
                  )}>
                    Just now
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-2xl">🤖</span>
                </div>
                <div className="bg-background-secondary border border-white/10 rounded-2xl rounded-tl-sm p-5 max-w-[75%] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">
                      Analyzing your options...
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-purple rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input Area */}
      <div className="glassmorphic border-t border-white/10 sticky bottom-0">
        <div className="container mx-auto px-4 md:px-8 py-6 max-w-[900px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-purple to-accent rounded-3xl opacity-0 group-focus-within:opacity-100 blur transition duration-300" />
              
              <div className="relative bg-background-secondary rounded-3xl border-2 border-white/10 group-focus-within:border-transparent transition-all duration-300 p-4 flex items-end gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask me anything about courses, professors, or your schedule..."
                  className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[24px] max-h-[120px]"
                  disabled={isTyping}
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-purple text-white flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </form>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {["Winter 2025", "Spring 2025", "ICS courses", "High GPA Focus"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-2 bg-white/5 backdrop-blur-sm text-sm rounded-full border border-white/10 hover:bg-primary/20 hover:border-primary/30 transition-all duration-300 text-muted-foreground hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
