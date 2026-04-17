import { LocationAwareLink as Link } from "@/components/location-aware-link"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-8 lg:px-16">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
            <p>
              By accessing and using FarmGreens services, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">2. Payment Methods</h2>
            <p>We accept the following payment methods:</p>
            
            <h3 className="mt-4 text-xl font-medium text-gray-900">2.1 Online Payment (Razorpay)</h3>
            <p>
              We accept online payments through Razorpay, a secure payment gateway. By choosing this payment method, 
              you agree to Razorpay's terms and conditions. All payments are processed securely and your payment 
              information is encrypted.
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Payments are processed in Indian Rupees (INR)</li>
              <li>You authorize FarmGreens to charge your selected payment method for the total order amount</li>
              <li>Payment confirmation will be sent via email and WhatsApp (if opted in)</li>
              <li>All transactions are subject to verification and fraud prevention measures</li>
            </ul>

            <h3 className="mt-4 text-xl font-medium text-gray-900">2.2 Cash on Delivery (COD)</h3>
            <p>
              For Cash on Delivery orders, payment is collected upon delivery. Please ensure you have the exact 
              amount ready when our delivery partner arrives.
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>COD is available in selected delivery areas</li>
              <li>Delivery partner will not accept checks or credit cards</li>
              <li>Orders may be cancelled if payment is not available at the time of delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">3. Order Placement and Confirmation</h2>
            <p>
              By placing an order on FarmGreens, you agree to purchase the products listed in your order at the 
              prices displayed at the time of purchase. Order confirmation will be sent via email and WhatsApp (if opted in).
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>All orders are subject to product availability</li>
              <li>We reserve the right to cancel orders if products are unavailable</li>
              <li>Order confirmation constitutes acceptance of your order</li>
              <li>Prices are subject to change without prior notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">4. Delivery Terms</h2>
            <p>
              We strive to deliver your order within the estimated delivery time. Delivery times may vary based on 
              your location and product availability.
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Delivery is available in selected areas only</li>
              <li>Free delivery applies for orders above the specified threshold</li>
              <li>Delivery fees apply for orders below the threshold</li>
              <li>We are not responsible for delays caused by unforeseen circumstances</li>
              <li>Someone must be available at the delivery address to receive the order</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">5. Order Cancellation</h2>
            <p>
              You may cancel your order under the following conditions:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Cancellation requests must be made before order processing begins</li>
              <li>For online payments, refunds will be processed to the original payment method</li>
              <li>Refund processing time may vary based on your payment provider</li>
              <li>We reserve the right to refuse cancellations after order processing has begun</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">6. User Responsibilities</h2>
            <p>As a user of FarmGreens, you agree to:</p>
            <ul className="mt-2 list-disc pl-6">
              <li>Provide accurate and complete information for orders</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not use our services for any illegal or unauthorized purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">7. Limitation of Liability</h2>
            <p>
              FarmGreens shall not be liable for any indirect, incidental, special, or consequential damages 
              arising from the use of our services. Our liability is limited to the amount paid for the order.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon 
              posting on our website. Your continued use of our services constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">9. Contact Information</h2>
            <p>
              For any questions regarding these Terms of Service, please contact us through our 
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
