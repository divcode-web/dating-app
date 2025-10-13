'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Crown, Zap, Clock, Star } from 'lucide-react';
import { getBoostStatus, activateBoost, hasBoostAccess } from '@/lib/boost-api';
import { BoostStatus } from '@/lib/boost-api';
import toast from 'react-hot-toast';

interface ProfileBoostProps {
  onBoostActivated?: () => void;
}

export function ProfileBoost({ onBoostActivated }: ProfileBoostProps) {
  const { user } = useAuth();
  const [boostStatus, setBoostStatus] = useState<BoostStatus | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadBoostStatus();
      checkAccess();
    }
  }, [user?.id]);

  const loadBoostStatus = async () => {
    if (!user?.id) return;

    try {
      const status = await getBoostStatus(user.id);
      setBoostStatus(status);
    } catch (error) {
      console.error('Error loading boost status:', error);
    }
  };

  const checkAccess = async () => {
    if (!user?.id) return;

    try {
      const access = await hasBoostAccess(user.id);
      setHasAccess(access);
    } catch (error) {
      console.error('Error checking boost access:', error);
    }
  };

  const handleActivateBoost = async (boostType: 'standard' | 'premium' | 'super') => {
    if (!user?.id) return;

    setActivating(boostType);
    try {
      const result = await activateBoost(user.id, boostType);

      if (result.success) {
        toast.success(result.message);
        await loadBoostStatus();
        onBoostActivated?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to activate boost');
      console.error('Error activating boost:', error);
    } finally {
      setActivating(null);
    }
  };

  if (!hasAccess) {
    return (
      <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
        <CardContent className="p-6 text-center">
          <Crown className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Premium Feature</h3>
          <p className="text-gray-500 mb-4">
            Profile boosts are available for Standard and Premium subscribers
          </p>
          <Button
            onClick={() => window.location.href = '/premium'}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Access Boosts
          </Button>
        </CardContent>
      </Card>
    );
  }

  const boostOptions = [
    {
      type: 'standard' as const,
      name: 'Standard Boost',
      description: '2x visibility for 24 hours',
      icon: Rocket,
      multiplier: 2,
      color: 'from-blue-500 to-purple-600',
    },
    {
      type: 'premium' as const,
      name: 'Premium Boost',
      description: '3x visibility for 24 hours',
      icon: Star,
      multiplier: 3,
      color: 'from-yellow-400 to-orange-500',
    },
    {
      type: 'super' as const,
      name: 'Super Boost',
      description: '5x visibility for 24 hours',
      icon: Zap,
      multiplier: 5,
      color: 'from-red-500 to-pink-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Active Boost Status */}
      {boostStatus?.isActive && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-full">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">
                    Profile Boost Active!
                  </h3>
                  <p className="text-sm text-green-700">
                    {boostStatus.boostMultiplier}x visibility • Expires in {boostStatus.timeRemaining}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boost Options */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Profile Boosts</h3>
          <div className="text-sm text-gray-600">
            {boostStatus?.remainingBoosts || 0} boosts remaining this month
          </div>
        </div>

        {boostOptions.map((option) => {
          const Icon = option.icon;
          const canActivate = (boostStatus?.remainingBoosts || 0) > 0;
          const isActivating = activating === option.type;

          return (
            <Card key={option.type} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-gradient-to-r ${option.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{option.name}</h4>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleActivateBoost(option.type)}
                    disabled={!canActivate || isActivating}
                    className={`bg-gradient-to-r ${option.color} hover:opacity-90`}
                    size="sm"
                  >
                    {isActivating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Boost
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No Boosts Remaining */}
      {(boostStatus?.remainingBoosts || 0) === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <h4 className="font-semibold text-orange-900 mb-1">No Boosts Remaining</h4>
            <p className="text-sm text-orange-700 mb-3">
              You've used all your monthly boosts. Resets on the 1st of next month.
            </p>
            <Button
              onClick={() => window.location.href = '/premium'}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <Crown className="w-4 h-4 mr-2" />
              Get More Boosts
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Boost Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-blue-900 mb-2">How Profile Boosts Work</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Get up to 5x more profile views</li>
            <li>• Appear higher in search results</li>
            <li>• Increased visibility in recommendations</li>
            <li>• Boosts last 24 hours</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}