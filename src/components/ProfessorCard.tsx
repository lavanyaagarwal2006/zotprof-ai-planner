import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GradeDistribution } from "./GradeDistribution";
import { MessageCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Professor {
  name: string;
  department: string;
  rating: number;
  difficulty: number;
  reviewCount: number;
  grades: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  section: {
    time: string;
    seats: {
      available: number;
      total: number;
    };
    code: string;
  };
  tags: string[];
  aiInsight: string;
}

interface ProfessorCardProps {
  professor: Professor;
  onViewReviews: () => void;
  onAskAI: () => void;
}

export const ProfessorCard = ({ professor, onViewReviews, onAskAI }: ProfessorCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const seatPercentage = (professor.section.seats.available / professor.section.seats.total) * 100;
  const isAlmostFull = seatPercentage < 10;
  const isFillingFast = seatPercentage < 50 && seatPercentage >= 10;
  const isTopRated = professor.rating >= 4.5;

  const seatStatusColor = isAlmostFull
    ? "text-destructive"
    : isFillingFast
    ? "text-warning"
    : "text-success";

  return (
    <div 
      className={cn(
        "relative bg-background-secondary rounded-2xl p-7 transition-all duration-300 ease-out border border-white/10",
        "hover:-translate-y-2 hover:scale-[1.01]",
        isHovered && "shadow-[0_30px_60px_-15px_rgba(59,130,246,0.4)]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient border on hover */}
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
        "bg-gradient-to-r from-primary via-purple to-accent p-[2px]",
        isHovered && "opacity-100"
      )}>
        <div className="absolute inset-[2px] bg-background-secondary rounded-2xl" />
      </div>

      {/* Floating badges */}
      <div className="absolute -top-3 right-6 flex gap-2 z-10">
        {isTopRated && (
          <div className="px-3 py-1.5 bg-gradient-to-r from-accent to-warning rounded-full flex items-center gap-1.5 shadow-lg animate-pulse-glow">
            <span className="text-xs font-semibold text-accent-foreground">✨ Top Rated</span>
          </div>
        )}
        {isAlmostFull && (
          <div className="px-3 py-1.5 bg-destructive/20 backdrop-blur-sm rounded-full flex items-center gap-1.5 shadow-lg animate-pulse-glow border border-destructive/30">
            <span className="text-xs font-semibold text-destructive">⚠️ Almost Full</span>
          </div>
        )}
      </div>

      {/* Content - relative to show above gradient */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-3xl flex-shrink-0 shadow-lg">
            👨‍🏫
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground mb-1 tracking-tight">{professor.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {professor.department}
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <div className="px-3 py-1.5 bg-primary/20 backdrop-blur-sm rounded-full flex items-center gap-1.5 border border-primary/30">
            <span className="text-lg">⭐</span>
            <span className="text-sm font-semibold text-foreground">{professor.rating.toFixed(1)}/5</span>
          </div>
          <div className="px-3 py-1.5 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
            <span className="text-sm text-muted-foreground">{professor.reviewCount} reviews</span>
          </div>
          <div className="px-3 py-1.5 bg-purple/20 backdrop-blur-sm rounded-full flex items-center gap-1.5 border border-purple/30">
            <span className="text-lg">💪</span>
            <span className="text-sm font-semibold text-foreground">{professor.difficulty.toFixed(1)}/5</span>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">Grade Distribution</h4>
          <GradeDistribution grades={professor.grades} />
        </div>

        {/* Section Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">📅</span>
              <span className="text-foreground font-medium">{professor.section.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">📍</span>
              <code className="text-foreground font-mono font-semibold">{professor.section.code}</code>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground">Seats</span>
                <span className={cn("font-semibold tabular-nums", seatStatusColor)}>
                  {professor.section.seats.available}/{professor.section.seats.total}
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isAlmostFull && "bg-gradient-to-r from-destructive to-red-400",
                    isFillingFast && "bg-gradient-to-r from-warning to-orange-400",
                    !isAlmostFull && !isFillingFast && "bg-gradient-to-r from-success to-green-400"
                  )}
                  style={{ width: `${100 - seatPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {professor.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-purple/10 backdrop-blur-sm text-primary text-xs font-medium rounded-full border border-primary/20 hover:border-primary/40 transition-colors duration-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* AI Insight */}
        <div className="mb-6 p-4 bg-gradient-to-r from-accent/5 to-warning/5 backdrop-blur-sm rounded-xl border-l-4 border-accent">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🤖</span>
            <div>
              <h4 className="text-sm font-semibold text-accent mb-2">AI Insight</h4>
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                {professor.aiInsight}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onViewReviews}
            className="flex-1 border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
          >
            <ExternalLink className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
            View Reviews
          </Button>
          <Button
            onClick={onAskAI}
            className="flex-1 bg-gradient-to-r from-primary to-purple hover:from-primary/90 hover:to-purple/90 shadow-[0_10px_30px_-10px_rgba(59,130,246,0.4)] hover:shadow-[0_15px_40px_-10px_rgba(59,130,246,0.6)] transition-all duration-300 group"
          >
            <MessageCircle className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
            Help Me Choose
          </Button>
        </div>
      </div>
    </div>
  );
};
