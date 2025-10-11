"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-blue-900 font-semibold">GDPR Compliant</p>
            <p className="text-blue-800 text-sm mt-1">
              This Privacy Policy complies with the EU General Data Protection
              Regulation (GDPR), California Consumer Privacy Act (CCPA), and
              other applicable data protection laws.
            </p>
          </div>

          <div className="text-sm text-gray-500">
            Last Updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              lovento ("we," "our," or "us") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your personal information when you use our
              dating service.
            </p>
            <p className="text-gray-700 leading-relaxed font-semibold">
              By using lovento, you consent to the data practices described in
              this policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              2. Information We Collect
            </h2>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">
              2.1 Information You Provide
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Account Information:</strong> Name, email address, phone
                number, date of birth, gender
              </li>
              <li>
                <strong>Profile Information:</strong> Photos, bio, interests,
                occupation, education, location
              </li>
              <li>
                <strong>Enhanced Profile Data:</strong> Pet preferences,
                favorite books, music taste (Spotify data if connected)
              </li>
              <li>
                <strong>Communications:</strong> Messages, chat content,
                customer support inquiries
              </li>
              <li>
                <strong>Payment Information:</strong> Credit card details
                (processed securely by third-party payment processors)
              </li>
              <li>
                <strong>Verification Data:</strong> Government-issued ID for
                photo verification (optional)
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">
              2.2 Information Collected Automatically
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Usage Data:</strong> Swipes, likes, matches, message
                activity, time spent on app
              </li>
              <li>
                <strong>Device Information:</strong> IP address, browser type,
                operating system, device identifiers
              </li>
              <li>
                <strong>Location Data:</strong> GPS coordinates, city, region
                (with your permission)
              </li>
              <li>
                <strong>Cookies:</strong> Session cookies, preference cookies,
                analytics cookies
              </li>
              <li>
                <strong>Log Data:</strong> Access times, pages viewed, actions
                taken
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">
              2.3 Sensitive Personal Data
            </h3>
            <p className="text-gray-700 leading-relaxed">
              We may collect sensitive data including sexual orientation, racial
              or ethnic origin, and religious beliefs
              <strong> only with your explicit consent</strong>. You may choose
              not to provide this information, but it may limit matching
              capabilities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We use your personal data for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Matching Algorithm:</strong> To suggest compatible
                matches based on preferences and behavior
              </li>
              <li>
                <strong>Service Delivery:</strong> To provide, maintain, and
                improve our dating service
              </li>
              <li>
                <strong>Communication:</strong> To send messages, notifications,
                and updates about your account
              </li>
              <li>
                <strong>Safety & Security:</strong> To detect fraud, prevent
                abuse, and ensure platform safety
              </li>
              <li>
                <strong>Content Moderation:</strong> To review content for
                compliance with Community Guidelines
              </li>
              <li>
                <strong>Analytics:</strong> To understand usage patterns and
                improve user experience
              </li>
              <li>
                <strong>Marketing:</strong> To send promotional emails (you can
                opt out anytime)
              </li>
              <li>
                <strong>Legal Compliance:</strong> To comply with legal
                obligations and protect our rights
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              4. Legal Basis for Processing (GDPR)
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Under GDPR, we process your personal data based on:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Consent:</strong> You have given clear consent for us to
                process your data
              </li>
              <li>
                <strong>Contract:</strong> Processing is necessary to provide
                the service you requested
              </li>
              <li>
                <strong>Legitimate Interests:</strong> Processing is necessary
                for our legitimate business interests
              </li>
              <li>
                <strong>Legal Obligation:</strong> Processing is required by law
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              5. Data Sharing and Disclosure
            </h2>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">
              5.1 Who We Share Data With
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Other Users:</strong> Your profile information is
                visible to other users as part of the matching service
              </li>
              <li>
                <strong>Service Providers:</strong> Cloud hosting
                (AWS/Supabase), payment processors (Stripe), analytics (Google
                Analytics)
              </li>
              <li>
                <strong>AI Services:</strong> Content moderation APIs (Azure AI,
                OpenAI) - data is processed securely
              </li>
              <li>
                <strong>Law Enforcement:</strong> When required by law or to
                protect rights and safety
              </li>
              <li>
                <strong>Business Transfers:</strong> In the event of a merger,
                acquisition, or sale of assets
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">
              5.2 What We DON'T Do
            </h3>
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <p className="text-green-900 font-semibold">We DO NOT:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-green-800">
                <li>Sell your personal data to third parties</li>
                <li>Share your data with advertisers without consent</li>
                <li>Use your messages to train AI without opt-in consent</li>
                <li>Share location data with third parties</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              6. Your Privacy Rights
            </h2>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">
              6.1 GDPR Rights (EU Users)
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Right to Access:</strong> Request a copy of your
                personal data
              </li>
              <li>
                <strong>Right to Rectification:</strong> Correct inaccurate or
                incomplete data
              </li>
              <li>
                <strong>Right to Erasure:</strong> Request deletion of your data
                ("right to be forgotten")
              </li>
              <li>
                <strong>Right to Data Portability:</strong> Receive your data in
                a machine-readable format
              </li>
              <li>
                <strong>Right to Object:</strong> Object to processing of your
                data
              </li>
              <li>
                <strong>Right to Restrict Processing:</strong> Request
                limitation of how we use your data
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> Withdraw consent at
                any time
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">
              6.2 CCPA Rights (California Users)
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Right to know what personal information is collected</li>
              <li>
                Right to know if personal information is sold or disclosed
              </li>
              <li>Right to opt-out of sale of personal information</li>
              <li>Right to deletion of personal information</li>
              <li>Right to non-discrimination for exercising rights</li>
            </ul>

            <div className="bg-pink-50 border-l-4 border-pink-500 p-4 mt-4">
              <p className="text-pink-900 font-semibold">
                To exercise your rights:
              </p>
              <p className="text-pink-800 mt-1">
                Email privacy@lovento.com or use your account settings
              </p>
              <p className="text-pink-800 text-sm mt-1">
                We will respond within 30 days (GDPR) or 45 days (CCPA)
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              7. Data Retention
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal data for as long as necessary to provide
              our services and comply with legal obligations:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Active Accounts:</strong> Data retained while your
                account is active
              </li>
              <li>
                <strong>Deleted Accounts:</strong> Most data deleted within 30
                days of account deletion
              </li>
              <li>
                <strong>Legal Requirements:</strong> Some data retained longer
                for legal compliance (e.g., transaction records for 10 years)
              </li>
              <li>
                <strong>Backup Systems:</strong> Data in backups deleted within
                90 days
              </li>
              <li>
                <strong>Anonymized Data:</strong> May be retained indefinitely
                for analytics
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              8. Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We implement industry-standard security measures to protect your
              data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>End-to-end encryption for messages</li>
              <li>HTTPS/SSL encryption for data transmission</li>
              <li>Secure cloud infrastructure with regular security audits</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Regular security updates and patches</li>
              <li>Employee training on data protection</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              However, no method of transmission over the Internet is 100%
              secure. While we strive to protect your data, we cannot guarantee
              absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              9. Data Breach Notification
            </h2>
            <p className="text-gray-700 leading-relaxed">
              In the event of a data breach affecting your personal information,
              we will:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Notify affected users within 72 hours (GDPR requirement)</li>
              <li>
                Notify relevant supervisory authorities as required by law
              </li>
              <li>
                Provide details about the breach and steps taken to mitigate
                harm
              </li>
              <li>Offer guidance on protecting your information</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              10. International Data Transfers
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Your data may be transferred to and processed in countries outside
              your residence. We ensure adequate protection through:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>EU-US Data Privacy Framework compliance</li>
              <li>Standard Contractual Clauses (SCCs)</li>
              <li>Adequacy decisions by the European Commission</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              11. Cookies and Tracking
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar tracking technologies:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Essential Cookies:</strong> Required for the service to
                function (cannot be disabled)
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand usage
                patterns (can be disabled)
              </li>
              <li>
                <strong>Preference Cookies:</strong> Remember your settings (can
                be disabled)
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You can control cookies through your browser settings. Note that
              disabling cookies may limit functionality.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              12. Third-Party Services
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We integrate with third-party services:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Spotify:</strong> Music integration (if you connect your
                account)
              </li>
              <li>
                <strong>Payment Processors:</strong> Stripe for secure payment
                processing
              </li>
              <li>
                <strong>Cloud Services:</strong> Supabase for data storage
              </li>
              <li>
                <strong>Analytics:</strong> Google Analytics for usage
                statistics
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              These services have their own privacy policies. We are not
              responsible for their data practices.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              13. Children's Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our service is NOT intended for anyone under 18 years old. We do
              not knowingly collect data from minors. If we learn that we have
              collected data from someone under 18, we will delete it
              immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              14. AI and Automated Decision-Making
            </h2>
            <p className="text-gray-700 leading-relaxed">We use AI for:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Matching Algorithm:</strong> Suggests compatible matches
                based on your profile and behavior
              </li>
              <li>
                <strong>Content Moderation:</strong> Automatically detects
                inappropriate content
              </li>
              <li>
                <strong>Spam Detection:</strong> Identifies and blocks spam or
                scam accounts
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You have the right to object to automated decision-making and
              request human review.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              15. Changes to Privacy Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of material changes via email or through the app. Your
              continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">16. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              For privacy-related questions or to exercise your rights:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@lovento.com
              </p>
              <p className="text-gray-700">
                <strong>Data Protection Officer:</strong> dpo@lovento.com
              </p>
              <p className="text-gray-700">
                <strong>Address:</strong> 123 Dating Street, San Francisco, CA
                94102
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">
              17. Supervisory Authority
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you are located in the EU/EEA, you have the right to lodge a
              complaint with your local data protection authority.
            </p>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-gray-500 italic">
              By using lovento, you acknowledge that you have read and
              understood this Privacy Policy.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <Button
            onClick={() => router.push("/terms")}
            variant="outline"
            className="flex-1"
          >
            Read Terms & Conditions
          </Button>
          <Button
            onClick={() => router.push("/community-guidelines")}
            variant="outline"
            className="flex-1"
          >
            Community Guidelines
          </Button>
        </div>
      </div>
    </div>
  );
}
