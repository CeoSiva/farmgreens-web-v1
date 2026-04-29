"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createDistrictAction,
  createAreaAction,
  deleteAreaAction,
  deleteDistrictAction,
  renameAreaAction,
  renameDistrictAction,
  bulkCreateAreasAction,
  createApartmentAction,
  deleteApartmentAction,
  updateApartmentAction,
  bulkCreateApartmentsAction,
} from "@/server/actions/location-admin"
import {
  updateDeliveryFeeAction,
  updateStoreProfileAction,
} from "@/server/actions/setting"
import { listAreasByDistrictAction, listApartmentsByDistrictAction } from "@/server/actions/location"

export function SettingsClient({
  settings,
  districts,
  bannerMessage,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  districts: any[]
  bannerMessage: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [storeName, setStoreName] = useState(settings.storeName ?? "")
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone ?? "")
  const [supportWhatsapp, setSupportWhatsapp] = useState(
    settings.supportWhatsapp ?? ""
  )
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress ?? "")

  const [deliveryFee, setDeliveryFee] = useState(
    String(settings.deliveryFee ?? 0)
  )
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(
    String(settings.freeDeliveryThreshold ?? 500)
  )

  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(
    districts?.[0]?._id ? String(districts[0]._id) : ""
  )
  const [areas, setAreas] = useState<any[]>([])
  const [apartments, setApartments] = useState<any[]>([])

  const [newDistrictName, setNewDistrictName] = useState("")
  const [newAreaName, setNewAreaName] = useState("")
  const [bulkAreaNames, setBulkAreaNames] = useState("")

  const [newApartmentName, setNewApartmentName] = useState("")
  const [newApartmentDeliveryDay, setNewApartmentDeliveryDay] = useState<string>("none")
  const [bulkApartmentNames, setBulkApartmentNames] = useState("")

  const [editingApartmentId, setEditingApartmentId] = useState<string | null>(null)
  const [editApartmentName, setEditApartmentName] = useState("")
  const [editApartmentDeliveryDay, setEditApartmentDeliveryDay] = useState<string>("none")

  const DAYS_OF_WEEK = [
    { value: "0", label: "Sunday" },
    { value: "1", label: "Monday" },
    { value: "2", label: "Tuesday" },
    { value: "3", label: "Wednesday" },
    { value: "4", label: "Thursday" },
    { value: "5", label: "Friday" },
    { value: "6", label: "Saturday" },
  ]

  const [deliveryBannerMessage, setDeliveryBannerMessage] = useState(bannerMessage)

  useEffect(() => {
    if (!selectedDistrictId) {
      setAreas([])
      setApartments([])
      return
    }
    startTransition(async () => {
      const [resAreas, resApts] = await Promise.all([
        listAreasByDistrictAction(selectedDistrictId),
        listApartmentsByDistrictAction(selectedDistrictId)
      ])
      setAreas((resAreas as any).areas)
      setApartments((resApts as any).apartments)
    })
  }, [selectedDistrictId])

  const districtById = useMemo(() => {
    const m = new Map<string, any>()
    for (const d of districts) m.set(String(d._id), d)
    return m
  }, [districts])

  const saveStoreProfile = () => {
    startTransition(async () => {
      const res = await updateStoreProfileAction({
        storeName,
        supportPhone,
        supportWhatsapp,
        storeAddress,
      })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("Store profile saved")
        router.refresh()
      }
    })
  }

  const saveDeliveryFee = () => {
    startTransition(async () => {
      const res = await updateDeliveryFeeAction({
        deliveryFee: Number(deliveryFee),
        freeDeliveryThreshold: Number(freeDeliveryThreshold),
      })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("Delivery fee saved")
        router.refresh()
      }
    })
  }

  const saveDeliveryBanner = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/settings/delivery-banner", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: deliveryBannerMessage }),
        })
        const data = await res.json()
        if (data.error) toast.error(data.error)
        else {
          toast.success("Delivery banner updated")
          router.refresh()
        }
      } catch {
        toast.error("Failed to update delivery banner")
      }
    })
  }

  const addDistrict = () => {
    startTransition(async () => {
      const res = await createDistrictAction({ name: newDistrictName })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("District created")
        setNewDistrictName("")
        router.refresh()
      }
    })
  }

  const handleRenameDistrict = (id: string) => {
    const current = districtById.get(id)
    const name = window.prompt("Rename district", current?.name ?? "")
    if (!name) return
    startTransition(async () => {
      const res = await renameDistrictAction({ id, name })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("District renamed")
        router.refresh()
      }
    })
  }

  const handleRemoveDistrict = (id: string) => {
    if (!window.confirm("Delete this district?")) return
    startTransition(async () => {
      const res = await deleteDistrictAction({ id })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("District deleted")
        if (selectedDistrictId === id) setSelectedDistrictId("")
        router.refresh()
      }
    })
  }

  const addArea = () => {
    if (!selectedDistrictId) {
      toast.error("Select a district first")
      return
    }
    startTransition(async () => {
      const res = await createAreaAction({
        districtId: selectedDistrictId,
        name: newAreaName,
      })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("Area created")
        setNewAreaName("")
        router.refresh()
      }
    })
  }

  const handleRenameArea = (id: string, currentName: string) => {
    const name = window.prompt("Rename area", currentName)
    if (!name) return
    startTransition(async () => {
      const res = await renameAreaAction({ id, name })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("Area renamed")
        router.refresh()
      }
    })
  }

  const handleRemoveArea = (id: string) => {
    if (!window.confirm("Delete this area?")) return
    startTransition(async () => {
      const res = await deleteAreaAction({ id })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("Area deleted")
        router.refresh()
      }
    })
  }

  const bulkAddAreas = () => {
    if (!selectedDistrictId) {
      toast.error("Select a district first")
      return
    }
    const names = bulkAreaNames
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean)
    if (names.length === 0) {
      toast.error("Enter at least one area name")
      return
    }
    startTransition(async () => {
      const res = await bulkCreateAreasAction({
        districtId: selectedDistrictId,
        names,
      })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success(`Created ${(res as any).count} areas`)
        setBulkAreaNames("")
        router.refresh()
      }
    })
  }

  const addApartment = () => {
    if (!selectedDistrictId) {
      toast.error("Select a district first")
      return
    }
    startTransition(async () => {
      const deliveryDayNum = newApartmentDeliveryDay === "none" ? null : parseInt(newApartmentDeliveryDay)
      const res = await createApartmentAction({
        districtId: selectedDistrictId,
        name: newApartmentName,
        deliveryDay: deliveryDayNum,
      })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("Apartment created")
        setNewApartmentName("")
        setNewApartmentDeliveryDay("none")
        router.refresh()
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startEditApartment = (a: any) => {
    setEditingApartmentId(String(a._id))
    setEditApartmentName(a.name)
    setEditApartmentDeliveryDay(a.deliveryDay != null ? String(a.deliveryDay) : "none")
  }

  const cancelEditApartment = () => {
    setEditingApartmentId(null)
    setEditApartmentName("")
    setEditApartmentDeliveryDay("none")
  }

  const handleUpdateApartment = () => {
    if (!editingApartmentId || !editApartmentName.trim()) return
    startTransition(async () => {
      const deliveryDayNum = editApartmentDeliveryDay === "none" ? null : parseInt(editApartmentDeliveryDay)
      const res = await updateApartmentAction({ 
        id: editingApartmentId, 
        name: editApartmentName,
        deliveryDay: deliveryDayNum
      })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("Apartment updated")
        setEditingApartmentId(null)
        router.refresh()
      }
    })
  }

  const handleRemoveApartment = (id: string) => {
    if (!window.confirm("Delete this apartment?")) return
    startTransition(async () => {
      const res = await deleteApartmentAction({ id })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("Apartment deleted")
        router.refresh()
      }
    })
  }

  const bulkAddApartments = () => {
    if (!selectedDistrictId) {
      toast.error("Select a district first")
      return
    }
    const names = bulkApartmentNames
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean)
    if (names.length === 0) {
      toast.error("Enter at least one apartment name")
      return
    }
    startTransition(async () => {
      const res = await bulkCreateApartmentsAction({
        districtId: selectedDistrictId,
        names,
      })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success(`Created ${(res as any).count} apartments`)
        setBulkApartmentNames("")
        router.refresh()
      }
    })
  }

  return (
    <Tabs defaultValue="store" className="w-full">
      <TabsList>
        <TabsTrigger value="store">Store</TabsTrigger>
        <TabsTrigger value="delivery">Delivery</TabsTrigger>
        <TabsTrigger value="locations">Locations</TabsTrigger>
        <TabsTrigger value="banner">Delivery Banner</TabsTrigger>
      </TabsList>

      <TabsContent value="store" className="mt-4">
        <Card className="grid gap-3 p-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Store name</label>
            <Input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Support phone</label>
              <Input
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">WhatsApp</label>
              <Input
                value={supportWhatsapp}
                onChange={(e) => setSupportWhatsapp(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Store address</label>
            <Input
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div>
            <Button onClick={saveStoreProfile} disabled={isPending}>
              Save
            </Button>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="delivery" className="mt-4">
        <Card className="grid gap-3 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Flat delivery fee (₹)</label>
              <Input
                type="number"
                min={0}
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Free Delivery Minimum Order (₹)</label>
              <Input
                type="number"
                min={0}
                value={freeDeliveryThreshold}
                onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          <div>
            <Button onClick={saveDeliveryFee} disabled={isPending}>
              Save
            </Button>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="locations" className="mt-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <div className="font-medium">Districts</div>
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="New district"
                value={newDistrictName}
                onChange={(e) => setNewDistrictName(e.target.value)}
                disabled={isPending}
              />
              <Button
                onClick={addDistrict}
                disabled={isPending || !newDistrictName}
              >
                Add
              </Button>
            </div>
            <div className="mt-4 grid gap-2">
              {districts.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No districts yet.
                </div>
              ) : (
                districts.map((d) => (
                  <button
                    key={d._id}
                    type="button"
                    onClick={() => setSelectedDistrictId(String(d._id))}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                      String(d._id) === selectedDistrictId
                        ? "bg-muted"
                        : "bg-background"
                    }`}
                    disabled={isPending}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{d.name}</span>
                      <span className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleRenameDistrict(String(d._id))
                          }}
                          disabled={isPending}
                        >
                          Rename
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleRemoveDistrict(String(d._id))
                          }}
                          disabled={isPending}
                        >
                          Delete
                        </Button>
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="p-4">
              <div className="font-medium">Areas</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {selectedDistrictId
                ? `For district: ${districtById.get(selectedDistrictId)?.name ?? ""}`
                : "Select a district to manage areas."}
            </div>

            <div className="mt-3 flex gap-2">
              <Input
                placeholder="New area"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                disabled={isPending || !selectedDistrictId}
              />
              <Button
                onClick={addArea}
                disabled={isPending || !selectedDistrictId || !newAreaName}
              >
                Add
              </Button>
            </div>

            <div className="mt-3 grid gap-2">
              <div className="text-xs font-medium text-muted-foreground">
                Bulk add (one area per line)
              </div>
              <textarea
                className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={"Area 1\nArea 2\nArea 3"}
                value={bulkAreaNames}
                onChange={(e) => setBulkAreaNames(e.target.value)}
                disabled={isPending || !selectedDistrictId}
              />
              <div>
                <Button
                  onClick={bulkAddAreas}
                  disabled={
                    isPending || !selectedDistrictId || !bulkAreaNames.trim()
                  }
                  variant="secondary"
                  size="sm"
                >
                  Bulk Add
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {areas.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No areas yet.
                </div>
              ) : (
                areas.map((a) => (
                  <div
                    key={a._id}
                    className="rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{a.name}</span>
                      <span className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRenameArea(String(a._id), a.name)
                          }
                          disabled={isPending}
                        >
                          Rename
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveArea(String(a._id))}
                          disabled={isPending}
                        >
                          Delete
                        </Button>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="font-medium">Apartments</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {selectedDistrictId
                ? `For district: ${districtById.get(selectedDistrictId)?.name ?? ""}`
                : "Select a district to manage apartments."}
            </div>

            <div className="mt-3 flex gap-2">
              <Input
                placeholder="New apartment"
                value={newApartmentName}
                onChange={(e) => setNewApartmentName(e.target.value)}
                disabled={isPending || !selectedDistrictId}
                className="flex-1"
              />
              <Select
                value={newApartmentDeliveryDay}
                onValueChange={setNewApartmentDeliveryDay}
                disabled={isPending || !selectedDistrictId}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Delivery Day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific day</SelectItem>
                  {DAYS_OF_WEEK.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={addApartment}
                disabled={isPending || !selectedDistrictId || !newApartmentName}
              >
                Add
              </Button>
            </div>

            <div className="mt-3 grid gap-2">
              <div className="text-xs font-medium text-muted-foreground">
                Bulk add (one apartment per line)
              </div>
              <textarea
                className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={"Apartment A\nApartment B\nApartment C"}
                value={bulkApartmentNames}
                onChange={(e) => setBulkApartmentNames(e.target.value)}
                disabled={isPending || !selectedDistrictId}
              />
              <div>
                <Button
                  onClick={bulkAddApartments}
                  disabled={
                    isPending || !selectedDistrictId || !bulkApartmentNames.trim()
                  }
                  variant="secondary"
                  size="sm"
                >
                  Bulk Add
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {apartments.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No apartments yet.
                </div>
              ) : (
                apartments.map((a) => (
                  <div
                    key={a._id}
                    className="rounded-md border px-3 py-2 text-sm"
                  >
                    {editingApartmentId === String(a._id) ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editApartmentName}
                          onChange={(e) => setEditApartmentName(e.target.value)}
                          disabled={isPending}
                          className="flex-1 h-8"
                        />
                        <Select
                          value={editApartmentDeliveryDay}
                          onValueChange={setEditApartmentDeliveryDay}
                          disabled={isPending}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue placeholder="Delivery Day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No specific day</SelectItem>
                            {DAYS_OF_WEEK.map((d) => (
                              <SelectItem key={d.value} value={d.value}>
                                {d.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleUpdateApartment}
                          disabled={isPending || !editApartmentName.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditApartment}
                          disabled={isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{a.name}</span>
                          {a.deliveryDay != null && (
                            <span className="text-xs text-muted-foreground">
                              Delivery: {DAYS_OF_WEEK.find(d => parseInt(d.value) === a.deliveryDay)?.label}
                            </span>
                          )}
                        </div>
                        <span className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => startEditApartment(a)}
                            disabled={isPending}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveApartment(String(a._id))}
                            disabled={isPending}
                          >
                            Delete
                          </Button>
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="banner" className="mt-4">
        <Card className="grid gap-3 p-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Delivery Message</label>
            <Textarea
              value={deliveryBannerMessage}
              onChange={(e) => setDeliveryBannerMessage(e.target.value)}
              placeholder="e.g. Your current orders will be delivered on Monday..."
              disabled={isPending}
              maxLength={200}
              className="min-h-[100px]"
            />
            <div className="text-xs text-muted-foreground text-right">
              {deliveryBannerMessage.length}/200
            </div>
          </div>
          <div>
            <Button onClick={saveDeliveryBanner} disabled={isPending}>
              Save
            </Button>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
