"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  User,
  MapPin,
  Package,
  CreditCard,
  Calendar,
  Hash,
  Phone,
  Info,
  FileDown,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatQuantity } from "@/lib/utils/format"
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const STATUS_CONFIG: Record<
  string,
  {
    label: string
    variant: "default" | "secondary" | "outline" | "destructive"
    className: string
  }
> = {
  placed: {
    label: "Order Placed",
    variant: "outline",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  confirmed: {
    label: "Confirmed",
    variant: "secondary",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  dispatched: {
    label: "Dispatched",
    variant: "secondary",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  delivered: {
    label: "Delivered",
    variant: "default",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  paid: {
    label: "Paid",
    variant: "default",
    className: "bg-green-100 text-green-700 border-green-200",
  },
}

export function OrderDetailsDrawer({
  order,
  open,
  onOpenChange,
}: {
  order: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!order) return null

  const address = order.shippingAddress
  const customer = order.customer
  const status = STATUS_CONFIG[order.status] || {
    label: order.status,
    variant: "secondary",
    className: "",
  }

  const handleDownloadInvoice = () => {
    const doc = new jsPDF()

    // Create Image object for logo
    const img = new Image()
    img.src = "/assets/farm-greens-logo-full.png"

    img.onload = () => {
      // Add Branding / Header
      // Logo (scaled to fit)
      const imgWidth = 64
      const imgHeight = (img.height * imgWidth) / img.width
      doc.addImage(img, "PNG", 14, 10, imgWidth, imgHeight)

      doc.setFontSize(18)
      doc.setTextColor(0)
      doc.text("INVOICE", 140, 20)

      doc.setFontSize(10)
      doc.text(`Order #: ${order.orderNumber}`, 140, 26)
      doc.text(
        `Date: ${new Date(order.createdAt).toLocaleDateString()}`,
        140,
        31
      )

      // Line Separator
      doc.setDrawColor(200)
      doc.line(14, 45, 196, 45)

      // Billing Details
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Billed To:", 14, 55)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(customer.name, 14, 61)
      doc.text(`${address.door}, ${address.street}`, 14, 66)
      doc.text(`${address.areaName}, ${address.districtName}`, 14, 71)
      doc.text(`Contact: ${customer.mobile}`, 14, 76)

      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Payment Method:", 140, 55)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text("Cash On Delivery (COD)", 140, 61)

      // Item Table
      const tableData = order.items.map((item: any) => {
        const isCombo = item.itemType === "combo"
        const itemName = isCombo ? item.comboName : item.name
        const itemQty = isCombo ? 1 : item.qty

        return [
          itemName,
          `Rs. ${item.price.toFixed(2)}`,
          isCombo ? "1" : formatQuantity(itemQty, item.unit || "unit"),
          `Rs. ${(item.price * itemQty).toFixed(2)}`,
        ]
      })

      autoTable(doc, {
        startY: 85,
        head: [["Product", "Price", "Qty", "Total"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [22, 163, 74] },
        margin: { left: 14, right: 14 },
      })

      // Summary
      const finalY = (doc as any).lastAutoTable.finalY + 10
      doc.setFontSize(10)
      doc.text("Subtotal:", 140, finalY)
      doc.text(`Rs. ${order.subtotal.toFixed(2)}`, 196, finalY, {
        align: "right",
      })

      doc.text("Delivery Fee:", 140, finalY + 6)
      doc.text(`Rs. ${order.deliveryFee.toFixed(2)}`, 196, finalY + 6, {
        align: "right",
      })

      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Grand Total:", 140, finalY + 14)
      doc.text(`Rs. ${order.total.toFixed(2)}`, 196, finalY + 14, {
        align: "right",
      })

      // Footer
      doc.setFontSize(9)
      doc.setFont("helvetica", "italic")
      doc.setTextColor(150)
      doc.text(
        "Thank you for choosing FarmGreens! Stay healthy, eat fresh.",
        105,
        finalY + 30,
        { align: "center" }
      )

      doc.save(`FarmGreens_Invoice_${order.orderNumber}.pdf`)
    }

    // Handle image load error
    img.onerror = () => {
      // Fallback without logo if image fails
      console.error("Failed to load invoice logo")
      // ... minimal fallback logic or just proceed with blank header ...
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="border-l-0 px-4 shadow-2xl sm:max-w-md md:max-w-xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4" />
              <span className="font-mono text-xs tracking-tighter uppercase">
                Order ID
              </span>
            </div>
            <Badge
              className={cn("font-semibold capitalize", status.className)}
              variant={status.variant}
            >
              {status.label}
            </Badge>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold">
              {order.orderNumber}
            </SheetTitle>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-2"
              onClick={handleDownloadInvoice}
            >
              <FileDown className="h-4 w-4" />
              Invoice
            </Button>
          </div>
          <SheetDescription className="mt-1 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Placed on{" "}
            {new Date(order.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <ScrollArea className="mt-4 h-[calc(100vh-140px)] pr-4">
          <div className="space-y-8 pb-10">
            {/* Customer Section */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold tracking-widest uppercase">
                  Customer
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/50 bg-muted/30 p-4">
                <div className="group flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      Ful Name
                    </p>
                    <p className="text-sm font-semibold">{customer.name}</p>
                  </div>
                </div>
                <div className="group flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      Contact Number
                    </p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {customer.countryCode} {customer.mobile}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Shipping Section */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-full bg-orange-100 p-2 text-orange-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold tracking-widest uppercase">
                  Shipping To
                </h3>
              </div>
              <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                <div className="space-y-1.5 text-sm leading-relaxed">
                  <p className="font-bold text-primary">{customer.name}</p>
                  <div className="space-y-0.5">
                    <p>
                      {address.door}, {address.street}
                    </p>
                    <p className="font-medium">
                      {address.areaName}, {address.districtName}
                    </p>
                  </div>
                </div>
                {address.lat && address.lng && (
                  <a
                    href={`https://www.google.com/maps?q=${address.lat},${address.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on Google Maps
                  </a>
                )}
              </div>
            </section>

            {/* Items Section */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                  <Package className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold tracking-widest uppercase">
                  Basket Items
                </h3>
              </div>
              <div className="space-y-3">
                {order.items.map((item: any, idx: number) => {
                  const isCombo = item.itemType === "combo"
                  const itemName = isCombo ? item.comboName : item.name
                  const itemQty = isCombo ? 1 : item.qty

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-border/40 bg-white p-3 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-bold">{itemName}</p>
                        {!isCombo && (
                          <p className="text-xs text-muted-foreground">
                            ₹{item.price.toFixed(2)} / {item.unit}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="mb-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          ×{" "}
                          {isCombo
                            ? "1"
                            : formatQuantity(itemQty, item.unit || "unit")}
                        </p>
                        <p className="text-sm font-bold text-primary">
                          ₹{(item.price * itemQty).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Payment Summary */}
            <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-xl">
              <div className="mb-6 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold tracking-widest uppercase opacity-80">
                  Payment Metrics
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm opacity-70">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm opacity-70">
                  <span>Standard Delivery</span>
                  <span>₹{order.deliveryFee.toFixed(2)}</span>
                </div>
                <Separator className="my-4 bg-white/10" />
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold">Total Amount</span>
                  <span className="text-2xl font-black text-emerald-400">
                    ₹{order.total.toFixed(2)}
                  </span>
                </div>
                <div className="mt-6 flex w-fit items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <Info className="h-3 w-3 text-white/40" />
                  <p className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                    Payment Via: {order.paymentMethod} (Cash On Delivery)
                  </p>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
