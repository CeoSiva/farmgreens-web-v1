"use client"

import * as React from "react"
import { useTransition } from "react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  User,
  MapPin,
  Phone,
  Hash,
  ShoppingBag,
  Save,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { updateCustomerAdminAction } from "@/server/actions/customer"

export function CustomerDetailsDrawer({
  customer,
  open,
  onOpenChange,
}: {
  customer: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = React.useState({
    name: "",
    mobile: "",
  })

  React.useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        mobile: customer.mobile || "",
      })
    }
  }, [customer])

  if (!customer) return null

  const handleUpdate = () => {
    startTransition(async () => {
      try {
        const res = await updateCustomerAdminAction(customer._id, {
          name: formData.name,
          mobile: formData.mobile,
        })
        if (res.success) {
          toast.success("Customer updated successfully")
          onOpenChange(false)
        } else {
          toast.error(res.error || "Failed to update customer")
        }
      } catch (error) {
        toast.error("An unexpected error occurred")
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-xl border-l-0 shadow-2xl px-4">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-tighter">Customer ID</span>
          </div>
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            {customer.name}
            {customer.whatsappOptIn && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-green-500/10 text-green-600 border-green-500/20 font-medium">
                WhatsApp Opted
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            View and edit customer profile information.
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <ScrollArea className="h-[calc(100vh-140px)] pr-4 mt-4">
          <div className="space-y-8 pb-10">
            {/* Edit Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Edit Details</h3>
              </div>
              <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="+91 9876543210"
                  />
                </div>
                <Button 
                  className="w-full mt-2" 
                  onClick={handleUpdate} 
                  disabled={isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </section>

            {/* Metrics Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Orders Summary</h3>
              </div>
              <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-tight">Total Orders</p>
                  <p className="text-3xl font-black text-blue-900">{customer.orderCount || 0}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs font-medium text-blue-700/60 leading-tight">Last activity<br/>{customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : "-"}</p>
                </div>
              </div>
            </section>

            {/* saved Addresses */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Saved Addresses</h3>
              </div>
              <div className="space-y-3">
                {customer.addresses?.length > 0 ? (
                  customer.addresses.map((addr: any, idx: number) => (
                    <div key={idx} className="bg-muted/30 p-4 rounded-xl border border-border/50 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-primary">{addr.label || "Address " + (idx + 1)}</p>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">Default</span>
                        )}
                      </div>
                      <p className="text-muted-foreground">{addr.door}, {addr.street}</p>
                      {addr.lat && addr.lng && (
                        <a
                          href={`https://www.google.com/maps?q=${addr.lat},${addr.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on Google Maps
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-center py-4 text-muted-foreground italic">No addresses saved yet.</p>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
