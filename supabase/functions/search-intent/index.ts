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
    const { query } = await req.json();
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Use AI to parse the user's intent
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
            content: `You are a UCI course search query parser. Analyze the user's query and extract structured information.

Return ONLY a valid JSON object with this exact structure:
{
  "type": "class" | "professor" | "recommendation",
  "department": string or null (e.g., "I&C SCI", "COMPSCI", "MATH"),
  "courseNumber": string or null (e.g., "33", "2A"),
  "term": string or null (e.g., "Winter 2025", "Spring 2025"),
  "professorName": string or null (e.g., "Pattis", "Thornton"),
  "intent": "search" | "comparison" | "recommendation",
  "filters": {
    "easyGrading": boolean,
    "highRating": boolean,
    "lowDifficulty": boolean
  }
}

Common abbreviations:
- "ics" → "I&C SCI"
- "cs" → "COMPSCI"  
- "w25" or "winter 25" → "Winter 2025"
- "f24" or "fall 24" → "Fall 2024"
- "s25" or "spring 25" → "Spring 2025"

Examples:
- "ics 33 winter 2025" → type: "class", department: "I&C SCI", courseNumber: "33", term: "Winter 2025"
- "pattis" → type: "professor", professorName: "Pattis"
- "who teaches data structures" → type: "recommendation", department: "I&C SCI", intent: "recommendation"
- "best professor for writing" → type: "recommendation", department: "WRITING", filters: { highRating: true }
- "easiest math class" → type: "recommendation", department: "MATH", filters: { easyGrading: true, lowDifficulty: true }
- "thornton vs pattis" → type: "professor", intent: "comparison", professorName: "Thornton"

Return ONLY the JSON object, no other text.`
          },
          {
            role: 'user',
            content: query
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

      return new Response(JSON.stringify({ error: 'Failed to parse search intent' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response from AI
    let parsedIntent;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedIntent = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    console.log('Parsed intent:', JSON.stringify(parsedIntent, null, 2));

    return new Response(JSON.stringify(parsedIntent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in search-intent function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to process search query'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
