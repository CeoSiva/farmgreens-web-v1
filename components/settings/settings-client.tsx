"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MapPin,
  Building,
  Map as MapIcon,
  Plus,
  Trash2,
  Edit2,
  MoreVertical,
  EyeOff,
} from "lucide-react"
import {
  createDistrictAction,
  updateDistrictAction,
  toggleDistrictCodAction,
  toggleDistrictEnabledAction,
  toggleApartmentCodAction,
  createAreaAction,
  deleteAreaAction,
  deleteDistrictAction,
  renameAreaAction,
  bulkCreateAreasAction,
  createApartmentAction,
  deleteApartmentAction,
  updateApartmentAction,
  bulkCreateApartmentsAction,
  bulkAssignDeliveryDaysAction,
} from "@/server/actions/location-admin"
import {
  updateDeliveryFeeAction,
  updateStoreProfileAction,
} from "@/server/actions/setting"
import {
  listAreasByDistrictAction,
  listApartmentsByDistrictAction,
} from "@/server/actions/location"

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
  const [isCodEnabled, setIsCodEnabled] = useState(
    settings.isCodEnabled ?? true
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
  const [newApartmentDeliveryDays, setNewApartmentDeliveryDays] = useState<
    number[]
  >([])
  const [newApartmentIsCodEnabled, setNewApartmentIsCodEnabled] = useState(true)
  const [bulkApartmentNames, setBulkApartmentNames] = useState("")

  const [editingApartmentId, setEditingApartmentId] = useState<string | null>(
    null
  )
  const [editApartmentName, setEditApartmentName] = useState("")
  const [editApartmentDeliveryDays, setEditApartmentDeliveryDays] = useState<
    number[]
  >([])
  const [editApartmentIsCodEnabled, setEditApartmentIsCodEnabled] =
    useState(true)

  // Bulk weekday assignment state
  const [selectedApartmentIds, setSelectedApartmentIds] = useState<Set<string>>(
    new Set()
  )
  const [bulkAssignDays, setBulkAssignDays] = useState<number[]>([])

  const DAYS_OF_WEEK = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
  ]

  const toggleDay = (days: number[], day: number): number[] =>
    days.includes(day) ? days.filter((d) => d !== day) : [...days, day]

  const dayLabel = (days: number[]) => {
    if (!days || days.length === 0) return null
    return days
      .slice()
      .sort((a, b) => a - b)
      .map((d) => DAYS_OF_WEEK.find((x) => x.value === d)?.label)
      .join(", ")
  }

  const [deliveryBannerMessage, setDeliveryBannerMessage] =
    useState(bannerMessage)

  const fetchLocations = async (id: string) => {
    const [resAreas, resApts] = await Promise.all([
      listAreasByDistrictAction(id),
      listApartmentsByDistrictAction(id, Date.now()),
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

  // Optimistic overrides for districts (since they are passed as props)
  const [districtCodOverrides, setDistrictCodOverrides] = useState<
    Record<string, boolean>
  >({})
  const [districtEnabledOverrides, setDistrictEnabledOverrides] = useState<
    Record<string, boolean>
  >({})

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
        isCodEnabled,
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

  const handleToggleDistrictEnabled = (id: string, enabled: boolean) => {
    // Optimistic update
    setDistrictEnabledOverrides((prev) => ({ ...prev, [id]: enabled }))

    startTransition(async () => {
      const res = await toggleDistrictEnabledAction(id, enabled)
      if ((res as any)?.error) {
        toast.error((res as any).error)
        // Revert on error
        setDistrictEnabledOverrides((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      } else {
        toast.success(
          `District ${enabled ? "enabled" : "disabled"} for customers`
        )
        router.refresh()
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
      const res = await updateDistrictAction({ id, name })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("District renamed")
        router.refresh()
      }
    })
  }

  const handleToggleDistrictCod = (id: string, enabled: boolean) => {
    // Optimistic update
    setDistrictCodOverrides((prev) => ({ ...prev, [id]: enabled }))

    startTransition(async () => {
      const res = await toggleDistrictCodAction(id, enabled)
      if ((res as any)?.error) {
        toast.error((res as any).error)
        // Revert on error
        setDistrictCodOverrides((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      } else {
        toast.success(`COD ${enabled ? "enabled" : "disabled"} for district`)
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
      const res = await createApartmentAction({
        districtId: selectedDistrictId,
        name: newApartmentName,
        deliveryDays: newApartmentDeliveryDays,
        isCodEnabled: newApartmentIsCodEnabled,
      })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("Apartment created")
        setNewApartmentName("")
        setNewApartmentDeliveryDays([])
        setNewApartmentIsCodEnabled(true)
        await fetchLocations(selectedDistrictId)
        router.refresh()
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startEditApartment = (a: any) => {
    setEditingApartmentId(String(a._id))
    setEditApartmentName(a.name)
    setEditApartmentDeliveryDays(
      Array.isArray(a.deliveryDays) ? a.deliveryDays : []
    )
    setEditApartmentIsCodEnabled(a.isCodEnabled !== false)
  }

  const cancelEditApartment = () => {
    setEditingApartmentId(null)
    setEditApartmentName("")
    setEditApartmentDeliveryDays([])
    setEditApartmentIsCodEnabled(true)
  }

  const handleUpdateApartment = () => {
    if (!editingApartmentId || !editApartmentName.trim()) return
    startTransition(async () => {
      const res = await updateApartmentAction({
        id: editingApartmentId,
        name: editApartmentName,
        deliveryDays: editApartmentDeliveryDays,
        isCodEnabled: editApartmentIsCodEnabled,
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

  const handleToggleApartmentCod = (id: string, enabled: boolean) => {
    // Optimistic update
    setApartments((prev) =>
      prev.map((a) =>
        String(a._id) === id ? { ...a, isCodEnabled: enabled } : a
      )
    )

    startTransition(async () => {
      const res = await toggleApartmentCodAction(id, enabled)
      if ((res as any)?.error) {
        toast.error((res as any).error)
        // Revert on error
        await fetchLocations(selectedDistrictId)
      } else {
        toast.success(`COD ${enabled ? "enabled" : "disabled"} for apartment`)
        await fetchLocations(selectedDistrictId)
        router.refresh()
      }
    })
  }

  const handleBulkAssignDays = () => {
    if (selectedApartmentIds.size === 0) return
    startTransition(async () => {
      const res = await bulkAssignDeliveryDaysAction({
        apartmentIds: Array.from(selectedApartmentIds),
        deliveryDays: bulkAssignDays,
      })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success(
          `Delivery days updated for ${selectedApartmentIds.size} apartment(s)`
        )
        setSelectedApartmentIds(new Set())
        setBulkAssignDays([])
        await fetchLocations(selectedDistrictId)
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
              <label className="text-sm font-medium">
                Flat delivery fee (₹)
              </label>
              <Input
                type="number"
                min={0}
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Free Delivery Minimum Order (₹)
              </label>
              <Input
                type="number"
                min={0}
                value={freeDeliveryThreshold}
                onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Payment Options</label>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="codEnabled"
                  checked={isCodEnabled}
                  onChange={(e) => setIsCodEnabled(e.target.checked)}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="codEnabled" className="text-sm">
                  Enable Cash on Delivery (COD)
                </label>
              </div>
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
          <div className="flex min-h-[500px] w-1/3 max-w-[300px] flex-col border-r bg-muted/30">
            <div className="flex items-center gap-2 border-b bg-muted/50 p-4">
              <MapPin className="h-5 w-5 text-primary" />
              <div className="text-base font-semibold">Districts</div>
            </div>

            <ScrollArea className="flex-1">
              <div className="grid gap-1 p-2">
                {districts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No districts yet.
                  </div>
                ) : (
                  districts.map((d) => (
                    <div
                      key={d._id}
                      className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                        String(d._id) === selectedDistrictId
                          ? "bg-primary font-medium text-primary-foreground shadow-sm"
                          : d.isEnabled === false
                            ? "cursor-pointer text-muted-foreground/40 hover:bg-muted hover:text-foreground"
                            : "cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      onClick={() => setSelectedDistrictId(String(d._id))}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {d.isEnabled === false && (
                          <EyeOff className="h-3.5 w-3.5 shrink-0" />
                        )}
                        {d.name}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 ${
                              String(d._id) === selectedDistrictId
                                ? "text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
                                : ""
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

            <div className="border-t bg-background p-3">
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
          <div className="flex min-w-0 flex-1 flex-col">
            {!selectedDistrictId ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-muted-foreground">
                <MapPin className="mb-4 h-12 w-12 opacity-20" />
                <p>
                  Select a district from the sidebar to manage areas and
                  apartments.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b p-6">
                  <h2 className="truncate pr-4 text-xl font-semibold tracking-tight">
                    {districtById.get(selectedDistrictId)?.name ?? "Unknown"}
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Visible</span>
                      <Switch
                        checked={
                          districtEnabledOverrides[selectedDistrictId] !==
                          undefined
                            ? districtEnabledOverrides[selectedDistrictId]
                            : districtById.get(selectedDistrictId)
                                ?.isEnabled !== false
                        }
                        onCheckedChange={(checked) =>
                          handleToggleDistrictEnabled(
                            selectedDistrictId,
                            checked
                          )
                        }
                        disabled={isPending}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">COD Enabled</span>
                      <Switch
                        checked={
                          districtCodOverrides[selectedDistrictId] !== undefined
                            ? districtCodOverrides[selectedDistrictId]
                            : districtById.get(selectedDistrictId)
                                ?.isCodEnabled !== false
                        }
                        onCheckedChange={(checked) =>
                          handleToggleDistrictCod(selectedDistrictId, checked)
                        }
                        disabled={isPending}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                  <Tabs defaultValue="areas" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger
                        value="areas"
                        className="flex items-center gap-2"
                      >
                        <MapIcon className="h-4 w-4" />
                        Areas
                      </TabsTrigger>
                      <TabsTrigger
                        value="apartments"
                        className="flex items-center gap-2"
                      >
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
                              <TableHead className="w-[100px] text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {areas.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={2}
                                  className="h-24 text-center text-muted-foreground"
                                >
                                  No areas defined in this district.
                                </TableCell>
                              </TableRow>
                            ) : (
                              areas.map((a) => (
                                <TableRow key={a._id}>
                                  <TableCell className="font-medium">
                                    {a.name}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleRenameArea(
                                              String(a._id),
                                              a.name
                                            )
                                          }
                                        >
                                          <Edit2 className="mr-2 h-4 w-4" />
                                          Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onClick={() =>
                                            handleRemoveArea(String(a._id))
                                          }
                                        >
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
                          <AccordionTrigger className="text-sm font-medium">
                            Bulk Add Areas
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid gap-3 pt-2">
                              <p className="text-xs text-muted-foreground">
                                Enter one area name per line.
                              </p>
                              <Textarea
                                className="min-h-[100px]"
                                placeholder="Area 1&#10;Area 2&#10;Area 3"
                                value={bulkAreaNames}
                                onChange={(e) =>
                                  setBulkAreaNames(e.target.value)
                                }
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
                      {/* Add Apartment Row */}
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="grid gap-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            Apartment Name
                          </label>
                          <Input
                            placeholder="New apartment name..."
                            value={newApartmentName}
                            onChange={(e) =>
                              setNewApartmentName(e.target.value)
                            }
                            disabled={isPending}
                            className="min-w-[200px]"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            Delivery Days
                          </label>
                          <div className="flex gap-1.5">
                            {DAYS_OF_WEEK.map((d) => (
                              <button
                                key={d.value}
                                type="button"
                                onClick={() =>
                                  setNewApartmentDeliveryDays((prev) =>
                                    toggleDay(prev, d.value)
                                  )
                                }
                                disabled={isPending}
                                className={`rounded border px-2 py-1 text-xs font-medium transition-colors ${
                                  newApartmentDeliveryDays.includes(d.value)
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                                }`}
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid gap-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            COD
                          </label>
                          <div className="flex h-9 items-center gap-2">
                            <Switch
                              checked={newApartmentIsCodEnabled}
                              onCheckedChange={setNewApartmentIsCodEnabled}
                              disabled={isPending}
                            />
                            <span className="text-xs">Enabled</span>
                          </div>
                        </div>
                        <Button
                          onClick={addApartment}
                          disabled={isPending || !newApartmentName}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Apartment
                        </Button>
                      </div>

                      {/* Bulk Assign Toolbar */}
                      {selectedApartmentIds.size > 0 && (
                        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                          <span className="text-sm font-medium text-primary">
                            {selectedApartmentIds.size} selected
                          </span>
                          <div className="flex gap-1.5">
                            {DAYS_OF_WEEK.map((d) => (
                              <button
                                key={d.value}
                                type="button"
                                onClick={() =>
                                  setBulkAssignDays((prev) =>
                                    toggleDay(prev, d.value)
                                  )
                                }
                                disabled={isPending}
                                className={`rounded border px-2 py-1 text-xs font-medium transition-colors ${
                                  bulkAssignDays.includes(d.value)
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                                }`}
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            onClick={handleBulkAssignDays}
                            disabled={isPending}
                          >
                            Assign Days
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedApartmentIds(new Set())
                              setBulkAssignDays([])
                            }}
                            disabled={isPending}
                          >
                            Clear
                          </Button>
                        </div>
                      )}

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[40px]">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={
                                    selectedApartmentIds.size ===
                                      apartments.length && apartments.length > 0
                                  }
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedApartmentIds(
                                        new Set(
                                          apartments.map((a: any) =>
                                            String(a._id)
                                          )
                                        )
                                      )
                                    } else {
                                      setSelectedApartmentIds(new Set())
                                    }
                                  }}
                                />
                              </TableHead>
                              <TableHead>Apartment Name</TableHead>
                              <TableHead>Delivery Days</TableHead>
                              <TableHead className="w-[100px] text-center">
                                COD
                              </TableHead>
                              <TableHead className="w-[100px] text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {apartments.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="h-24 text-center text-muted-foreground"
                                >
                                  No apartments defined in this district.
                                </TableCell>
                              </TableRow>
                            ) : (
                              apartments.map((a: any) => (
                                <TableRow key={a._id}>
                                  {editingApartmentId === String(a._id) ? (
                                    <TableCell colSpan={5} className="p-2">
                                      <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed bg-muted/50 p-2">
                                        <Input
                                          value={editApartmentName}
                                          onChange={(e) =>
                                            setEditApartmentName(e.target.value)
                                          }
                                          disabled={isPending}
                                          className="h-9 min-w-[150px] flex-1"
                                        />
                                        <div className="flex gap-1">
                                          {DAYS_OF_WEEK.map((d) => (
                                            <button
                                              key={d.value}
                                              type="button"
                                              onClick={() =>
                                                setEditApartmentDeliveryDays(
                                                  (prev) =>
                                                    toggleDay(prev, d.value)
                                                )
                                              }
                                              disabled={isPending}
                                              className={`rounded border px-2 py-1 text-xs font-medium transition-colors ${
                                                editApartmentDeliveryDays.includes(
                                                  d.value
                                                )
                                                  ? "border-primary bg-primary text-primary-foreground"
                                                  : "border-border bg-background text-muted-foreground hover:border-primary/50"
                                              }`}
                                            >
                                              {d.label}
                                            </button>
                                          ))}
                                        </div>
                                        <div className="flex h-9 items-center gap-2 rounded border bg-background px-2">
                                          <Switch
                                            checked={editApartmentIsCodEnabled}
                                            onCheckedChange={
                                              setEditApartmentIsCodEnabled
                                            }
                                            disabled={isPending}
                                          />
                                          <label className="text-xs">
                                            COD Enabled
                                          </label>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={handleUpdateApartment}
                                          disabled={
                                            isPending ||
                                            !editApartmentName.trim()
                                          }
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
                                      <TableCell>
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4"
                                          checked={selectedApartmentIds.has(
                                            String(a._id)
                                          )}
                                          onChange={(e) => {
                                            setSelectedApartmentIds((prev) => {
                                              const next = new Set(prev)
                                              if (e.target.checked)
                                                next.add(String(a._id))
                                              else next.delete(String(a._id))
                                              return next
                                            })
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        {a.name}
                                      </TableCell>
                                      <TableCell>
                                        {dayLabel(a.deliveryDays) ? (
                                          <Badge
                                            variant="outline"
                                            className="bg-secondary/50 text-xs font-normal"
                                          >
                                            {dayLabel(a.deliveryDays)}
                                          </Badge>
                                        ) : (
                                          <span className="text-xs text-muted-foreground italic">
                                            Unscheduled
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <div className="flex justify-center">
                                          <Switch
                                            checked={a.isCodEnabled !== false}
                                            onCheckedChange={(checked) =>
                                              handleToggleApartmentCod(
                                                String(a._id),
                                                checked
                                              )
                                            }
                                            disabled={isPending}
                                          />
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                            >
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                              onClick={() =>
                                                startEditApartment(a)
                                              }
                                            >
                                              <Edit2 className="mr-2 h-4 w-4" />
                                              Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              className="text-destructive focus:text-destructive"
                                              onClick={() =>
                                                handleRemoveApartment(
                                                  String(a._id)
                                                )
                                              }
                                            >
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
                          <AccordionTrigger className="text-sm font-medium">
                            Bulk Add Apartments
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid gap-3 pt-2">
                              <p className="text-xs text-muted-foreground">
                                Enter one apartment name per line.
                              </p>
                              <Textarea
                                className="min-h-[100px]"
                                placeholder={
                                  "Apartment A\nApartment B\nApartment C"
                                }
                                value={bulkApartmentNames}
                                onChange={(e) =>
                                  setBulkApartmentNames(e.target.value)
                                }
                                disabled={isPending}
                              />
                              <div>
                                <Button
                                  onClick={bulkAddApartments}
                                  disabled={
                                    isPending || !bulkApartmentNames.trim()
                                  }
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
            <div className="text-right text-xs text-muted-foreground">
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
