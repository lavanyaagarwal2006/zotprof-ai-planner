import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    
    if (!type || !data) {
      return new Response(JSON.stringify({ error: 'Type and data are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let prompt = '';
    
    if (type === 'professor-summary') {
      // Generate comprehensive professor summary
      const { professorData, rmpData, reviews, grades, redditMentions } = data;
      
      prompt = `You are an academic advisor helping UCI students choose professors. Generate a comprehensive, honest, and balanced summary.

PROFESSOR: ${professorData?.name || 'Unknown'}
DEPARTMENT: ${professorData?.department || rmpData?.department || 'Unknown'}

RATEMYPROFESSOR DATA:
- Rating: ${rmpData?.avgRating || 'N/A'}/5 (${rmpData?.numRatings || 0} ratings)
- Difficulty: ${rmpData?.avgDifficulty || 'N/A'}/5
- Would Take Again: ${rmpData?.wouldTakeAgainPercent || 'N/A'}%

RECENT REVIEWS (Top 10):
${reviews?.slice(0, 10).map((r: any) => `- "${r.comment}" (${r.rating}/5, ${r.class || 'Unknown Course'})`).join('\n') || 'No reviews available'}

GRADE DISTRIBUTIONS:
${grades?.map((g: any) => {
  const totalStudents = g.grades.reduce((sum: number, grade: any) => sum + (grade.gradeACount || 0) + (grade.gradeBCount || 0) + (grade.gradeCCount || 0) + (grade.gradeDCount || 0) + (grade.gradeFCount || 0), 0);
  return `${g.course}: ${totalStudents} students`;
}).join('\n') || 'No grade data available'}

REDDIT MENTIONS:
${redditMentions?.slice(0, 5).map((r: any) => `- "${r.title}": ${r.text.slice(0, 150)}...`).join('\n') || 'No Reddit mentions found'}

Generate a 2-3 paragraph summary (200-300 words) that:
1. First paragraph: Overall teaching style and what students should expect
2. Second paragraph: Specific strengths and potential challenges based on actual student feedback
3. Third paragraph: Who this professor is best suited for (be specific about student profiles)

Be balanced, honest, and quote actual patterns from reviews. Use a conversational but professional tone.`;
    } else if (type === 'course-recommendation') {
      // Generate recommendation for choosing between professors
      const { course, professors, userProfile } = data;
      
      const professorsInfo = professors.map((p: any) => `
${p.name}:
- Rating: ${p.rmpData?.avgRating || 'N/A'}/5
- Difficulty: ${p.rmpData?.avgDifficulty || 'N/A'}/5
- Would Take Again: ${p.rmpData?.wouldTakeAgainPercent || 'N/A'}%
- Key review themes: ${p.topTags?.join(', ') || 'Not enough data'}
- Sections: ${p.sections?.map((s: any) => `${s.sectionCode} (${s.meetings?.[0]?.days || 'TBA'} ${s.meetings?.[0]?.time || 'TBA'})`).join(', ') || 'No sections'}
`).join('\n');

      prompt = `You are advising a UCI student on professor selection.

COURSE: ${course}

${userProfile ? `STUDENT PROFILE:
- Major: ${userProfile.major || 'Not specified'}
- Year: ${userProfile.year || 'Not specified'}
- Priorities: ${userProfile.priorities?.join(', ') || 'Not specified'}` : 'Student profile not provided'}

PROFESSOR OPTIONS:
${professorsInfo}

Recommend the best professor for this specific student. In 2-3 sentences, explain:
1. Which professor you recommend
2. Why they're the best fit based on the data
3. One specific piece of advice

Be direct, actionable, and honest. Don't oversell - mention trade-offs if relevant.`;
    } else if (type === 'professor-insight') {
      // Generate short insight for professor card
      const { name, rmpData, reviews } = data;
      
      prompt = `Generate a 1-2 sentence insight about Professor ${name} for UCI students.

RATING: ${rmpData?.avgRating || 'N/A'}/5
DIFFICULTY: ${rmpData?.avgDifficulty || 'N/A'}/5

TOP REVIEWS:
${reviews?.slice(0, 5).map((r: any) => `- "${r.comment}"`).join('\n') || 'No reviews'}

Create an honest, specific insight that captures their teaching style. Be concise and actionable (max 40 words).`;
    } else if (type === 'chat-response') {
      // Handle chat conversation
      const { messages, userMessage } = data;
      
      // Use the messages array to build context
      const conversationContext = messages?.slice(-6) || []; // Last 6 messages for context
      
      prompt = `You are ZotProf AI, a friendly UCI academic advisor chatbot.

Help students plan their course schedules by:
- Asking what quarter they're planning for
- Finding out which courses they need
- Understanding their goals (GPA, learning, balance)
- Providing personalized recommendations

Be conversational, friendly, and use emojis occasionally. Keep responses concise (3-5 sentences per message).

User's message: ${userMessage}

Respond naturally to continue the conversation.`;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid summary type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating ${type} summary...`);

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert academic advisor at UCI with deep knowledge of teaching styles and student needs. Provide honest, balanced, and actionable advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Failed to generate summary' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    const summary = aiData.choices?.[0]?.message?.content;
    
    if (!summary) {
      throw new Error('No content in AI response');
    }

    console.log(`Successfully generated ${type} summary`);

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-ai-summary function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to generate AI summary'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
