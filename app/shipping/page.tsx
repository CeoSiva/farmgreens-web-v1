import { LocationAwareLink as Link } from "@/components/location-aware-link"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-8 lg:px-16">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">Shipping Policy</h1>
        
        <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900">1. Delivery Areas</h2>
            <p>
              FarmGreens currently delivers to selected districts and areas. Delivery availability depends 
              on your location. You can check delivery availability by selecting your district during checkout.
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Delivery is available in major districts within our service area</li>
              <li>We are continuously expanding our delivery network</li>
              <li>If your area is not covered, you will be notified during checkout</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">2. Delivery Fee Structure</h2>
            <p>
              Our delivery fees are structured to provide value while ensuring efficient delivery:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Free delivery applies for orders above the specified threshold (e.g., ₹500)</li>
              <li>A nominal delivery fee applies for orders below the threshold</li>
              <li>Delivery fees are calculated based on your delivery location</li>
              <li>The exact delivery fee will be displayed at checkout before you place your order</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">3. Delivery Timelines</h2>
            <p>
              We strive to deliver your orders as quickly as possible while maintaining product freshness:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Orders are typically delivered within 1-2 business days</li>
              <li>Delivery time may vary based on your location and order volume</li>
              <li>Same-day delivery may be available in select areas (subject to order time)</li>
              <li>You will receive an estimated delivery time at checkout</li>
              <li>Order status updates will be sent via WhatsApp (if opted in)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">4. Order Processing Time</h2>
            <p>
              Once your order is confirmed, we begin processing it immediately:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Order confirmation is sent immediately after successful payment</li>
              <li>Order preparation typically takes 2-4 hours</li>
              <li>Orders placed after cutoff time may be processed the next business day</li>
              <li>You will be notified when your order is out for delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">5. Delivery Address Requirements</h2>
            <p>
              To ensure successful delivery, please provide accurate and complete delivery information:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Complete address including door number, street, area, and district</li>
              <li>Precise location coordinates (automatically pinned on map during checkout)</li>
              <li>Valid contact number for delivery coordination</li>
              <li>Instructions for finding your location (landmarks, building name, etc.)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">6. Receiving Your Delivery</h2>
            <p>
              Please ensure someone is available at the delivery address to receive your order:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Our delivery partner will call you when arriving at your location</li>
              <li>Please ensure your phone is reachable during the delivery window</li>
              <li>For COD orders, please keep the exact amount ready</li>
              <li>Inspect your order upon delivery and report any issues immediately</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">7. Undeliverable Orders</h2>
            <p>
              In the following situations, orders may be marked as undeliverable:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>No one is available at the delivery address after multiple attempts</li>
              <li>Incorrect or incomplete address provided</li>
              <li>Contact number is unreachable or disconnected</li>
              <li>Customer refuses to accept the order</li>
              <li>Payment not available for COD orders</li>
            </ul>
            <p className="mt-2">
              For undeliverable orders, we will attempt to contact you to reschedule delivery. 
              If rescheduling is not possible, the order may be cancelled and refund processed 
              (for online payments).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">8. Product Freshness Guarantee</h2>
            <p>
              We take special care to ensure your products remain fresh during delivery:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Products are packed in temperature-controlled packaging</li>
              <li>Delivery vehicles are equipped to maintain product quality</li>
              <li>Perishable items are given priority for early delivery slots</li>
              <li>If you receive products that are not fresh, please contact us immediately</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">9. Special Delivery Instructions</h2>
            <p>
              If you have special delivery requirements, please contact us before placing your order:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Specific delivery time requests</li>
              <li>Building access instructions</li>
              <li>Leave at door options (for non-perishable items)</li>
              <li>Multiple delivery locations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">10. Contact Information</h2>
            <p>
              For any questions regarding shipping and delivery, please contact us through our 
              <Link href="/contact" className="text-primary underline">Contact Us</Link> page.
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </main>
      <Footer />
    </div>
  )
}
