import { useState, useRef } from "react";
import { X, Upload, Camera, Loader2 } from "lucide-react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CrewAvatarUploadModalProps {
  crewId: string;
  currentAvatarUrl?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export default function CrewAvatarUploadModal({
  crewId,
  currentAvatarUrl,
  onClose,
  onSuccess,
}: CrewAvatarUploadModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  };

  const getCroppedImage = async (): Promise<Blob | null> => {
    const image = imgRef.current;
    if (!image || !crop) return null;

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio || 1;

    const cropWidth = (crop.width / 100) * image.width;
    const cropHeight = (crop.height / 100) * image.height;

    canvas.width = cropWidth * scaleX * pixelRatio;
    canvas.height = cropHeight * scaleY * pixelRatio;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = "high";

    const cropX = (crop.x / 100) * image.width * scaleX;
    const cropY = (crop.y / 100) * image.height * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth * scaleX,
      cropHeight * scaleY,
      0,
      0,
      cropWidth * scaleX,
      cropHeight * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  };

  const handleUpload = async () => {
    const croppedBlob = await getCroppedImage();
    if (!croppedBlob) {
      toast.error("Failed to crop image");
      return;
    }

    setUploading(true);

    try {
      const fileName = `${crewId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("crew-avatars")
        .upload(fileName, croppedBlob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("crew-avatars")
        .getPublicUrl(fileName);

      const avatarUrlWithCache = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("crews")
        .update({ avatar_url: avatarUrlWithCache })
        .eq("id", crewId);

      if (updateError) throw updateError;

      toast.success("Crew avatar updated");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentAvatarUrl) return;

    setRemoving(true);

    try {
      const { error } = await supabase
        .from("crews")
        .update({ avatar_url: null })
        .eq("id", crewId);

      if (error) throw error;

      toast.success("Crew avatar removed");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Remove error:", error);
      toast.error("Failed to remove avatar");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-background border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-lg">Crew Avatar</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {!selectedImage ? (
            <>
              {/* Current avatar preview */}
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-border">
                  {currentAvatarUrl ? (
                    <img
                      src={currentAvatarUrl}
                      alt="Crew avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Camera className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              {/* Upload button */}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full py-3 bg-gold text-black font-semibold uppercase tracking-wider text-sm flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                Select Image
              </button>

              {/* Remove button */}
              {currentAvatarUrl && (
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="w-full py-3 border border-destructive text-destructive font-semibold uppercase tracking-wider text-sm disabled:opacity-50"
                >
                  {removing ? "Removing..." : "Remove Avatar"}
                </button>
              )}
            </>
          ) : (
            <>
              {/* Crop area */}
              <div className="flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    src={selectedImage}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="max-h-64"
                  />
                </ReactCrop>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="flex-1 py-3 border border-border text-foreground font-semibold uppercase tracking-wider text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 py-3 bg-gold text-black font-semibold uppercase tracking-wider text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Save Avatar"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
