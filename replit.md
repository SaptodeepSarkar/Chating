# Real-Time Chat Application

## Overview

This is a real-time chat application built with React (frontend) and Express (backend), featuring WebSocket-based instant messaging, file sharing capabilities, and user authentication. The application follows design patterns inspired by modern messaging platforms like Slack, Discord, and WhatsApp Web, emphasizing clear information hierarchy and efficient real-time communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management

**UI Component System:**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Component-based architecture with reusable UI elements (Avatar, MessageBubble, UserList, ChatArea)
- Custom theming system supporting light/dark modes through CSS variables

**Layout Strategy:**
- Three-column responsive layout (sidebar, main chat, optional right panel)
- Mobile-first approach with collapsible navigation
- Breakpoints: mobile (default), tablet (md:), desktop (lg:)
- Fixed positioning for input areas and headers to maintain context

**State Management:**
- Local component state for UI interactions
- React Query for server data caching and synchronization
- WebSocket connection state managed at the Chat page level
- LocalStorage for user session persistence

### Backend Architecture

**Server Framework:**
- Express.js for HTTP request handling
- Node.js runtime with ES modules
- TypeScript for type safety across the stack

**Real-Time Communication:**
- WebSocket server using the `ws` library for bidirectional messaging
- Custom WebSocket client interface extending base WebSocket with userId tracking
- Message broadcasting system for real-time delivery
- Connection-based user presence tracking

**Data Storage Strategy:**
- **Current Implementation:** JSON file-based storage using a custom JSONStorage class
  - Separate files for users, messages, and file metadata
  - In-memory Maps for fast lookups
  - Atomic write operations using Node.js fs promises
- **Schema Definition:** Drizzle ORM schema defined for PostgreSQL migration
  - Prepared for database transition with pgTable definitions
  - UUID-based primary keys with `gen_random_uuid()` defaults
  - Type-safe schema validation using Drizzle-Zod

**File Upload System:**
- Multer middleware for multipart form-data handling
- Local filesystem storage in `uploads/` directory
- File size limit: 10MB per upload
- Unique filename generation using timestamp + random suffix
- Metadata storage (filename, type, size) linked to messages

**Authentication:**
- Username/password authentication with bcrypt hashing
- Session-based authentication pattern (though sessions not fully implemented in current code)
- User registration and login endpoints
- Client-side session persistence via localStorage

**API Structure:**
- RESTful endpoints for authentication (`/api/auth/register`, `/api/auth/login`)
- User management endpoints (`/api/users`)
- File upload endpoints (`/api/upload`)
- WebSocket endpoint (`/ws`) for real-time messaging
- Static file serving for uploaded content

### Data Models

**Users Table:**
- Unique identifiers and usernames
- Password hashing for security
- Online status tracking (online/offline)
- Last seen timestamps

**Messages Table:**
- Sender and receiver relationships
- Support for both text content and file attachments
- File metadata (URL, name, type, size) embedded in message records
- Read status tracking
- Timestamp-based ordering

**Files Table:**
- Separate file registry for tracking all uploads
- Links to uploader user
- Physical file storage metadata
- Upload timestamp tracking

### Design System Integration

**Reference-Based Design:**
- Draws inspiration from established messaging platforms (Slack, Discord, WhatsApp Web)
- Prioritizes clarity, efficiency, and familiar interaction patterns
- Consistent spacing primitives using Tailwind units (2, 3, 4, 6, 8)

**Visual Hierarchy:**
- Clear distinction between sent/received messages through color and positioning
- Online status indicators using color-coded badges
- Avatar system with username-based color generation for visual differentiation
- Consistent border radius values (.1875rem, .375rem, .5625rem)

**Interactive Feedback:**
- Hover and active states using elevation classes
- Message animation on send (fade-in, slide-in)
- Loading states and disabled states for async operations
- Toast notifications for user feedback

## External Dependencies

### Frontend Libraries

**UI & Styling:**
- `@radix-ui/*`: Accessible, unstyled UI component primitives (30+ components)
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority`: Component variant management
- `clsx` + `tailwind-merge`: Conditional class name utilities

**Form Management:**
- `react-hook-form`: Performant form state management
- `@hookform/resolvers`: Form validation integration
- `zod`: TypeScript-first schema validation

**Data Fetching:**
- `@tanstack/react-query`: Asynchronous state management and caching

**Routing:**
- `wouter`: Minimalist routing library (implicit from usage patterns)

**Date Utilities:**
- `date-fns`: Modern date/time manipulation

### Backend Libraries

**Web Framework:**
- `express`: HTTP server and routing
- `ws`: WebSocket protocol implementation

**Database & ORM:**
- `drizzle-orm`: TypeScript ORM (configured for PostgreSQL)
- `drizzle-kit`: Database migration toolkit
- `@neondatabase/serverless`: PostgreSQL driver for serverless environments

**File Handling:**
- `multer`: Multipart form-data parsing and file uploads

**Authentication:**
- `bcryptjs`: Password hashing and comparison
- `connect-pg-simple`: PostgreSQL session store (for future session implementation)

**Development Tools:**
- `tsx`: TypeScript execution for development
- `esbuild`: Fast JavaScript/TypeScript bundler for production builds
- `@vitejs/plugin-react`: React Fast Refresh support
- `@replit/vite-plugin-*`: Replit-specific development enhancements

### External Services

**Database:**
- PostgreSQL (via Neon serverless driver)
- Connection via `DATABASE_URL` environment variable
- Schema migrations managed through Drizzle Kit

**Development Platform:**
- Replit-specific integrations for debugging and development
- Runtime error overlay
- Cartographer plugin for code navigation
- Development banner for Replit environment

### Font Services

**Google Fonts:**
- Inter: Primary UI font (weights 300-700)
- JetBrains Mono: Monospace font for code/technical content (weights 400-600)

### Configuration Notes

- Environment variables required: `DATABASE_URL`, `NODE_ENV`
- Build outputs: `dist/public` (frontend), `dist` (backend)
- TypeScript configuration uses path aliases (`@/`, `@shared/`, `@assets/`)
- Hot Module Replacement (HMR) enabled in development via Vite
- WebSocket connection adapts to protocol (ws/wss based on HTTP/HTTPS)