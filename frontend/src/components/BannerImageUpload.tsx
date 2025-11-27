import { useState, useEffect, useRef, useCallback, memo, useId } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthenticatedSupabase } from "@/lib/supabase";

interface BannerImageUploadProps {
  placeId: string;
  initialImageUrl?: string | null;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved: () => void;
}

function BannerImageUploadComponent({
  placeId,
  initialImageUrl,
  onImageUploaded,
  onImageRemoved,
}: BannerImageUploadProps) {
  console.log("[BannerImageUpload] Component rendered", {
    placeId,
    initialImageUrl,
  });

  const { toast } = useToast();
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(
    initialImageUrl || null
  );
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const previousInitialUrlRef = useRef<string | null | undefined>(
    initialImageUrl
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const isUserSelectingFileRef = useRef(false);

  // Update preview when initialImageUrl changes (but not when user is selecting a file)
  useEffect(() => {
    // Don't interfere if user is actively selecting a file
    if (isUserSelectingFileRef.current) {
      console.log(
        "[BannerImageUpload] User is selecting file, skipping useEffect update"
      );
      return;
    }

    console.log("[BannerImageUpload] useEffect triggered", {
      initialImageUrl,
      previousUrl: previousInitialUrlRef.current,
      isImageSelected,
    });

    // Only update if the URL actually changed from the previous value
    if (initialImageUrl !== previousInitialUrlRef.current) {
      console.log("[BannerImageUpload] URL changed, updating state");
      previousInitialUrlRef.current = initialImageUrl;

      // Only update if user hasn't selected a new file
      if (!isImageSelected) {
        if (initialImageUrl) {
          console.log(
            "[BannerImageUpload] Setting initial image URL",
            initialImageUrl
          );
          setBannerImagePreview(initialImageUrl);
          setBannerImageFile(null);
        } else {
          // Only clear if we had a preview but now don't
          console.log("[BannerImageUpload] Clearing initial image");
          setBannerImagePreview(null);
          setBannerImageFile(null);
        }
      } else {
        console.log(
          "[BannerImageUpload] User has selected file, preserving selection"
        );
      }
    } else {
      console.log(
        "[BannerImageUpload] initialImageUrl unchanged, skipping update"
      );
    }
  }, [initialImageUrl, isImageSelected]);

  const handleBannerImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log("[BannerImageUpload] handleBannerImageChange called", {
        files: e.target.files,
        fileCount: e.target.files?.length,
        target: e.target,
      });

      // Mark that user is selecting a file
      isUserSelectingFileRef.current = true;

      const file = e.target.files?.[0];
      console.log("[BannerImageUpload] Selected file", {
        file,
        name: file?.name,
        type: file?.type,
        size: file?.size,
      });

      if (file) {
        // Validate file type
        console.log("[BannerImageUpload] Validating file type", file.type);
        if (!file.type.startsWith("image/")) {
          console.log("[BannerImageUpload] Invalid file type, showing error");
          toast({
            variant: "destructive",
            title: "Invalid File",
            description: "Please select an image file",
          });
          // Reset input
          e.target.value = "";
          isUserSelectingFileRef.current = false;
          return;
        }

        // Validate file size (max 5MB)
        console.log("[BannerImageUpload] Validating file size", file.size);
        if (file.size > 5 * 1024 * 1024) {
          console.log("[BannerImageUpload] File too large, showing error");
          toast({
            variant: "destructive",
            title: "File Too Large",
            description: "Image must be less than 5MB",
          });
          // Reset input
          e.target.value = "";
          isUserSelectingFileRef.current = false;
          return;
        }

        console.log(
          "[BannerImageUpload] File validation passed, setting state"
        );
        setBannerImageFile(file);
        setIsImageSelected(true);
        // Reset the flag after a short delay to allow state to settle
        setTimeout(() => {
          isUserSelectingFileRef.current = false;
        }, 100);
        console.log("[BannerImageUpload] State updated", {
          bannerImageFile: file.name,
          isImageSelected: true,
        });

        // Create preview (local preview, not uploaded yet)
        console.log("[BannerImageUpload] Creating FileReader for preview");
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log("[BannerImageUpload] FileReader onloadend", {
            result: reader.result ? "exists" : "null",
            resultLength: reader.result ? (reader.result as string).length : 0,
          });
          if (reader.result) {
            console.log("[BannerImageUpload] Setting preview URL");
            setBannerImagePreview(reader.result as string);
          } else {
            console.log("[BannerImageUpload] No result from FileReader");
          }
        };
        reader.onerror = (error) => {
          console.error("[BannerImageUpload] FileReader error", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to read image file",
          });
          e.target.value = "";
          setBannerImageFile(null);
          setIsImageSelected(false);
          isUserSelectingFileRef.current = false;
        };
        reader.onabort = () => {
          console.log("[BannerImageUpload] FileReader aborted");
          isUserSelectingFileRef.current = false;
        };
        console.log("[BannerImageUpload] Starting FileReader.readAsDataURL");
        reader.readAsDataURL(file);
      } else {
        console.log("[BannerImageUpload] No file selected");
        isUserSelectingFileRef.current = false;
      }
    },
    [toast]
  );

  const handleUploadImage = async () => {
    console.log("[BannerImageUpload] handleUploadImage called", {
      bannerImageFile: bannerImageFile ? bannerImageFile.name : null,
      placeId,
      isImageSelected,
    });

    if (!bannerImageFile || !placeId) {
      console.log("[BannerImageUpload] Validation failed", {
        hasFile: !!bannerImageFile,
        hasPlaceId: !!placeId,
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an image first",
      });
      return;
    }

    try {
      console.log("[BannerImageUpload] Starting upload process");
      setIsUploadingImage(true);

      // Get the current user's access token
      console.log("[BannerImageUpload] Getting access token");
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        console.error("[BannerImageUpload] No access token found");
        throw new Error("No access token found. Please log in.");
      }
      console.log("[BannerImageUpload] Access token found");

      // Get authenticated Supabase client
      console.log("[BannerImageUpload] Getting authenticated Supabase client");
      const supabase = await getAuthenticatedSupabase();
      console.log("[BannerImageUpload] Supabase client obtained");

      // Get bucket name from environment variable
      const bucketName = import.meta.env.VITE_SUPABASE_BUCKET_NAME;
      console.log(
        "[BannerImageUpload] Bucket name",
        bucketName ? "found" : "missing"
      );
      if (!bucketName) {
        console.error("[BannerImageUpload] Bucket name not configured");
        throw new Error("Bucket name not configured");
      }

      // Create a file path: place-banners/{placeId}/banner-{placeId}.jpg
      const filePath = `${placeId}/banner-${placeId}.jpg`;
      console.log("[BannerImageUpload] File path created", {
        filePath,
      });

      // Upload file to Supabase Storage
      console.log("[BannerImageUpload] Starting upload to Supabase Storage", {
        bucketName,
        filePath,
        fileSize: bannerImageFile.size,
      });
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, bannerImageFile, {
          cacheControl: "3600",
          upsert: true,
          contentType: bannerImageFile.type,
        });

      console.log("[BannerImageUpload] Upload response", { data, error });

      if (error) {
        console.error("[BannerImageUpload] Upload error", error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      console.log("[BannerImageUpload] Upload successful, getting public URL");
      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      console.log("[BannerImageUpload] Public URL", publicUrl);

      if (!publicUrl) {
        console.error("[BannerImageUpload] No public URL returned");
        throw new Error("Failed to get public URL for uploaded image");
      }

      // Update preview with Supabase URL
      console.log("[BannerImageUpload] Updating preview and state");
      setBannerImagePreview(publicUrl);
      setIsImageSelected(false); // Image is now uploaded
      setBannerImageFile(null);
      isUserSelectingFileRef.current = false; // Reset flag after upload

      // Notify parent component
      console.log("[BannerImageUpload] Notifying parent component", publicUrl);
      onImageUploaded(publicUrl);

      console.log("[BannerImageUpload] Upload complete, showing success toast");
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("[BannerImageUpload] Upload error caught", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload image. Please try again.",
      });
    } finally {
      console.log("[BannerImageUpload] Setting isUploadingImage to false");
      setIsUploadingImage(false);
    }
  };

  const handleRemoveBannerImage = () => {
    console.log("[BannerImageUpload] handleRemoveBannerImage called");
    setBannerImageFile(null);
    setBannerImagePreview(null);
    setIsImageSelected(false);
    isUserSelectingFileRef.current = false; // Reset flag
    console.log("[BannerImageUpload] State cleared");
    // Reset file input
    console.log("[BannerImageUpload] Resetting file input");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      console.log("[BannerImageUpload] File input reset via ref");
    } else {
      console.warn("[BannerImageUpload] fileInputRef.current is null");
    }
    // Notify parent component
    console.log("[BannerImageUpload] Notifying parent of removal");
    onImageRemoved();
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>Banner Image</Label>
      <div className="space-y-4">
        {bannerImagePreview ? (
          <div className="relative w-full h-48 rounded-lg border border-border overflow-hidden bg-muted">
            <img
              src={bannerImagePreview}
              alt="Banner preview"
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemoveBannerImage}
              disabled={isUploadingImage}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg bg-muted/50">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                No image selected
              </p>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleBannerImageChange}
            className="hidden"
            disabled={isUploadingImage}
          />
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-[#D3D5D9]"
            disabled={isUploadingImage}
            onClick={(e) => {
              console.log(
                "[BannerImageUpload] Choose Image button clicked, triggering file input"
              );
              e.preventDefault();
              e.stopPropagation();
              if (fileInputRef.current) {
                console.log("[BannerImageUpload] Clicking file input via ref");
                fileInputRef.current.click();
              } else {
                console.error(
                  "[BannerImageUpload] fileInputRef.current is null"
                );
              }
            }}
          >
            Choose Image
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={(e) => {
              console.log("[BannerImageUpload] Upload button clicked", {
                isImageSelected,
                isUploadingImage,
                hasFile: !!bannerImageFile,
              });
              handleUploadImage();
            }}
            className="flex-1"
            disabled={!isImageSelected || isUploadingImage || !bannerImageFile}
          >
            {isUploadingImage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Use default shallow comparison for memoization
// This prevents re-renders when props haven't changed, but allows re-renders
// when internal state changes (which is what we want)
export const BannerImageUpload = memo(BannerImageUploadComponent);
