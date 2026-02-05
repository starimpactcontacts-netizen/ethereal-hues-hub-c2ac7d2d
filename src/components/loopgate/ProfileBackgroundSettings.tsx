 import { useState } from "react";
 import { Check, Lock, Upload, X } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { motion } from "framer-motion";
 
 interface ProfileBackgroundSettingsProps {
   userId: string;
   currentColor: string;
   currentImageUrl: string | null;
   userLevel: number;
   onUpdate: () => void;
 }
 
 const colorOptions = [
   { id: 'gold', label: 'Gold', gradient: 'from-gold/20 via-gold/5 to-transparent', preview: 'bg-gold' },
   { id: 'purple', label: 'Purple', gradient: 'from-purple-500/20 via-purple-500/5 to-transparent', preview: 'bg-purple-500' },
   { id: 'cyan', label: 'Cyan', gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent', preview: 'bg-cyan-500' },
   { id: 'red', label: 'Red', gradient: 'from-red-500/20 via-red-500/5 to-transparent', preview: 'bg-red-500' },
   { id: 'emerald', label: 'Emerald', gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent', preview: 'bg-emerald-500' },
   { id: 'zinc', label: 'Silver', gradient: 'from-zinc-400/20 via-zinc-400/5 to-transparent', preview: 'bg-zinc-400' },
 ];
 
 export default function ProfileBackgroundSettings({ 
   userId, 
   currentColor, 
   currentImageUrl,
   userLevel,
   onUpdate 
 }: ProfileBackgroundSettingsProps) {
   const [selectedColor, setSelectedColor] = useState(currentColor || 'gold');
   const [imageUrl, setImageUrl] = useState(currentImageUrl);
   const [isUploading, setIsUploading] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
 
   const canUseImage = userLevel >= 3;
   const hasChanges = selectedColor !== currentColor || imageUrl !== currentImageUrl;
 
   const handleColorSelect = async (colorId: string) => {
     setSelectedColor(colorId);
   };
 
   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     if (!canUseImage) {
       toast.error("Reach Level 3 to unlock background images");
       return;
     }
 
     if (file.size > 2 * 1024 * 1024) {
       toast.error("Image must be under 2MB");
       return;
     }
 
     setIsUploading(true);
     try {
       const fileExt = file.name.split('.').pop();
       const fileName = `${userId}/profile-bg.${fileExt}`;
 
       const { error: uploadError } = await supabase.storage
         .from('avatars')
         .upload(fileName, file, { upsert: true });
 
       if (uploadError) throw uploadError;
 
       const { data: { publicUrl } } = supabase.storage
         .from('avatars')
         .getPublicUrl(fileName);
 
       setImageUrl(publicUrl);
       toast.success("Image uploaded!");
     } catch (error) {
       console.error("Upload error:", error);
       toast.error("Failed to upload image");
     } finally {
       setIsUploading(false);
     }
   };
 
   const handleRemoveImage = () => {
     setImageUrl(null);
   };
 
   const handleSave = async () => {
     setIsSaving(true);
     try {
       const { error } = await supabase
         .from('profiles')
         .update({
           profile_bg_color: selectedColor,
           profile_bg_image_url: canUseImage ? imageUrl : null,
         })
         .eq('id', userId);
 
       if (error) throw error;
       toast.success("Background saved!");
       onUpdate();
     } catch (error) {
       console.error("Save error:", error);
       toast.error("Failed to save");
     } finally {
       setIsSaving(false);
     }
   };
 
   return (
     <div className="space-y-4">
       {/* Color Selection */}
       <div>
         <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 block">
           Background Color
         </label>
         <div className="grid grid-cols-6 gap-2">
           {colorOptions.map((color) => (
             <button
               key={color.id}
               onClick={() => handleColorSelect(color.id)}
               className={`relative w-full aspect-square rounded-lg ${color.preview} transition-all ${
                 selectedColor === color.id 
                   ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-110' 
                   : 'opacity-60 hover:opacity-100'
               }`}
               title={color.label}
             >
               {selectedColor === color.id && (
                 <div className="absolute inset-0 flex items-center justify-center">
                   <Check className="w-4 h-4 text-white drop-shadow-md" />
                 </div>
               )}
             </button>
           ))}
         </div>
       </div>
 
       {/* Background Image (Level 3+) */}
       <div>
         <div className="flex items-center justify-between mb-3">
           <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
             Background Image
           </label>
           {!canUseImage && (
             <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
               <Lock className="w-3 h-3" />
               Level 3
             </span>
           )}
         </div>
 
         {canUseImage ? (
           <div className="space-y-3">
             {imageUrl ? (
               <div className="relative aspect-[3/1] rounded-lg overflow-hidden border border-border">
                 <img src={imageUrl} alt="Background" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                 <button
                   onClick={handleRemoveImage}
                   className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-red-500 transition-colors"
                 >
                   <X className="w-4 h-4" />
                 </button>
               </div>
             ) : (
               <label className="flex flex-col items-center justify-center aspect-[3/1] rounded-lg border border-dashed border-border hover:border-gold/50 cursor-pointer transition-colors bg-surface-1">
                 <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                 <span className="text-xs text-muted-foreground">Upload Image</span>
                 <span className="text-[10px] text-muted-foreground/60 mt-1">Max 2MB</span>
                 <input
                   type="file"
                   accept="image/*"
                   onChange={handleImageUpload}
                   className="hidden"
                   disabled={isUploading}
                 />
               </label>
             )}
             {isUploading && (
               <p className="text-xs text-muted-foreground text-center">Uploading...</p>
             )}
           </div>
         ) : (
           <div className="aspect-[3/1] rounded-lg border border-dashed border-border bg-muted/10 flex flex-col items-center justify-center opacity-50">
             <Lock className="w-6 h-6 text-muted-foreground mb-2" />
             <span className="text-xs text-muted-foreground">Unlock at Level 3</span>
           </div>
         )}
       </div>
 
       {/* Preview */}
       <div>
         <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 block">
           Preview
         </label>
         <div className="relative h-24 rounded-lg overflow-hidden border border-border bg-background">
           {imageUrl && canUseImage ? (
             <>
               <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
             </>
           ) : (
             <div className={`absolute inset-0 bg-gradient-to-b ${colorOptions.find(c => c.id === selectedColor)?.gradient || colorOptions[0].gradient}`} />
           )}
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 rounded-full bg-muted border-2 border-border" />
           </div>
         </div>
       </div>
 
       {/* Save Button */}
       {hasChanges && (
         <motion.button
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           onClick={handleSave}
           disabled={isSaving}
           className="w-full py-3 bg-gold text-black font-semibold rounded-lg disabled:opacity-50"
         >
           {isSaving ? "Saving..." : "Save Background"}
         </motion.button>
       )}
     </div>
   );
 }