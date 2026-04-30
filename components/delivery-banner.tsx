"use client";

import { Leaf } from "lucide-react";

export function DeliveryBanner({ message }: { message: string }) {
  if (!message || message.trim() === "") {
    return null;
  }

  return (
    <div className="w-full px-4 pt-8 pb-2">
      <div className="max-w-4xl mx-auto overflow-hidden rounded-2xl border border-primary/15 bg-linear-to-b from-white to-green-50/30 p-4 md:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-primary">
            <Leaf className="h-6 w-6" />
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-primary/70">
              Delivery Information
            </div>
            <p className="text-base md:text-lg font-medium text-zinc-900 balance">
              {message}
            </p>
          </div>
          
          <div className="hidden lg:flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 self-center">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Live Updates
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
