"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ComboImageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  imageAlt: string
}

export function ComboImageModal({
  open,
  onOpenChange,
  imageUrl,
  imageAlt,
}: ComboImageModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
            "data-open:animate-in data-open:fade-in-0",
            "data-closed:animate-out data-closed:fade-out-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            "outline-none"
          )}
        >
          <div className="relative h-full w-full max-w-4xl max-h-[90vh] mx-auto my-auto flex items-center justify-center p-4">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-contain rounded-lg"
              sizes="(max-width: 768px) 100vw, 80vw"
              priority
              unoptimized={
                imageUrl.startsWith("/") || imageUrl.includes("placeholder")
              }
            />
          </div>

          <DialogPrimitive.Close
            className={cn(
              "absolute right-4 top-4 z-[60] rounded-full p-2",
              "bg-black/50 text-white hover:bg-black/70 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-white/50"
            )}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
