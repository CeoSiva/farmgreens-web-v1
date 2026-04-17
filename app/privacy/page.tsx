import { LocationAwareLink as Link } from "@/components/location-aware-link"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-8 lg:px-16">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900">1. Introduction</h2>
            <p>
              FarmGreens is committed to protecting your privacy. This Privacy Policy explains how we collect, 
              use, and safeguard your personal information when you use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">2. Information We Collect</h2>
            
            <h3 className="mt-4 text-xl font-medium text-gray-900">2.1 Personal Information</h3>
            <p>We collect the following personal information when you use our services:</p>
            <ul className="mt-2 list-disc pl-6">
              <li>Name and contact details (phone number, email)</li>
              <li>Delivery address (door, street, area, district)</li>
              <li>Location coordinates (latitude, longitude) for delivery</li>
              <li>WhatsApp preferences for order notifications</li>
            </ul>

            <h3 className="mt-4 text-xl font-medium text-gray-900">2.2 Payment Information</h3>
            <p>
              When you make online payments through Razorpay, we collect payment-related information in 
              compliance with Razorpay's security standards:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Payment method details are processed securely by Razorpay</li>
              <li>We do not store your complete credit card or payment instrument details</li>
              <li>Payment transaction IDs are stored for order tracking and refund processing</li>
              <li>Razorpay handles all payment data in accordance with PCI-DSS standards</li>
            </ul>

            <h3 className="mt-4 text-xl font-medium text-gray-900">2.3 Order Information</h3>
            <p>We collect information related to your orders:</p>
            <ul className="mt-2 list-disc pl-6">
              <li>Order details (products, quantities, prices)</li>
              <li>Order history and payment method used</li>
              <li>Delivery status and tracking information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">3. How We Use Your Information</h2>
            <p>We use your information for the following purposes:</p>
            <ul className="mt-2 list-disc pl-6">
              <li>Process and fulfill your orders</li>
              <li>Provide order updates via WhatsApp (if opted in)</li>
              <li>Process payments and issue refunds</li>
              <li>Improve our services and user experience</li>
              <li>Communicate with you about your orders</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">4. Data Storage and Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>All payment data is processed through Razorpay's secure payment gateway</li>
              <li>Personal information is stored in secure databases with encryption</li>
              <li>Access to personal information is restricted to authorized personnel</li>
              <li>We regularly review our security practices</li>
              <li>Location coordinates are stored only for delivery purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">5. Third-Party Services</h2>
            <p>We use the following third-party services to provide our services:</p>
            
            <h3 className="mt-4 text-xl font-medium text-gray-900">5.1 Razorpay (Payment Gateway)</h3>
            <p>
              Razorpay processes all online payments. Razorpay's privacy policy and security measures 
              govern the handling of payment data. We comply with Razorpay's data handling requirements 
              and merchant agreement terms.
            </p>

            <h3 className="mt-4 text-xl font-medium text-gray-900">5.2 Gupshup (WhatsApp Notifications)</h3>
            <p>
              We use Gupshup to send order confirmations and updates via WhatsApp. Your phone number 
              is shared with Gupshup solely for this purpose. Gupshup's privacy policy applies to 
              data processed through their service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services 
              and comply with legal obligations:
            </p>
            <ul className="mt-2 list-disc pl-6">
              <li>Order information is retained for order history and warranty purposes</li>
              <li>Account information is retained while your account is active</li>
              <li>Payment transaction data is retained for refund processing and compliance</li>
              <li>You may request deletion of your account and personal information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">7. Your Rights</h2>
            <p>You have the following rights regarding your personal information:</p>
            <ul className="mt-2 list-disc pl-6">
              <li>Access to your personal information</li>
              <li>Correction of inaccurate information</li>
              <li>Deletion of your account and personal information</li>
              <li>Opt-out of WhatsApp notifications</li>
              <li>Object to processing of your personal information</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, please contact us through our 
              <Link href="/contact" className="text-primary underline">Contact Us</Link> page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">8. Cookie Policy</h2>
            <p>
              We use cookies and similar technologies to improve your experience, analyze usage, and 
              assist in our marketing efforts. You can manage cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">9. Changes to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page 
              with a revised date. Your continued use of our services constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">10. Contact Information</h2>
            <p>
              For any questions regarding this Privacy Policy or your personal information, please contact us 
              through our <Link href="/contact" className="text-primary underline">Contact Us</Link> page.
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
