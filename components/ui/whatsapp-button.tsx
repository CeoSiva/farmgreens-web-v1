"use client"

import { Button } from "./button"
import { FaWhatsapp } from "react-icons/fa";

export function WhatsAppButton() {
  const phoneNumber = "919790381233"
  const message = "Hello FarmGreens, I would like to know more about your products."
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact on WhatsApp"
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#128C7E] shadow-lg"
        >
          <FaWhatsapp className="size-7 text-white" />
        </Button>
      </a>
    </div>
  )
}
