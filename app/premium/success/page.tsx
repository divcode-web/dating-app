import { Button } from "@/components/ui/button"
import { CheckCircle, Crown, Heart } from "lucide-react"
import Link from "next/link"

export default function PremiumSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600">
            Welcome to Premium! Your subscription is now active.
          </p>
        </div>

        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-xl mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Crown className="w-6 h-6" />
            <span className="text-lg font-semibold">Premium Features Unlocked</span>
          </div>
          <ul className="text-sm space-y-1 text-left">
            <li className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Unlimited likes and super likes
            </li>
            <li className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              See who liked you
            </li>
            <li className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Advanced matching algorithms
            </li>
            <li className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Priority customer support
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link href="/home" className="block">
            <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3">
              Start Dating Premium
            </Button>
          </Link>

          <Link href="/profile" className="block">
            <Button variant="outline" className="w-full">
              Update Your Profile
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Questions? Contact our support team at support@loventodate.com
        </p>
      </div>
    </div>
  )
}