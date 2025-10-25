# Order In The Coop - AI Legal Assistant

## Overview

Order In The Coop is an AI-powered legal assistant application featuring "Tender," a chatbot designed to help plaintiff legal teams process case documents, extract key information, and generate actionable next steps. The system accepts multiple document formats (PDF, DOCX, TXT, images), analyzes them using Google's Gemini AI, and provides structured insights including case numbers, parties involved, deadlines, key facts, and prioritized action items that require human approval before execution.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type safety and component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query for server state management and caching

**UI Framework:**
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design system
- Custom color scheme supporting light/dark modes
- Typography system using Inter (UI/body) and JetBrains Mono (monospace for legal data)

**Design System:**
- Linear/Notion-inspired professional aesthetic optimized for legal workflows
- Information hierarchy distinguishing AI suggestions from verified data
- Document-centric layout with fixed sidebar (280px), main content area (max-w-7xl), and collapsible right panel (360px)
- Spacing primitives based on Tailwind units (3, 4, 6, 8, 12)

**Key Components:**
- ChatInterface: Message handling with document attachment pills above input, inline controls (attach, voice, send)
- FileUploadZone: Drag-and-drop file upload supporting multiple formats
- ExtractedDataCard: Displays parsed legal information (case numbers, parties, deadlines, facts)
- ActionApprovalCard: Human-in-the-loop approval system for AI-suggested actions with approve/reject buttons
- ApprovalsTab: Displays approved actions grouped by case with full context (document filename, rationale, priority, approval date)
- DeadlinesTab: Interactive calendar interface displaying critical deadlines with case context and priority indicators
- AppSidebar: Case navigation sidebar with search bar, real-time filtering, and text highlighting of matches

**Navigation & Search:**
- Sidebar contains search bar for filtering active cases by name or case number
- Real-time text highlighting of matched search terms using proper regex escaping
- Tab-based navigation (Chat, Documents, Approvals, Deadlines) in main content area
- Documents tab shows only pending suggested actions
- Approvals tab shows only approved actions grouped by case
- Deadlines tab shows calendar interface with all deadlines from extracted documents
- Dynamic case name display updates automatically when switching between cases

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript running on Node.js
- ESM module system for modern JavaScript features
- Custom Vite integration for development with HMR support

**API Design:**
- RESTful endpoints following `/api` convention
- File upload handling via Multer middleware with memory storage
- Request/response logging with duration tracking
- JSON body parsing with raw body preservation for verification

**File Processing Pipeline:**
1. Multer receives uploaded files in memory
2. Text extraction based on file type (PDF via pdf-parse, DOCX via mammoth, plain text)
3. Extracted text sent to Gemini AI for analysis
4. Structured response parsed and stored in database
5. File metadata saved to local filesystem storage

**AI Integration:**
- Google Gemini AI (@google/genai) for document analysis
- Structured prompts requesting specific legal information extraction
- JSON response format for case numbers, parties, deadlines, facts, and suggested actions
- Confidence scoring for extracted data

### Data Storage

**Database:**
- PostgreSQL via Neon serverless driver (@neondatabase/serverless)
- Drizzle ORM for type-safe database queries and schema management
- WebSocket support for serverless database connections

**Schema Design:**
- `cases`: Core case information (name, case number, status)
- `documents`: File metadata linked to cases
- `chatMessages`: Conversation history with role-based messages
- `extractedData`: AI-extracted information with JSONB fields for complex data structures
- `suggestedActions`: Action items with approval workflow (pending/approved/rejected status)

**Rationale:** PostgreSQL chosen for JSONB support enabling flexible storage of variable legal document structures while maintaining relational integrity. Drizzle provides compile-time type safety matching database schema to TypeScript types.

### File Storage

**Approach:** Local filesystem storage in private directory
- Files stored in `.private/documents` with timestamp-prefixed filenames
- File URLs generated as `/files/{filename}` routes
- Separation of file metadata (database) from binary content (filesystem)

**Alternative Considered:** Cloud object storage (S3, R2) would provide better scalability but adds complexity and cost for initial deployment. Local storage sufficient for development and small-scale deployments.

### Authentication & Authorization

**Current State:** No authentication implemented (in-memory user storage exists but unused)
**Future Consideration:** Session-based authentication with connect-pg-simple for PostgreSQL session storage already configured in dependencies

### Human-in-the-Loop Workflow

**Design Principle:** AI suggestions require explicit human approval before execution

**Workflow States:**
- **Pending**: AI-generated actions appear in Documents tab with approve/reject buttons
- **Approved**: User clicks approve → action moves to Approvals tab as a permanent reminder grouped by case
- **Rejected**: User clicks reject → action is deleted entirely from the system

**Approval Flow:**
1. User reviews pending action in Documents tab
2. Clicks approve button → PATCH /api/actions/:id updates status to "approved"
3. Action disappears from Documents tab
4. Action appears in Approvals tab grouped by case with full context:
   - Action title, description, and rationale
   - Priority badge (high/medium/low)
   - Source document filename
   - Approval date
5. Approved actions persist as reminders for legal team

**Rejection Flow:**
1. User reviews pending action in Documents tab
2. Clicks reject button → DELETE /api/actions/:id removes action from database
3. Action disappears from Documents tab
4. Action does NOT appear in Approvals tab (deleted entirely)

**Visual Indicators:**
- Priority badges (high/medium/low) guide urgency assessment
- Toast notifications confirm approve/reject actions
- Empty state messaging when no approvals exist
- Case grouping organizes approved actions by legal matter

**Rationale:** Legal work demands verification and accountability. This prevents automated AI actions while accelerating decision-making through structured recommendations. The Approvals tab serves as a permanent reminder system for verified actions that require follow-up.

### Deadline Calendar System

**Design Principle:** Visual calendar interface for tracking critical legal deadlines across all cases

**Calendar Interface:**
- Two-panel layout: Interactive calendar (left) and deadline details (right)
- Calendar built with react-day-picker for intuitive date selection
- Dates with deadlines are visually highlighted (bold, underlined, primary color)
- Click any date to view all deadlines scheduled for that day

**Deadline Display:**
- Each deadline card shows:
  - Description of the deadline
  - Priority badge (high/medium/low) with color coding
  - Associated case name and case number
  - Source document that contained the deadline
- Priority color scheme:
  - High: Red background with alert icon
  - Medium: Yellow background
  - Low: Blue background
- ScrollArea for handling multiple deadlines on a single date

**Data Flow:**
1. AI extracts deadlines from documents during analysis
2. Deadlines stored in extractedData.deadlines JSONB field
3. Backend GET /api/deadlines aggregates all deadlines across cases
4. Frontend fetches and parses ISO date strings with date-fns
5. Calendar highlights active dates using react-day-picker modifiers
6. Date selection filters deadlines using isSameDay comparison

**Empty States:**
- No deadlines for selected date: Shows calendar icon with helpful message
- Loading state: Displays loading message while fetching data

**Rationale:** Legal deadlines are mission-critical. Missing a filing deadline can result in case dismissal. The calendar provides an at-a-glance view of all upcoming deadlines across multiple cases, helping legal teams prioritize work and avoid missed deadlines. Grouping by date rather than case enables better daily planning and workload management.

## External Dependencies

### AI Services
- **Google Gemini AI**: Document analysis and natural language processing
  - Requires `GEMINI_API_KEY` environment variable
  - Used for extracting structured legal information from unstructured documents
  - Generates contextual action recommendations

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
  - Requires `DATABASE_URL` environment variable
  - WebSocket connection support for serverless environments
  - Schema migrations managed via Drizzle Kit

### UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, accordions, etc.)
- **Shadcn/ui**: Pre-built component library with Tailwind styling
- **Lucide React**: Icon library for consistent iconography
- **react-day-picker**: Accessible date picker component for calendar interface
- **date-fns**: Modern JavaScript date utility library for date parsing and comparison

### File Processing
- **pdf-parse**: PDF text extraction
- **mammoth**: DOCX document conversion to plain text
- **multer**: Multipart form data handling for file uploads

### Development Tools
- **Vite**: Frontend build tool with development server
- **TypeScript**: Type safety across frontend and backend
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Backend bundling for production deployment

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing with autoprefixer
- **Google Fonts**: Inter and JetBrains Mono font families

### State Management
- **TanStack Query**: Server state management with automatic caching and refetching
- **React Hook Form**: Form state management (via @hookform/resolvers dependency)