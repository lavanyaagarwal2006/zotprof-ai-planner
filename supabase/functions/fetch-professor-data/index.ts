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
    const { professorName } = await req.json();
    
    if (!professorName) {
      return new Response(JSON.stringify({ error: 'professorName is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching professor data for: ${professorName}`);

    // 1. Fetch PeterAPI instructor data
    let peterData = null;
    try {
      const allInstructorsResponse = await fetch(`${PETERAPI_BASE}/instructors/all`);
      
      if (allInstructorsResponse.ok) {
        const allInstructors = await allInstructorsResponse.json();
        peterData = allInstructors.find((i: any) => 
          i.name.toLowerCase().includes(professorName.toLowerCase()) ||
          professorName.toLowerCase().includes(i.name.toLowerCase())
        );
        
        console.log(`PeterAPI found: ${peterData ? peterData.name : 'not found'}`);
      }
    } catch (error) {
      console.error('Error fetching from PeterAPI:', error);
    }

    // 2. Fetch RateMyProfessor data via GraphQL API
    let rmpData = null;
    let rmpReviews = [];
    try {
      // Search for professor using RMP GraphQL API
      const searchQuery = {
        query: `query NewSearchTeachersQuery($text: String!) {
          newSearch {
            teachers(query: {text: $text, schoolID: "U2Nob29sLTEwNzQ="}) {
              edges {
                node {
                  id
                  firstName
                  lastName
                  avgRating
                  avgDifficulty
                  numRatings
                  wouldTakeAgainPercent
                  department
                }
              }
            }
          }
        }`,
        variables: {
          text: professorName
        }
      };
      
      const searchResponse = await fetch('https://www.ratemyprofessors.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic dGVzdDp0ZXN0',
        },
        body: JSON.stringify(searchQuery)
      });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const teachers = searchData?.data?.newSearch?.teachers?.edges || [];
        
        if (teachers.length > 0) {
          const teacher = teachers[0].node;
          
          rmpData = {
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            avgRating: teacher.avgRating,
            avgDifficulty: teacher.avgDifficulty,
            numRatings: teacher.numRatings,
            wouldTakeAgainPercent: teacher.wouldTakeAgainPercent,
            department: teacher.department,
            teacherId: teacher.id,
          };
          
          console.log(`RateMyProfessor found: ${teacher.firstName} ${teacher.lastName}`);
          
          // Fetch reviews for this teacher
          try {
            const reviewsQuery = {
              query: `query RatingsPageQuery($id: ID!) {
                node(id: $id) {
                  ... on Teacher {
                    ratings(first: 20) {
                      edges {
                        node {
                          comment
                          class
                          date
                          helpfulRating
                          clarityRating
                          difficultyRating
                          ratingTags
                        }
                      }
                    }
                  }
                }
              }`,
              variables: {
                id: teacher.id
              }
            };
            
            const reviewsResponse = await fetch('https://www.ratemyprofessors.com/graphql', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic dGVzdDp0ZXN0',
              },
              body: JSON.stringify(reviewsQuery)
            });
            
            if (reviewsResponse.ok) {
              const reviewsData = await reviewsResponse.json();
              const ratingsEdges = reviewsData?.data?.node?.ratings?.edges || [];
              
              rmpReviews = ratingsEdges.map((edge: any) => ({
                class: edge.node.class,
                comment: edge.node.comment,
                date: edge.node.date,
                rating: edge.node.clarityRating || edge.node.helpfulRating,
                difficulty: edge.node.difficultyRating,
                tags: edge.node.ratingTags || [],
              }));
              
              console.log(`Fetched ${rmpReviews.length} reviews`);
            }
          } catch (reviewError) {
            console.error('Error fetching reviews:', reviewError);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching from RateMyProfessor:', error);
    }

    // 3. Get courses taught (from PeterAPI)
    let coursesTaught = [];
    if (peterData) {
      coursesTaught = peterData.courses || [];
    }

    // 4. Fetch grade distributions for recent courses
    const gradesData: any[] = [];
    if (peterData && coursesTaught.length > 0) {
      // Get grades for up to 5 most recent courses
      const recentCourses = coursesTaught.slice(0, 5);
      
      for (const courseId of recentCourses) {
        try {
          // Extract department and number from course ID (e.g., "I&C SCI 33")
          const [dept, ...numParts] = courseId.split(' ');
          const courseNum = numParts.join(' ');
          
          const gradesResponse = await fetch(
            `${PETERAPI_BASE}/grades/raw?instructor=${encodeURIComponent(peterData.name)}&department=${encodeURIComponent(dept)}&number=${courseNum}`
          );
          
          if (gradesResponse.ok) {
            const grades = await gradesResponse.json();
            gradesData.push({
              course: courseId,
              grades: grades,
            });
          }
        } catch (error) {
          console.error(`Error fetching grades for ${courseId}:`, error);
        }
      }
    }

    // 5. Search Reddit (using Reddit JSON API - no auth needed)
    let redditMentions: any[] = [];
    try {
      const redditQuery = encodeURIComponent(`${professorName} UCI`);
      const redditResponse = await fetch(
        `https://www.reddit.com/r/UCI/search.json?q=${redditQuery}&restrict_sr=1&sort=relevance&limit=10`
      );
      
      if (redditResponse.ok) {
        const redditData = await redditResponse.json();
        redditMentions = redditData.data.children.map((post: any) => ({
          title: post.data.title,
          text: post.data.selftext?.slice(0, 300) || '',
          url: `https://reddit.com${post.data.permalink}`,
          score: post.data.score,
          created: new Date(post.data.created_utc * 1000).toISOString(),
        }));
        
        console.log(`Found ${redditMentions.length} Reddit mentions`);
      }
    } catch (error) {
      console.error('Error fetching Reddit data:', error);
    }

    const result = {
      peterData,
      rmpData,
      rmpReviews,
      coursesTaught,
      gradesData,
      redditMentions,
    };

    console.log(`Successfully compiled professor data for ${professorName}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-professor-data function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to fetch professor data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
