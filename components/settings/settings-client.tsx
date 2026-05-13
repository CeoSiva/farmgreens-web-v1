"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Papa from "papaparse"
import { Switch } from "@/components/ui/switch"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

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
  toggleDistrictApartmentsAction,
  toggleApartmentCodAction,
  toggleApartmentEnabledAction,
  createAreaAction,
  deleteAreaAction,
  deleteDistrictAction,
  renameAreaAction,
  updateAreaAction,
  toggleAreaEnabledAction,
  bulkCreateAreasAction,
  bulkUpdateAreasAction,
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
import { DistrictRadiusPicker } from "./district-radius-picker"

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
  const [newAreaPincode, setNewAreaPincode] = useState("")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<{ name: string; pincode?: string }[]>([])
  const [isCsvParsed, setIsCsvParsed] = useState(false)

  // Edit All mode state
  const [isEditAllMode, setIsEditAllMode] = useState(false)
  const [editAllData, setEditAllData] = useState<
    { id: string; name: string; pincode: string; isEnabled: boolean }[]
  >([])

  // Area editing state
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null)
  const [editAreaName, setEditAreaName] = useState("")

  // Search state
  const [areaSearchQuery, setAreaSearchQuery] = useState("")
  const [apartmentSearchQuery, setApartmentSearchQuery] = useState("")
  const [editAreaPincode, setEditAreaPincode] = useState("")

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
  const [editApartmentIsEnabled, setEditApartmentIsEnabled] = useState(true)

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
      listApartmentsByDistrictAction(id, Date.now(), true),
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
  const [districtApartmentsOverrides, setDistrictApartmentsOverrides] =
    useState<Record<string, boolean>>({})

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

  const handleToggleDistrictApartments = (id: string, enabled: boolean) => {
    // Optimistic update
    setDistrictApartmentsOverrides((prev) => ({ ...prev, [id]: enabled }))

    startTransition(async () => {
      const res = await toggleDistrictApartmentsAction(id, enabled)
      if ((res as any)?.error) {
        toast.error((res as any).error)
        // Revert on error
        setDistrictApartmentsOverrides((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      } else {
        toast.success(
          `Apartment selection ${enabled ? "enabled" : "disabled"} for district`
        )
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

  const handleSaveDistrictRadius = (
    center: { lat: number; lng: number },
    radius: number
  ) => {
    if (!selectedDistrictId) return
    startTransition(async () => {
      const res = await updateDistrictAction({
        id: selectedDistrictId,
        deliveryCenter: center,
        deliveryRadius: radius,
      })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("Delivery boundary updated")
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
        pincode: newAreaPincode || undefined,
      })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("Area created")
        setNewAreaName("")
        setNewAreaPincode("")
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

  const handleEditArea = (id: string, currentName: string, currentPincode?: string) => {
    setEditingAreaId(id)
    setEditAreaName(currentName)
    setEditAreaPincode(currentPincode || "")
  }

  const handleUpdateArea = () => {
    if (!editingAreaId || !editAreaName.trim()) return
    startTransition(async () => {
      const res = await updateAreaAction({
        id: editingAreaId,
        name: editAreaName,
        pincode: editAreaPincode || undefined,
      })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success("Area updated")
        setEditingAreaId(null)
        await fetchLocations(selectedDistrictId)
        router.refresh()
      }
    })
  }

  const handleToggleAreaEnabled = (id: string, enabled: boolean) => {
    setAreas((prev) =>
      prev.map((a) =>
        String(a._id) === id ? { ...a, isEnabled: enabled } : a
      )
    )
    startTransition(async () => {
      const res = await toggleAreaEnabledAction(id, enabled)
      if ((res as any)?.error) {
        toast.error((res as any).error)
        await fetchLocations(selectedDistrictId)
      } else {
        toast.success(`Area ${enabled ? "enabled" : "disabled"}`)
        await fetchLocations(selectedDistrictId)
        router.refresh()
      }
    })
  }

  const startEditAllMode = () => {
    setEditAllData(
      areas.map((a: any) => ({
        id: String(a._id),
        name: a.name || "",
        pincode: a.pincode || "",
        isEnabled: a.isEnabled !== false,
      }))
    )
    setIsEditAllMode(true)
  }

  const cancelEditAllMode = () => {
    setIsEditAllMode(false)
    setEditAllData([])
  }

  const handleEditAllFieldChange = (
    id: string,
    field: "name" | "pincode" | "isEnabled",
    value: string | boolean
  ) => {
    setEditAllData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const handleDeleteEditAllItem = (id: string) => {
    setEditAllData((prev) => prev.filter((item) => item.id !== id))
  }

  const saveEditAll = () => {
    if (!selectedDistrictId) return

    const validItems = editAllData.filter((item) => item.name.trim())
    if (validItems.length === 0) {
      toast.error("No valid areas to save")
      return
    }

    console.log("Saving areas:", JSON.stringify(validItems, null, 2))

    startTransition(async () => {
      const res = await bulkUpdateAreasAction(validItems)
      console.log("Save result:", res)
      if ((res as any)?.error) {
        toast.error((res as any).error)
      } else {
        toast.success(`Updated ${(res as any).count} areas`)
        setIsEditAllMode(false)
        setEditAllData([])
        await fetchLocations(selectedDistrictId)
        router.refresh()
      }
    })
  }

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setCsvFile(null)
      setCsvData([])
      setIsCsvParsed(false)
      return
    }

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file")
      return
    }

    setCsvFile(file)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error("Error parsing CSV file")
          return
        }

        const data = results.data as Record<string, string>[]
        const parsedAreas = data
          .map((row) => ({
            name: row.name?.trim() || row.Name?.trim() || "",
            pincode: row.pincode?.trim() || row.Pincode?.trim() || undefined,
          }))
          .filter((a) => a.name)

        if (parsedAreas.length === 0) {
          toast.error("No valid areas found in CSV")
          return
        }

        setCsvData(parsedAreas)
        setIsCsvParsed(true)
      },
    })
  }

  const handleCsvUpload = () => {
    if (!selectedDistrictId) {
      toast.error("Select a district first")
      return
    }

    if (csvData.length === 0) {
      toast.error("No areas to upload")
      return
    }

    startTransition(async () => {
      const res = await bulkCreateAreasAction({
        districtId: selectedDistrictId,
        areas: csvData,
      })
      if ((res as any)?.error) toast.error((res as any).error)
      else {
        toast.success(`Created ${(res as any).count} areas`)
        setCsvFile(null)
        setCsvData([])
        setIsCsvParsed(false)
        await fetchLocations(selectedDistrictId)
        router.refresh()
      }
    })
  }

  const resetCsvUpload = () => {
    setCsvFile(null)
    setCsvData([])
    setIsCsvParsed(false)
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
    setEditApartmentIsEnabled(a.isEnabled !== false)
  }

  const cancelEditApartment = () => {
    setEditingApartmentId(null)
    setEditApartmentName("")
    setEditApartmentDeliveryDays([])
    setEditApartmentIsCodEnabled(true)
    setEditApartmentIsEnabled(true)
  }

  const handleUpdateApartment = () => {
    if (!editingApartmentId || !editApartmentName.trim()) return
    startTransition(async () => {
      const res = await updateApartmentAction({
        id: editingApartmentId,
        name: editApartmentName,
        deliveryDays: editApartmentDeliveryDays,
        isCodEnabled: editApartmentIsCodEnabled,
        isEnabled: editApartmentIsEnabled,
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

  const handleToggleApartmentEnabled = (id: string, enabled: boolean) => {
    // Optimistic update
    setApartments((prev) =>
      prev.map((a) => (String(a._id) === id ? { ...a, isEnabled: enabled } : a))
    )

    startTransition(async () => {
      const res = await toggleApartmentEnabledAction(id, enabled)
      if ((res as any)?.error) {
        toast.error((res as any).error)
        // Revert on error
        await fetchLocations(selectedDistrictId)
      } else {
        toast.success(`Apartment ${enabled ? "enabled" : "disabled"}`)
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Apartments</span>
                      <Switch
                        checked={
                          districtApartmentsOverrides[selectedDistrictId] !==
                          undefined
                            ? districtApartmentsOverrides[selectedDistrictId]
                            : districtById.get(selectedDistrictId)
                                ?.hasApartments !== false
                        }
                        onCheckedChange={(checked) =>
                          handleToggleDistrictApartments(
                            selectedDistrictId,
                            checked
                          )
                        }
                        disabled={isPending}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x h-full">
                    {/* Sub-Tabs: Areas & Apartments */}
                    <div className="p-6">
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
                            placeholder="Area name"
                            value={newAreaName}
                            onChange={(e) => setNewAreaName(e.target.value)}
                            disabled={isPending}
                            className="max-w-[200px]"
                          />
                          <Input
                            placeholder="Pincode (e.g. 600001)"
                            value={newAreaPincode}
                            onChange={(e) => setNewAreaPincode(e.target.value)}
                            disabled={isPending}
                            className="max-w-[150px]"
                          />
                          <Button
                            onClick={addArea}
                            disabled={isPending || !newAreaName}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Area
                          </Button>
                        </div>

                      <div className="flex items-center justify-between">
                        {isEditAllMode ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEditAllMode}
                          >
                            Cancel Edit All
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={startEditAllMode}
                            disabled={areas.length === 0}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit All
                          </Button>
                        )}
                        {isEditAllMode && (
                          <Button
                            size="sm"
                            onClick={saveEditAll}
                            disabled={isPending}
                          >
                            Save All Changes ({editAllData.length})
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Search areas..."
                          value={areaSearchQuery}
                          onChange={(e) => setAreaSearchQuery(e.target.value)}
                          className="max-w-[200px]"
                        />
                        {areaSearchQuery && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAreaSearchQuery("")}
                          >
                            Clear
                          </Button>
                        )}
                      </div>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Area Name</TableHead>
                              <TableHead>Pincode</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="w-[100px] text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {areas.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={4}
                                  className="h-24 text-center text-muted-foreground"
                                >
                                  No areas defined in this district.
                                </TableCell>
                              </TableRow>
                            ) : (isEditAllMode
                                ? editAllData.filter(
                                    (item) =>
                                      item.name
                                        .toLowerCase()
                                        .includes(areaSearchQuery.toLowerCase()) ||
                                      (item.pincode || "")
                                        .toLowerCase()
                                        .includes(areaSearchQuery.toLowerCase())
                                  )
                                : areas.filter(
                                    (a) =>
                                      a.name
                                        .toLowerCase()
                                        .includes(areaSearchQuery.toLowerCase()) ||
                                      (a.pincode || "")
                                        .toLowerCase()
                                        .includes(areaSearchQuery.toLowerCase())
                                  )
                              ).length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={4}
                                  className="h-24 text-center text-muted-foreground"
                                >
                                  No areas match your search.
                                </TableCell>
                              </TableRow>
                            ) : isEditAllMode ? (
                              editAllData
                                .filter(
                                  (item) =>
                                    item.name
                                      .toLowerCase()
                                      .includes(areaSearchQuery.toLowerCase()) ||
                                    (item.pincode || "")
                                      .toLowerCase()
                                      .includes(areaSearchQuery.toLowerCase())
                                )
                                .map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <Input
                                      value={item.name}
                                      onChange={(e) =>
                                        handleEditAllFieldChange(
                                          item.id,
                                          "name",
                                          e.target.value
                                        )
                                      }
                                      className="h-8"
                                      placeholder="Area name"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={item.pincode}
                                      onChange={(e) =>
                                        handleEditAllFieldChange(
                                          item.id,
                                          "pincode",
                                          e.target.value
                                        )
                                      }
                                      className="h-8"
                                      placeholder="Pincode"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Switch
                                      checked={item.isEnabled}
                                      onCheckedChange={(checked) =>
                                        handleEditAllFieldChange(
                                          item.id,
                                          "isEnabled",
                                          checked
                                        )
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() =>
                                        handleDeleteEditAllItem(item.id)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              areas
                                .filter(
                                  (a) =>
                                    a.name
                                      .toLowerCase()
                                      .includes(areaSearchQuery.toLowerCase()) ||
                                    (a.pincode || "")
                                      .toLowerCase()
                                      .includes(areaSearchQuery.toLowerCase())
                                )
                                .map((a) => (
                                <TableRow key={a._id}>
                                  <TableCell className="font-medium">
                                    {a.name}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {a.pincode || "-"}
                                  </TableCell>
                                  <TableCell>
                                    <Switch
                                      checked={a.isEnabled !== false}
                                      onCheckedChange={(checked) =>
                                        handleToggleAreaEnabled(
                                          String(a._id),
                                          checked
                                        )
                                      }
                                    />
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
                                            handleEditArea(
                                              String(a._id),
                                              a.name,
                                              a.pincode
                                            )
                                          }
                                        >
                                          <Edit2 className="mr-2 h-4 w-4" />
                                          Edit
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

                      <Sheet
                        open={!!editingAreaId}
                        onOpenChange={(open) => {
                          if (!open) {
                            setEditingAreaId(null)
                            setEditAreaName("")
                            setEditAreaPincode("")
                          }
                        }}
                      >
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Edit Area</SheetTitle>
                            <SheetDescription>
                              Update the area name and pincode.
                            </SheetDescription>
                          </SheetHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <label className="text-sm font-medium">
                                Area Name
                              </label>
                              <Input
                                value={editAreaName}
                                onChange={(e) =>
                                  setEditAreaName(e.target.value)
                                }
                                placeholder="Area name"
                              />
                            </div>
                            <div className="grid gap-2">
                              <label className="text-sm font-medium">
                                Pincode
                              </label>
                              <Input
                                value={editAreaPincode}
                                onChange={(e) =>
                                  setEditAreaPincode(e.target.value)
                                }
                                placeholder="Pincode (e.g. 600001)"
                              />
                            </div>
                            <Button
                              onClick={handleUpdateArea}
                              disabled={isPending || !editAreaName.trim()}
                              className="w-full"
                            >
                              Save Changes
                            </Button>
                          </div>
                        </SheetContent>
                      </Sheet>

                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="bulk-areas">
                          <AccordionTrigger className="text-sm font-medium">
                            Bulk Add Areas (CSV Import)
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid gap-4 pt-2">
                              <div className="rounded-lg border border-dashed p-4">
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="file"
                                      accept=".csv"
                                      onChange={handleCsvFileChange}
                                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:mr-4 file:inline-flex file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground file:hover:bg-primary/90"
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">CSV Format:</span> name, pincode
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Example CSV:
                                  </p>
                                  <code className="block whitespace-nowrap rounded bg-muted p-2 text-xs">
                                    name,pincode{'\n'}Anna Nagar,600001{'\n'}T Nagar,600018{'\n'}Nungambakkam,600034
                                  </code>
                                </div>
                              </div>

                              {isCsvParsed && csvData.length > 0 && (
                                <div className="rounded-md border">
                                  <div className="flex items-center justify-between px-3 py-2">
                                    <span className="text-sm font-medium">
                                      {csvData.length} areas ready to import
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={resetCsvUpload}
                                    >
                                      Reset
                                    </Button>
                                  </div>
                                  <div className="max-h-40 overflow-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Name</TableHead>
                                          <TableHead>Pincode</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {csvData.slice(0, 5).map((area, idx) => (
                                          <TableRow key={idx}>
                                            <TableCell className="py-1">{area.name}</TableCell>
                                            <TableCell className="py-1">{area.pincode || "-"}</TableCell>
                                          </TableRow>
                                        ))}
                                        {csvData.length > 5 && (
                                          <TableRow>
                                            <TableCell colSpan={2} className="py-1 text-xs text-muted-foreground">
                                              ...and {csvData.length - 5} more
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                  <div className="px-3 py-2">
                                    <Button
                                      onClick={handleCsvUpload}
                                      disabled={isPending}
                                      className="w-full"
                                    >
                                      Import {csvData.length} Areas
                                    </Button>
                                  </div>
                                </div>
                              )}
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

                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Search apartments..."
                          value={apartmentSearchQuery}
                          onChange={(e) => setApartmentSearchQuery(e.target.value)}
                          className="max-w-[200px]"
                        />
                        {apartmentSearchQuery && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setApartmentSearchQuery("")}
                          >
                            Clear
                          </Button>
                        )}
                      </div>

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
                              <TableHead className="w-[80px] text-center">
                                Visible
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
                                  colSpan={6}
                                  className="h-24 text-center text-muted-foreground"
                                >
                                  No apartments defined in this district.
                                </TableCell>
                              </TableRow>
                            ) : (
                              (() => {
                                const filteredApartments = apartments.filter((a: any) =>
                                  a.name.toLowerCase().includes(apartmentSearchQuery.toLowerCase())
                                )
                                if (filteredApartments.length === 0) {
                                  return (
                                    <TableRow>
                                      <TableCell
                                        colSpan={6}
                                        className="h-24 text-center text-muted-foreground"
                                      >
                                        No apartments match your search.
                                      </TableCell>
                                    </TableRow>
                                  )
                                }
                                return filteredApartments.map((a: any) => (
                                <TableRow key={a._id}>
                                  {editingApartmentId === String(a._id) ? (
                                    <TableCell colSpan={6} className="p-2">
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
                                        <div className="flex h-9 items-center gap-2 rounded border bg-background px-2">
                                          <Switch
                                            checked={editApartmentIsEnabled}
                                            onCheckedChange={
                                              setEditApartmentIsEnabled
                                            }
                                            disabled={isPending}
                                          />
                                          <label className="text-xs">
                                            Visible
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
                                      <TableCell className="text-center">
                                        <div className="flex justify-center">
                                          <Switch
                                            checked={a.isEnabled !== false}
                                            onCheckedChange={(checked) =>
                                              handleToggleApartmentEnabled(
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
                              })()
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

                {/* Map Configuration Section */}
                <div className="bg-muted/10 p-6 border-t lg:border-t-0">
                  <DistrictRadiusPicker
                    key={selectedDistrictId}
                    initialCenter={
                      districtById.get(selectedDistrictId)?.deliveryCenter
                    }
                    initialRadius={
                      districtById.get(selectedDistrictId)?.deliveryRadius
                    }
                    onSave={handleSaveDistrictRadius}
                    isPending={isPending}
                  />
                </div>
              </div>
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
