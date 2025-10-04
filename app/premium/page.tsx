"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Crown, Zap, Heart, Star, Globe } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { getUserProfile } from "@/lib/api";
import toast from "react-hot-toast";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const plans = [
  {
    id: "premium-monthly",
    name: "Premium Monthly",
    price: 9.99,
    interval: "month",
    features: [
      "Unlimited Swipes",
      "See Who Likes You",
      "Priority Matches",
      "Rewind Last Swipe",
      "Global Dating",
      "5 Super Likes per day",
    ],
  },
  {
    id: "premium-yearly",
    name: "Premium Yearly",
    price: 99.99,
    interval: "year",
    features: [
      "All Monthly Features",
      "2 Months Free",
      "Boost Once per Month",
      "10 Super Likes per day",
      "Priority Support",
      "Ad-Free Experience",
    ],
  },
];

export default function PremiumPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(plans[0]);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkPremiumStatus();
    }
  }, [user?.id]);

  const checkPremiumStatus = async () => {
    try {
      const profile = await getUserProfile(user!.id);
      setIsPremium(profile.is_premium);
    } catch (error) {
      console.error("Error checking premium status:", error);
    }
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: selectedPlan.id,
          userId: user?.id,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error("Stripe failed to initialize");
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        toast.error(error.message || "Payment failed");
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      toast.error("Failed to process subscription");
    } finally {
      setLoading(false);
    }
  };

  if (isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">
              You're Premium!
            </h1>
            <p className="text-gray-600 mt-2">
              Enjoy all the premium features and benefits.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <Zap className="w-8 h-8 text-purple-500 mb-4" />
                <h3 className="font-semibold mb-2">Unlimited Swipes</h3>
                <p className="text-gray-600 text-sm">
                  No daily limit on your swipes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Heart className="w-8 h-8 text-pink-500 mb-4" />
                <h3 className="font-semibold mb-2">See Who Likes You</h3>
                <p className="text-gray-600 text-sm">
                  Check who's interested in you
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Star className="w-8 h-8 text-yellow-500 mb-4" />
                <h3 className="font-semibold mb-2">Priority Matches</h3>
                <p className="text-gray-600 text-sm">Get seen by more people</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Globe className="w-8 h-8 text-blue-500 mb-4" />
                <h3 className="font-semibold mb-2">Global Dating</h3>
                <p className="text-gray-600 text-sm">
                  Match with people worldwide
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">
            Upgrade to Premium
          </h1>
          <p className="text-gray-600 mt-2">
            Get more matches and exclusive features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-shadow hover:shadow-lg ${
                selectedPlan.id === plan.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedPlan(plan)}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{plan.name}</span>
                  <span className="text-2xl font-bold">
                    ${plan.price}
                    <span className="text-sm text-gray-500">
                      /{plan.interval}
                    </span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center text-gray-700"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full max-w-md"
          >
            {loading
              ? "Processing..."
              : `Get Premium for $${selectedPlan.price}/${selectedPlan.interval}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
