export interface Coordinate {
  lat: number;
  lng: number;
}

export interface BaseOrder {
  orderNumber: string;
  date?: string;
  customerName: string;
  mobileNumber?: string;
  address: string;
  area: string;
  district: string;
  googleMapsLink?: string | null;
  status: string;
  items: { product: string; qty: number; price: number }[];
  totalValue: number;
  [key: string]: unknown;
}

export interface ClusteredOrder extends BaseOrder {
  zoneLabel: string;
  coords: Coordinate;
}

/**
 * Extracts latitude and longitude from a Google Maps URL string.
 * Format expected: https://www.google.com/maps?q=LAT,LNG
 */
export function extractLatLng(url?: string | null): Coordinate | null {
  if (!url || url === "no location") return null;
  
  const match = url.match(/[?&]q=([\d.-]+),([\d.-]+)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  
  return null;
}

/**
 * Calculates the straight-line distance between two coordinate pairs in kilometres
 * using the Haversine formula.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in kilometres

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Runs DBSCAN clustering algorithm on an array of coordinates.
 * Returns an array of cluster labels, one per input point.
 * 0 means the point is a noise/outlier, >0 is the cluster ID.
 */
export function runDBSCAN(
  coords: Coordinate[],
  radiusKm: number,
  minPoints: number = 1
): number[] {
  const labels: number[] = new Array(coords.length).fill(-1); // -1: undefined, 0: noise, >0: clusterId
  let clusterId = 0;

  const regionQuery = (pointIndex: number): number[] => {
    const neighbors: number[] = [];
    const p1 = coords[pointIndex];
    for (let i = 0; i < coords.length; i++) {
      const p2 = coords[i];
      if (haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng) <= radiusKm) {
        neighbors.push(i);
      }
    }
    return neighbors;
  };

  for (let i = 0; i < coords.length; i++) {
    if (labels[i] !== -1) continue; // Already processed

    const neighbors = regionQuery(i);

    if (neighbors.length < minPoints) {
      labels[i] = 0; // Noise
    } else {
      clusterId++;
      labels[i] = clusterId;
      
      const seedSet = new Set(neighbors);
      seedSet.delete(i); // Remove the core point itself
      
      for (const q of Array.from(seedSet)) {
        if (labels[q] === 0) {
          labels[q] = clusterId; // Change noise to border point
        }
        if (labels[q] !== -1) continue; // Already processed
        
        labels[q] = clusterId;
        const qNeighbors = regionQuery(q);
        if (qNeighbors.length >= minPoints) {
          for (const n of qNeighbors) {
            seedSet.add(n);
          }
        }
      }
    }
  }

  return labels;
}

/**
 * Filters orders by city and valid coordinates, then clusters them based on proximity.
 * Adds zoneLabel and coords fields to each valid order.
 */
export function clusterOrders<T extends BaseOrder>(
  orders: T[],
  radiusKm: number,
  cityFilter: string = "all"
): (T & { zoneLabel: string; coords: Coordinate })[] {
  const filteredOrders = orders.filter(o => {
    if (cityFilter !== "all" && o.district !== cityFilter) return false;
    if (!o.googleMapsLink || o.googleMapsLink === "no location") return false;
    return extractLatLng(o.googleMapsLink) !== null;
  });

  const coords = filteredOrders.map(o => extractLatLng(o.googleMapsLink)!);
  const labels = runDBSCAN(coords, radiusKm, 1);

  const getZoneLabel = (id: number): string => {
    if (id === 0) return "Outlier";
    
    // Convert 1 -> A, 2 -> B, ..., 26 -> Z, 27 -> AA, etc.
    let label = "";
    let temp = id;
    while (temp > 0) {
      temp--;
      label = String.fromCharCode(65 + (temp % 26)) + label;
      temp = Math.floor(temp / 26);
    }
    return `Zone ${label}`;
  };

  return filteredOrders.map((o, index) => ({
    ...o,
    zoneLabel: getZoneLabel(labels[index]),
    coords: coords[index]
  }));
}
