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
- ActionApprovalCard: Human-in-the-loop approval system for AI-suggested actions
- AppSidebar: Case navigation sidebar showing active cases list only (Navigation section removed)

**Navigation Structure:**
- Sidebar: Shows only "Active Cases" list for switching between cases
- Main Content: Tab-based navigation (Chat, Documents, Approvals, Deadlines) within each case
- Dynamic case name display updates when switching between cases

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
- Suggested actions displayed with title, description, rationale, and priority
- Three-state approval: pending → approved/rejected
- Visual indicators (badges, priority icons) guide decision-making
- Audit trail maintained through status field in database

**Rationale:** Legal work demands verification and accountability. This prevents automated AI actions while accelerating decision-making through structured recommendations.

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