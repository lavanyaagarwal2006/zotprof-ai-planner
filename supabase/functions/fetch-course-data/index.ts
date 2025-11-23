import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PETERAPI_BASE = 'https://api.peterportal.org/rest/v0';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { department, courseNumber, term } = await req.json();
    
    if (!department || !courseNumber) {
      return new Response(JSON.stringify({ error: 'Department and courseNumber are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching course data for ${department} ${courseNumber}, term: ${term}`);

    // 1. Get course catalog information
    const courseId = `${department} ${courseNumber}`;
    const catalogResponse = await fetch(`${PETERAPI_BASE}/courses/${encodeURIComponent(courseId)}`);
    
    let courseInfo = null;
    if (catalogResponse.ok) {
      courseInfo = await catalogResponse.json();
    } else {
      console.log(`Course catalog not found for ${courseId}`);
    }

    // 2. Get sections (if term is specified)
    let sections = [];
    if (term) {
      const [quarter, year] = term.split(' ');
      const socResponse = await fetch(
        `${PETERAPI_BASE}/schedule/soc?year=${year}&quarter=${quarter}&department=${encodeURIComponent(department)}`
      );
      
      if (socResponse.ok) {
        const socData = await socResponse.json();
        
        // Filter for the specific course number
        for (const school of socData.schools || []) {
          for (const dept of school.departments || []) {
            for (const course of dept.courses || []) {
              if (course.courseNumber === courseNumber) {
                sections = course.sections || [];
                break;
              }
            }
          }
        }
      }
    }

    // 3. Get unique instructors from sections
    const instructorNames = new Set<string>();
    sections.forEach((section: any) => {
      section.meetings?.forEach((meeting: any) => {
        meeting.instructors?.forEach((instructor: string) => {
          if (instructor && instructor !== 'STAFF') {
            instructorNames.add(instructor);
          }
        });
      });
    });

    // 4. Fetch instructor details for each unique instructor
    const instructors = await Promise.all(
      Array.from(instructorNames).map(async (name) => {
        try {
          // Search for instructor by name
          const searchResponse = await fetch(
            `${PETERAPI_BASE}/instructors/all`
          );
          
          if (searchResponse.ok) {
            const allInstructors = await searchResponse.json();
            const instructor = allInstructors.find((i: any) => 
              i.name.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(i.name.toLowerCase())
            );
            
            if (instructor) {
              return {
                name: instructor.name,
                ucinetid: instructor.ucinetid,
                title: instructor.title,
                department: instructor.department,
                schools: instructor.schools,
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching instructor ${name}:`, error);
        }
        
        // Return basic info if detailed fetch fails
        return {
          name,
          ucinetid: null,
          title: null,
          department: null,
          schools: [],
        };
      })
    );

    // 5. Get grade distributions for each instructor
    const gradesPromises = instructors.map(async (instructor) => {
      if (!term) return null;
      
      try {
        const [quarter, year] = term.split(' ');
        const gradesResponse = await fetch(
          `${PETERAPI_BASE}/grades/raw?year=${year}&quarter=${quarter}&instructor=${encodeURIComponent(instructor.name)}&department=${encodeURIComponent(department)}&number=${courseNumber}`
        );
        
        if (gradesResponse.ok) {
          const grades = await gradesResponse.json();
          return {
            instructorName: instructor.name,
            grades: grades,
          };
        }
      } catch (error) {
        console.error(`Error fetching grades for ${instructor.name}:`, error);
      }
      return null;
    });

    const gradesData = await Promise.all(gradesPromises);
    const gradesMap = Object.fromEntries(
      gradesData.filter(g => g !== null).map(g => [g!.instructorName, g!.grades])
    );

    const result = {
      course: courseInfo,
      sections: sections,
      instructors: instructors.filter(i => i !== null),
      grades: gradesMap,
    };

    console.log(`Successfully fetched course data: ${instructors.length} instructors, ${sections.length} sections`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-course-data function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to fetch course data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
