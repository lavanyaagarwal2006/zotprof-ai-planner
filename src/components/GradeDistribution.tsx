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
  const gradeEntries = [
    { grade: "A", percentage: grades.A, color: "bg-success" },
    { grade: "B", percentage: grades.B, color: "bg-primary" },
    { grade: "C", percentage: grades.C, color: "bg-warning" },
    { grade: "D", percentage: grades.D, color: "bg-destructive/70" },
    { grade: "F", percentage: grades.F, color: "bg-destructive" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📊</span>
        <span className="text-sm font-medium">Grade Distribution:</span>
      </div>
      {gradeEntries.map(({ grade, percentage, color }) => (
        <div key={grade} className="flex items-center gap-3">
          <span className="text-sm font-medium w-4">{grade}:</span>
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground w-12 text-right">
            {percentage}%
          </span>
        </div>
      ))}
    </div>
  );
};
