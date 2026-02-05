 import { useState, useEffect } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { X, ExternalLink, MessageCircle, Loader2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import FeedComments from './FeedComments';
 
 interface FeedVideoPlayerProps {
   isOpen: boolean;
   onClose: () => void;
   submissionUrl: string;
   platform: string;
   submissionId: string;
   submissionType: 'arena' | 'review';
   username: string;
 }
 
 // Extract video ID from various platform URLs
 function getEmbedUrl(url: string, platform: string): string | null {
   try {
     const urlObj = new URL(url);
     
     if (platform === 'youtube' || urlObj.hostname.includes('youtube') || urlObj.hostname.includes('youtu.be')) {
       // Handle youtube.com/watch?v=ID
       if (urlObj.hostname.includes('youtube.com')) {
         const videoId = urlObj.searchParams.get('v');
         if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
       }
       // Handle youtu.be/ID
       if (urlObj.hostname.includes('youtu.be')) {
         const videoId = urlObj.pathname.slice(1);
         if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
       }
       // Handle youtube.com/shorts/ID
       if (urlObj.pathname.includes('/shorts/')) {
         const videoId = urlObj.pathname.split('/shorts/')[1]?.split('/')[0];
         if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
       }
     }
     
     if (platform === 'tiktok' || urlObj.hostname.includes('tiktok')) {
       // TikTok embed - extract video ID from URL
       const pathParts = urlObj.pathname.split('/');
       const videoIndex = pathParts.indexOf('video');
       if (videoIndex !== -1 && pathParts[videoIndex + 1]) {
         const videoId = pathParts[videoIndex + 1];
         return `https://www.tiktok.com/embed/v2/${videoId}`;
       }
       // Handle vm.tiktok.com short URLs - these need to be opened externally
       if (urlObj.hostname === 'vm.tiktok.com') {
         return null;
       }
     }
     
     if (platform === 'instagram' || urlObj.hostname.includes('instagram')) {
       // Instagram embed - extract reel/post ID
       const reelMatch = urlObj.pathname.match(/\/reel\/([^\/]+)/);
       const postMatch = urlObj.pathname.match(/\/p\/([^\/]+)/);
       const id = reelMatch?.[1] || postMatch?.[1];
       if (id) return `https://www.instagram.com/reel/${id}/embed`;
     }
     
     return null;
   } catch {
     return null;
   }
 }
 
 export default function FeedVideoPlayer({
   isOpen,
   onClose,
   submissionUrl,
   platform,
   submissionId,
   submissionType,
   username
 }: FeedVideoPlayerProps) {
   const [showComments, setShowComments] = useState(false);
   const [embedLoaded, setEmbedLoaded] = useState(false);
   const [embedError, setEmbedError] = useState(false);
   
   const embedUrl = getEmbedUrl(submissionUrl, platform);
   
   // Reset states when modal opens/closes
   useEffect(() => {
     if (isOpen) {
       setEmbedLoaded(false);
       setEmbedError(false);
       setShowComments(false);
     }
   }, [isOpen, submissionUrl]);
   
   // Handle escape key
   useEffect(() => {
     const handleEscape = (e: KeyboardEvent) => {
       if (e.key === 'Escape') {
         if (showComments) {
           setShowComments(false);
         } else {
           onClose();
         }
       }
     };
     if (isOpen) {
       document.addEventListener('keydown', handleEscape);
       return () => document.removeEventListener('keydown', handleEscape);
     }
   }, [isOpen, showComments, onClose]);
   
   const openExternal = () => {
     window.open(submissionUrl, '_blank');
   };
 
   return (
     <AnimatePresence>
       {isOpen && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-[100] bg-black"
         >
           {/* Header */}
           <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
             <button 
               onClick={onClose}
               className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
             >
               <X className="w-5 h-5 text-white" />
             </button>
             
             <div className="flex items-center gap-2">
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => setShowComments(true)}
                 className="text-white hover:bg-white/10"
               >
                 <MessageCircle className="w-4 h-4 mr-2" />
                 Comments
               </Button>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={openExternal}
                 className="text-white hover:bg-white/10"
               >
                 <ExternalLink className="w-4 h-4 mr-2" />
                 Open
               </Button>
             </div>
           </div>
           
           {/* Video Player Area */}
           <div className="absolute inset-0 flex items-center justify-center">
             {embedUrl && !embedError ? (
               <>
                 {!embedLoaded && (
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Loader2 className="w-8 h-8 text-white animate-spin" />
                   </div>
                 )}
                 <iframe
                   src={embedUrl}
                   className="w-full h-full max-w-[500px] max-h-[90vh]"
                   style={{ 
                     aspectRatio: platform === 'youtube' && !submissionUrl.includes('/shorts/') ? '16/9' : '9/16',
                     opacity: embedLoaded ? 1 : 0
                   }}
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowFullScreen
                   onLoad={() => setEmbedLoaded(true)}
                   onError={() => setEmbedError(true)}
                 />
               </>
             ) : (
               // Fallback for unsupported embeds
               <div className="flex flex-col items-center gap-6 text-center px-8">
                 <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                   <ExternalLink className="w-10 h-10 text-white/60" />
                 </div>
                 <div>
                   <p className="text-white text-lg font-medium mb-2">
                     This video can't be embedded
                   </p>
                   <p className="text-white/60 text-sm mb-6">
                     Open it on {platform === 'tiktok' ? 'TikTok' : platform === 'instagram' ? 'Instagram' : 'YouTube'} to watch
                   </p>
                   <Button onClick={openExternal} className="bg-white text-black hover:bg-white/90">
                     <ExternalLink className="w-4 h-4 mr-2" />
                     Watch on {platform === 'tiktok' ? 'TikTok' : platform === 'instagram' ? 'Instagram' : 'YouTube'}
                   </Button>
                 </div>
               </div>
             )}
           </div>
           
           {/* Comments Sheet */}
           <FeedComments 
             isOpen={showComments}
             onClose={() => setShowComments(false)}
             submissionId={submissionId}
             submissionType={submissionType}
             username={username}
           />
         </motion.div>
       )}
     </AnimatePresence>
   );
 }