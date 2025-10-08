"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Terms & Conditions</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div className="text-sm text-gray-500">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using DatingApp ("the Service"), you agree to be bound by these Terms and Conditions ("Terms").
              If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">2. Eligibility</h2>
            <p className="text-gray-700 leading-relaxed">
              You must be at least 18 years old to use this Service. By using the Service, you represent and warrant that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You are at least 18 years of age</li>
              <li>You have the legal capacity to enter into these Terms</li>
              <li>You are not prohibited from using the Service under the laws of any jurisdiction</li>
              <li>You have not been convicted of or pleaded no contest to a felony or indictable offense (or crime of similar severity), a sex crime, or any crime involving violence</li>
              <li>You are not required to register as a sex offender with any government entity</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">3. Account Registration</h2>
            <p className="text-gray-700 leading-relaxed">
              To use certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Be responsible for all activities that occur under your account</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">4. User Content and Conduct</h2>
            <p className="text-gray-700 leading-relaxed font-semibold">
              You are solely responsible for the content you post on the Service. You agree NOT to post content that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Contains nudity, sexually explicit material, or pornographic content</li>
              <li>Promotes violence, discrimination, or hatred against individuals or groups</li>
              <li>Contains harassment, bullying, or threats</li>
              <li>Violates any intellectual property rights</li>
              <li>Is false, misleading, or fraudulent</li>
              <li>Promotes illegal activities or substances</li>
              <li>Contains spam, solicitation, or commercial advertising</li>
              <li>Impersonates another person or entity</li>
              <li>Contains malware, viruses, or harmful code</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">5. Profile Verification</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to verify profiles through photo verification, identity verification, or other means.
              Verified profiles receive a verification badge. Misrepresenting yourself or using fake photos may result in
              immediate account termination.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">6. Prohibited Activities</h2>
            <p className="text-gray-700 leading-relaxed">
              You may not:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Use the Service for any illegal purpose</li>
              <li>Solicit money or engage in financial scams</li>
              <li>Use automated systems (bots) to access the Service</li>
              <li>Scrape, harvest, or collect user data</li>
              <li>Create multiple accounts or fake accounts</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Engage in catfishing or identity deception</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">7. Subscription and Payments</h2>
            <p className="text-gray-700 leading-relaxed">
              Premium features require a paid subscription. By purchasing a subscription:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You authorize us to charge your payment method for the subscription fee</li>
              <li>Subscriptions auto-renew unless canceled before the renewal date</li>
              <li>Fees are non-refundable except as required by law</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
              <li>You are responsible for all applicable taxes</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">8. Cancellation and Refunds</h2>
            <p className="text-gray-700 leading-relaxed">
              You may cancel your subscription at any time through your account settings. Refunds are provided only in
              accordance with applicable law. If you violate these Terms, you forfeit any right to a refund.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">9. Content Moderation</h2>
            <p className="text-gray-700 leading-relaxed">
              We use AI-powered and human moderation to review content. We reserve the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Remove any content that violates these Terms</li>
              <li>Suspend or terminate accounts without prior notice</li>
              <li>Report illegal activity to law enforcement</li>
              <li>Preserve content for legal proceedings</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">10. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              The Service and its original content, features, and functionality are owned by DatingApp and are protected
              by international copyright, trademark, and other intellectual property laws. You retain ownership of content
              you post, but grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display your
              content in connection with the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">11. Privacy and Data</h2>
            <p className="text-gray-700 leading-relaxed">
              Your privacy is important to us. Please review our <a href="/privacy" className="text-pink-600 hover:underline">Privacy Policy</a> to
              understand how we collect, use, and protect your personal information. By using the Service, you consent to
              our data practices as described in the Privacy Policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">12. Safety and Meetings</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
              <p className="text-yellow-800 font-semibold">Important Safety Notice:</p>
              <p className="text-yellow-700 mt-2">
                DatingApp does not conduct criminal background checks on users. You are solely responsible for your
                interactions with other users. Always meet in public places, tell someone where you're going, and never
                send money to someone you haven't met in person.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">13. Disclaimer of Warranties</h2>
            <p className="text-gray-700 leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE
              THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. WE DO NOT GUARANTEE THAT YOU WILL FIND A
              ROMANTIC PARTNER OR THAT ANY MATCHES WILL BE COMPATIBLE.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">14. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, DATINGAPP SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR USE, ARISING FROM YOUR
              USE OF THE SERVICE.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">15. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless DatingApp and its affiliates from any claims, losses, damages,
              liabilities, and expenses arising from your use of the Service, violation of these Terms, or violation of
              any rights of another person or entity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">16. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your account immediately, without prior notice, for any reason, including
              violation of these Terms. Upon termination, your right to use the Service will immediately cease. If you
              wish to terminate your account, you may do so through your account settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">17. Dispute Resolution</h2>
            <p className="text-gray-700 leading-relaxed">
              Any disputes arising from these Terms or use of the Service shall be resolved through binding arbitration
              in accordance with the rules of the American Arbitration Association. You waive your right to a jury trial
              and to participate in class action lawsuits.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">18. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of California,
              United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">19. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of material changes via email
              or through the Service. Your continued use of the Service after changes become effective constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">20. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about these Terms, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">Email: legal@datingapp.com</p>
              <p className="text-gray-700">Address: 123 Dating Street, San Francisco, CA 94102</p>
            </div>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-gray-500 italic">
              By using DatingApp, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <Button
            onClick={() => router.push('/privacy')}
            variant="outline"
            className="flex-1"
          >
            Read Privacy Policy
          </Button>
          <Button
            onClick={() => router.push('/community-guidelines')}
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
