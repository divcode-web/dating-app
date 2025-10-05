-- ============================================
-- SAMPLE BLOG POSTS WITH AD PLACEHOLDERS
-- ============================================

-- First, we need to get a valid admin user ID
-- This assumes you have at least one admin user in the system
DO $$
DECLARE
    admin_user_id UUID;
    dating_tips_cat_id UUID;
    love_stories_cat_id UUID;
    safety_privacy_cat_id UUID;
BEGIN
    -- Get the first admin user
    SELECT id INTO admin_user_id FROM admin_users LIMIT 1;

    -- If no admin exists, create a placeholder note
    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'No admin user found. Please create an admin user first, then update the author_id for these posts.';
        -- Use a dummy UUID for now
        admin_user_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- Get category IDs
    SELECT id INTO dating_tips_cat_id FROM blog_categories WHERE slug = 'dating-tips' LIMIT 1;
    SELECT id INTO love_stories_cat_id FROM blog_categories WHERE slug = 'love-stories' LIMIT 1;
    SELECT id INTO safety_privacy_cat_id FROM blog_categories WHERE slug = 'safety-privacy' LIMIT 1;

    -- Insert Sample Blog Posts
    INSERT INTO blog_posts (
        title, slug, excerpt, content, featured_image, author_id, category_id, status, published_at, meta_title, meta_description
    ) VALUES
    (
        '10 First Date Ideas That Actually Work',
        '10-first-date-ideas-that-work',
        'Tired of boring coffee dates? Here are 10 creative first date ideas that will make you stand out and create lasting memories.',
        '<h2>Make Your First Date Unforgettable</h2>
        <p>First dates can be nerve-wracking, but they don''t have to be boring! Here are 10 proven first date ideas that will help you make a great impression.</p>

        <h3>1. Outdoor Adventure</h3>
        <p>Take a hike, go for a bike ride, or explore a local park. Physical activity releases endorphins and reduces nervous energy, making conversation flow naturally.</p>

        <h3>2. Cooking Class</h3>
        <p>Learn something new together! Cooking classes are interactive, fun, and give you plenty to talk about. Plus, you get to enjoy a delicious meal at the end.</p>

        <h3>3. Art Gallery or Museum</h3>
        <p>Perfect for conversation starters. You can discuss the exhibits and learn about each other''s interests and perspectives.</p>

        <h3>4. Food Tour</h3>
        <p>Explore different cuisines in your city. It''s a great way to try new things and keep the date dynamic and exciting.</p>

        <h3>5. Volunteering Together</h3>
        <p>See each other''s compassionate side by volunteering at a local charity, animal shelter, or community event.</p>

        <h3>6. Mini Golf or Bowling</h3>
        <p>Keep it light and playful! These activities are low-pressure and create opportunities for friendly competition and laughter.</p>

        <h3>7. Live Music or Comedy Show</h3>
        <p>Entertainment provides natural conversation topics and shared experiences. Just make sure you can still talk!</p>

        <h3>8. Farmers Market</h3>
        <p>Browse fresh produce, artisan goods, and local treats. It''s casual, public, and perfect for daytime dates.</p>

        <h3>9. Escape Room</h3>
        <p>Work together to solve puzzles. You''ll see how well you communicate and collaborate under pressure.</p>

        <h3>10. Sunset Picnic</h3>
        <p>Pack some snacks, find a scenic spot, and watch the sunset. It''s romantic, thoughtful, and shows effort.</p>

        <h3>The Bottom Line</h3>
        <p>The best first date is one where both people feel comfortable and can be themselves. Choose an activity that allows for conversation and connection. Good luck! 💕</p>',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
        admin_user_id,
        dating_tips_cat_id,
        'published',
        NOW() - INTERVAL '5 days',
        '10 First Date Ideas That Actually Work | Dating Tips',
        'Discover 10 creative first date ideas that will make you stand out. From outdoor adventures to cooking classes, find the perfect first date activity.'
    ),
    (
        'How to Create an Irresistible Dating Profile',
        'create-irresistible-dating-profile',
        'Your dating profile is your first impression. Learn expert tips to craft a profile that gets you more matches and meaningful connections.',
        '<h2>Stand Out With an Amazing Profile</h2>
        <p>Your dating profile is your digital first impression. Here''s how to make it count!</p>

        <h3>1. Choose the Right Photos</h3>
        <p><strong>Your main photo should:</strong></p>
        <ul>
            <li>Show your face clearly (no sunglasses!)</li>
            <li>Feature you smiling</li>
            <li>Have good lighting</li>
            <li>Be recent (within the last year)</li>
        </ul>

        <p><strong>Additional photos should include:</strong></p>
        <ul>
            <li>A full-body shot</li>
            <li>You doing something you love</li>
            <li>A social photo (not as the main!)</li>
            <li>A candid, natural moment</li>
        </ul>

        <h3>2. Write a Compelling Bio</h3>
        <p>Keep it short (3-4 sentences) and show your personality:</p>
        <ul>
            <li>✅ "Adventure seeker who loves trying new restaurants and weekend hikes. Dog dad to the best golden retriever. Looking for someone who can keep up with my dad jokes."</li>
            <li>❌ "I like movies, music, and having fun."</li>
        </ul>

        <h3>3. Be Specific About Your Interests</h3>
        <p>Instead of "I love music," say "Currently obsessed with indie rock and can''t wait for festival season."</p>

        <h3>4. Show, Don''t Tell</h3>
        <p>Rather than saying "I''m funny," share a witty observation or joke.</p>

        <h3>5. Add Conversation Starters</h3>
        <p>End your bio with a question or prompt: "What''s your go-to karaoke song?" or "Convince me why your favorite pizza topping is the best."</p>

        <h3>Common Mistakes to Avoid</h3>
        <ul>
            <li>Group photos where you can''t be identified</li>
            <li>Bathroom/gym mirror selfies</li>
            <li>Overly filtered photos</li>
            <li>Negative language ("No drama," "Don''t swipe if...")</li>
            <li>Listing requirements instead of sharing about yourself</li>
        </ul>

        <h3>Pro Tip</h3>
        <p>Update your profile regularly! Fresh photos and updated interests show you''re active and engaged. Ready to start swiping? 🔥</p>',
        'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800',
        admin_user_id,
        dating_tips_cat_id,
        'published',
        NOW() - INTERVAL '3 days',
        'How to Create an Irresistible Dating Profile | Expert Tips',
        'Learn how to create a dating profile that gets results. Expert tips on choosing photos, writing your bio, and standing out from the crowd.'
    ),
    (
        'Success Story: How We Met on Our App',
        'success-story-how-we-met',
        'Sarah and Mike share their heartwarming story of finding love through our dating app. From the first swipe to happily ever after.',
        '<h2>A Love Story That Started With a Swipe</h2>
        <p><em>Sarah, 28, and Mike, 30, matched in March 2024 and are now planning their wedding. Here''s their story.</em></p>

        <h3>The First Swipe</h3>
        <p><strong>Sarah:</strong> "I almost didn''t swipe right! Mike''s first photo was him rock climbing, and I thought he might be too adventurous for me. But his bio made me laugh, so I gave it a shot."</p>

        <p><strong>Mike:</strong> "When we matched, I was nervous about messaging first. I saw she loved coffee in her profile, so I asked about her favorite local café. Simple, but it worked!"</p>

        <h3>The First Date</h3>
        <p>They met at the coffee shop Sarah recommended. What was supposed to be a quick coffee turned into a 4-hour conversation.</p>

        <p><strong>Sarah:</strong> "We closed down the café! The barista had to kindly kick us out. I knew there was something special about Mike when I realized I''d been laughing for hours straight."</p>

        <h3>The Journey</h3>
        <p>Three months of dates turned into a relationship. They''ve since traveled to 5 countries together, adopted a rescue dog named Mocha, and built a life that neither imagined possible.</p>

        <h3>Their Advice for App Users</h3>
        <p><strong>Be Authentic:</strong> "Don''t try to be someone you''re not. The right person will love the real you." - Sarah</p>

        <p><strong>Take the First Step:</strong> "Don''t overthink your first message. Keep it simple and genuine." - Mike</p>

        <p><strong>Stay Open-Minded:</strong> "Your perfect match might not look like what you expected." - Both</p>

        <h3>The Proposal</h3>
        <p>Mike proposed at that same coffee shop where they had their first date. The barista (who remembered them!) helped coordinate the surprise.</p>

        <p><strong>Mike:</strong> "I knew from day one this was the place where my life changed forever. It only made sense to propose there."</p>

        <h3>To Everyone Still Swiping</h3>
        <p><strong>Sarah''s message:</strong> "Keep going! I was on the app for 6 months before I met Mike. It only takes one right swipe to change everything. Don''t give up on love. ❤️"</p>

        <p><em>Want to share your success story? Email us at success@datingapp.com</em></p>',
        'https://images.unsplash.com/photo-1516589091380-5d8e87df6999?w=800',
        admin_user_id,
        love_stories_cat_id,
        'published',
        NOW() - INTERVAL '1 day',
        'Success Story: How Sarah & Mike Met on Our App',
        'Read the heartwarming story of how Sarah and Mike found love on our dating app. From first swipe to engagement - a true modern love story.'
    ),
    (
        'Online Dating Safety: 10 Essential Tips',
        'online-dating-safety-tips',
        'Stay safe while dating online with these 10 essential safety tips. Protect your privacy and enjoy the dating journey with confidence.',
        '<h2>Your Safety Matters</h2>
        <p>Online dating should be fun and exciting, but safety always comes first. Here are 10 essential tips to protect yourself while finding love online.</p>

        <h3>1. Protect Your Personal Information</h3>
        <p>Don''t share:</p>
        <ul>
            <li>Your home or work address</li>
            <li>Phone number (until you''re comfortable)</li>
            <li>Financial information</li>
            <li>Daily routines or schedules</li>
        </ul>

        <h3>2. Use the App''s Messaging System</h3>
        <p>Keep conversations within the app until you feel completely comfortable. This protects your personal contact information.</p>

        <h3>3. Google Them</h3>
        <p>A quick search can reveal red flags. Look for:</p>
        <ul>
            <li>Social media profiles (do they match?)</li>
            <li>Professional presence</li>
            <li>Any concerning news or records</li>
        </ul>

        <h3>4. Video Chat Before Meeting</h3>
        <p>Request a video call to verify they''re who they say they are. It also helps you gauge chemistry before an in-person date.</p>

        <h3>5. Meet in Public Places</h3>
        <p>Always choose busy, public locations for first dates:</p>
        <ul>
            <li>Coffee shops</li>
            <li>Restaurants</li>
            <li>Parks (during daytime)</li>
            <li>Public events</li>
        </ul>

        <h3>6. Tell Someone Your Plans</h3>
        <p>Share details with a friend or family member:</p>
        <ul>
            <li>Where you''re going</li>
            <li>Who you''re meeting</li>
            <li>When you expect to be home</li>
            <li>Your date''s profile information</li>
        </ul>

        <h3>7. Arrange Your Own Transportation</h3>
        <p>Drive yourself or use your own ride service. This ensures you can leave whenever you want.</p>

        <h3>8. Trust Your Instincts</h3>
        <p>If something feels off, it probably is. Don''t ignore red flags:</p>
        <ul>
            <li>Aggressive or pushy behavior</li>
            <li>Requests for money</li>
            <li>Inconsistent stories</li>
            <li>Pressure to move too fast</li>
        </ul>

        <h3>9. Stay Sober</h3>
        <p>Limit alcohol on first dates to stay alert and make good decisions. Save the celebration for when you know them better!</p>

        <h3>10. Use Our Safety Features</h3>
        <p>Our app includes:</p>
        <ul>
            <li>Profile verification</li>
            <li>Block and report functions</li>
            <li>Photo verification</li>
            <li>24/7 safety support</li>
        </ul>

        <h3>Warning Signs</h3>
        <p>Report and block anyone who:</p>
        <ul>
            <li>Asks for money or financial help</li>
            <li>Won''t video chat or meet in person</li>
            <li>Becomes aggressive or threatening</li>
            <li>Pressures you for intimate photos</li>
            <li>Has inconsistent stories about their life</li>
        </ul>

        <h3>Remember</h3>
        <p>Most people on dating apps are genuine and looking for connections. These safety tips help you filter out the bad apples and focus on finding your match with confidence. Stay safe and happy swiping! 🛡️</p>',
        'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800',
        admin_user_id,
        safety_privacy_cat_id,
        'published',
        NOW() - INTERVAL '7 days',
        'Online Dating Safety: 10 Essential Tips to Stay Safe',
        'Protect yourself while dating online with these 10 essential safety tips. Learn how to stay safe, protect your privacy, and enjoy online dating confidently.'
    );

    -- Add tags to posts
    INSERT INTO blog_post_tags (post_id, tag_id)
    SELECT
        bp.id,
        bt.id
    FROM blog_posts bp
    CROSS JOIN blog_tags bt
    WHERE
        (bp.slug = '10-first-date-ideas-that-work' AND bt.slug IN ('first-date', 'profile-tips'))
        OR (bp.slug = 'create-irresistible-dating-profile' AND bt.slug IN ('profile-tips', 'online-dating'))
        OR (bp.slug = 'success-story-how-we-met' AND bt.slug IN ('success-stories', 'online-dating'))
        OR (bp.slug = 'online-dating-safety-tips' AND bt.slug IN ('safety', 'online-dating'))
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Sample blog posts created successfully!';
END $$;
