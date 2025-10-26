# Order In The Coop - AI Legal Assistant

## Overview
Order In The Coop is an AI-powered legal assistant featuring "Tender," a chatbot designed to help plaintiff legal teams process case documents. The system analyzes various document formats (PDF, DOCX, TXT, Excel, CSV, images) using Google's Gemini AI, extracts key information like case numbers, parties, deadlines, and facts, and generates prioritized, human-approvable action items. The project aims to streamline legal document processing, enhance information extraction, and improve task management for legal professionals.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Technology Stack**: React with TypeScript, Vite, Wouter for routing, TanStack Query for server state.
- **UI Framework**: Shadcn/ui (Radix UI base), Tailwind CSS for styling, custom light/dark mode color scheme, Inter and JetBrains Mono typography.
- **Design System**: Linear/Notion-inspired professional aesthetic, document-centric layout with fixed sidebar (280px), main content (max-w-7xl), and collapsible right panel (360px).
- **Key Components**: ChatInterface, FileUploadZone, ExtractedDataCard, ActionApprovalCard, ApprovalsTab, DeadlinesTab (calendar view), AppSidebar (case navigation, search), NewCaseDialog.
- **Navigation & Search**: Sidebar search for cases with real-time filtering and highlighting. Tab-based navigation for Chat, Documents (pending actions), Approvals (approved actions), and Deadlines (calendar).
- **Case Management**: Create new cases, delete cases (with CASCADE deletion of all associated data), and display empty states.

### Backend
- **Server Framework**: Express.js with TypeScript, Node.js, ESM modules.
- **API Design**: RESTful endpoints, Multer for file uploads (in-memory storage), request/response logging.
- **File Processing Pipeline**: Supports single or multiple file uploads in one batch. Uploaded files undergo text extraction (pdf-parse, mammoth, xlsx library) or direct multimodal processing (for PDFs with Gemini). All files in a batch are sent to Gemini AI together for unified analysis. Structured responses are parsed and stored, and file metadata is saved.
- **Supported File Formats**: PDF (multimodal vision processing via Gemini), DOCX/DOC, Excel (.xlsx, .xls), CSV, TXT. Images are supported for upload but OCR is planned for future.
- **AI Integration**: Google Gemini AI (gemini-2.5-flash model) for document analysis, multimodal vision processing for PDFs, batch analysis of multiple documents in single request, context-aware prompts including user instructions, JSON response format for structured data, and conversational responses for specific user queries. When multiple files are uploaded, Gemini analyzes all documents together and returns unified results combining information from all files.

### Data Storage
- **Database**: PostgreSQL via Neon serverless driver, Drizzle ORM for type-safe queries and schema.
- **Schema Design**: `cases`, `documents`, `chatMessages`, `extractedData`, `suggestedActions` tables with `ON DELETE CASCADE` for data integrity.
- **File Storage**: Local filesystem storage (`.private/documents`) with timestamp-prefixed filenames.

### Human-in-the-Loop Workflow
- **Design Principle**: AI suggestions require explicit human approval.
- **Workflow States**: Pending (in Documents tab, approve/reject buttons), Approved (moves to Approvals tab with full context), Rejected (deleted).
- **Approval Flow**: User approves, action moves to Approvals tab as a permanent, grouped reminder with details (title, description, rationale, priority, source, date).
- **Rejection Flow**: User rejects, action is deleted from the system.

### Deadline Calendar System
- **Design Principle**: Visual calendar for critical legal deadlines across all cases.
- **Calendar Interface**: Two-panel layout (calendar + deadline details), custom calendar component with month navigation. Dates with deadlines are visually highlighted.
- **Deadline Display**: Each deadline card shows description, priority, associated case, and source document. Priority is color-coded.
- **Data Flow**: AI extracts deadlines, stored in `extractedData.deadlines`. Backend aggregates all deadlines, frontend fetches and displays them in the calendar.

## External Dependencies

### AI Services
- **Google Gemini AI**: Document analysis, NLP, multimodal vision (requires `GEMINI_API_KEY`).

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database (requires `DATABASE_URL`).

### UI Libraries
- **Radix UI**: Accessible component primitives.
- **Shadcn/ui**: Pre-built component library.
- **Lucide React**: Icon library.
- **date-fns**: Date utility library.

### File Processing
- **pdf-parse**: PDF text extraction.
- **mammoth**: DOCX conversion to plain text.
- **multer**: Multipart form data handling for file uploads.

### Development Tools
- **Vite**: Frontend build tool.
- **TypeScript**: Type safety.
- **Drizzle Kit**: Database schema management.

### Styling
- **Tailwind CSS**: Utility-first CSS framework.