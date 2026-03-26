"use client";

import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePlusIcon, Loader2, XIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  defaultImage?: string;
}

export function ImageUpload({ onUploadComplete, defaultImage }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImage || null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    setIsUploading(true);
    // Create a unique file name inside products directory
    const timestamp = Date.now();
    const fileName = `products/${timestamp}_${file.name.replace(/\s+/g, "_")}`;
    const storageRef = ref(storage, fileName);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (snapshot: any) => {
        const p = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(p);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => {
        console.error("Upload Error:", error);
        toast.error("Failed to upload image.");
        setIsUploading(false);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        setPreviewUrl(downloadUrl);
        onUploadComplete(downloadUrl);
        setIsUploading(false);
        setProgress(0);
      }
    );
  };

  const handleClear = () => {
    setPreviewUrl(null);
    onUploadComplete("");
  };

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="relative isolate group w-full h-48 border rounded-lg overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Product Preview"
            className="w-full h-full object-cover rounded-lg"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleClear}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/20 hover:bg-muted/50 transition-colors">
          <Input
            type="file"
            accept="image/*"
            className="hidden"
            id="image-upload-input"
            onChange={handleUpload}
            disabled={isUploading}
          />
          <Label
            htmlFor="image-upload-input"
            className={`flex flex-col items-center justify-center w-full ${isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm font-medium">Uploading... {progress}%</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ImagePlusIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Click to upload a product image
                </p>
              </div>
            )}
          </Label>
        </div>
      )}
    </div>
  );
}
