"use client";

import { useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { bulkUploadCustomersAction } from "@/server/actions/customer";

export function BulkUploadButton() {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadSample = () => {
    const headers = "Name,Mobile,WhatsApp,City";
    const example1 = "John Doe,9876543210,yes,Chennai";
    const example2 = "Jane Smith,9123456789,no,Coimbatore";
    const csvContent = `${headers}\n${example1}\n${example2}`;
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "customer_import_sample.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast.error("Please upload a valid CSV file");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        const res = await bulkUploadCustomersAction(formData);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(res.message || "Customers uploaded successfully");
        }
      } catch (err) {
        toast.error("An error occurred during upload");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        onClick={downloadSample}
        size="sm"
      >
        <Download className="mr-2 h-4 w-4" />
        Sample CSV
      </Button>
      <Button
        variant="secondary"
        disabled={isPending}
        onClick={() => fileInputRef.current?.click()}
        size="sm"
      >
        <Upload className="mr-2 h-4 w-4" />
        {isPending ? "Uploading..." : "Upload CSV"}
      </Button>
    </div>
  );
}
