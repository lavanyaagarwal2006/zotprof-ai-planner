import { supabase } from "@/integrations/supabase/client";

export interface StudentContext {
  quarter: string;
  courses: string[];
  goals: string;
  preferences: string;
}

export interface ProfessorOption {
  name: string;
  section: any;
  grades: any;
  meetingTime: string;
  seats: string;
}

/**
 * Generate AI comparison and recommendation for chat mode
 * Uses Lovable AI through edge functions
 */
export async function analyzeProfessorOptions(
  studentContext: StudentContext,
  professorData: ProfessorOption[]
): Promise<string> {
  const prompt = `You are ZotProf AI, a friendly UCI academic advisor helping students choose professors.

STUDENT CONTEXT:
- Quarter: ${studentContext.quarter}
- Courses needed: ${studentContext.courses.join(', ')}
- Goals: ${studentContext.goals}
- Preferences: ${studentContext.preferences}

PROFESSOR OPTIONS:
${professorData.map((prof, i) => `
Option ${i + 1}: ${prof.name}
- Section Code: ${prof.section.sectionCode}
- Schedule: ${prof.meetingTime}
- Seats: ${prof.seats}
- Grade Distribution: ${prof.grades ? `${prof.grades.aPercent}% A's, ${prof.grades.bPercent}% B's, ${prof.grades.cPercent}% C's` : 'No historical data available'}
`).join('\n')}

Provide a conversational analysis comparing these professors. Your response should:
1. Compare all options briefly (2-3 sentences)
2. Make a specific recommendation based on the student's goals
3. Highlight key insights from the grade data and availability
4. Give practical advice about seat urgency or registration

Be friendly and use emojis sparingly (📚 🎯 ⚠️). Keep it concise (250-350 words).
Format your response naturally for a chat conversation.`;

  try {
    const { data, error } = await supabase.functions.invoke('generate-ai-summary', {
      body: {
        type: 'course-recommendation',
        data: {
          course: studentContext.courses[0] || 'Requested course',
          professors: professorData.map(p => ({
            name: p.name,
            rmpData: {
              avgRating: 0,
              avgDifficulty: 0,
              wouldTakeAgainPercent: 0
            },
            topTags: [],
            sections: [p.section],
            grades: p.grades
          })),
          userProfile: {
            goals: studentContext.goals,
            preferences: studentContext.preferences
          }
        }
      }
    });

    if (error) throw error;
    
    return data.summary || "I'm having trouble analyzing the data right now. But here's what I can see: " + 
           professorData.map(p => `${p.name} (${p.meetingTime}, ${p.seats})`).join(', ');
    
  } catch (error) {
    console.error('AI analysis error:', error);
    return "I'm having trouble analyzing the data right now. But here's what I can see: " + 
           professorData.map(p => `${p.name} (${p.meetingTime}, ${p.seats})`).join(', ');
  }
}

/**
 * Generate quick AI summary for search results
 */
export async function generateProfessorSummary(
  professorName: string,
  grades: any
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-ai-summary', {
      body: {
        type: 'professor-insight',
        data: {
          name: professorName,
          rmpData: {
            avgRating: 0,
            avgDifficulty: grades ? (grades.fPercent > 20 ? 4 : 3) : 0
          },
          reviews: [],
          grades: grades
        }
      }
    });

    if (error) throw error;
    
    return data.summary || `Professor ${professorName} teaches this course. ${grades ? `Historical grade distribution shows ${grades.aPercent}% A's and ${grades.bPercent}% B's.` : 'Limited data available.'}`;
    
  } catch (error) {
    console.error('Summary generation error:', error);
    return `Professor ${professorName} teaches this course. ${grades ? `Historical grade distribution shows ${grades.aPercent}% A's and ${grades.bPercent}% B's.` : 'Limited data available.'}`;
  }
}

/**
 * Handle chat conversation flow
 */
export async function chatWithAI(
  conversationHistory: Array<{role: string, content: string}>,
  userMessage: string
): Promise<string> {
  const systemPrompt = `You are ZotProf AI, a friendly UCI academic advisor chatbot. 

Help students plan their course schedules by:
- Asking what quarter they're planning for
- Finding out which courses they need
- Understanding their goals (GPA, learning, balance)
- Providing personalized recommendations

Be conversational, friendly, and use emojis occasionally. Keep responses concise (3-5 sentences per message).`;

  try {
    // Build conversation history for the API
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    // Note: This would need a dedicated edge function for chat
    // For now, using generate-ai-summary with a special type
    const { data, error } = await supabase.functions.invoke('generate-ai-summary', {
      body: {
        type: 'chat-response',
        data: {
          messages: messages,
          userMessage: userMessage
        }
      }
    });

    if (error) throw error;
    
    return data.summary || "I'm having trouble connecting right now. Could you try rephrasing that?";
    
  } catch (error) {
    console.error('Chat error:', error);
    return "I'm having trouble connecting right now. Could you try rephrasing that?";
  }
}
