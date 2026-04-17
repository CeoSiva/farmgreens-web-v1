import { LocationAwareLink as Link } from "@/components/location-aware-link"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function ReturnsRefundsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-8 lg:px-16">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">Returns & Refunds Policy</h1>
        
        <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900">1. Return Policy for Perishable Goods</h2>
            <p>
              Due to the perishable nature of our products, we have specific return policies:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Fresh vegetables, fruits, and greens cannot be returned once delivered</li>
              <li>These products have limited shelf life and quality cannot be guaranteed after delivery</li>
              <li>Please inspect your order upon delivery and report any quality issues immediately</li>
              <li>Our delivery partner will wait while you inspect perishable items</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">2. Refund Policy for Online Payments (Razorpay)</h2>
            <p>
              For orders paid online via Razorpay, refunds are processed under the following conditions:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Refunds are initiated to the original payment method used</li>
              <li>Refund processing time typically takes 5-7 business days</li>
              <li>Actual credit to your account depends on your bank's processing time</li>
              <li>You will receive refund confirmation via email and WhatsApp</li>
              <li>Razorpay refund policies and processing times apply</li>
            </ul>

            <h3 className="mt-4 text-xl font-medium text-gray-900">2.1 Eligible Refund Scenarios</h3>
            <ul className="mt-2 list-disc pl-6">
              <li>Order cancellation before processing begins</li>
              <li>Products received are damaged or spoiled</li>
              <li>Wrong products delivered</li>
              <li>Missing items from your order</li>
              <li>Quality issues reported at the time of delivery</li>
            </ul>

            <h3 className="mt-4 text-xl font-medium text-gray-900">2.2 Non-Refundable Scenarios</h3>
            <ul className="mt-2 list-disc pl-6">
              <li>Change of mind after order processing</li>
              <li>Perishable items returned after delivery</li>
              <li>Orders cancelled after delivery has begun</li>
              <li>Minor quality issues that do not affect product usability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">3. Cash on Delivery (COD) Terms</h2>
            <p>
              For orders placed with Cash on Delivery payment method:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Payment is collected upon delivery in cash only</li>
              <li>Our delivery partners do not accept checks, cards, or other payment methods</li>
              <li>Please keep the exact amount ready to avoid change issues</li>
              <li>If payment is not available, the order may be cancelled</li>
              <li>Refunds for COD orders are processed as store credit or bank transfer</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">4. Damaged or Incorrect Items</h2>
            <p>
              If you receive damaged or incorrect items:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Report the issue immediately upon delivery to our delivery partner</li>
              <li>Take photos of damaged items if possible</li>
              <li>Contact our customer support within 24 hours of delivery</li>
              <li>Provide your order number and details of the issue</li>
              <li>We will arrange for replacement or refund based on the situation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">5. How to Request a Refund</h2>
            <p>
              To request a refund, please follow these steps:
            </p>
            <ol className="mt-2 list-decimal pl-6">
              <li>Contact our customer support through the <Link href="/contact" className="text-primary underline">Contact Us</Link> page</li>
              <li>Provide your order number and contact details</li>
              <li>Describe the issue and provide photos if applicable</li>
              <li>Our team will review your request within 24-48 hours</li>
              <li>You will be notified of the refund decision via email and WhatsApp</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">6. Refund Processing</h2>
            <p>
              Once your refund is approved:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Refunds are initiated within 1-2 business days of approval</li>
              <li>For Razorpay payments, refunds are processed to the original payment method</li>
              <li>Bank transfer may take 5-7 business days to reflect in your account</li>
              <li>You will receive a refund confirmation with transaction details</li>
              <li>For COD orders, refunds may be issued as store credit or bank transfer</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">7. Partial Refunds</h2>
            <p>
              In some cases, partial refunds may be issued:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Only some items in your order are damaged or incorrect</li>
              <li>Items are out of stock and cannot be replaced</li>
              <li>Promotional discounts cannot be applied retroactively</li>
              <li>Delivery fees are non-refundable unless the entire order is cancelled</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">8. Order Cancellations</h2>
            <p>
              Order cancellation policies:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Cancellations before order processing: Full refund</li>
              <li>Cancellations after processing begins: No refund (store credit may be offered)</li>
              <li>Cancellations after dispatch: No refund (order must be received)</li>
              <li>Contact support immediately if you need to cancel an order</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">9. Exceptions</h2>
            <p>
              We reserve the right to modify refund policies in exceptional circumstances:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Natural disasters affecting delivery</li>
              <li>Government restrictions or lockdowns</li>
              <li>Force majeure events beyond our control</li>
              <li>System-wide technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">10. Contact Information</h2>
            <p>
              For any questions regarding returns and refunds, please contact us through our 
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
