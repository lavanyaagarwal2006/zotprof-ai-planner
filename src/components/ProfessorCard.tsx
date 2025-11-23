import { Button } from "@/components/ui/button";
import { GradeDistribution } from "./GradeDistribution";
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
  const seatPercentage = (professor.section.seats.available / professor.section.seats.total) * 100;
  const isAlmostFull = seatPercentage < 10;
  const isFillingFast = seatPercentage < 50 && seatPercentage >= 10;
  const isMostlyAvailable = seatPercentage >= 50;

  const seatStatusColor = isAlmostFull
    ? "text-destructive"
    : isFillingFast
    ? "text-warning"
    : "text-success";

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover-lift card-glow transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👨‍🏫</span>
          <div>
            <h3 className="text-xl font-heading font-semibold">{professor.name}</h3>
            <p className="text-sm text-muted-foreground">{professor.department}</p>
          </div>
        </div>
        {isAlmostFull && (
          <div className="flex items-center gap-2 px-3 py-1 bg-destructive/20 rounded-full animate-pulse">
            <span className="text-destructive text-xs font-medium">⚠️ Almost Full!</span>
          </div>
        )}
      </div>

      {/* Ratings */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1">
          <span>⭐</span>
          <span className="font-medium">{professor.rating.toFixed(1)}/5</span>
          <span className="text-muted-foreground">({professor.reviewCount} reviews)</span>
        </div>
        <div className="flex items-center gap-1">
          <span>💪</span>
          <span className="font-medium">{professor.difficulty.toFixed(1)}/5</span>
          <span className="text-muted-foreground">difficulty</span>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="mb-4">
        <GradeDistribution grades={professor.grades} />
      </div>

      {/* Section Info */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span>📅</span>
          <span className="text-muted-foreground">Section:</span>
          <span className="font-medium">{professor.section.time}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🪑</span>
          <span className="text-muted-foreground">Seats:</span>
          <span className={cn("font-medium", seatStatusColor)}>
            {professor.section.seats.available}/{professor.section.seats.total} available
          </span>
          <span className="text-muted-foreground">
            ({seatPercentage.toFixed(0)}% full)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>📍</span>
          <span className="text-muted-foreground">Code:</span>
          <span className="font-mono font-medium">{professor.section.code}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span>🏷️</span>
          <span className="text-sm font-medium">Top Tags:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {professor.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* AI Insight */}
      <div className="mb-4 p-4 bg-secondary/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span>🤖</span>
          <span className="text-sm font-medium">AI Insight:</span>
        </div>
        <p className="text-sm text-muted-foreground italic leading-relaxed">
          {professor.aiInsight}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onViewReviews}
          className="flex-1"
        >
          View Full Reviews
        </Button>
        <Button
          onClick={onAskAI}
          className="flex-1"
        >
          💬 Help Me Choose
        </Button>
      </div>
    </div>
  );
};
