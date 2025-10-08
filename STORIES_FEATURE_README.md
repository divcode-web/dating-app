# Stories Feature Documentation

## Overview

The Stories feature allows matched users to share ephemeral photo and video content that expires after 24 hours. Similar to Instagram/Snapchat Stories, users can:

- Post photos and videos visible to their matches
- View stories from their matches
- See who viewed their stories
- Delete their own stories
- Stories automatically expire after 24 hours

## Setup Instructions

### 1. Database Migration

Run the database migration to create the necessary tables:

```bash
# Navigate to Supabase project dashboard
# Go to SQL Editor
# Copy and run the content of: supabase/migrations/ADD_STORIES_FEATURE.sql
```

This will create:
- `stories` table - stores story metadata
- `story_views` table - tracks who viewed each story
- Storage bucket `stories` - for media files
- RLS policies for secure access
- Cron jobs for automatic cleanup
- Database functions for efficient queries

### 2. Verify Storage Bucket

After running the migration:

1. Go to Supabase Dashboard → Storage
2. Verify that the `stories` bucket was created
3. Ensure it's set to `public`

### 3. Environment Variables

No additional environment variables are needed. The feature uses existing Supabase configuration.

## Features

### For Users

#### Posting Stories
1. Navigate to the Matches page
2. Click the "+" button (Your Story)
3. Choose to upload a photo or video
4. Add an optional caption (max 200 characters)
5. Share the story

**Limits:**
- File size: Max 50MB
- Supported formats: Images (JPG, PNG) and Videos (MP4, MOV)
- Duration: Stories expire after 24 hours

#### Viewing Stories
1. Stories appear at the top of the Matches page in a horizontal scrollable ring
2. Unviewed stories have a colorful gradient ring
3. Viewed stories have a gray ring
4. Click any story ring to view
5. Tap left/right to navigate between stories
6. Hold to pause
7. Swipe or use arrows to move between users' stories

#### Managing Your Stories
- View who has seen your stories (eye icon)
- Delete your stories anytime (trash icon)
- See how many people viewed each story

### Privacy & Security

- **Only matches can view each other's stories**
- Stories are automatically deleted after 24 hours
- Users can only delete their own stories
- Row Level Security (RLS) ensures data protection
- Media files are stored securely in Supabase Storage

## Architecture

### Database Schema

#### `stories` Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → user_profiles)
- media_url (TEXT) - URL to media file
- media_type (VARCHAR) - 'image' or 'video'
- thumbnail_url (TEXT) - Optional thumbnail
- caption (TEXT) - Optional caption
- duration (INTEGER) - Display duration in seconds
- is_active (BOOLEAN) - Whether story is active
- created_at (TIMESTAMP)
- expires_at (TIMESTAMP) - Auto-set to +24 hours
```

#### `story_views` Table
```sql
- id (UUID, Primary Key)
- story_id (UUID, Foreign Key → stories)
- viewer_id (UUID, Foreign Key → user_profiles)
- viewed_at (TIMESTAMP)
- UNIQUE(story_id, viewer_id)
```

### API Routes

#### POST `/api/stories/upload`
Upload a new story (image or video)

**Request:**
- Multipart form data
- Fields: `file`, `media_type`, `caption`, `duration`
- Requires authentication

**Response:**
```json
{
  "success": true,
  "story": { ... }
}
```

#### GET `/api/stories/matches`
Fetch all active stories from user's matches

**Response:**
```json
{
  "success": true,
  "stories": [
    {
      "user_id": "...",
      "user": { ... },
      "stories": [ ... ],
      "has_unviewed": true,
      "latest_story_at": "..."
    }
  ]
}
```

#### POST `/api/stories/[storyId]/view`
Mark a story as viewed

**Response:**
```json
{
  "success": true,
  "message": "Story view recorded"
}
```

#### DELETE `/api/stories/[storyId]`
Delete a story (only by owner)

**Response:**
```json
{
  "success": true,
  "message": "Story deleted successfully"
}
```

#### GET `/api/stories/[storyId]`
Get story details (including viewers for own stories)

**Response:**
```json
{
  "success": true,
  "story": {
    ...
    "viewers": [ ... ],
    "view_count": 5
  }
}
```

### Components

#### `StoriesRing`
Displays horizontal scrollable ring of story avatars at the top of matches page.

**Props:**
- `onStoryClick` - Callback when a story is clicked
- `onAddStoryClick` - Callback when add story button is clicked

#### `StoryViewer`
Full-screen story viewer with swipe navigation and progress bars.

**Props:**
- `userStoriesData` - Array of user stories
- `currentUserIndex` - Index of user to start viewing
- `onClose` - Callback when viewer is closed

**Features:**
- Auto-advance stories
- Tap to pause/resume
- Progress indicators
- View count (for own stories)
- Delete option (for own stories)

#### `StoryUpload`
Modal for uploading new stories with preview.

**Props:**
- `onClose` - Callback when upload is cancelled
- `onUploadComplete` - Callback when upload succeeds

**Features:**
- File size validation
- Image/video preview
- Caption input (200 char limit)
- Upload progress

### Automatic Cleanup

Two cron jobs run automatically:

1. **Expire Stories** (every hour)
   - Marks stories as inactive when expired

2. **Delete Old Stories** (daily at 3 AM)
   - Permanently deletes stories expired for 7+ days
   - Deletes associated media files
   - Deletes view records

## Usage Example

```typescript
import { StoriesRing } from "@/components/stories-ring";
import { StoryViewer } from "@/components/story-viewer";
import { StoryUpload } from "@/components/story-upload";

function MatchesPage() {
  const [showViewer, setShowViewer] = useState(false);
  const [selectedStories, setSelectedStories] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <StoriesRing
        onStoryClick={(stories) => {
          setSelectedStories([stories]);
          setShowViewer(true);
        }}
        onAddStoryClick={() => setShowUpload(true)}
      />

      {showViewer && (
        <StoryViewer
          userStoriesData={selectedStories}
          currentUserIndex={0}
          onClose={() => setShowViewer(false)}
        />
      )}

      {showUpload && (
        <StoryUpload
          onClose={() => setShowUpload(false)}
          onUploadComplete={() => {
            // Refresh stories
          }}
        />
      )}
    </>
  );
}
```

## Future Enhancements

Potential improvements:

1. **Story Replies** - Allow users to reply to stories with messages
2. **Story Reactions** - Quick emoji reactions to stories
3. **Story Mentions** - Tag other matches in stories
4. **Story Archive** - Save expired stories privately
5. **Story Highlights** - Pin favorite stories to profile
6. **Video Thumbnails** - Auto-generate video thumbnails
7. **Filters & Stickers** - Add Instagram-style filters and stickers
8. **Music Integration** - Add Spotify tracks to stories (leveraging existing integration)
9. **Story Analytics** - Detailed view metrics
10. **Story Settings** - Hide stories from specific matches

## Troubleshooting

### Stories not appearing
- Verify database migration ran successfully
- Check that `stories` storage bucket exists
- Ensure RLS policies are active

### Upload failing
- Check file size (max 50MB)
- Verify supported file format
- Check Supabase storage quota

### Stories not expiring
- Verify cron jobs are scheduled
- Check `expire_old_stories()` function exists
- Manually run: `SELECT expire_old_stories();`

### Performance issues
- Database indexes are created automatically
- Consider enabling CDN for storage bucket
- Monitor storage bucket usage

## Support

For issues or questions:
1. Check Supabase logs for errors
2. Verify all migrations ran successfully
3. Test API routes individually
4. Check browser console for client errors
