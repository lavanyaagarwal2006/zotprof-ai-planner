import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";
import { chatWithAI } from "@/services/aiService";
import { toast } from "sonner";

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

    try {
      // Get AI response using our service
      const aiResponse = await chatWithAI(messages, input);
      
      const aiMessage: Message = {
        role: "assistant",
        content: aiResponse,
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error("Sorry, I'm having trouble responding. Please try again.");
      
      // Add a fallback response
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting right now. Could you try rephrasing that?"
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
    "Winter 2025",
    "ICS 33",
    "Best for GPA",
    "Easy A courses"
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

          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-purple to-accent rounded-3xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 blur transition duration-300" />
            
            <div className="relative bg-background-secondary rounded-3xl border-2 border-white/10 group-focus-within:border-transparent transition-all duration-300 shadow-lg">
              <div className="flex items-end gap-3 px-6 py-4">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about courses, professors, or your schedule..."
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none text-foreground text-base placeholder:text-muted-foreground resize-none max-h-32"
                  style={{ minHeight: '24px' }}
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
