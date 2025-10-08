# Stories Feature - UI/UX Guide

## Visual Overview

This guide shows what the Stories feature looks like and how users interact with it.

---

## 1. Stories Ring on Matches Page

```
┌─────────────────────────────────────────────────────────────┐
│  Your Matches                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Stories Ring (Horizontal Scroll)                    │    │
│  │                                                      │    │
│  │  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐        │    │
│  │  │ + │  │ ● │  │ ● │  │ ○ │  │ ● │  │ ○ │  →     │    │
│  │  └───┘  └───┘  └───┘  └───┘  └───┘  └───┘        │    │
│  │  Your   Sarah   Mike   Emma   John  Alex          │    │
│  │  Story   (2)    (1)    (3)    (1)   (2)          │    │
│  │                                                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Match Card   │  │ Match Card   │  │ Match Card   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘

Legend:
  + = Add Story button (dashed border, pink)
  ● = Unviewed stories (colorful gradient ring)
  ○ = Viewed stories (gray ring)
  (2) = Number of stories from that user
```

### Ring Styles

**Add Story Button:**
- Dashed pink border
- Plus icon in center
- Smaller plus icon badge
- Text: "Your Story"

**Unviewed Stories:**
- Gradient ring: yellow → pink → purple
- User's profile photo in center
- White border around photo
- First name below

**Viewed Stories:**
- Gray ring
- User's profile photo in center
- White border around photo
- First name below

---

## 2. Story Upload Modal

```
┌──────────────────────────────────────────────────┐
│  Add to Your Story                           ✕   │
├──────────────────────────────────────────────────┤
│                                                   │
│  Share a moment with your matches                │
│                                                   │
│  ┌──────────────┐        ┌──────────────┐       │
│  │              │        │              │       │
│  │    📷        │        │    🎥        │       │
│  │              │        │              │       │
│  │   Photo      │        │   Video      │       │
│  │  JPG, PNG    │        │  MP4, MOV    │       │
│  └──────────────┘        └──────────────┘       │
│                                                   │
│  ℹ️ Your story will be visible to your          │
│     matches for 24 hours.                        │
│                                                   │
└──────────────────────────────────────────────────┘
```

### After File Selection

```
┌──────────────────────────────────────────────────┐
│  Add to Your Story                           ✕   │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌────────────────────────────────────────────┐ │
│  │                                             │ │
│  │         [Image/Video Preview]              │ │
│  │                                             │ │
│  └────────────────────────────────────────────┘ │
│                                                   │
│  Caption (optional)                              │
│  ┌────────────────────────────────────────────┐ │
│  │ Add a caption...                           │ │
│  │                                             │ │
│  └────────────────────────────────────────────┘ │
│  0/200 characters                                │
│                                                   │
│  ┌──────────┐  ┌──────────────────────────────┐│
│  │  Change  │  │      Share Story  →          ││
│  └──────────┘  └──────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

---

## 3. Story Viewer (Full Screen)

```
┌──────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ ← Progress bars
│                                                   │
│  👤 Sarah          2m ago                    ✕  │ ← Header
│  👁️ 5  🗑️                                        │
│                                                   │
│                                                   │
│                                                   │
│                [Story Content]                    │
│                 Image or Video                    │
│                                                   │
│                                                   │
│                                                   │
│  ┌────────────────────────────────────────────┐ │
│  │  "Having coffee with friends! ☕"          │ │ ← Caption
│  └────────────────────────────────────────────┘ │
│                                                   │
└──────────────────────────────────────────────────┘

Navigation:
  Tap Left Side   → Previous story
  Tap Right Side  → Next story
  Hold/Press      → Pause
  Release         → Resume
  Swipe Left      → Next user's stories
  Swipe Right     → Previous user's stories
```

### Story Viewer Controls

**Top Bar:**
- Multiple thin progress bars (one per story)
- Current story bar fills left-to-right
- Previous stories: fully filled
- Next stories: empty

**Header:**
- User avatar (circular)
- User name
- Time ago (e.g., "2m ago", "1h ago")
- Eye icon + count (for own stories only)
- Trash icon (for own stories only)
- X button (close viewer)

**Footer:**
- Caption text (if present)
- Centered, white text on dark background

---

## 4. Viewers Panel (Your Stories Only)

```
┌──────────────────────────────────────────────────┐
│                [Story Content]                    │
│                                                   │
├──────────────────────────────────────────────────┤
│  Viewers (3)                                      │
│                                                   │
│  👤 Mike Smith                   2m ago          │
│                                                   │
│  👤 Emma Johnson                 15m ago         │
│                                                   │
│  👤 Alex Brown                   1h ago          │
│                                                   │
│  (scroll for more...)                             │
└──────────────────────────────────────────────────┘
```

Opens when clicking the eye icon on your own story.

---

## 5. Mobile View

### Portrait Mode

```
┌───────────────────┐
│ Stories Ring      │
│ ←─────────────→   │
│ + ● ● ○ ● ○      │
│                   │
│ Match Cards       │
│ ┌───────────────┐ │
│ │               │ │
│ │  Match Card   │ │
│ │               │ │
│ └───────────────┘ │
│ ┌───────────────┐ │
│ │               │ │
│ │  Match Card   │ │
│ │               │ │
│ └───────────────┘ │
└───────────────────┘
```

### Story Viewer Mobile

```
┌───────────────────┐
│▓▓▓▓▓░░░░░░░░░░░░░│ ← Progress
│ 👤 Sarah    2m ✕ │ ← Header
│                   │
│                   │
│                   │
│   [Story Image]   │
│                   │
│                   │
│                   │
│ ┌───────────────┐ │
│ │  "Caption"    │ │
│ └───────────────┘ │
│                   │
└───────────────────┘

