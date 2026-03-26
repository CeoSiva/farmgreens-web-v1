"use client";

import { useTransition } from "react";
import { UploadIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProductImageAction } from "@/server/actions/product";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export function InlineImageUpload({ productId }: { productId: string }) {
  const [isUploading, startTransition] = useTransition();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    startTransition(async () => {
      const timestamp = Date.now();
      const fileName = `products/${timestamp}_${file.name.replace(/\s+/g, "_")}`;
      const storageRef = ref(storage, fileName);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        () => {}, // Avoid setting state in loops for inline
        (error) => {
          console.error("Upload Error:", error);
          toast.error("Failed to upload inline image.");
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const res = await updateProductImageAction(productId, downloadUrl);
          if (res.error) {
            toast.error(res.error);
          } else {
            toast.success("Image uploaded successfully!");
          }
        }
      );
    });
  };

  return (
    <>
      {isUploading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <label className="cursor-pointer grid place-items-center w-full h-full hover:bg-muted/80">
          <UploadIcon className="h-4 w-4 text-muted-foreground opacity-50" />
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
        </label>
      )}
    </>
  );
}
