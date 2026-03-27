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
  FileDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const STATUS_CONFIG: Record<string, { label: string, variant: "default" | "secondary" | "outline" | "destructive", className: string }> = {
  placed: { label: "Order Placed", variant: "outline", className: "bg-slate-100 text-slate-700 border-slate-200" },
  confirmed: { label: "Confirmed", variant: "secondary", className: "bg-blue-100 text-blue-700 border-blue-200" },
  dispatched: { label: "Dispatched", variant: "secondary", className: "bg-orange-100 text-orange-700 border-orange-200" },
  delivered: { label: "Delivered", variant: "default", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", variant: "destructive", className: "bg-red-100 text-red-700 border-red-200" },
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
  const status = STATUS_CONFIG[order.status] || { label: order.status, variant: "secondary", className: "" }

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
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 140, 31)
      
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
      const tableData = order.items.map((item: any) => [
        item.name,
        `Rs. ${item.price.toFixed(2)}`,
        item.qty,
        `Rs. ${(item.price * item.qty).toFixed(2)}`
      ])
      
      autoTable(doc, {
        startY: 85,
        head: [['Product', 'Price', 'Qty', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] },
        margin: { left: 14, right: 14 }
      })
      
      // Summary
      const finalY = (doc as any).lastAutoTable.finalY + 10
      doc.setFontSize(10)
      doc.text("Subtotal:", 140, finalY)
      doc.text(`Rs. ${order.subtotal.toFixed(2)}`, 196, finalY, { align: 'right' })
      
      doc.text("Delivery Fee:", 140, finalY + 6)
      doc.text(`Rs. ${order.deliveryFee.toFixed(2)}`, 196, finalY + 6, { align: 'right' })
      
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Grand Total:", 140, finalY + 14)
      doc.text(`Rs. ${order.total.toFixed(2)}`, 196, finalY + 14, { align: 'right' })
      
      // Footer
      doc.setFontSize(9)
      doc.setFont("helvetica", "italic")
      doc.setTextColor(150)
      doc.text("Thank you for choosing FarmGreens! Stay healthy, eat fresh.", 105, finalY + 30, { align: 'center' })
      
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
      <SheetContent className="sm:max-w-md md:max-w-xl border-l-0 shadow-2xl px-4">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4" />
              <span className="text-xs font-mono uppercase tracking-tighter">Order ID</span>
            </div>
            <Badge className={cn("capitalize font-semibold", status.className)} variant={status.variant}>
              {status.label}
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-1">
            <SheetTitle className="text-2xl font-bold">
              {order.orderNumber}
            </SheetTitle>
            <Button size="sm" variant="outline" className="h-8 gap-2" onClick={handleDownloadInvoice}>
              <FileDown className="h-4 w-4" />
              Invoice
            </Button>
          </div>
          <SheetDescription className="flex items-center gap-1.5 mt-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Placed on {new Date(order.createdAt).toLocaleString(undefined, { 
              dateStyle: 'medium', 
              timeStyle: 'short' 
            })}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <ScrollArea className="h-[calc(100vh-140px)] pr-4 mt-4">
          <div className="space-y-8 pb-10">
            {/* Customer Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Customer</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                <div className="flex justify-between items-center group">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Ful Name</p>
                    <p className="text-sm font-semibold">{customer.name}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center group">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Contact Number</p>
                    <div className="flex items-center gap-2">
                       <Phone className="h-3 w-3 text-muted-foreground" />
                       <p className="text-sm font-medium">{customer.countryCode} {customer.mobile}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Shipping Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Shipping To</h3>
              </div>
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                <div className="text-sm space-y-1.5 leading-relaxed">
                  <p className="font-bold text-primary">{customer.name}</p>
                  <div className="space-y-0.5">
                    <p>{address.door}, {address.street}</p>
                    <p className="font-medium">{address.areaName}, {address.districtName}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Items Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <Package className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Basket Items</h3>
              </div>
              <div className="space-y-3">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-border/40 shadow-sm transition-all hover:shadow-md">
                    <div className="flex-1">
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ₹{item.price.toFixed(2)} / {item.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full inline-block mb-1">
                        × {item.qty}
                      </p>
                      <p className="text-sm font-bold text-primary">
                        ₹{(item.price * item.qty).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Payment Summary */}
            <section className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                 <CreditCard className="h-5 w-5 text-emerald-400" />
                 <h3 className="text-sm font-bold uppercase tracking-widest opacity-80">Payment Metrics</h3>
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
                <Separator className="bg-white/10 my-4" />
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold">Total Amount</span>
                  <span className="text-2xl font-black text-emerald-400">₹{order.total.toFixed(2)}</span>
                </div>
                <div className="mt-6 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-white/5 border border-white/10 w-fit">
                  <Info className="h-3 w-3 text-white/40" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
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
