# Google AdSense Setup Guide

## Step 1: Sign Up for Google AdSense

1. Go to [Google AdSense](https://www.google.com/adsense)
2. Click "Get Started" and sign in with your Google account
3. Fill in your website details:
   - Website URL: `yourdomain.com`
   - Content language: English
4. Submit your application and wait for approval (usually 1-2 weeks)

## Step 2: Get Your Publisher ID

Once approved:
1. Log into your AdSense account
2. Go to **Account** → **Account Information**
3. Copy your **Publisher ID** (format: `ca-pub-XXXXXXXXXXXXXXXX`)

## Step 3: Configure Your App

### Update the AdSense Component

Open `components/google-adsense.tsx` and replace:
```typescript
data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
```
With your actual Publisher ID:
```typescript
data-ad-client="ca-pub-1234567890123456"
```

### Add AdSense Script to Your App

Open `app/layout.tsx` and add this script to the `<head>`:
```tsx
<Script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
  crossOrigin="anonymous"
  strategy="afterInteractive"
/>
```

## Step 4: Create Ad Units

1. In AdSense dashboard, go to **Ads** → **By ad unit** → **Display ads**
2. Create these ad units:

### Recommended Ad Units:

**Blog Content Ad (In-Article)**
- Name: `blog-content-ad`
- Type: In-article
- Copy the **data-ad-slot** code (e.g., `1234567890`)

**Blog Sidebar Ad (Display)**
- Name: `blog-sidebar-ad`
- Type: Display
- Size: Responsive
- Copy the **data-ad-slot** code

**Premium Promotion Ad (Display)**
- Name: `premium-promo-ad`
- Type: Display
- Size: Responsive or 728x90
- Copy the **data-ad-slot** code

## Step 5: Add Ad Slots to Your Code

The ad placeholders are already in your blog post page. You just need to update them with real AdSense components:

### In `app/blog/[slug]/page.tsx`:

Replace the placeholder ads with:

```tsx
import GoogleAdSense from "@/components/google-adsense";

// Replace "Advertisement - App Promo" with:
<GoogleAdSense
  adSlot="YOUR_AD_SLOT_ID_HERE"
  adFormat="fluid"
  style={{ display: "block", textAlign: "center", minHeight: "250px" }}
/>

// Replace "Advertisement - Premium Features" with:
<GoogleAdSense
  adSlot="YOUR_SECOND_AD_SLOT_ID_HERE"
  adFormat="horizontal"
  style={{ display: "block", minHeight: "100px" }}
/>
```

## Step 6: Important AdSense Policies

⚠️ **Must Follow These Rules:**

1. **Don't click your own ads** - This will get you banned
2. **No misleading content** - Be honest in blog posts
3. **Ad placement limits:**
   - Max 3 ads per page recommended
   - Don't place ads in pop-ups
   - Ads must be clearly distinguishable from content
4. **Content requirements:**
   - Must have original, valuable content
   - No prohibited content (violence, adult, illegal drugs, etc.)
   - Privacy policy required (you need to add this)

## Step 7: Add Required Privacy Policy

Create a privacy policy page that includes:
- How you collect data
- Google AdSense uses cookies and tracks users
- Link to Google's privacy policy

You can use a generator like:
- [Privacy Policy Generator](https://www.privacypolicygenerator.info/)
- [Termly](https://termly.io/)

## Step 8: Alternative Ad Networks (If AdSense Rejects You)

If AdSense rejects your application, try these:

### Media.net (Yahoo! Bing Network)
- Website: https://www.media.net/
- Good for: Contextual ads, high-quality traffic
- Requirements: English content, good traffic

### Ezoic
- Website: https://www.ezoic.com/
- Good for: AI-optimized ad placements
- Requirements: 10,000 monthly visitors recommended

### AdThrive / Mediavine
- Requirements: 100,000+ monthly pageviews
- Highest revenue potential
- Manual approval process

### PropellerAds
- Website: https://propellerads.com/
- Good for: Easy approval, multiple ad formats
- Lower CPM but accepts almost anyone

### Carbon Ads
- Website: https://www.carbonads.net/
- Good for: Tech/developer audiences
- Clean, minimal ads

## Step 9: Testing Your Ads

1. **Enable Test Mode:**
   - AdSense has automatic test mode for your own IP
   - Ads will show as blank or "test" ads when you visit

2. **Verify Ads Load:**
   - Open browser DevTools → Console
   - Check for AdSense errors
   - Look for `adsbygoogle.push()` calls

3. **Use AdSense Chrome Extension:**
   - Install "Publisher Toolbar" from Chrome Web Store
   - Helps debug ad issues

## Step 10: Expected Revenue

**Blog Revenue Estimates:**
- 1,000 pageviews/month: $2-$5
- 10,000 pageviews/month: $20-$100
- 100,000 pageviews/month: $200-$1,000+

**Factors:**
- Traffic location (US/UK/Canada pays more)
- Content niche (dating/relationships pays well)
- Click-through rate (1-3% average)
- Cost per click ($0.20-$2.00 average)

## Step 11: Optimize Revenue

1. **Ad Placement:**
   - Above the fold gets more clicks
   - Within content performs better than sidebar
   - End of article catches engaged readers

2. **Content Strategy:**
   - Write high-value dating advice
   - Target high-CPC keywords (dating tips, relationship advice)
   - Longer articles = more ad impressions

3. **Traffic Sources:**
   - SEO optimization for organic traffic
   - Social media sharing
   - Email newsletters

## Troubleshooting

**Ads not showing?**
- Check browser ad blockers
- Verify Publisher ID is correct
- Wait 24-48 hours after setup
- Check AdSense account for policy violations

**"AdSense not approved"?**
- Need more original content (aim for 20+ blog posts)
- Ensure site is live and accessible
- Add privacy policy and about pages
- Wait and reapply after 30 days

**Low revenue?**
- Increase traffic
- Improve ad placement
- Test different ad formats
- Write higher-value content

## Support

- AdSense Help: https://support.google.com/adsense
- AdSense Community: https://support.google.com/adsense/community
- Your AdSense account dashboard for detailed analytics
