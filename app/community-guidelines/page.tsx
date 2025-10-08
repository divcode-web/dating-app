"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Heart, AlertTriangle, Flag } from "lucide-react";

export default function CommunityGuidelinesPage() {
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
          <div>
            <h1 className="text-2xl font-bold">Community Guidelines</h1>
            <p className="text-sm text-gray-600">Making DatingApp safe and welcoming for everyone</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-l-4 border-pink-500 p-6 rounded-r-lg">
            <div className="flex items-start gap-4">
              <Heart className="w-8 h-8 text-pink-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Our Mission</h2>
                <p className="text-gray-700 leading-relaxed">
                  DatingApp is built on respect, authenticity, and kindness. These guidelines help create a safe,
                  inclusive community where everyone can find meaningful connections.
                </p>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>

          {/* BE YOURSELF Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Be Yourself</h2>
            </div>

            <div className="pl-13 space-y-3">
              <p className="text-gray-700 leading-relaxed">
                Authenticity is the foundation of meaningful connections. We encourage you to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Use real, recent photos of yourself</li>
                <li>Be honest about your age, appearance, and intentions</li>
                <li>Write a genuine bio that reflects who you are</li>
                <li>Represent yourself accurately - no celebrity photos, heavily filtered images, or group photos as your main picture</li>
              </ul>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
                <p className="text-red-900 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Zero Tolerance
                </p>
                <p className="text-red-800 mt-1">
                  Catfishing, impersonation, and fake profiles result in immediate account termination.
                </p>
              </div>
            </div>
          </section>

          {/* RESPECT OTHERS Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🤝</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Respect Others</h2>
            </div>

            <div className="pl-13 space-y-3">
              <p className="text-gray-700 leading-relaxed">
                Treat every person with dignity and respect, even if you're not interested:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Be kind in your messages - rejection doesn't require rudeness</li>
                <li>Respect boundaries - "no" means no</li>
                <li>Don't harass, stalk, or send unsolicited explicit content</li>
                <li>Accept that not everyone will be interested, and that's okay</li>
                <li>Use appropriate language - no hate speech, slurs, or derogatory terms</li>
              </ul>
            </div>
          </section>

          {/* PROHIBITED CONTENT Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🚫</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Prohibited Content</h2>
            </div>

            <div className="pl-13 space-y-3">
              <p className="text-gray-700 leading-relaxed font-semibold">
                The following content is strictly prohibited:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">❌ Nudity & Sexual Content</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                    <li>Nudity or sexually explicit photos</li>
                    <li>Pornographic content or links</li>
                    <li>Unsolicited sexual messages or propositions</li>
                    <li>Sexual content involving minors (reported to authorities)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">❌ Hate & Harassment</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                    <li>Hate speech based on race, ethnicity, religion, gender, sexual orientation, disability</li>
                    <li>Harassment, bullying, or threatening behavior</li>
                    <li>Doxxing or sharing private information without consent</li>
                    <li>Encouraging self-harm or violence</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">❌ Illegal Activity</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                    <li>Illegal drug use or sales</li>
                    <li>Weapons sales or distribution</li>
                    <li>Prostitution or solicitation</li>
                    <li>Human trafficking</li>
                    <li>Any content that violates local, state, or federal laws</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">❌ Scams & Spam</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                    <li>Financial scams or requests for money</li>
                    <li>Phishing or fraudulent schemes</li>
                    <li>Commercial solicitation or advertising</li>
                    <li>Pyramid schemes or multi-level marketing</li>
                    <li>Spam messages or bot activity</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">❌ Violence & Gore</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                    <li>Graphic violence or gore</li>
                    <li>Animal abuse</li>
                    <li>Threats of violence</li>
                    <li>Glorification of terrorism or extremism</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* PHOTO GUIDELINES Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📸</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Photo Guidelines</h2>
            </div>

            <div className="pl-13 space-y-3">
              <p className="text-gray-700 leading-relaxed font-semibold text-green-700">
                ✅ Good Photos:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Clear, recent photos showing your face</li>
                <li>Photos where you're the primary subject</li>
                <li>Natural lighting and minimal filters</li>
                <li>Variety: close-ups, full body, hobbies</li>
              </ul>

              <p className="text-gray-700 leading-relaxed font-semibold text-red-700 mt-4">
                ❌ Unacceptable Photos:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Nudity, underwear, or sexually suggestive poses</li>
                <li>Photos of children alone (for safety)</li>
                <li>Screenshots of other profiles or memes as main photo</li>
                <li>Blurry, dark, or unidentifiable photos</li>
                <li>Photos with weapons</li>
                <li>Celebrity or stock photos</li>
              </ul>
            </div>
          </section>

          {/* SAFETY FIRST Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-10 h-10 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900">Safety First</h2>
            </div>

            <div className="pl-13 space-y-3">
              <p className="text-gray-700 leading-relaxed">
                Your safety is our top priority. Follow these safety tips:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Meet in Public:</strong> First meetings should always be in public places</li>
                <li><strong>Tell Someone:</strong> Let a friend or family member know where you're going</li>
                <li><strong>Trust Your Instincts:</strong> If something feels off, it probably is</li>
                <li><strong>Don't Share Financial Info:</strong> Never send money or share bank details</li>
                <li><strong>Protect Personal Info:</strong> Don't share your address, workplace, or other sensitive details early on</li>
                <li><strong>Stay on Platform:</strong> Keep conversations on DatingApp until you feel comfortable</li>
                <li><strong>Report Concerns:</strong> Use our report feature for suspicious behavior</li>
              </ul>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                <p className="text-yellow-900 font-semibold">Remember:</p>
                <p className="text-yellow-800 mt-1">
                  We do not conduct background checks. You are responsible for your own safety and interactions with others.
                </p>
              </div>
            </div>
          </section>

          {/* REPORTING Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Flag className="w-10 h-10 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">Report Violations</h2>
            </div>

            <div className="pl-13 space-y-3">
              <p className="text-gray-700 leading-relaxed">
                Help us keep DatingApp safe by reporting violations:
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-blue-900 font-semibold mb-2">How to Report:</p>
                <ol className="list-decimal pl-6 space-y-1 text-blue-800 text-sm">
                  <li>Click the three dots (...) on any profile or message</li>
                  <li>Select "Report" from the menu</li>
                  <li>Choose the reason for reporting</li>
                  <li>Add details to help our team review</li>
                  <li>Submit - we'll review within 24 hours</li>
                </ol>
              </div>

              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>All reports are confidential and anonymous.</strong> The reported user will not know you reported them.
              </p>

              <p className="text-gray-700 leading-relaxed">
                For emergencies or illegal activity, contact local law enforcement immediately.
              </p>
            </div>
          </section>

          {/* CONSEQUENCES Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚖️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Consequences of Violations</h2>
            </div>

            <div className="pl-13 space-y-3">
              <p className="text-gray-700 leading-relaxed">
                Violations of these guidelines may result in:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Warning:</strong> First-time minor violations receive a warning</li>
                <li><strong>Content Removal:</strong> Inappropriate content is deleted</li>
                <li><strong>Temporary Suspension:</strong> Account suspended for 7-30 days</li>
                <li><strong>Permanent Ban:</strong> Serious or repeated violations result in permanent account termination</li>
                <li><strong>Legal Action:</strong> Illegal activity is reported to law enforcement</li>
              </ul>

              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="text-gray-700 font-semibold">Zero Tolerance Violations (Immediate Ban):</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600 text-sm">
                  <li>Sexual content involving minors</li>
                  <li>Human trafficking or exploitation</li>
                  <li>Violent threats or terrorism</li>
                  <li>Repeated harassment after warning</li>
                </ul>
              </div>
            </div>
          </section>

          {/* MODERATION Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">How We Moderate</h2>
            </div>

            <div className="pl-13 space-y-3">
              <p className="text-gray-700 leading-relaxed">
                We use a combination of technology and human review:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>AI Detection:</strong> Automated systems scan for prohibited content 24/7</li>
                <li><strong>Photo Verification:</strong> Optional verification to prove you're real</li>
                <li><strong>Human Review:</strong> Trained moderators review reported content</li>
                <li><strong>Community Reports:</strong> User reports help us identify violations</li>
                <li><strong>Proactive Monitoring:</strong> Random checks to ensure compliance</li>
              </ul>
            </div>
          </section>

          {/* BE A GOOD COMMUNITY MEMBER Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💝</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Be a Good Community Member</h2>
            </div>

            <div className="pl-13 space-y-3">
              <p className="text-gray-700 leading-relaxed">
                Beyond following rules, here's how to be a great community member:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Engage authentically and put effort into conversations</li>
                <li>Be patient and understanding with others</li>
                <li>Celebrate diversity and different perspectives</li>
                <li>Give constructive feedback when asked</li>
                <li>Support others in finding connections</li>
                <li>Lead with empathy and kindness</li>
              </ul>
            </div>
          </section>

          {/* UPDATES Section */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Updates to Guidelines</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these guidelines as our community grows. We'll notify you of significant changes.
              Continued use of DatingApp constitutes acceptance of updated guidelines.
            </p>
          </section>

          {/* CONTACT Section */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Questions?</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about these guidelines:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> support@datingapp.com</p>
              <p className="text-gray-700"><strong>Report Safety Concerns:</strong> safety@datingapp.com</p>
            </div>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-gray-500 italic">
              By using DatingApp, you agree to follow these Community Guidelines. Together, we can build a safe,
              respectful, and welcoming community for everyone.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <Button
            onClick={() => router.push('/terms')}
            variant="outline"
            className="flex-1"
          >
            Terms & Conditions
          </Button>
          <Button
            onClick={() => router.push('/privacy')}
            variant="outline"
            className="flex-1"
          >
            Privacy Policy
          </Button>
        </div>
      </div>
    </div>
  );
}
