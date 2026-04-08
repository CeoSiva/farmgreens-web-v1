"use client"

import * as React from "react"
import { useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, Search } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  toggleComboActiveAction,
  deleteComboAction,
} from "@/server/actions/combo"
import type { ComboSlot } from "@/lib/models/Combo"

type ComboRow = {
  _id: string
  name: string
  description?: string
  imageUrl?: string
  isActive: boolean
  pricingMode: "fixed" | "percent_discount" | "per_item"
  fixedPrice?: number
  discountPercent?: number
  displayOrder: number
  availableInAllDistricts: boolean
  unavailableDistricts: string[]
  slots?: ComboSlot[]
  createdAt: string
  updatedAt: string
}

function SlotBadge({ slots }: { slots?: ComboSlot[] }) {
  if (!slots || !Array.isArray(slots)) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  const fixedCount = slots.filter((s) => s.type === "fixed").length
  const choiceCount = slots.filter((s) => s.type === "choice").length
  return (
    <div className="flex items-center gap-1">
      {fixedCount > 0 && (
        <Badge variant="secondary" className="h-5 px-1.5 py-0 text-[10px]">
          {fixedCount} fixed
        </Badge>
      )}
      {choiceCount > 0 && (
        <Badge variant="outline" className="h-5 px-1.5 py-0 text-[10px]">
          {choiceCount} choice
        </Badge>
      )}
    </div>
  )
}

function PricingModeBadge({
  mode,
  fixedPrice,
  discountPercent,
}: {
  mode: string
  fixedPrice?: number
  discountPercent?: number
}) {
  if (mode === "fixed") {
    return (
      <span className="font-semibold">₹{fixedPrice?.toFixed(0) ?? "—"}</span>
    )
  }
  if (mode === "percent_discount") {
    return (
      <span className="font-semibold text-primary">{discountPercent}% off</span>
    )
  }
  return <span className="text-xs text-muted-foreground">Per item</span>
}

export function CombosTable({ data }: { data: ComboRow[] }) {
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = React.useState("")

  const filtered = React.useMemo(() => {
    if (!searchQuery.trim()) return data
    const q = searchQuery.toLowerCase()
    return data.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  const handleToggle = (id: string, currentActive: boolean) => {
    startTransition(async () => {
      const res = await toggleComboActiveAction(id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(currentActive ? "Combo deactivated" : "Combo activated")
      }
    })
  }

  const handleDelete = (id: string, name: string) => {
    startTransition(async () => {
      const res = await deleteComboAction(id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Deleted "${name}" successfully!`)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search combos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Pricing</TableHead>
              <TableHead className="hidden lg:table-cell">Slots</TableHead>
              <TableHead className="hidden md:table-cell">
                Availability
              </TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  {searchQuery
                    ? "No combos match your search."
                    : "No combos found."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((combo) => (
                <TableRow key={combo._id}>
                  {/* Name */}
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{combo.name}</span>
                      {combo.description && (
                        <span className="line-clamp-1 max-w-[200px] text-xs text-muted-foreground">
                          {combo.description}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Pricing */}
                  <TableCell>
                    <PricingModeBadge
                      mode={combo.pricingMode}
                      fixedPrice={combo.fixedPrice}
                      discountPercent={combo.discountPercent}
                    />
                  </TableCell>

                  {/* Slots */}
                  <TableCell className="hidden lg:table-cell">
                    <SlotBadge slots={combo.slots} />
                  </TableCell>

                  {/* Availability */}
                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {combo.availableInAllDistricts
                        ? "All districts"
                        : `${combo.unavailableDistricts.length} restricted`}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-center">
                    <Badge
                      variant={combo.isActive ? "default" : "outline"}
                      className={combo.isActive ? "" : "text-muted-foreground"}
                    >
                      {combo.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8"
                      >
                        <Link href={`/fmg-admin/combos/${combo._id}`}>
                          <span className="sr-only">Edit</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-muted-foreground"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Link>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggle(combo._id, combo.isActive)}
                        disabled={isPending}
                      >
                        <span className="sr-only">
                          {combo.isActive ? "Deactivate" : "Activate"}
                        </span>
                        {combo.isActive ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-amber-500"
                          >
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-green-600"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-destructive"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the combo
                              <span className="font-semibold text-foreground">
                                {" "}
                                {combo.name}
                              </span>{" "}
                              from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isPending}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDelete(combo._id, combo.name)
                              }
                              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                            >
                              {isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
