import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    const { userId, promoCode } = await request.json();

    if (!userId || !promoCode) {
      return NextResponse.json(
        { success: false, error: "User ID and promo code are required" },
        { status: 400 }
      );
    }

    // Call the database function to redeem promo code
    const { data, error } = await supabase.rpc("redeem_promo_code", {
      p_user_id: userId,
      p_code: promoCode.toUpperCase(),
    });

    if (error) {
      console.error("Error redeeming promo code:", error);
      return NextResponse.json(
        { success: false, error: "Failed to redeem promo code" },
        { status: 500 }
      );
    }

    // The function returns a JSON object with success status
    if (!data.success) {
      return NextResponse.json(
        { success: false, error: data.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tier_id: data.tier_id,
      expires_at: data.expires_at,
      message: data.message,
    });
  } catch (error: any) {
    console.error("Promo code redemption error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
