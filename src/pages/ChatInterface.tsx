import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-16 z-40">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <span className="text-lg font-heading font-semibold">
                ZotProf AI Advisor
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSwitchToSearch}
              className="text-sm"
            >
              🔍 Switch to Search
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-[800px]">
          <div className="space-y-6">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-xl p-4 whitespace-pre-wrap",
                    message.role === "user"
                      ? "bg-accent/20 border border-accent text-foreground ml-auto rounded-br-sm"
                      : "bg-primary/20 border border-primary text-foreground mr-auto rounded-bl-sm"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">🤖</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-primary/20 border border-primary rounded-xl rounded-bl-sm p-4 max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🤖</span>
                    <span className="text-sm text-muted-foreground">
                      ZotProf is analyzing...
                    </span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input Area */}
      <div className="border-t border-border bg-card/95 backdrop-blur-sm sticky bottom-0">
        <div className="container mx-auto px-4 md:px-8 py-4 max-w-[800px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your response..."
              className="h-14 bg-background"
              disabled={isTyping}
            />
            <Button
              type="submit"
              size="lg"
              disabled={!input.trim() || isTyping}
              className="px-6"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {["Winter 2025", "Spring 2025", "ICS courses", "High GPA"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1 bg-secondary text-sm rounded-full hover:bg-secondary/80 transition-colors"
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
