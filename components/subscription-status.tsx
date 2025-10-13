"use client";

import { useState } from 'react';
import { useSubscriptionStatus } from '@/lib/use-subscription-status';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton-loader';
import { RefreshCw, Crown, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SubscriptionStatusProps {
  showRefreshButton?: boolean;
  showDetails?: boolean;
  compact?: boolean;
}

export function SubscriptionStatus({
  showRefreshButton = true,
  showDetails = true,
  compact = false
}: SubscriptionStatusProps) {
  const { subscription, loading, error, refresh, isSubscriptionActive, hasFeature } = useSubscriptionStatus();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      toast.success('Subscription status refreshed');
    } catch (err) {
      toast.error('Failed to refresh subscription status');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !subscription) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Error loading subscription status</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="text-sm">No subscription data available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'premium':
      case 'premium_yearly':
        return 'bg-purple-100 text-purple-800';
      case 'standard':
      case 'standard_3month':
        return 'bg-blue-100 text-blue-800';
      case 'basic':
      case 'basic_monthly':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          {isSubscriptionActive ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-gray-400" />
          )}
          <div>
            <Badge className={getTierColor(subscription.tier)}>
              {subscription.tierDetails?.name || subscription.tier}
            </Badge>
            {subscription.currentPeriodEnd && (
              <p className="text-xs text-gray-500 mt-1">
                {isSubscriptionActive ? 'Expires' : 'Expired'}: {formatDate(subscription.currentPeriodEnd)}
              </p>
            )}
          </div>
        </div>
        {showRefreshButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Subscription Status</CardTitle>
          </div>
          {showRefreshButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <div className="flex items-center space-x-2">
            {isSubscriptionActive ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-600" />
                <Badge className="bg-red-100 text-red-800">Inactive</Badge>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Tier:</span>
          <Badge className={getTierColor(subscription.tier)}>
            {subscription.tierDetails?.name || subscription.tier}
          </Badge>
        </div>

        {showDetails && (
          <>
            {subscription.currentPeriodStart && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Started:</span>
                <span className="text-sm text-gray-600">
                  {formatDate(subscription.currentPeriodStart)}
                </span>
              </div>
            )}

            {subscription.provider && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Provider:</span>
                <Badge className="bg-purple-100 text-purple-800 capitalize">
                  {subscription.provider}
                </Badge>
              </div>
            )}

            {subscription.currentPeriodEnd && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {isSubscriptionActive ? 'Expires:' : 'Expired:'}
                </span>
                <span className="text-sm text-gray-600">
                  {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>
            )}

            {subscription.cancelAtPeriodEnd && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto-cancel:</span>
                <Badge className="bg-orange-100 text-orange-800">Enabled</Badge>
              </div>
            )}

            {subscription.tierDetails && (
              <div className="pt-2 border-t">
                <h4 className="text-sm font-medium mb-2">Features:</h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {subscription.tierDetails.no_ads && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>No ads</span>
                    </div>
                  )}
                  {subscription.tierDetails.can_see_who_likes && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>See who likes</span>
                    </div>
                  )}
                  {subscription.tierDetails.can_use_ai_matching && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>AI matching</span>
                    </div>
                  )}
                  {subscription.tierDetails.has_unlimited_rewinds && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Unlimited rewinds</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {subscription.refreshedAt && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            Last updated: {formatDate(subscription.refreshedAt)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}