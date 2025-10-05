/**
 * Calculate matching score between two users based on various factors
 * Returns a score from 0-100
 */

interface UserProfile {
  location?: { lat: number; lng: number } | null;
  location_city?: string | null;
  interests?: string[];
  looking_for?: string[];
  relationship_type?: string;
  age?: number;
  gender?: string;
  ethnicity?: string;
  education?: string;
  smoking?: string;
  drinking?: string;
  religion?: string;
  children?: string;
}

interface MatchingScoreResult {
  totalScore: number;
  breakdown: {
    location: number;
    interests: number;
    compatibility: number;
    preferences: number;
  };
}

/**
 * Calculate distance-based location score
 * - At least one GPS: 100% accuracy (0-50 points based on distance)
 * - Both city only: 50% accuracy (0-25 points based on same city)
 * - No location: 10% accuracy (5 points random)
 */
function calculateLocationScore(
  user1: UserProfile,
  user2: UserProfile,
  maxDistance: number = 50 // in km
): number {
  // Both have GPS coordinates - 100% accuracy
  if (user1.location && user2.location) {
    const distance = calculateDistance(
      user1.location.lat,
      user1.location.lng,
      user2.location.lat,
      user2.location.lng
    );

    if (distance <= maxDistance) {
      // Score decreases as distance increases
      // 0km = 50 points, maxDistance = 0 points
      return Math.max(0, 50 - (distance / maxDistance) * 50);
    }
    return 0;
  }

  // At least ONE has GPS - 100% accuracy (use city to estimate)
  if ((user1.location && user2.location_city) || (user2.location && user1.location_city)) {
    // One has GPS, other has city - check if same city for full points
    const city1 = user1.location_city;
    const city2 = user2.location_city;

    if (city1 && city2 && city1.toLowerCase() === city2.toLowerCase()) {
      return 50; // Same city with at least one GPS = full points
    }
    return 25; // Different cities but one has GPS = partial points
  }

  // Both have city names only - 50% accuracy (max 25 points)
  if (user1.location_city && user2.location_city) {
    const sameCity = user1.location_city.toLowerCase() === user2.location_city.toLowerCase();
    return sameCity ? 25 : 0;
  }

  // No location data - 10% random matching (5 points)
  return 5;
}

/**
 * Calculate interest overlap score (0-25 points)
 */
function calculateInterestScore(user1: UserProfile, user2: UserProfile): number {
  if (!user1.interests || !user2.interests) return 0;

  const interests1 = user1.interests.map((i) => i.toLowerCase());
  const interests2 = user2.interests.map((i) => i.toLowerCase());

  const commonInterests = interests1.filter((i) => interests2.includes(i));
  const totalUnique = new Set([...interests1, ...interests2]).size;

  if (totalUnique === 0) return 0;

  // Score based on Jaccard similarity
  const similarity = commonInterests.length / totalUnique;
  return Math.round(similarity * 25);
}

/**
 * Calculate compatibility score based on lifestyle (0-15 points)
 */
function calculateCompatibilityScore(user1: UserProfile, user2: UserProfile): number {
  let score = 0;

  // Smoking compatibility (5 points)
  if (user1.smoking && user2.smoking) {
    if (user1.smoking === user2.smoking) {
      score += 5;
    } else if (
      (user1.smoking === "never" && user2.smoking === "occasionally") ||
      (user2.smoking === "never" && user1.smoking === "occasionally")
    ) {
      score += 2;
    }
  }

  // Drinking compatibility (5 points)
  if (user1.drinking && user2.drinking) {
    if (user1.drinking === user2.drinking) {
      score += 5;
    } else if (
      (user1.drinking === "never" && user2.drinking === "occasionally") ||
      (user2.drinking === "never" && user1.drinking === "occasionally")
    ) {
      score += 2;
    }
  }

  // Children compatibility (5 points)
  if (user1.children && user2.children) {
    if (user1.children === user2.children) {
      score += 5;
    } else if (user1.children === "open" || user2.children === "open") {
      score += 3;
    }
  }

  return score;
}

/**
 * Calculate preference score based on what they're looking for (0-10 points)
 */
function calculatePreferenceScore(user1: UserProfile, user2: UserProfile): number {
  let score = 0;

  // Relationship type match (5 points)
  if (user1.relationship_type && user2.relationship_type) {
    if (user1.relationship_type === user2.relationship_type) {
      score += 5;
    } else if (
      user1.relationship_type === "not_sure" ||
      user2.relationship_type === "not_sure"
    ) {
      score += 2;
    }
  }

  // Looking for match (5 points)
  if (user1.looking_for && user2.looking_for) {
    const lookingFor1 = user1.looking_for.map((l) => l.toLowerCase());
    const lookingFor2 = user2.looking_for.map((l) => l.toLowerCase());
    const overlap = lookingFor1.filter((l) => lookingFor2.includes(l));

    if (overlap.length > 0) {
      score += Math.min(5, overlap.length * 2);
    }
  }

  return score;
}

/**
 * Calculate distance using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Main function to calculate total matching score
 */
export function calculateMatchingScore(
  user1: UserProfile,
  user2: UserProfile,
  maxDistance: number = 50
): MatchingScoreResult {
  const locationScore = calculateLocationScore(user1, user2, maxDistance);
  const interestScore = calculateInterestScore(user1, user2);
  const compatibilityScore = calculateCompatibilityScore(user1, user2);
  const preferenceScore = calculatePreferenceScore(user1, user2);

  const totalScore = Math.min(
    100,
    locationScore + interestScore + compatibilityScore + preferenceScore
  );

  return {
    totalScore: Math.round(totalScore),
    breakdown: {
      location: Math.round(locationScore),
      interests: Math.round(interestScore),
      compatibility: Math.round(compatibilityScore),
      preferences: Math.round(preferenceScore),
    },
  };
}

/**
 * Get location accuracy level
 */
export function getLocationAccuracy(user: UserProfile): {
  level: "high" | "medium" | "low" | "none";
  percentage: number;
  description: string;
} {
  if (user.location) {
    return {
      level: "high",
      percentage: 100,
      description: "GPS location enabled - Best matching accuracy",
    };
  }

  if (user.location_city) {
    return {
      level: "medium",
      percentage: 50,
      description: "City location only - Moderate matching accuracy",
    };
  }

  return {
    level: "none",
    percentage: 0,
    description: "No location provided - Limited matching",
  };
}
