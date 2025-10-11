"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Crown, Zap, Heart, Star, Globe, X, Shield, Sparkles, TrendingUp, Bitcoin, CreditCard } from "lucide-react";
import { getSubscriptionTiers, type SubscriptionTier } from "@/lib/subscription-limits";
import { getUserProfile } from "@/lib/api";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

const paymentProviders = [
  {
    id: 'lemonsqueezy',
    name: 'Card Payment',
    description: 'Credit/Debit Card via LemonSqueezy',
    icon: CreditCard,
    type: 'fiat' as const,
  },
  {
    id: 'cryptomus',
    name: 'Cryptocurrency',
    description: 'BTC, ETH, USDT & more',
    icon: Bitcoin,
    type: 'crypto' as const,
  },
];

const tierIcons: Record<string, any> = {
  free: Zap,
  basic_monthly: Heart,
  standard_3month: Star,
  premium_yearly: Crown,
};

const tierColors: Record<string, string> = {
  free: 'from-gray-500 to-gray-600',
  basic_monthly: 'from-pink-500 to-rose-600',
  standard_3month: 'from-purple-500 to-indigo-600',
  premium_yearly: 'from-yellow-500 to-amber-600',
};

export default function PremiumPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [currentTier, setCurrentTier] = useState<string>('free');

  useEffect(() => {
    loadTiers();
    loadCurrentTier();

    // Handle payment success/failure callbacks
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const tier = searchParams.get('tier');

    if (success === 'true') {
      toast.success('🎉 Payment successful! Your subscription is being activated...', { duration: 5000 });
      // Reload profile to get updated tier
      setTimeout(() => {
        loadCurrentTier();
      }, 2000);
    } else if (canceled === 'true') {
      toast.error('Payment canceled. You can try again anytime!');
    }
  }, [user?.id, searchParams]);

  const loadTiers = async () => {
    const allTiers = await getSubscriptionTiers();
    setTiers(allTiers);
  };

  const loadCurrentTier = async () => {
    if (!user?.id) return;
    try {
      const profile = await getUserProfile(user.id);
      setCurrentTier(profile.subscription_tier_id || 'free');
    } catch (error) {
      console.error('Error loading current tier:', error);
    }
  };

  const handlePaymentProvider = async (providerId: string, tier: SubscriptionTier) => {
    if (!tier || !user?.id) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/payments/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          tierId: tier.id,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        // Redirect to checkout
        window.location.href = data.checkoutUrl;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to process subscription');
    } finally {
      setLoading(false);
    }
  };

  const getFeaturesList = (tier: SubscriptionTier): string[] => {
    const features: string[] = [];

    // Limits
    if (tier.daily_swipe_limit === null) {
      features.push('♾️ Unlimited Swipes');
    } else {
      features.push(`${tier.daily_swipe_limit} Swipes per day`);
    }

    if (tier.daily_message_limit === null) {
      features.push('♾️ Unlimited Messages');
    } else {
      features.push(`${tier.daily_message_limit} Messages per day`);
    }

    if (tier.daily_super_likes > 0) {
      features.push(`${tier.daily_super_likes} Super Likes daily`);
    }

    if (tier.monthly_boosts > 0) {
      features.push(`${tier.monthly_boosts} Profile Boosts monthly`);
    }

    // Premium Features
    if (tier.no_ads) features.push('✨ Ad-Free Experience');
    if (tier.can_see_who_likes) features.push('👀 See Who Likes You');
    if (tier.can_use_ai_matching) features.push('🤖 AI Smart Matching');
    if (tier.can_rewind_swipes) features.push('⏪ Rewind Swipes');
    if (tier.has_global_dating) features.push('🌍 Global Dating');
    if (tier.has_priority_matches) features.push('⭐ Priority in Queue');
    if (tier.has_read_receipts) features.push('✓✓ Read Receipts');
    if (tier.has_advanced_filters) features.push('🔍 Advanced Filters');
    if (tier.has_profile_boost) features.push('🚀 Profile Visibility Boost');
    if (tier.can_see_online_status) features.push('🟢 See Online Status');
    if (tier.has_unlimited_rewinds) features.push('♾️ Unlimited Rewinds');
    if (tier.has_priority_support) features.push('💬 Priority Support');

    return features;
  };

  const getMonthlyPrice = (tier: SubscriptionTier): string => {
    if (tier.price === 0) return 'Free';
    if (tier.interval === 'month') return `$${tier.price.toFixed(2)}/mo`;
    if (tier.interval === '3month') return `$${(tier.price / 3).toFixed(2)}/mo`;
    if (tier.interval === 'year') return `$${(tier.price / 12).toFixed(2)}/mo`;
    return `$${tier.price.toFixed(2)}`;
  };

  const getSavings = (tier: SubscriptionTier): string | null => {
    if (tier.interval === '3month') {
      const monthlyCost = tier.price / 3;
      const savings = ((9.99 - monthlyCost) / 9.99 * 100).toFixed(0);
      return `Save ${savings}%`;
    }
    if (tier.interval === 'year') {
      const monthlyCost = tier.price / 12;
      const savings = ((9.99 - monthlyCost) / 9.99 * 100).toFixed(0);
      return `Save ${savings}%`;
    }
    return null;
  };

  if (currentTier !== 'free') {
    const Icon = tierIcons[currentTier] || Crown;
    const currentTierData = tiers.find(t => t.id === currentTier);

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r ${tierColors[currentTier]} flex items-center justify-center`}>
            <Icon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            You're {currentTierData?.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Enjoy all your premium features and benefits
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {currentTierData && getFeaturesList(currentTierData).slice(0, 9).map((feature, i) => (
              <Card key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{feature}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            onClick={() => setCurrentTier('free')} // Allow viewing upgrade options
            variant="outline"
            className="mt-8"
          >
            View Other Plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-yellow-500 mr-2" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Find Your Perfect Match
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-500 ml-2" />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose the plan that fits your dating goals
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tiers.map((tier) => {
            const Icon = tierIcons[tier.id] || Crown;
            const savings = getSavings(tier);
            const features = getFeaturesList(tier);
            const isCurrentTier = tier.id === currentTier;

            return (
              <Card
                key={tier.id}
                className={`relative overflow-hidden transition-all hover:shadow-xl ${
                  tier.is_popular ? 'ring-2 ring-purple-500 scale-105' : ''
                } ${isCurrentTier ? 'opacity-75' : ''}`}
              >
                {tier.is_popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                {savings && (
                  <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-br-lg">
                    {savings}
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${tierColors[tier.id]} flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                  <CardDescription className="text-sm">{tier.description}</CardDescription>
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">
                      {getMonthlyPrice(tier)}
                    </div>
                    {tier.price > 0 && tier.interval !== 'month' && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        ${tier.price.toFixed(2)} billed {tier.interval === '3month' ? 'quarterly' : 'annually'}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {features.slice(0, 8).map((feature, i) => (
                      <li key={i} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {features.length > 8 && (
                      <li className="text-sm text-gray-500 dark:text-gray-400 italic">
                        +{features.length - 8} more features
                      </li>
                    )}
                  </ul>

                  {/* CTA Button */}
                  {isCurrentTier ? (
                    <Button disabled className="w-full" size="lg">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Current Plan
                    </Button>
                  ) : tier.id === 'free' ? (
                    <Button variant="outline" className="w-full" size="lg" disabled>
                      Active Plan
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      {/* Price breakdown for multi-period plans */}
                      {tier.interval !== 'month' && tier.interval !== 'free' && (
                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {tier.interval === '3month' && `$${tier.price.toFixed(2)} total • Billed every 3 months`}
                            {tier.interval === 'year' && `$${tier.price.toFixed(2)} total • Billed annually`}
                          </p>
                        </div>
                      )}

                      {/* Payment Method Header */}
                      <div className="border-t pt-3">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">
                          {tier.interval === 'month' && `Pay $${tier.price.toFixed(2)}/month with:`}
                          {tier.interval === '3month' && `Pay $${tier.price.toFixed(2)} now with:`}
                          {tier.interval === 'year' && `Pay $${tier.price.toFixed(2)} now with:`}
                        </p>

                        {/* Payment Method Buttons */}
                        <div className="space-y-2">
                          {paymentProviders.map((provider) => {
                            const Icon = provider.icon;
                            return (
                              <Button
                                key={provider.id}
                                onClick={() => handlePaymentProvider(provider.id, tier)}
                                disabled={loading}
                                variant="outline"
                                className="w-full h-auto py-3 px-3 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-500 transition-all group"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <div className="text-left">
                                    <div className="font-semibold text-sm text-gray-900 dark:text-white">
                                      {provider.name}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {provider.type === 'fiat' && (
                                    <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
                                      Card
                                    </span>
                                  )}
                                  {provider.type === 'crypto' && (
                                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                      Crypto
                                    </span>
                                  )}
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      {savings && (
                        <p className="text-xs text-center text-green-600 dark:text-green-400 font-semibold">
                          {savings} compared to monthly
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur mb-12 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b">
            <CardTitle className="text-2xl text-center">Compare All Plans</CardTitle>
            <CardDescription className="text-center">Choose the perfect plan for your dating journey</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-900 dark:text-white w-1/4">Features</th>
                    <th className="text-center p-4 font-semibold text-gray-600 dark:text-gray-400">Free</th>
                    <th className="text-center p-4 font-semibold bg-pink-50 dark:bg-pink-900/20">
                      <div className="text-pink-600 dark:text-pink-400">Basic</div>
                      <div className="text-xs font-normal text-gray-500">$9.99/mo</div>
                    </th>
                    <th className="text-center p-4 font-semibold bg-purple-50 dark:bg-purple-900/20">
                      <div className="text-purple-600 dark:text-purple-400">Standard</div>
                      <div className="text-xs font-normal text-gray-500">$8.00/mo</div>
                    </th>
                    <th className="text-center p-4 font-semibold bg-yellow-50 dark:bg-yellow-900/20">
                      <div className="text-yellow-600 dark:text-yellow-400">Premium VIP</div>
                      <div className="text-xs font-normal text-gray-500">$8.33/mo</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Daily Limits */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">Daily Swipes</td>
                    <td className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">10</td>
                    <td className="p-4 text-center text-sm bg-pink-50/50 dark:bg-pink-900/10">50</td>
                    <td className="p-4 text-center text-sm bg-purple-50/50 dark:bg-purple-900/10">
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">♾️ Unlimited</span>
                    </td>
                    <td className="p-4 text-center text-sm bg-yellow-50/50 dark:bg-yellow-900/10">
                      <span className="text-yellow-600 dark:text-yellow-400 font-semibold">♾️ Unlimited</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">Daily Messages</td>
                    <td className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">11</td>
                    <td className="p-4 text-center text-sm bg-pink-50/50 dark:bg-pink-900/10">
                      <span className="text-pink-600 dark:text-pink-400 font-semibold">♾️ Unlimited</span>
                    </td>
                    <td className="p-4 text-center text-sm bg-purple-50/50 dark:bg-purple-900/10">
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">♾️ Unlimited</span>
                    </td>
                    <td className="p-4 text-center text-sm bg-yellow-50/50 dark:bg-yellow-900/10">
                      <span className="text-yellow-600 dark:text-yellow-400 font-semibold">♾️ Unlimited</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">Super Likes</td>
                    <td className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">—</td>
                    <td className="p-4 text-center text-sm bg-pink-50/50 dark:bg-pink-900/10">5/day</td>
                    <td className="p-4 text-center text-sm bg-purple-50/50 dark:bg-purple-900/10">10/day</td>
                    <td className="p-4 text-center text-sm bg-yellow-50/50 dark:bg-yellow-900/10">20/day</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">Profile Boosts</td>
                    <td className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">—</td>
                    <td className="p-4 text-center text-sm bg-pink-50/50 dark:bg-pink-900/10">1/month</td>
                    <td className="p-4 text-center text-sm bg-purple-50/50 dark:bg-purple-900/10">3/month</td>
                    <td className="p-4 text-center text-sm bg-yellow-50/50 dark:bg-yellow-900/10">5/month</td>
                  </tr>

                  {/* Premium Features */}
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <td colSpan={5} className="p-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Premium Features
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">✨ Ad-Free Experience</td>
                    <td className="p-4 text-center"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-pink-50/50 dark:bg-pink-900/10"><CheckCircle2 className="w-5 h-5 text-pink-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-purple-50/50 dark:bg-purple-900/10"><CheckCircle2 className="w-5 h-5 text-purple-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-yellow-50/50 dark:bg-yellow-900/10"><CheckCircle2 className="w-5 h-5 text-yellow-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">👀 See Who Likes You</td>
                    <td className="p-4 text-center"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-pink-50/50 dark:bg-pink-900/10"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-purple-50/50 dark:bg-purple-900/10"><CheckCircle2 className="w-5 h-5 text-purple-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-yellow-50/50 dark:bg-yellow-900/10"><CheckCircle2 className="w-5 h-5 text-yellow-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">⏪ Rewind Swipes</td>
                    <td className="p-4 text-center"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-pink-50/50 dark:bg-pink-900/10"><CheckCircle2 className="w-5 h-5 text-pink-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-purple-50/50 dark:bg-purple-900/10"><CheckCircle2 className="w-5 h-5 text-purple-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-yellow-50/50 dark:bg-yellow-900/10"><CheckCircle2 className="w-5 h-5 text-yellow-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">🌍 Global Dating</td>
                    <td className="p-4 text-center"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-pink-50/50 dark:bg-pink-900/10"><CheckCircle2 className="w-5 h-5 text-pink-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-purple-50/50 dark:bg-purple-900/10"><CheckCircle2 className="w-5 h-5 text-purple-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-yellow-50/50 dark:bg-yellow-900/10"><CheckCircle2 className="w-5 h-5 text-yellow-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">✓✓ Read Receipts</td>
                    <td className="p-4 text-center"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-pink-50/50 dark:bg-pink-900/10"><CheckCircle2 className="w-5 h-5 text-pink-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-purple-50/50 dark:bg-purple-900/10"><CheckCircle2 className="w-5 h-5 text-purple-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-yellow-50/50 dark:bg-yellow-900/10"><CheckCircle2 className="w-5 h-5 text-yellow-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">🟢 See Online Status</td>
                    <td className="p-4 text-center"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-pink-50/50 dark:bg-pink-900/10"><CheckCircle2 className="w-5 h-5 text-pink-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-purple-50/50 dark:bg-purple-900/10"><CheckCircle2 className="w-5 h-5 text-purple-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-yellow-50/50 dark:bg-yellow-900/10"><CheckCircle2 className="w-5 h-5 text-yellow-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">🤖 AI Smart Matching</td>
                    <td className="p-4 text-center"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-pink-50/50 dark:bg-pink-900/10"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-purple-50/50 dark:bg-purple-900/10"><CheckCircle2 className="w-5 h-5 text-purple-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-yellow-50/50 dark:bg-yellow-900/10"><CheckCircle2 className="w-5 h-5 text-yellow-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">🔍 Advanced Filters</td>
                    <td className="p-4 text-center"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-pink-50/50 dark:bg-pink-900/10"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-purple-50/50 dark:bg-purple-900/10"><CheckCircle2 className="w-5 h-5 text-purple-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-yellow-50/50 dark:bg-yellow-900/10"><CheckCircle2 className="w-5 h-5 text-yellow-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">🚀 Profile Visibility Boost</td>
                    <td className="p-4 text-center"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-pink-50/50 dark:bg-pink-900/10"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-purple-50/50 dark:bg-purple-900/10"><CheckCircle2 className="w-5 h-5 text-purple-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-yellow-50/50 dark:bg-yellow-900/10"><CheckCircle2 className="w-5 h-5 text-yellow-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">♾️ Unlimited Rewinds</td>
                    <td className="p-4 text-center"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-pink-50/50 dark:bg-pink-900/10"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-purple-50/50 dark:bg-purple-900/10"><CheckCircle2 className="w-5 h-5 text-purple-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-yellow-50/50 dark:bg-yellow-900/10"><CheckCircle2 className="w-5 h-5 text-yellow-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">⭐ Priority in Queue</td>
                    <td className="p-4 text-center"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-pink-50/50 dark:bg-pink-900/10"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-purple-50/50 dark:bg-purple-900/10"><CheckCircle2 className="w-5 h-5 text-purple-600 mx-auto" /></td>
                    <td className="p-4 text-center bg-yellow-50/50 dark:bg-yellow-900/10"><CheckCircle2 className="w-5 h-5 text-yellow-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">💬 Priority Support</td>
                    <td className="p-4 text-center"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-pink-50/50 dark:bg-pink-900/10"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-purple-50/50 dark:bg-purple-900/10"><X className="w-5 h-5 text-gray-400 mx-auto" /></td>
                    <td className="p-4 text-center bg-yellow-50/50 dark:bg-yellow-900/10"><CheckCircle2 className="w-5 h-5 text-yellow-600 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
