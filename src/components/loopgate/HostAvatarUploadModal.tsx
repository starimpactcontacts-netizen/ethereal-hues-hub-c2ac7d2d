import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Upload, Camera as CameraIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { isNativeApp } from "@/lib/native";

interface HostAvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  currentAvatarUrl?: string | null;
  onUpdated: () => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 90 },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function HostAvatarUploadModal({
  isOpen,
  onClose,
  competitionId,
  currentAvatarUrl,
  onUpdated,
}: HostAvatarUploadModalProps) {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNativePhotoPicker = async (source: CameraSource) => {
    setPickingPhoto(true);
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source,
        correctOrientation: true,
        width: 1024,
        height: 1024,
        presentationStyle: 'popover',
      });

      if (photo.dataUrl) {
        setTimeout(() => {
          setImgSrc(photo.dataUrl!);
        }, 100);
      }
    } catch (error: any) {
      const errorMsg = error?.message || error?.toString() || '';
      if (!errorMsg.includes("User cancelled") && !errorMsg.includes("canceled") && !errorMsg.includes("cancelled")) {
        console.error("Photo picker error:", error);
        toast.error("Failed to select photo");
      }
    } finally {
      setPickingPhoto(false);
    }
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB");
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImgSrc(reader.result?.toString() || "");
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const getCroppedImg = async (): Promise<Blob | null> => {
    const image = imgRef.current;
    if (!image || !crop) return null;

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const pixelCrop = {
      x: (crop.x / 100) * image.width * scaleX,
      y: (crop.y / 100) * image.height * scaleY,
      width: (crop.width / 100) * image.width * scaleX,
      height: (crop.height / 100) * image.height * scaleY,
    };

    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      256,
      256
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  };

  const handleUpload = async () => {
    const croppedBlob = await getCroppedImg();
    if (!croppedBlob) {
      toast.error("Failed to crop image");
      return;
    }

    setUploading(true);

    try {
      // Use a unique filename with timestamp to avoid caching issues
      const timestamp = Date.now();
      const filePath = `hosted-comps/${competitionId}/avatar-${timestamp}.jpg`;

      // First, try to delete any existing avatar files for this comp
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(`hosted-comps/${competitionId}`);
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `hosted-comps/${competitionId}/${f.name}`);
        await supabase.storage.from("avatars").remove(filesToDelete);
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedBlob, { 
          upsert: true,
          contentType: "image/jpeg"
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const urlWithCacheBuster = `${publicUrl}?t=${timestamp}`;

      const { error: updateError } = await supabase
        .from("hosted_competitions")
        .update({ host_avatar_url: urlWithCacheBuster })
        .eq("id", competitionId);

      if (updateError) {
        console.error("DB update error:", updateError);
        throw updateError;
      }

      toast.success("Host avatar updated");
      onUpdated();
      handleClose();
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(error?.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);

    try {
      await supabase.storage
        .from("avatars")
        .remove([`hosted-comp-${competitionId}/avatar.jpg`]);

      const { error: updateError } = await supabase
        .from("hosted_competitions")
        .update({ host_avatar_url: null })
        .eq("id", competitionId);

      if (updateError) throw updateError;

      toast.success("Host avatar removed");
      onUpdated();
      handleClose();
    } catch (error: any) {
      console.error("Avatar remove error:", error);
      toast.error("Failed to remove avatar");
    } finally {
      setRemoving(false);
    }
  };

  const handleClose = () => {
    setImgSrc("");
    setCrop(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-surface-1 border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {imgSrc ? "Crop Photo" : "Host Avatar"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {imgSrc ? (
            <>
              <div className="flex justify-center bg-black/20 rounded-lg p-2">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  aspect={1}
                  circularCrop
                  className="max-h-[300px]"
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="max-h-[300px] object-contain"
                  />
                </ReactCrop>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setImgSrc("")}
                  className="flex-1"
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  className="flex-1 bg-gold hover:bg-gold/90 text-black"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-border bg-muted">
                  {currentAvatarUrl ? (
                    <img
                      src={currentAvatarUrl}
                      alt="Current avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl font-display">
                      ?
                    </div>
                  )}
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={onSelectFile}
                accept="image/*"
                className="hidden"
              />

              <div className="space-y-2">
                {isNativeApp() ? (
                  <>
                    <Button
                      onClick={() => handleNativePhotoPicker(CameraSource.Camera)}
                      className="w-full bg-gold hover:bg-gold/90 text-black"
                      disabled={pickingPhoto}
                    >
                      {pickingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CameraIcon className="w-4 h-4 mr-2" />
                      )}
                      Take Photo
                    </Button>
                    <Button
                      onClick={() => handleNativePhotoPicker(CameraSource.Photos)}
                      variant="outline"
                      className="w-full"
                      disabled={pickingPhoto}
                    >
                      {pickingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Choose from Library
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-gold hover:bg-gold/90 text-black"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {currentAvatarUrl ? "Change Photo" : "Upload Photo"}
                  </Button>
                )}

                {currentAvatarUrl && (
                  <Button
                    variant="outline"
                    onClick={handleRemove}
                    className="w-full text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10"
                    disabled={removing}
                  >
                    {removing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Photo
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
