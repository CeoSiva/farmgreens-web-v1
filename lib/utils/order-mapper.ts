export interface OrderItem {
  product: string;
  qty: number;
  price: number;
}

export interface NormalisedOrder {
  orderNumber: string;
  date: string;
  customerName: string;
  mobileNumber: string;
  address: string;
  area: string;
  district: string;
  googleMapsLink: string | null;
  status: string;
  items: OrderItem[];
  totalValue: number;
  [key: string]: unknown;
}

interface RawData {
  createdAt?: string | Date;
  customer?: { name?: string; mobile?: string };
  shippingAddress?: {
    lat?: number;
    lng?: number;
    door?: string;
    street?: string;
    areaName?: string;
    districtName?: string;
  };
  status?: string;
  items?: unknown[];
  [key: string]: unknown;
}

/**
 * Safely extracts a string from an object trying multiple possible keys.
 */
const getString = (obj: Record<string, unknown>, keys: string[], defaultVal = ""): string => {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
      return String(obj[k]).trim();
    }
  }
  return defaultVal;
};

/**
 * Safely extracts a number from an object trying multiple possible keys.
 * Removes non-numeric characters before parsing.
 */
const getNumber = (obj: Record<string, unknown>, keys: string[], defaultVal = 0): number => {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
      const parsed = parseFloat(String(obj[k]).replace(/[^\d.-]/g, ""));
      if (!isNaN(parsed)) return parsed;
    }
  }
  return defaultVal;
};

/**
 * Deduplicates and normalises flat order rows into a structured array of orders.
 * Merges products from multiple rows for the same order into an items array.
 * Calculates total value based on qty and price of each item.
 */
export function normaliseOrders(rawRows: Record<string, unknown>[]): NormalisedOrder[] {
  const ordersMap = new Map<string, NormalisedOrder>();

  for (const rowRaw of rawRows) {
    const row = rowRaw as unknown as RawData;
    // Extract Order Number using common variations
    const orderNumber = getString(row, ["Order Number", "Order ID", "orderNumber"]);
    if (!orderNumber) continue;

    let order = ordersMap.get(orderNumber);

    // If we haven't seen this order yet, create its base structure
    if (!order) {
      let googleMapsLink = getString(row, [
        "Google Maps link",
        "Google Maps Link",
        "googleMapsLink",
      ]);

      if (!googleMapsLink && row.shippingAddress?.lat !== undefined && row.shippingAddress?.lng !== undefined) {
        googleMapsLink = `https://www.google.com/maps?q=${row.shippingAddress.lat},${row.shippingAddress.lng}`;
      }

      order = {
        orderNumber,
        date: getString(row, ["Date", "date"]) || (row.createdAt ? new Date(row.createdAt).toLocaleString() : ""),
        customerName: getString(row, ["Customer Name", "customerName", "Name", "name"]) || row.customer?.name || "",
        mobileNumber: getString(row, ["Mobile Number", "mobileNumber", "Phone", "phone"]) || row.customer?.mobile || "",
        address: getString(row, ["Address", "address"]) || (row.shippingAddress ? `${row.shippingAddress.door || ""}, ${row.shippingAddress.street || ""}` : ""),
        area: getString(row, ["Area", "area"]) || row.shippingAddress?.areaName || "",
        district: getString(row, ["District", "district"]) || row.shippingAddress?.districtName || "",
        googleMapsLink: googleMapsLink ? googleMapsLink : null,
        status: getString(row, ["Status", "status"]) || row.status || "",
        items: [],
        totalValue: 0,
      };
      ordersMap.set(orderNumber, order);
    }

    // Extract products
    if (row.items && Array.isArray(row.items) && order.items.length === 0) {
      // Nested IOrder structure
      const itemsArr = row.items as { itemType?: string; comboName?: string; name?: string; qty?: number; price?: number }[];
      itemsArr.forEach((it) => {
        const isCombo = it.itemType === "combo";
        const name = isCombo ? it.comboName : it.name;
        const qty = isCombo ? 1 : (it.qty || 1);
        order!.items.push({ product: String(name || ""), qty: Number(qty), price: Number(it.price || 0) });
      });
    } else {
      // Extract up to 5 products per row (Flat structure)
      for (let i = 1; i <= 5; i++) {
        const product = getString(row, [`Product ${i}`, `product${i}`, `Product${i}`]);
        
        // Skip if product field is empty
        if (!product) continue;

        const qty = getNumber(row, [`Qty ${i}`, `Qty${i}`, `qty${i}`], 0);
        const price = getNumber(row, [`Price ${i}`, `Price${i}`, `price${i}`], 0);

        order.items.push({ product, qty, price });
      }
    }
  }

  // Calculate total values and return as array
  const result = Array.from(ordersMap.values());
  for (const order of result) {
    order.totalValue = order.items.reduce(
      (sum, item) => sum + item.qty * item.price,
      0
    );
  }

  return result;
}
