# DatingApp - Modern Dating Platform

A fully-featured dating website built with Next.js 14, Supabase, and modern web technologies. This application provides a Tinder-like experience with user profiles, swiping, matching, messaging, premium subscriptions, and comprehensive admin functionality.

## ✨ Features

### Core Features
- **User Authentication**: Secure signup/login with email verification
- **Profile Management**: Complete user profiles with photos, bio, interests, and preferences
- **Smart Matching**: Advanced algorithm for finding compatible matches
- **Real-time Messaging**: Instant messaging between matched users
- **Geolocation**: Location-based user discovery
- **Premium Subscriptions**: Monetization with Stripe integration
- **Admin Dashboard**: Complete user management and analytics

### User Experience
- **Responsive Design**: Works perfectly on desktop and mobile
- **Intuitive Swiping**: Tinder-like card interface
- **Real-time Notifications**: Instant updates for matches and messages
- **Photo Management**: Multiple photo uploads with cropping
- **Interest-based Matching**: Find users with similar interests
- **Safety Features**: User reporting and blocking system

### Admin Features
- **User Management**: View, edit, and manage all users
- **Analytics Dashboard**: Comprehensive usage statistics
- **Content Moderation**: Review and moderate user content
- **Subscription Management**: Monitor premium subscriptions
- **Geographic Insights**: Location-based user analytics

## 🛠 Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Hook Form** - Form management
- **React Query** - Server state management
- **Zustand** - Client state management

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - File storage
  - Row Level Security (RLS)

### Payment & Services
- **Stripe** - Payment processing for subscriptions
- **React Geolocated** - Geolocation services
- **React Dropzone** - File uploads
- **React Hot Toast** - Notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- A Supabase project with PostGIS extension enabled
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd dating-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

4. **Set up Supabase database**
   ```bash
   # Enable PostGIS extension first
   # Go to your Supabase dashboard > SQL Editor
   # Run: CREATE EXTENSION IF NOT EXISTS "postgis";

   # Then run the migration file
   # Copy and paste the contents of supabase/migrations/001_initial_schema.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
dating-app/
├── app/                    # Next.js 14 App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── auth-form.tsx     # Authentication forms
│   ├── auth-provider.tsx # Auth context
│   ├── dashboard.tsx     # Main dashboard
│   ├── providers.tsx     # App providers
│   └── ui/               # Reusable UI components
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Helper functions
├── supabase/             # Database migrations
│   └── migrations/
├── types/                # TypeScript definitions
├── public/               # Static assets
└── package.json          # Dependencies
```

## 🔧 Configuration

### Supabase Setup

1. **Create a new project** at [supabase.com](https://supabase.com)

2. **Enable PostGIS extension**:
   - Go to SQL Editor in your Supabase dashboard
   - Run: `CREATE EXTENSION IF NOT EXISTS "postgis";`
   - This is required for location-based features

3. **Run the database migration**:
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Execute the SQL to create all tables and policies

4. **Configure authentication**:
   - Go to Authentication > Settings
   - Configure your site URL and redirect URLs
   - Enable email confirmations if desired

5. **Set up storage** (for profile photos):
   - Go to Storage > Create bucket named "avatars"
   - Set bucket to public

### Stripe Setup (Optional)

1. **Create a Stripe account** at [stripe.com](https://stripe.com)

2. **Get your API keys** from the dashboard

3. **Configure webhooks** for subscription events

4. **Add products** for your subscription plans

## 🎯 Key Features Implementation

### User Authentication
- Email/password authentication via Supabase Auth
- Protected routes and middleware
- Session management with automatic refresh

### Profile Management
- Complete user profiles with photos and preferences
- Image upload with cropping and optimization
- Location services for geolocation features

### Matching Algorithm
- Distance-based matching
- Interest compatibility scoring
- Preference filtering (age, gender, etc.)

### Real-time Messaging
- WebSocket connections via Supabase Realtime
- Message history and read receipts
- Typing indicators and presence

### Premium Subscriptions
- Stripe integration for payment processing
- Feature gating based on subscription status
- Webhook handling for subscription events

### Admin Dashboard
- User management interface
- Analytics and reporting
- Content moderation tools

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Input validation**: Comprehensive form validation
- **File upload security**: Image type and size restrictions
- **Rate limiting**: API endpoint protection
- **CSRF protection**: Cross-site request forgery prevention

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Mobile devices** (320px and up)
- **Tablets** (768px and up)
- **Desktop** (1024px and up)
- **Large screens** (1440px and up)

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Add environment variables** in the dashboard
3. **Deploy automatically** on push

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

### Environment Variables for Production

Make sure to configure these in your hosting platform:

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 🔄 Database Schema

The application uses the following main tables:

- **profiles**: User profile information
- **matches**: User matches and relationships
- **messages**: Chat messages between users
- **swipes**: User swipe history for analytics
- **subscriptions**: Premium subscription data
- **reports**: User reports for moderation
- **notifications**: In-app notifications

## 📊 Analytics & Monitoring

The admin dashboard provides insights into:
- User registration trends
- Match success rates
- Geographic user distribution
- Premium subscription metrics
- User engagement statistics

## 🛠 Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
npm run type-check # Run TypeScript checks
```

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

## 🔮 Future Enhancements

- **Video calling** integration
- **Advanced AI matching** algorithms
- **Social media integration**
- **Event and dating meetups**
- **Enhanced premium features**
- **Mobile app development**

---

Built with ❤️ using Next.js, Supabase, and modern web technologies.