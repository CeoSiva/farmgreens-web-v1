// Analytics helper functions for Firebase Analytics and Google Analytics 4

import { logEvent, setUserId as setFirebaseUserId } from "firebase/analytics"
import { analytics } from "./firebase"

// Google Analytics 4 helper
declare global {
  interface Window {
    gtag?: any;
    dataLayer?: any[];
  }
}

// Initialize GA4
export const initGA4 = () => {
  if (typeof window === "undefined") return;

  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId || measurementId === "G-XXXXXXXXXX") {
    console.warn("GA4 measurement ID not configured");
    return;
  }

  // Load GA4 script
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments);
    };

    // Initialize GA4
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false, // We'll handle page views manually
    });

    // Load GA4 script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }
};

// Track page view
export const trackPageView = (path: string, title: string, districtSlug?: string) => {
  if (typeof window === "undefined") return;

  // GA4 page view
  if (window.gtag) {
    window.gtag("event", "page_view", {
      page_path: path,
      page_title: title,
      district: districtSlug || "not_set",
    });
  }

  // Firebase Analytics page view (will be handled by AnalyticsProvider)
};

// Track event for both GA4 and Firebase
export const trackEvent = (
  eventName: string,
  params?: Record<string, any>,
  customerId?: string
) => {
  if (typeof window === "undefined") return;

  // GA4 event
  if (window.gtag) {
    window.gtag("event", eventName, {
      ...params,
      ...(customerId && { customer_id: customerId }),
    });
  }

  // Firebase Analytics event
  if (analytics) {
    logEvent(analytics, eventName, {
      ...params,
      ...(customerId && { customer_id: customerId }),
    });
  }
};

// Set user ID for both GA4 and Firebase
export const setUserId = (customerId: string) => {
  if (typeof window === "undefined") return;

  // GA4 user ID
  if (window.gtag) {
    window.gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      user_id: customerId,
    });
  }

  // Firebase Analytics user ID
  if (analytics) {
    setFirebaseUserId(analytics, customerId);
  }
};

// E-commerce event helpers
export const trackViewItem = (productId: string, productName: string, price: number, customerId?: string, districtSlug?: string) => {
  trackEvent("view_item", {
    item_id: productId,
    item_name: productName,
    price: price,
    district: districtSlug || "not_set",
  }, customerId);
};

export const trackSelectItem = (productId: string, productName: string, price: number, customerId?: string, districtSlug?: string) => {
  trackEvent("select_item", {
    item_id: productId,
    item_name: productName,
    price: price,
    district: districtSlug || "not_set",
  }, customerId);
};

export const trackAddToCart = (productId: string, productName: string, price: number, quantity: number, customerId?: string, districtSlug?: string) => {
  trackEvent("add_to_cart", {
    item_id: productId,
    item_name: productName,
    price: price,
    quantity: quantity,
    district: districtSlug || "not_set",
  }, customerId);
};

export const trackRemoveFromCart = (productId: string, productName: string, customerId?: string) => {
  trackEvent("remove_from_cart", {
    item_id: productId,
    item_name: productName,
  }, customerId);
};

export const trackBeginCheckout = (totalValue: number, itemCount: number, customerId?: string, districtSlug?: string) => {
  trackEvent("begin_checkout", {
    value: totalValue,
    item_count: itemCount,
    district: districtSlug || "not_set",
  }, customerId);
};

export const trackPurchase = (orderId: string, totalValue: number, itemCount: number, customerId?: string, districtSlug?: string) => {
  trackEvent("purchase", {
    transaction_id: orderId,
    value: totalValue,
    item_count: itemCount,
    district: districtSlug || "not_set",
  }, customerId);
};

export const trackDistrictSelected = (districtSlug: string, districtName: string, customerId?: string) => {
  trackEvent("district_selected", {
    district_slug: districtSlug,
    district_name: districtName,
  }, customerId);
};

export const trackWhatsAppOptIn = (customerId: string) => {
  trackEvent("whatsapp_opt_in", {}, customerId);
};

export const trackWhatsAppOptOut = (customerId: string) => {
  trackEvent("whatsapp_opt_out", {}, customerId);
};
