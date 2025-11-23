import { useEffect, useState } from "react";

interface GradeDistributionProps {
  grades: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
}

export const GradeDistribution = ({ grades }: GradeDistributionProps) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const gradeData = [
    { grade: "A", percentage: grades.A, color: "from-primary to-blue-400", delay: "delay-0" },
    { grade: "B", percentage: grades.B, color: "from-purple to-purple-400", delay: "delay-75" },
    { grade: "C", percentage: grades.C, color: "from-accent to-yellow-400", delay: "delay-150" },
    { grade: "D", percentage: grades.D, color: "from-warning to-orange-400", delay: "delay-225" },
    { grade: "F", percentage: grades.F, color: "from-destructive to-red-400", delay: "delay-300" },
  ];

  return (
    <div className="space-y-2.5">
      {gradeData.map(({ grade, percentage, color, delay }) => (
        <div key={grade} className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground w-4">{grade}</span>
          <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700 ease-out ${delay} shadow-lg`}
              style={{
                width: animate ? `${percentage}%` : "0%",
              }}
            />
          </div>
          <span className="text-sm font-semibold text-muted-foreground w-10 text-right tabular-nums">
            {percentage}%
          </span>
        </div>
      ))}
    </div>
  );
};
