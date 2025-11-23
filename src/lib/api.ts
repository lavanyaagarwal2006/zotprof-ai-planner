import { supabase } from "@/integrations/supabase/client";

export interface SearchIntent {
  type: "class" | "professor" | "recommendation";
  department?: string | null;
  courseNumber?: string | null;
  term?: string | null;
  professorName?: string | null;
  intent?: "search" | "comparison" | "recommendation";
  filters?: {
    easyGrading?: boolean;
    highRating?: boolean;
    lowDifficulty?: boolean;
  };
}

export interface CourseData {
  course: any;
  sections: any[];
  instructors: any[];
  grades: Record<string, any>;
}

export interface ProfessorData {
  peterData: any;
  rmpData: any;
  rmpReviews: any[];
  coursesTaught: string[];
  gradesData: any[];
  redditMentions: any[];
}

export interface AISummary {
  summary: string;
}

/**
 * Parse natural language search query using AI
 */
export async function parseSearchIntent(query: string): Promise<SearchIntent> {
  const { data, error } = await supabase.functions.invoke('search-intent', {
    body: { query }
  });

  if (error) {
    console.error('Error parsing search intent:', error);
    throw new Error('Failed to parse search query');
  }

  return data as SearchIntent;
}

/**
 * Fetch course data from PeterAPI
 */
export async function fetchCourseData(
  department: string,
  courseNumber: string,
  term?: string
): Promise<CourseData> {
  const { data, error } = await supabase.functions.invoke('fetch-course-data', {
    body: { department, courseNumber, term }
  });

  if (error) {
    console.error('Error fetching course data:', error);
    throw new Error('Failed to fetch course data');
  }

  return data as CourseData;
}

/**
 * Fetch professor data from multiple sources
 */
export async function fetchProfessorData(professorName: string): Promise<ProfessorData> {
  const { data, error } = await supabase.functions.invoke('fetch-professor-data', {
    body: { professorName }
  });

  if (error) {
    console.error('Error fetching professor data:', error);
    throw new Error('Failed to fetch professor data');
  }

  return data as ProfessorData;
}

/**
 * Generate AI summary
 */
export async function generateAISummary(
  type: 'professor-summary' | 'course-recommendation' | 'professor-insight',
  data: any
): Promise<AISummary> {
  const { data: summaryData, error } = await supabase.functions.invoke('generate-ai-summary', {
    body: { type, data }
  });

  if (error) {
    console.error('Error generating AI summary:', error);
    throw new Error('Failed to generate AI summary');
  }

  return summaryData as AISummary;
}
