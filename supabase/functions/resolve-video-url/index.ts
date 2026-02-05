 import "https://deno.land/x/xhr@0.1.0/mod.ts";
 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
   
   try {
     const { url } = await req.json();
     
     if (!url) {
       return new Response(
         JSON.stringify({ error: 'URL is required' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
     
     console.log('Resolving URL:', url);
     
     let resolvedUrl = url;
     let videoId: string | null = null;
     let platform: string | null = null;
     
     // Handle TikTok short URLs (vm.tiktok.com)
     if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
       console.log('Detected TikTok short URL, following redirect...');
       
       try {
         // Follow the redirect to get the full URL
         const response = await fetch(url, {
           method: 'HEAD',
           redirect: 'follow',
           headers: {
             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
           }
         });
         
         resolvedUrl = response.url;
         console.log('Resolved to:', resolvedUrl);
       } catch (e) {
         console.log('HEAD request failed, trying GET...');
         
         // Fallback: make a GET request and check the final URL
         const response = await fetch(url, {
           redirect: 'follow',
           headers: {
             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
           }
         });
         
         resolvedUrl = response.url;
         await response.text(); // Consume body to prevent leaks
         console.log('Resolved via GET to:', resolvedUrl);
       }
       
       platform = 'tiktok';
     }
     
     // Extract TikTok video ID from resolved URL
     if (resolvedUrl.includes('tiktok.com')) {
       platform = 'tiktok';
       
       // Match /video/XXXXX pattern
       const videoMatch = resolvedUrl.match(/\/video\/(\d+)/);
       if (videoMatch) {
         videoId = videoMatch[1];
         console.log('Extracted TikTok video ID:', videoId);
       }
       
       // Also try extracting from /v/ or /t/ patterns
       if (!videoId) {
         const altMatch = resolvedUrl.match(/tiktok\.com\/[^\/]+\/video\/(\d+)/);
         if (altMatch) {
           videoId = altMatch[1];
         }
       }
     }
     
     // Handle Instagram short URLs
     if (url.includes('instagram.com')) {
       platform = 'instagram';
       
       const reelMatch = resolvedUrl.match(/\/reel\/([^\/\?]+)/);
       const postMatch = resolvedUrl.match(/\/p\/([^\/\?]+)/);
       videoId = reelMatch?.[1] || postMatch?.[1] || null;
     }
     
     // Handle YouTube
     if (url.includes('youtube.com') || url.includes('youtu.be')) {
       platform = 'youtube';
       
       if (url.includes('youtu.be')) {
         const match = url.match(/youtu\.be\/([^\/\?]+)/);
         videoId = match?.[1] || null;
       } else if (url.includes('/shorts/')) {
         const match = url.match(/\/shorts\/([^\/\?]+)/);
         videoId = match?.[1] || null;
       } else {
         const urlObj = new URL(url);
         videoId = urlObj.searchParams.get('v');
       }
     }
     
     // Build embed URL
     let embedUrl: string | null = null;
     
     if (platform === 'tiktok' && videoId) {
       embedUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
     } else if (platform === 'youtube' && videoId) {
       embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
     } else if (platform === 'instagram' && videoId) {
       embedUrl = `https://www.instagram.com/reel/${videoId}/embed`;
     }
     
     console.log('Result:', { resolvedUrl, videoId, platform, embedUrl });
     
     return new Response(
       JSON.stringify({ 
         originalUrl: url,
         resolvedUrl, 
         videoId, 
         platform,
         embedUrl,
         canEmbed: !!embedUrl
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
     
   } catch (error) {
     console.error('Error resolving URL:', error);
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     return new Response(
       JSON.stringify({ 
         error: errorMessage, 
         originalUrl: null,
         resolvedUrl: null,
         videoId: null,
         embedUrl: null,
         canEmbed: false
       }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });