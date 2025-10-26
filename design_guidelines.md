# Design Guidelines for Real-Time Chat Application

## Design Approach: Reference-Based (Messaging Platforms)

**Primary References:** Slack, Discord, WhatsApp Web
**Rationale:** This is a communication-focused application where clarity, efficiency, and real-time interaction patterns are critical. Drawing from established messaging platforms ensures familiar patterns while maintaining usability.

**Core Design Principles:**
1. Information hierarchy that prioritizes active conversations
2. Clear visual distinction between sent/received messages
3. Instant visual feedback for all real-time actions
4. Efficient use of screen space for maximum chat visibility
5. Accessible file sharing with clear upload/download states

---

## Layout System

**Application Structure:**
Three-column layout for desktop, collapsible for mobile:

1. **Left Sidebar (w-64 to w-80):**
   - Fixed width on desktop
   - User profile section at top
   - Search bar prominently placed
   - Scrollable user/conversation list
   - Online status indicators

2. **Main Chat Area (flex-1):**
   - Chat header with recipient info and actions
   - Scrollable message container (flex-grow)
   - Fixed message input at bottom
   - Full height utilization

3. **Right Panel (w-64, optional visibility):**
   - Shared files/media gallery
   - User details when viewing profile
   - Toggleable on smaller screens

**Spacing Primitives:**
Use Tailwind units of **2, 3, 4, 6, and 8** consistently:
- Component padding: p-4, p-6
- Message spacing: space-y-3, space-y-4
- Section gaps: gap-4, gap-6
- Avatar sizes: w-8 h-8 (small), w-10 h-10 (standard), w-12 h-12 (profile)

**Responsive Behavior:**
- Desktop (lg:): Three-column layout
- Tablet (md:): Two columns (sidebar + chat, hide right panel)
- Mobile: Single view with slide-out sidebar navigation

---

## Typography System

**Font Families:**
- Primary: Inter or DM Sans (via Google Fonts CDN)
- Monospace: JetBrains Mono (for file names, technical info)

**Hierarchy:**

**Headers & Titles:**
- App header: text-lg font-semibold
- Chat header (username): text-base font-semibold
- Section titles: text-sm font-semibold uppercase tracking-wide

**Body Text:**
- Message content: text-sm leading-relaxed
- Input placeholder: text-sm
- Helper text: text-xs
- Timestamps: text-xs font-medium

**Interactive Elements:**
- Buttons: text-sm font-medium
- Links: text-sm font-medium underline-offset-2

---

## Component Library

### Authentication Screens

**Login/Register Layout:**
- Centered card design (max-w-md mx-auto)
- Vertical form layout with space-y-4
- Input fields: Full-width with p-3, rounded-lg borders
- Labels: text-sm font-medium mb-2
- Submit button: w-full with p-3
- Toggle between login/register: Text link below form

### Left Sidebar Components

**Search Bar:**
- Sticky at top with p-4
- Full-width input with rounded-lg, p-2.5
- Search icon (Heroicons) positioned left inside input
- Live filtering as user types

**User/Conversation List:**
- Each item: p-3, rounded-lg, clickable
- Avatar (w-10 h-10) with online indicator (absolute positioned dot, w-3 h-3, bottom-right)
- Two-line layout: Username (text-sm font-semibold) + Last message preview (text-xs truncate)
- Unread badge: Circular, w-5 h-5, text-xs, absolute top-right
- Active conversation: Distinct treatment

**User Profile Section (Top):**
- p-4 with flex items-center gap-3
- Avatar w-12 h-12
- Username text-base font-semibold
- Status dropdown or settings icon

### Main Chat Area

**Chat Header:**
- Fixed height (h-16), px-6, border-b
- Flex justify-between items-center
- Left: Recipient avatar + name + online status
- Right: Actions (search in chat, info, more options icons)

**Message Container:**
- flex-1 overflow-y-auto with p-6
- Messages grouped by timestamp (date separators with text-xs text-center)
- Individual messages with max-w-lg for readability