Touch Actions:
  👆 Tap left  = Previous
  👆 Tap right = Next
  👇 Hold      = Pause
  ⬅️ Swipe up  = Viewers
```

---

## 6. States & Animations

### Loading State

```
Stories Ring:
┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐
│░░░│  │░░░│  │░░░│  │░░░│  │░░░│  ← Skeleton loading
└───┘  └───┘  └───┘  └───┘  └───┘
```

### Empty State

```
┌────────────────────────────────────┐
│  No Stories Yet                     │
│                                     │
│  Be the first to share a moment!   │
│                                     │
│  ┌──────────────┐                  │
│  │  + Add Story │                  │
│  └──────────────┘                  │
└────────────────────────────────────┘
```

### Upload Progress

```
┌──────────────────────────────────┐
│  ⏳ Uploading...                  │
│                                   │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░  65%        │
│                                   │
└──────────────────────────────────┘
```

### Success

```
┌──────────────────────────────────┐
│  ✅ Story shared successfully!   │
└──────────────────────────────────┘
```

### Error

```
┌──────────────────────────────────┐
│  ❌ Upload failed                │
│  File size must be less than 50MB │
└──────────────────────────────────┘
```

---

## 7. Animations & Transitions

### Story Ring Entry
- Fade in from left to right
- Each avatar appears with slight delay (stagger effect)

### Story Viewer Opening
- Fade in background (black overlay)
- Scale up from center
- Duration: 200ms

### Story Progress
- Linear fill left-to-right
- Smooth 50ms intervals
- Pauses on hold

### Story Transition
- Fade out current story
- Fade in next story
- Quick 100ms transition

### Delete Animation
- Shake animation on trash icon hover
- Fade out story on delete
- Smooth removal from list

---

## 8. Color Scheme

### Gradient (Unviewed Stories)
```
background: linear-gradient(
  45deg,
  #fbbf24 0%,    /* Yellow */
  #ec4899 50%,   /* Pink */
  #8b5cf6 100%   /* Purple */
);
```

### Gray (Viewed Stories)
```
border: 3px solid #9ca3af;  /* Gray-400 */
```

### Primary Actions
```
background: linear-gradient(
  to right,
  #ec4899,  /* Pink-500 */
  #9333ea   /* Purple-600 */
);
```

---

## 9. Accessibility

### Keyboard Navigation
- `Tab` - Navigate between stories
- `Space` - Pause/Resume
- `←` - Previous story
- `→` - Next story
- `Esc` - Close viewer

### Screen Readers
- Story ring: "Stories from your matches"
- Add button: "Add new story"
- Story avatar: "View stories from [Name], [viewed/unviewed]"
- Viewer: "[Name]'s story, [number] of [total]"

### Focus Indicators
- Clear outline on focused elements
- High contrast for visibility

---

## 10. Responsive Breakpoints

### Mobile (< 768px)
- Single column layout
- Full-width story viewer
- Touch-optimized navigation

### Tablet (768px - 1024px)
- Two column match cards
- Story ring with more avatars visible

### Desktop (> 1024px)
- Three column match cards
- Full story ring visible
- Arrow navigation in story viewer
- Hover effects enabled

---

## 11. Performance Optimizations

### Lazy Loading
- Story images load as you approach them in ring
- Preview thumbnails for videos

### Caching
- Viewed stories cached locally
- Reduce API calls

### Compression
- Images optimized on upload
- Videos compressed if needed

---

## 12. User Flows

### Flow 1: Posting a Story
```
Matches Page → Click "+" → Select Photo/Video
→ Preview & Caption → Click "Share"
→ Success → Ring Updates
```

### Flow 2: Viewing Stories
```
Matches Page → See Unviewed Ring → Click Avatar
→ Viewer Opens → Auto-plays Stories
→ Tap Through → Auto-advances to Next User
→ Close or End
```

### Flow 3: Checking Who Viewed
```
Matches Page → Click Your Story → Click Eye Icon
→ Viewers Panel Opens → See List
→ Close Panel → Continue Viewing
```

---

This UI is designed to be:
- ✅ **Intuitive** - Familiar Instagram/Snapchat-like interface
- ✅ **Fast** - Smooth animations and transitions
- ✅ **Responsive** - Works great on all devices
- ✅ **Accessible** - Keyboard navigation and screen reader support
- ✅ **Beautiful** - Modern gradients and clean design

Enjoy your new Stories feature! 🎉
