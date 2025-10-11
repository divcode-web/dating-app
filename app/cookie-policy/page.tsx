"use client";

import { Card } from "@/components/ui/card";
import { ArrowLeft, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CookiePolicyPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Button onClick={() => router.back()} variant="outline" className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <Cookie className="w-10 h-10 text-purple-500" />
          <h1 className="text-4xl font-bold">Cookie Policy</h1>
        </div>

        <p className="text-gray-600 mb-6">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-8 text-gray-700">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="mb-4">
              This Cookie Policy explains how Dating App ("we", "us", or "our")
              uses cookies and similar technologies to recognize you when you
              visit our website and mobile application. It explains what these
              technologies are and why we use them, as well as your rights to
              control our use of them.
            </p>
            <p>
              This policy complies with the General Data Protection Regulation
              (GDPR), UK GDPR, California Consumer Privacy Act (CCPA), and other
              applicable privacy laws.
            </p>
          </section>

          {/* What are cookies */}
          <section>
            <h2 className="text-2xl font-bold mb-4">2. What Are Cookies?</h2>
            <p className="mb-4">
              Cookies are small data files that are placed on your computer or
              mobile device when you visit a website. Cookies are widely used by
              website owners in order to make their websites work, or to work
              more efficiently, as well as to provide reporting information.
            </p>
            <p>
              Cookies set by the website owner (in this case, Dating App) are
              called "first-party cookies". Cookies set by parties other than
              the website owner are called "third-party cookies".
            </p>
          </section>

          {/* Types of cookies */}
          <section>
            <h2 className="text-2xl font-bold mb-4">
              3. Types of Cookies We Use
            </h2>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">
                  3.1 Necessary Cookies
                </h3>
                <p className="mb-2">
                  These cookies are essential for you to browse the website and
                  use its features. Without these cookies, services you have
                  asked for cannot be provided.
                </p>
                <p className="text-sm">
                  <strong>Examples:</strong> Authentication cookies, security
                  cookies, session cookies
                </p>
                <p className="text-sm mt-2">
                  <strong>Legal Basis:</strong> These cookies are necessary for
                  the performance of a contract between you and us (Article
                  6(1)(b) GDPR).
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">
                  3.2 Analytics Cookies
                </h3>
                <p className="mb-2">
                  These cookies collect information about how you use our
                  website, such as which pages you visit most often. This data
                  is used to optimize our website and make it easier for you to
                  navigate.
                </p>
                <p className="text-sm">
                  <strong>Examples:</strong> Google Analytics, internal
                  analytics
                </p>
                <p className="text-sm mt-2">
                  <strong>Legal Basis:</strong> Your consent (Article 6(1)(a)
                  GDPR).
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">
                  3.3 Marketing Cookies
                </h3>
                <p className="mb-2">
                  These cookies track your online activity to help advertisers
                  deliver more relevant advertising or to limit how many times
                  you see an ad. These cookies can share that information with
                  other organizations or advertisers.
                </p>
                <p className="text-sm">
                  <strong>Examples:</strong> Facebook Pixel, Google Ads,
                  retargeting cookies
                </p>
                <p className="text-sm mt-2">
                  <strong>Legal Basis:</strong> Your consent (Article 6(1)(a)
                  GDPR).
                </p>
              </div>
            </div>
          </section>

          {/* Cookie duration */}
          <section>
            <h2 className="text-2xl font-bold mb-4">4. Cookie Duration</h2>
            <div className="space-y-3">
              <p>
                <strong>Session Cookies:</strong> These cookies are temporary
                and expire when you close your browser.
              </p>
              <p>
                <strong>Persistent Cookies:</strong> These cookies remain on
                your device for a set period (typically 12 months) or until you
                delete them.
              </p>
            </div>
          </section>

          {/* Your rights */}
          <section>
            <h2 className="text-2xl font-bold mb-4">
              5. Your Cookie Choices and Rights
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">5.1 Managing Cookies</h3>
                <p className="mb-2">
                  You have the right to decide whether to accept or reject
                  cookies. You can exercise your cookie rights by setting your
                  preferences in our cookie consent banner when you first visit
                  our website.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">5.2 Browser Settings</h3>
                <p className="mb-2">
                  You can also set or amend your web browser controls to accept
                  or refuse cookies. The method for disabling cookies may vary
                  from browser to browser:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Chrome:</strong> Settings → Privacy and security →
                    Cookies and other site data
                  </li>
                  <li>
                    <strong>Firefox:</strong> Settings → Privacy & Security →
                    Cookies and Site Data
                  </li>
                  <li>
                    <strong>Safari:</strong> Preferences → Privacy → Cookies and
                    website data
                  </li>
                  <li>
                    <strong>Edge:</strong> Settings → Cookies and site
                    permissions
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">5.3 Withdrawing Consent</h3>
                <p>
                  You can withdraw your consent to our use of analytics and
                  marketing cookies at any time by clearing your browser cookies
                  or adjusting your cookie preferences.
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm">
                  <strong>Please note:</strong> If you choose to block or delete
                  cookies, some features of our website may not function
                  properly or may not be available to you.
                </p>
              </div>
            </div>
          </section>

          {/* Third-party cookies */}
          <section>
            <h2 className="text-2xl font-bold mb-4">6. Third-Party Cookies</h2>
            <p className="mb-4">
              We may use third-party service providers who are allowed to place
              cookies on your device on our behalf to perform certain functions
              described in this policy. These third parties include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Google Analytics:</strong> To analyze website traffic
                and user behavior
              </li>
              <li>
                <strong>Advertising Partners:</strong> To deliver relevant
                advertisements
              </li>
              <li>
                <strong>Social Media Platforms:</strong> To enable social
                sharing and track engagement
              </li>
            </ul>
          </section>

          {/* Regional compliance */}
          <section>
            <h2 className="text-2xl font-bold mb-4">7. Regional Compliance</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">7.1 EU/UK Users (GDPR)</h3>
                <p>
                  Under the GDPR, we require your explicit consent before
                  setting non-essential cookies. You have the right to withdraw
                  consent at any time without affecting the lawfulness of
                  processing based on consent before its withdrawal.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  7.2 California Users (CCPA)
                </h3>
                <p>
                  California residents have the right to opt-out of the "sale"
                  of personal information. While we do not sell personal
                  information in the traditional sense, sharing data with
                  advertising partners may constitute a "sale" under CCPA. You
                  can opt-out by rejecting marketing cookies.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">7.3 Other Jurisdictions</h3>
                <p>
                  We comply with applicable privacy laws in all jurisdictions
                  where we operate, including providing appropriate notices and
                  obtaining necessary consents.
                </p>
              </div>
            </div>
          </section>

          {/* Do Not Track */}
          <section>
            <h2 className="text-2xl font-bold mb-4">8. Do Not Track Signals</h2>
            <p>
              Some browsers have a "Do Not Track" feature that lets you tell
              websites that you do not want to have your online activities
              tracked. We currently do not respond to browser "Do Not Track"
              signals, but you can manage your cookie preferences through our
              cookie consent banner or your browser settings.
            </p>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-bold mb-4">
              9. Updates to This Policy
            </h2>
            <p>
              We may update this Cookie Policy from time to time to reflect
              changes in our practices or for other operational, legal, or
              regulatory reasons. We will notify you of any material changes by
              posting the new Cookie Policy on this page and updating the "Last
              Updated" date.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold mb-4">10. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about our use of cookies or this Cookie
              Policy, please contact us:
            </p>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p>
                <strong>Email:</strong> privacy@lovento.com
              </p>
              <p>
                <strong>Address:</strong> [Your Company Address]
              </p>
              <p>
                <strong>Data Protection Officer:</strong> dpo@lovento.com
              </p>
            </div>
          </section>

          {/* Data retention */}
          <section>
            <h2 className="text-2xl font-bold mb-4">11. Data Retention</h2>
            <p>
              Cookie consent choices are stored for 12 months. After this
              period, you will be asked to renew your preferences. Session
              cookies are deleted when you close your browser. Persistent
              cookies remain for the duration specified in their settings or
              until you delete them.
            </p>
          </section>

          {/* Footer */}
          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-gray-600">
              This Cookie Policy is part of our{" "}
              <a
                href="/privacy-policy"
                className="text-purple-600 hover:underline"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a href="/terms" className="text-purple-600 hover:underline">
                Terms of Service
              </a>
              . By using our website, you agree to our use of cookies in
              accordance with this policy.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
