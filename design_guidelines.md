# AI Legal Assistant Chatbot - Design Guidelines

## Design Approach
**System-Based Approach**: Linear/Notion-inspired design system optimized for professional legal workflows. Prioritizes clarity, information density, and efficient task completion with a modern, trustworthy aesthetic that builds confidence in AI-assisted legal work.

## Core Design Principles
1. **Professional Trust**: Clean, uncluttered layouts that convey reliability and precision
2. **Information Hierarchy**: Clear visual distinction between AI suggestions and verified data
3. **Workflow Clarity**: Obvious approval gates and status indicators for human-in-the-loop processes
4. **Document-Centric**: Design optimized for reading, reviewing, and processing legal content

## Typography System
- **Primary Font**: Inter (via Google Fonts CDN) for UI elements and body text
- **Monospace Font**: JetBrains Mono for case numbers, dates, and extracted data fields
- **Hierarchy**:
  - Page Titles: text-3xl font-semibold
  - Section Headers: text-xl font-semibold
  - Card Titles: text-lg font-medium
  - Body Text: text-base font-normal
  - Labels/Metadata: text-sm font-medium
  - Fine Print: text-xs

## Layout System
**Spacing Primitives**: Tailwind units of 3, 4, 6, 8, 12 (e.g., p-4, gap-6, space-y-8, mb-12)

**Layout Structure**:
- Fixed left sidebar (280px) for navigation and case selection
- Main content area with max-w-7xl container
- Right panel (360px, collapsible) for document preview/details
- Chat interface: max-w-4xl centered for optimal reading width

## Component Library

### Navigation
- **Sidebar**: Vertical navigation with case list, recent documents, and quick actions
- **Top Bar**: Breadcrumb trail, case context, user profile menu

### Chat Interface
- **Message Layout**: Left-aligned user messages, right-aligned AI responses with clear avatars
- **AI Response Cards**: Bordered containers with distinct header showing "AI Analysis" badge
- **Action Suggestions**: List items with checkbox-style approval buttons and confidence indicators
- **Verification Prompts**: Highlighted cards requiring explicit user confirmation with "Approve" and "Review" actions

### Document Upload
- **Drag-and-Drop Zone**: Large centered area (min-h-64) with dashed border and upload icon
- **File List**: Compact table showing filename, type, size, upload status with progress indicators
- **Multi-Format Support**: Clear icons differentiating PDF, DOCX, TXT, images

### Data Display
- **Extracted Information Cards**: Grid layout (grid-cols-2 lg:grid-cols-3) showing:
  - Case number and parties
  - Critical deadlines with countdown indicators
  - Key facts in expandable sections
  - Document metadata
- **Timeline View**: Vertical timeline for case events and deadlines
- **Approval Queue**: List of pending AI suggestions with status badges (Pending, Approved, Rejected)

### Forms & Inputs
- **Text Inputs**: Border with focus ring, generous padding (px-4 py-3)
- **Approval Buttons**: Primary action (Approve) and secondary (Review/Reject) side-by-side
- **Confirmation Dialogs**: Modal overlays with clear action choices and consequence warnings

### Status Indicators
- **Processing States**: Spinner with status text ("Analyzing document...", "Extracting key information...")
- **Badges**: Rounded pills for document status (New, Processed, Verified, Action Required)
- **Confidence Scores**: Progress bars or percentage indicators for AI extraction confidence

### Document Preview
- **PDF Viewer**: Embedded viewer with zoom controls and page navigation
- **Highlighted Sections**: Visual markers showing AI-identified critical passages
- **Annotation Tools**: Simple markup for user notes and corrections

## Interaction Patterns

### Human-in-the-Loop Workflow
1. **Clear Separation**: Visual distinction between AI suggestions (outlined cards) and approved data (solid backgrounds)
2. **Prominent Approval CTAs**: Large, obvious buttons requiring explicit user action
3. **Undo Capability**: "Undo Approval" option visible for recently approved items
4. **Batch Actions**: Checkbox selection for approving multiple related items

### Chat Interactions
- **Typing Indicators**: Animated dots when AI is processing
- **Streaming Responses**: Progressive text reveal for long AI analyses
- **Quick Actions**: Inline buttons within AI responses for common workflows
- **Context Awareness**: Sticky header showing active case context

### Document Processing Flow
1. Upload → Immediate visual confirmation
2. Processing → Progress indicator with estimated time
3. Analysis Complete → Summary card with expandable details
4. Verification → Highlighted sections requiring review
5. Approval → Status change with visual feedback

## Responsive Behavior
- **Desktop (lg+)**: Three-column layout (sidebar, main, preview panel)
- **Tablet (md)**: Collapsible sidebar, main content, preview as modal
- **Mobile**: Single column, hamburger menu, bottom sheet for document preview

## Images
**Hero Section**: No traditional hero image. Instead, use a dashboard-style landing showing:
- Active case count widget
- Recent documents thumbnails (PDF first pages)
- Quick upload area
- Pending approvals counter

**Document Thumbnails**: Display first page previews for uploaded documents in grid layouts

**Empty States**: Illustration-style graphics (simple line art) for:
- No documents uploaded yet
- No pending approvals
- New case initialization

## Accessibility
- Keyboard navigation for all approval workflows
- Clear focus indicators on interactive elements
- Screen reader labels for AI confidence scores
- ARIA labels for document status changes
- High contrast between text and backgrounds