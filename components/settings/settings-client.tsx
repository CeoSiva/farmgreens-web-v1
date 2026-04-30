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
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Building, Map as MapIcon, Plus, Trash2, Edit2, MoreVertical } from "lucide-react"
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

  const fetchLocations = async (id: string) => {
    const [resAreas, resApts] = await Promise.all([
      listAreasByDistrictAction(id),
      listApartmentsByDistrictAction(id)
    ])
    setAreas((resAreas as any).areas)
    setApartments((resApts as any).apartments)
  }

  useEffect(() => {
    if (!selectedDistrictId) {
      setAreas([])
      setApartments([])
      return
    }
    startTransition(async () => {
      await fetchLocations(selectedDistrictId)
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
        await fetchLocations(selectedDistrictId)
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
        await fetchLocations(selectedDistrictId)
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
        await fetchLocations(selectedDistrictId)
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
        await fetchLocations(selectedDistrictId)
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
        await fetchLocations(selectedDistrictId)
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
        await fetchLocations(selectedDistrictId)
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
        await fetchLocations(selectedDistrictId)
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
        await fetchLocations(selectedDistrictId)
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
        <Card className="flex overflow-hidden border">
          {/* Left Sidebar: Districts */}
          <div className="w-1/3 max-w-[300px] border-r bg-muted/30 flex flex-col min-h-[500px]">
            <div className="p-4 border-b bg-muted/50 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <div className="font-semibold text-base">Districts</div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2 grid gap-1">
                {districts.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 text-center">
                    No districts yet.
                  </div>
                ) : (
                  districts.map((d) => (
                    <div
                      key={d._id}
                      className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                        String(d._id) === selectedDistrictId
                          ? "bg-primary text-primary-foreground font-medium shadow-sm"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      }`}
                      onClick={() => setSelectedDistrictId(String(d._id))}
                    >
                      <span className="truncate">{d.name}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 ${
                              String(d._id) === selectedDistrictId ? "text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground" : ""
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRenameDistrict(String(d._id))
                            }}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveDistrict(String(d._id))
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="p-3 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  placeholder="New district..."
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                  disabled={isPending}
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  className="h-8 px-3"
                  onClick={addDistrict}
                  disabled={isPending || !newDistrictName}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Main Content: District Details */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedDistrictId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                <MapPin className="h-12 w-12 opacity-20 mb-4" />
                <p>Select a district from the sidebar to manage areas and apartments.</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b flex items-center justify-between">
                  <h2 className="text-xl font-semibold tracking-tight truncate pr-4">
                    {districtById.get(selectedDistrictId)?.name ?? "Unknown"}
                  </h2>
                </div>
                
                <div className="p-6 flex-1 overflow-auto">
                  <Tabs defaultValue="areas" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="areas" className="flex items-center gap-2">
                        <MapIcon className="h-4 w-4" />
                        Areas
                      </TabsTrigger>
                      <TabsTrigger value="apartments" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Apartments
                      </TabsTrigger>
                    </TabsList>

                    {/* Areas Sub-Tab */}
                    <TabsContent value="areas" className="mt-0 space-y-4">
                      <div className="flex gap-3">
                        <Input
                          placeholder="New area name..."
                          value={newAreaName}
                          onChange={(e) => setNewAreaName(e.target.value)}
                          disabled={isPending}
                          className="max-w-xs"
                        />
                        <Button
                          onClick={addArea}
                          disabled={isPending || !newAreaName}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Area
                        </Button>
                      </div>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Area Name</TableHead>
                              <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {areas.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                                  No areas defined in this district.
                                </TableCell>
                              </TableRow>
                            ) : (
                              areas.map((a) => (
                                <TableRow key={a._id}>
                                  <TableCell className="font-medium">{a.name}</TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleRenameArea(String(a._id), a.name)}>
                                          <Edit2 className="mr-2 h-4 w-4" />
                                          Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleRemoveArea(String(a._id))}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="bulk-areas">
                          <AccordionTrigger className="text-sm font-medium">Bulk Add Areas</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid gap-3 pt-2">
                              <p className="text-xs text-muted-foreground">Enter one area name per line.</p>
                              <Textarea
                                className="min-h-[100px]"
                                placeholder="Area 1&#10;Area 2&#10;Area 3"
                                value={bulkAreaNames}
                                onChange={(e) => setBulkAreaNames(e.target.value)}
                                disabled={isPending}
                              />
                              <div>
                                <Button
                                  onClick={bulkAddAreas}
                                  disabled={isPending || !bulkAreaNames.trim()}
                                  variant="secondary"
                                >
                                  Submit Bulk Add
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TabsContent>

                    {/* Apartments Sub-Tab */}
                    <TabsContent value="apartments" className="mt-0 space-y-4">
                      <div className="flex flex-wrap gap-3">
                        <Input
                          placeholder="New apartment name..."
                          value={newApartmentName}
                          onChange={(e) => setNewApartmentName(e.target.value)}
                          disabled={isPending}
                          className="flex-1 min-w-[200px]"
                        />
                        <Select
                          value={newApartmentDeliveryDay}
                          onValueChange={setNewApartmentDeliveryDay}
                          disabled={isPending}
                        >
                          <SelectTrigger className="w-[160px]">
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
                          disabled={isPending || !newApartmentName}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Apartment
                        </Button>
                      </div>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Apartment Name</TableHead>
                              <TableHead>Delivery Day</TableHead>
                              <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {apartments.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                  No apartments defined in this district.
                                </TableCell>
                              </TableRow>
                            ) : (
                              apartments.map((a) => (
                                <TableRow key={a._id}>
                                  {editingApartmentId === String(a._id) ? (
                                    <TableCell colSpan={3} className="p-2">
                                      <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md border border-dashed">
                                        <Input
                                          value={editApartmentName}
                                          onChange={(e) => setEditApartmentName(e.target.value)}
                                          disabled={isPending}
                                          className="flex-1 h-9"
                                        />
                                        <Select
                                          value={editApartmentDeliveryDay}
                                          onValueChange={setEditApartmentDeliveryDay}
                                          disabled={isPending}
                                        >
                                          <SelectTrigger className="w-[160px] h-9 bg-background">
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
                                          size="sm"
                                          onClick={handleUpdateApartment}
                                          disabled={isPending || !editApartmentName.trim()}
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={cancelEditApartment}
                                          disabled={isPending}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </TableCell>
                                  ) : (
                                    <>
                                      <TableCell className="font-medium">{a.name}</TableCell>
                                      <TableCell>
                                        {a.deliveryDay != null ? (
                                          <Badge variant="outline" className="font-normal text-xs bg-secondary/50">
                                            {DAYS_OF_WEEK.find(d => parseInt(d.value) === a.deliveryDay)?.label}
                                          </Badge>
                                        ) : (
                                          <span className="text-muted-foreground text-xs italic">Unscheduled</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => startEditApartment(a)}>
                                              <Edit2 className="mr-2 h-4 w-4" />
                                              Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleRemoveApartment(String(a._id))}>
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    </>
                                  )}
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="bulk-apartments">
                          <AccordionTrigger className="text-sm font-medium">Bulk Add Apartments</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid gap-3 pt-2">
                              <p className="text-xs text-muted-foreground">Enter one apartment name per line.</p>
                              <Textarea
                                className="min-h-[100px]"
                                placeholder="Apartment A&#10;Apartment B&#10;Apartment C"
                                value={bulkApartmentNames}
                                onChange={(e) => setBulkApartmentNames(e.target.value)}
                                disabled={isPending}
                              />
                              <div>
                                <Button
                                  onClick={bulkAddApartments}
                                  disabled={isPending || !bulkApartmentNames.trim()}
                                  variant="secondary"
                                >
                                  Submit Bulk Add
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </div>
        </Card>
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