**Message Bubbles:**
- Sent messages: ml-auto, rounded-2xl rounded-br-md, p-3
- Received messages: mr-auto, rounded-2xl rounded-bl-md, p-3
- Timestamp: text-xs below bubble, text-right for sent, text-left for received
- File attachments: Additional component within bubble with download action

**File/Image Message Components:**
- Images: Rounded corners, max-w-sm, clickable for full view
- Documents: Flex row with file icon, name (truncate), size, download button
- Document preview: p-3 rounded-lg border

**Message Input Area:**
- Fixed at bottom, p-4, border-t
- Flex row with gap-3
- File upload button (icon button, w-10 h-10)
- Text input: flex-1, p-3, rounded-full, max-h-32 (auto-expand)
- Send button: w-10 h-10, rounded-full, icon button
- File preview area above input (when files selected) with remove actions

### Real-time Status Indicators

**Online Status Dot:**
- Positioned absolute on avatars
- w-3 h-3 rounded-full with ring-2 (white/background ring)
- Online/offline states clearly differentiated

**Typing Indicator:**
- Below last message in chat
- Animated dots (3 spans with staggered animation)
- text-xs with avatar mini (w-6 h-6)

**Message Delivery Status:**
- Checkmarks next to timestamp (single check: sent, double: delivered, filled: read)
- Icon size: w-3.5 h-3.5

### Modals & Overlays

**Image Lightbox:**
- Full-screen overlay with backdrop blur
- Image centered, max-w-screen-lg
- Close button (top-right, w-10 h-10)
- Download and share actions

**User Profile Modal:**
- Centered card, max-w-md
- Avatar (w-24 h-24, mx-auto)
- Username, bio, joined date
- Shared files gallery preview

---

## Icons

**Library:** Heroicons (via CDN)

**Icon Placement:**
- Search: magnifying-glass
- Send: paper-airplane
- Attach: paper-clip
- Settings: cog-6-tooth
- More options: ellipsis-vertical
- Online status: circle (filled/outline)
- File types: document, photo, video icons
- Download: arrow-down-tray
- Close: x-mark

---

## Accessibility

**Form Inputs:**
- All inputs have associated labels (for screen readers, can be visually hidden)
- Placeholder text provides context
- Focus states clearly visible with ring-2 ring-offset-2
- Keyboard navigation fully supported (Tab, Enter, Escape)

**Interactive Elements:**
- Minimum touch target: 44x44px (w-11 h-11)
- Clear focus indicators on all clickable items
- Alt text for all uploaded images
- ARIA labels for icon-only buttons

**Contrast:**
- Text meets WCAG AA standards
- Interactive states clearly distinguishable
- Status indicators don't rely solely on color

---

## Animations

**Minimal, purposeful animations only:**
- Message appearance: Fade-in with slight slide-up (transition-all duration-200)
- Typing indicator: Gentle pulse on dots
- Hover states: Subtle opacity or scale changes (hover:opacity-80)
- No elaborate scroll animations or unnecessary motion

---

## Images

**No hero images required** - this is a utility application focused on functionality.

**User-Generated Content:**
- Profile avatars: User uploads or generated initials in circular frames
- Shared images in chat: Display inline with rounded corners, clickable for full view
- Document thumbnails: Generic file type icons with file extension badges

**Placeholder States:**
- Empty chat: Friendly illustration or icon with "Start a conversation"
- No search results: Magnifying glass icon with helpful message
- Loading states: Subtle skeleton screens for message lists

---

## Special Considerations

**File Upload UX:**
- Drag-and-drop zone in message input (dashed border on drag-over)
- Progress indicators for uploads (linear progress bar, text-xs showing percentage)
- File size limits displayed clearly (text-xs helper text)
- Preview before sending with cancel option

**Search Functionality:**
- Instant results as user types
- Highlight matched text
- Recent searches quick access
- Clear search button appears when text present

**Notification States:**
- Unread message count badges (circular, min-w-5 h-5)
- Desktop notification permission prompt (small, non-intrusive)
- Sound toggle in settings

**Responsive Mobile Adaptations:**
- Hamburger menu for sidebar (top-left)
- Back button in chat header to return to user list
- Bottom navigation for quick actions
- Touch-optimized message input with improved spacing (p-4 instead of p-3)