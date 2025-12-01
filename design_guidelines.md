# Design Guidelines: Among Us Card Game

## Design Approach

**Reference-Based Approach** drawing inspiration from:
- **Among Us**: Playful, cartoon aesthetic with bold colors and rounded shapes
- **Jackbox Games**: Clear turn-based UI, room codes, player waiting screens
- **Exploding Kittens Digital**: Card reveal animations and game state transitions

**Core Principles**:
- Playful and accessible gaming aesthetic
- Clear visual hierarchy for game states
- Smooth character animations as primary visual feedback
- High contrast for readability across devices

## Typography

**Font Selection**:
- Primary: **Fredoka** or **Quicksand** (rounded, friendly gaming font) from Google Fonts
- Secondary: **Inter** for UI text and room codes

**Hierarchy**:
- Titles/Headers: Bold, 2.5rem-4rem, uppercase with letter-spacing
- Game State Messages: Semibold, 1.5rem-2rem ("Turno de: Mario")
- Card Text: Medium, 1.25rem (role and word on cards)
- Body/UI Text: Regular, 1rem for buttons, player lists
- Room Codes: Monospace, 1.5rem, bold

## Layout System

**Spacing Units**: Tailwind units of **4, 6, 8, 12, 16** (e.g., p-4, gap-6, m-8, py-12, space-y-16)

**Screen Layouts**:
- Full-viewport canvas-based screens (100vh) for game states
- Centered content with max-w-4xl for configuration screens
- Flexible grid for player lists (grid-cols-2 md:grid-cols-3 lg:grid-cols-4)

## Core Components

### 1. Mode Selection Screen
- Large centered buttons (min-w-64, py-6) for "Clásico" and "Multijugador"
- Icon + text combination in buttons
- Subtle background pattern or gradient

### 2. Configuration Screens
- Category selection: Grid of cards with icons (3-4 columns on desktop)
- Number selectors: Large +/- buttons with centered number display
- Progress indicator showing configuration steps

### 3. Multiplayer Lobby
- Large room code display at top (text-4xl, monospace, tracking-wider)
- Player grid showing names with avatars/icons
- "Waiting for players..." state with animated dots
- Admin controls: Prominent "Empezar Partida" button (bg color with glow effect)

### 4. Character Animations
**Impostor Character**:
- Bold red (#EF4444) rounded character figure
- Subtle shadow/glow effect around character
- Entrance animation: Scale up from 0.5 to 1 with slight bounce
- Idle animation: Gentle float/pulse

**Civil Characters**:
- Multiple color variants: Blue (#3B82F6), Green (#10B981), Purple (#8B5CF6)
- Same rounded style as impostor, different colors
- Similar entrance animations but no glow

**Character Design**:
- Simple rounded shapes (circle head, rounded rectangle body)
- 200-300px size for card reveals
- Minimal details (eyes, visor like Among Us)
- Smooth transitions between states (0.3s ease-in-out)

### 5. Card Display
- Large centered card (400-500px width on desktop)
- Rounded corners (rounded-2xl)
- Subtle shadow and border
- Two-tone design: Header area for role, body for word
- Card flip/reveal animation from center

### 6. Turn Interface
**Active Turn**:
- Player's card prominently displayed center-screen
- Character animation above or beside card
- "Tu turno" message
- Large "Siguiente" button below (full-width on mobile, fixed-width on desktop)

**Waiting State**:
- Blurred/darkened screen
- Large text: "Turno de: [Nombre]"
- Small waiting indicator
- No interactive elements except cancel/leave game

### 7. Navigation & Buttons
- Primary buttons: Large (py-4 px-8), rounded-xl, bold text
- Secondary buttons: Outlined style with hover fill
- Icon buttons for settings/leave game (top corners)
- Floating "Siguiente" button at bottom during turns

### 8. Player List Display
- Compact cards showing player name + small avatar
- Grid layout that adapts to player count
- Active player highlight during their turn
- Admin badge/crown icon for room creator

## Visual Elements

**Background Treatments**:
- Subtle gradient or pattern for menu screens
- Solid dark background during active gameplay for focus
- Light particle effects for ambiance (very subtle)

**Icons**:
- Use **Heroicons** for UI elements (settings, info, close)
- Custom simple icons for categories (can use emoji as placeholders initially)

**Images/Illustrations**:
No photographic images needed. All visuals are:
- Custom character illustrations (simple SVG-style shapes)
- Icon-based category representations
- Pattern backgrounds for ambiance

## Responsive Behavior

- Mobile-first: Single column layouts, full-width cards and buttons
- Tablet: 2-column player grids, slightly larger card displays
- Desktop: Multi-column layouts, larger character animations, max-width constraints for readability

## Game State Transitions

- Smooth fade transitions between screens (200-300ms)
- Scale animations for card reveals (300-400ms)
- Slide-in animations for player joining lobby
- Bounce effect for "Empezar Partida" button when all ready

**Animation Philosophy**: Use sparingly for game feedback only - character reveals, turn changes, and state transitions. No continuous background animations that distract from gameplay.