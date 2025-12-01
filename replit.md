# Impostor - Multiplayer Card Game

## Overview

Impostor is a multiplayer card game inspired by Among Us, built as a web application. Players are assigned roles (impostor or civil) and receive related words based on a chosen category. The impostor receives a different word than the other players, and the goal is to identify the impostor through discussion. The game supports both local (classic) and online multiplayer modes, with real-time turn-based gameplay.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and bundler.

**UI Library**: shadcn/ui components built on top of Radix UI primitives, providing accessible and customizable components. The design system uses Tailwind CSS with a custom configuration focusing on a gaming aesthetic.

**Design Approach**:
- Playful, cartoon-like aesthetic inspired by Among Us, Jackbox Games, and Exploding Kittens
- Canvas-based character animations for visual feedback
- Framer Motion for smooth transitions and card reveal animations
- Typography using Fredoka/Quicksand for headers and Inter for UI text
- Full-viewport layouts for game states with responsive grid systems

**State Management**: React hooks for local state, with game state managed at the component level and passed down through props. No global state management library is used.

**Routing**: Wouter for lightweight client-side routing, though the application is primarily single-page with screen state managed internally.

**Key Components**:
- `CharacterCanvas`: HTML5 Canvas-based character rendering with animation support
- `GameCard`: Card reveal component with flip animations
- `ModeSelection`: Initial screen for choosing classic or multiplayer mode
- `GameConfig`: Multi-step configuration wizard for category, impostor count, and player setup
- `Lobby`: Multiplayer waiting room with real-time player list updates
- `TurnView`: Turn-based gameplay interface with card reveal mechanics

### Backend Architecture

**Runtime**: Node.js with Express.js server framework.

**Real-time Communication**: WebSocket implementation using the `ws` library for multiplayer game state synchronization. The server manages:
- Room creation with unique 4-character codes
- Player connections and disconnections
- Turn-based game flow
- Role and word assignment

**Game Logic**: Server-side game state management stored in-memory using Maps:
- `rooms`: Map of room codes to room objects containing players, game configuration, and current turn state
- `clients`: Map of WebSocket connections to client metadata (player ID, room code)

**Session Management**: In-memory storage using a custom `MemStorage` class for user data (though user authentication appears minimal/optional for the game).

**API Design**: RESTful endpoints are minimal; primary communication happens via WebSocket events for real-time gameplay.

### Data Storage

**Database**: Configured for PostgreSQL via Drizzle ORM with Neon Database serverless driver, though the current implementation uses primarily in-memory storage for game state.

**Schema Management**: Drizzle Kit for migrations and schema management. Schema definitions in `shared/schema.ts` include:
- Game categories (Animales, Películas, Objetos, Deportes, Comida, Tecnología, General)
- Word sets for each category with main impostor word and related civil words
- Player color assignments
- Type definitions for game modes, players, and game state

**In-Memory State**: Game sessions are ephemeral and stored in server memory. Rooms and player data are lost on server restart.

### Development Tools

**Build System**: 
- Vite for frontend development with HMR (Hot Module Replacement)
- esbuild for server bundling in production
- Custom build script that bundles allowlisted dependencies to reduce cold start times

**Type Safety**: Full TypeScript implementation across client, server, and shared code with strict mode enabled.

**Code Organization**:
- `/client`: React frontend application
- `/server`: Express backend with WebSocket handling
- `/shared`: Shared type definitions and schemas accessible to both client and server
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)

## External Dependencies

### UI and Styling
- **shadcn/ui**: Pre-built accessible component library (Radix UI-based)
- **Tailwind CSS**: Utility-first CSS framework with custom gaming theme
- **Framer Motion**: Animation library for card flips, transitions, and character movements
- **Lucide React**: Icon library for UI elements

### Real-time Communication
- **ws**: WebSocket library for multiplayer game synchronization
- No Socket.IO dependency despite mentions in design documents - implementation uses native WebSocket protocol

### Database and ORM
- **Drizzle ORM**: TypeScript ORM for database operations
- **@neondatabase/serverless**: Neon Database PostgreSQL driver
- **connect-pg-simple**: PostgreSQL session store (configured but minimally used)

### Development and Build
- **Vite**: Frontend build tool and dev server with React plugin
- **esbuild**: Fast JavaScript/TypeScript bundler for production server build
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit-specific development tooling
- **@replit/vite-plugin-dev-banner**: Development banner for Replit environment

### Form Handling and Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation library
- **drizzle-zod**: Zod schema generation from Drizzle schemas

### Deployment
- Application designed for deployment on Replit/Render
- Static file serving in production mode
- Environment-based configuration for database connection strings