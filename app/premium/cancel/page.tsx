import { Button } from "@/components/ui/button"
import { XCircle, RefreshCw, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function PremiumCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Cancelled
          </h1>
          <p className="text-gray-600">
            No worries! Your payment was cancelled and you haven't been charged.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl mb-6">
          <h3 className="font-semibold mb-3">Why go Premium?</h3>
          <ul className="text-sm text-gray-600 space-y-2 text-left">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
              Unlimited likes and super likes
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              See who liked you first
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Advanced matching algorithms
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Priority customer support
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link href="/premium" className="block">
            <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Premium Again
            </Button>
          </Link>

          <Link href="/home" className="block">
            <Button variant="outline" className="w-full">
              Continue with Free Account
            </Button>
          </Link>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Need Help?</span>
          </div>
          <p className="text-xs text-blue-700">
            Questions about Premium? Contact us at support@loventodate.com
          </p>
        </div>
      </div>
    </div>
  )
}