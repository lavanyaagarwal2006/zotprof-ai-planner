const ANTEATER_BASE_URL = 'https://anteaterapi.com/v2/rest';

// Type definitions
export interface Meeting {
  days: string;
  time: string;
  bldg: string[];
}

export interface Section {
  sectionCode: string;
  sectionType: string;
  sectionNum: string;
  units: string;
  instructors: string[];
  meetings: Meeting[];
  finalExam: string;
  maxCapacity: number;
  numCurrentlyEnrolled: {
    totalEnrolled: number;
    sectionEnrolled: number;
  };
  numOnWaitlist: number;
  numWaitlistCap: number;
  numRequested: number;
  numNewOnlyReserved: number;
  restrictions: string;
  status: string;
  sectionComment: string;
}

export interface Course {
  deptCode: string;
  courseNumber: string;
  courseTitle: string;
  courseComment: string;
  prerequisiteLink: string;
  sections: Section[];
}

export interface GradeData {
  year: string;
  quarter: string;
  instructor: string;
  department: string;
  courseNumber: string;
  sectionCode: string;
  gradeACount: number;
  gradeBCount: number;
  gradeCCount: number;
  gradeDCount: number;
  gradeFCount: number;
  gradePCount: number;
  gradeNPCount: number;
  gradeWCount: number;
}

export interface GradePercentages {
  aPercent: number;
  bPercent: number;
  cPercent: number;
  dPercent: number;
  fPercent: number;
  totalGrades: number;
}

// Function 1: Get course sections for a specific quarter
export async function getCourseSections(
  year: string,
  quarter: string,
  department: string,
  courseNumber: string
): Promise<Course | null> {
  try {
    const params = new URLSearchParams({
      year: year,
      quarter: quarter,
      department: department.toUpperCase(),
      courseNumber: courseNumber
    });

    const response = await fetch(`${ANTEATER_BASE_URL}/websoc?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    
    // Navigate nested structure: schools > departments > courses
    if (result.data?.schools?.length > 0) {
      for (const school of result.data.schools) {
        for (const dept of school.departments) {
          for (const course of dept.courses) {
            if (course.courseNumber === courseNumber) {
              return course as Course;
            }
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Anteater API error:', error);
    throw error;
  }
}

// Function 2: Get grade distribution for instructor
export async function getGradeDistribution(
  instructor: string,
  courseNumber: string
): Promise<GradeData[] | null> {
  try {
    // Extract last name and uppercase
    const instructorLastName = instructor.split(' ').pop()?.toUpperCase() || instructor.toUpperCase();
    
    const params = new URLSearchParams({
      instructor: instructorLastName,
      courseNumber: courseNumber
    });

    const response = await fetch(`${ANTEATER_BASE_URL}/grades/aggregate?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Grades API error: ${response.status}`);
    }

    const result = await response.json();
    
    // API response structure: { ok: true, data: { sectionList: [...], gradeDistribution: {...} } }
    if (result.ok && result.data?.sectionList?.length > 0) {
      // Convert the sectionList to GradeData format for compatibility
      return result.data.sectionList.map((section: any) => ({
        year: section.year,
        quarter: section.quarter,
        instructor: section.instructors[0] || instructor,
        department: section.department,
        courseNumber: section.courseNumber,
        sectionCode: section.sectionCode,
        // Use the aggregated grade distribution from the API
        gradeACount: result.data.gradeDistribution.gradeACount,
        gradeBCount: result.data.gradeDistribution.gradeBCount,
        gradeCCount: result.data.gradeDistribution.gradeCCount,
        gradeDCount: result.data.gradeDistribution.gradeDCount,
        gradeFCount: result.data.gradeDistribution.gradeFCount,
        gradePCount: result.data.gradeDistribution.gradePCount,
        gradeNPCount: result.data.gradeDistribution.gradeNPCount,
        gradeWCount: result.data.gradeDistribution.gradeWCount,
      })) as GradeData[];
    }
    
    return null;
  } catch (error) {
    console.error('Grade fetch error:', error);
    return null;
  }
}

// Function 3: Calculate grade percentages
export function calculateGradePercentages(gradeData: GradeData[]): GradePercentages | null {
  if (!gradeData || gradeData.length === 0) return null;
  
  const totals = gradeData.reduce(
    (acc, record) => ({
      gradeACount: acc.gradeACount + record.gradeACount,
      gradeBCount: acc.gradeBCount + record.gradeBCount,
      gradeCCount: acc.gradeCCount + record.gradeCCount,
      gradeDCount: acc.gradeDCount + record.gradeDCount,
      gradeFCount: acc.gradeFCount + record.gradeFCount,
    }),
    {
      gradeACount: 0,
      gradeBCount: 0,
      gradeCCount: 0,
      gradeDCount: 0,
      gradeFCount: 0,
    }
  );
  
  const total = totals.gradeACount + totals.gradeBCount + totals.gradeCCount + 
                totals.gradeDCount + totals.gradeFCount;
  
  if (total === 0) return null;
  
  return {
    aPercent: Math.round((totals.gradeACount / total) * 100),
    bPercent: Math.round((totals.gradeBCount / total) * 100),
    cPercent: Math.round((totals.gradeCCount / total) * 100),
    dPercent: Math.round((totals.gradeDCount / total) * 100),
    fPercent: Math.round((totals.gradeFCount / total) * 100),
    totalGrades: total,
  };
}

// Utility: Get seat availability percent
export function getSeatAvailabilityPercent(section: Section): number {
  const enrolled = section.numCurrentlyEnrolled.totalEnrolled;
  const capacity = section.maxCapacity;
  return Math.round((enrolled / capacity) * 100);
}

// Utility: Check if section is almost full
export function isAlmostFull(section: Section): boolean {
  return getSeatAvailabilityPercent(section) > 80;
}

// Utility: Format meeting times
export function formatMeetingTime(section: Section): string {
  if (!section.meetings || section.meetings.length === 0) {
    return 'TBA';
  }
  const meeting = section.meetings[0];
  return `${meeting.days} ${meeting.time}`;
}

// Utility: Parse search queries like "ICS 33" or "COMPSCI 33"
export function parseSearchQuery(query: string): { department: string; courseNumber: string } | null {
  const cleaned = query.trim().toUpperCase();
  const match = cleaned.match(/([A-Z&\s]+?)\s*(\d+[A-Z]*)/);
  
  if (!match) return null;
  
  let department = match[1].trim();
  const courseNumber = match[2];
  
  // Handle common aliases
  const deptAliases: Record<string, string> = {
    'ICS': 'COMPSCI',
    'I&C SCI': 'IN4MATX',
  };
  
  department = deptAliases[department] || department;
  
  return { department, courseNumber };
}
