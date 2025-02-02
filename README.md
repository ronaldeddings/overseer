# Overseer

> **Description**: Overseer is a personal (and possibly future SaaS) workflow automation tool built with Next.js, TypeScript, React Flow for visual workflow design, and a Chrome Extension for in-browser automation. It uses Supabase (Postgres) for persistence. Overseer is designed to let you connect APIs, automate tasks, control browser interactions, and chain steps via a node-based editor.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [High-Level Architecture](#high-level-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Detailed Checklist / Milestones](#detailed-checklist--milestones)
- [Installation & Setup (MVP)](#installation--setup-mvp)
- [Usage Flow](#usage-flow)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing) *(Optional)*
- [License](#license) *(Optional)*

---

## Overview

**Overseer** is a node-based workflow automation platform. Its main goal is to allow you to:

1. **Visually create workflows** that connect multiple APIs or tasks.  
2. **Automate browser interactions** with a Chrome Extension—no need to run Chrome in remote debug mode.  
3. **Schedule** recurring workflows (e.g., cron-like).  
4. **Branch logic** (if-else, loops) and handle sub-workflows for modular design.  
5. **Grow** into container-based step execution, enabling multi-language or specialized environments.

Initially, Overseer targets **private** usage, but we leave the door open for future expansions (e.g., multi-user or SaaS model).

---

## Key Features

1. **Visual Workflow Builder**  
   - Built using [React Flow](https://reactflow.dev).  
   - Drag-and-drop nodes for API calls, code transforms, browser actions, etc.

2. **Workflow Execution Engine**  
   - Implemented in TypeScript within a Next.js backend.  
   - Executes steps sequentially or in parallel branches.  
   - Passes data between nodes, logs results.  

3. **Sub-Workflows**  
   - Ability to reference another workflow from a node, for modular, nested tasks.

4. **Browser Automation**  
   - A Chrome Extension (Manifest V3) that listens for commands via WebSockets.  
   - Can click elements, fill forms, scrape data, or wait for page events.

5. **Scheduling & Cron**  
   - Basic scheduling with `node-cron` or external triggers.  
   - Potential to integrate robust queuing (BullMQ) for retries and concurrency.

6. **Supabase (Postgres)**  
   - Stores workflow definitions, execution logs, and optional credentials.  
   - JSON-based storage for flexible schema evolution.

7. **(Future) Container-Based Execution**  
   - Option to run steps in Docker for Python, Ruby, or other environments.

---

## High-Level Architecture

Below is a simplified diagram of Overseer's monolithic approach (MVP).  
```
┌─────────────────────────────────────┐
│             Overseer UI            │ (Next.js + React + React Flow)
│    e.g., https://overseer.app/    │
└───────────────┬────────────────────┘
                │
                ▼  HTTP (REST)
┌─────────────────────────────────────┐
│     Next.js API / Workflow Engine  │
│   (in-process TypeScript modules)  │
└───────────────┬────────────────────┘
                │
                ▼
       ┌───────────────────────┐
       │  Supabase (Postgres)  │
       │  (Workflows, Logs)    │
       └───────────────────────┘
                │
                ▼ WebSocket (Socket.IO)
┌─────────────────────────────────────┐
│    Chrome Extension (Manifest V3)  │
│   - background.js / content.js     │
│   - Receives commands, automates   │
└─────────────────────────────────────┘
```

### How it works (MVP flow)

1. **User** creates or edits a workflow in the React Flow editor. The JSON config is saved to Postgres.  
2. **User** triggers a workflow manually (or via schedule) via HTTP POST to `/api/execute/[id]`.  
3. **Engine** (TypeScript) fetches workflow JSON, executes each node:  
   - **API call nodes**: perform HTTP requests.  
   - **Code nodes**: run JavaScript/TypeScript transforms.  
   - **Browser Action nodes**: send WebSocket instructions to the Chrome Extension.  
4. **Logs** stored in Postgres for each step, including errors.  
5. (Optional) A schedule runs workflows automatically at set intervals.

### Recent Architecture Updates

The project has been updated to use a more focused WebSocket architecture:

1. **Web UI to Server Communication**
   - Removed WebSocket connections from the web UI
   - All communication now happens via HTTP endpoints
   - Workflow execution triggered through `/api/execute/[id]` endpoint

2. **Server to Extension Communication**
   - WebSocket connections (Socket.IO) restricted to Chrome extension only
   - Server validates connection origins
   - Maintains real-time communication for browser automation
   - Extension receives commands and sends results via WebSocket

3. **Benefits of the Change**
   - Cleaner architecture with clear separation of concerns
   - Reduced complexity in web UI
   - WebSocket connections only used where necessary
   - Improved security with origin validation
   - More efficient resource usage

4. **Communication Flow**
   ```
   Web UI → HTTP → Server → WebSocket → Extension
                     ↑          ↓
                  Postgres   Results
   ```

---

## Tech Stack

- **Frontend / UI**:  
  - **Next.js** (TypeScript) for SSR and a dynamic web interface  
  - **React Flow** for the graph-based editor
  - **Tailwind CSS** (optional) or your preferred styling solution

- **Backend**:  
  - **Next.js API Routes** for REST endpoints  
  - **Node.js** (TypeScript) orchestrating workflow execution in-process

- **Database**:  
  - **Supabase** (Postgres) for structured & JSON-based workflow definitions  
  - Potential future use of a **redis** queue (BullMQ) if concurrency demands

- **Browser Extension**:  
  - **Chrome Extension** (Manifest V3)  
  - **WebSockets** for communication with the Next.js server

- **Scheduling**:  
  - **node-cron** or an external trigger (like GitHub Actions or Supabase Edge Functions)

---

## Project Structure

Folder layout (changes require approval):

```
overseer/
├── README.md                 # This document
├── package.json             # Project dependencies and scripts
├── next.config.js          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── .env.example            # Template for environment variables
├── .env                    # Environment variables for local dev
├── supabase/              # Supabase configuration
│   ├── migrations/        # Database migrations
│   │   └── 20240319000000_initial_schema.sql  # Initial schema
│   └── config.toml       # Supabase configuration
├── .vscode/              # VS Code settings
│   └── settings.json     # Deno settings for Supabase
├── /pages                  # Next.js Pages Router
│   ├── _app.tsx            # Global app wrapper with Toaster and Navbar
│   ├── _document.tsx       # Custom document setup
│   ├── index.tsx           # Landing page
│   ├── workflows/
│   │   ├── index.tsx       # Workflows list with CRUD operations
│   │   └── [id].tsx        # React Flow editor for a workflow
│   └── api/
│       ├── workflows/      # Workflow CRUD endpoints
│       ├── execute/        # Workflow execution endpoint
│       └── ws.ts          # WebSocket endpoint for extension
├── /components            
│   ├── /layout            # Layout components
│   │   └── navbar.tsx     # Main navigation bar
│   ├── /ui                # shadcn/ui components
│   │   ├── button.tsx     # Button component
│   │   ├── toast.tsx      # Toast notifications
│   │   ├── alert-dialog.tsx # Confirmation dialogs
│   │   ├── sheet.tsx      # Sheet component for mobile nav
│   │   └── ...           # Other components
│   └── /workflows        
│       ├── WorkflowEditor.tsx  # React Flow editor wrapper
│       ├── NodeConfigPanel.tsx # Side panel for node configuration
│       └── /nodes         # Node type components
│           ├── ApiCallNode.tsx      # API call node
│           ├── CodeTransformNode.tsx # Code transform node
│           └── BrowserActionNode.tsx # Browser action node
├── /hooks               # Custom React hooks
│   └── use-toast.ts    # Toast notifications hook
├── /lib                  
│   ├── utils.ts          # Helper functions for UI components
│   ├── supabase.ts       # Supabase client and workflow CRUD operations
│   ├── /engine           # Workflow execution engine
│   │   ├── WorkflowEngine.ts  # Main engine implementation
│   │   └── types.ts      # Engine type definitions
│   ├── /executors        # Node type executors
│   │   ├── ApiCallExecutor.ts    # API call execution
│   │   ├── CodeTransformExecutor.ts # Code transform execution
│   │   └── BrowserActionExecutor.ts # Browser action execution
│   ├── /websocket        # WebSocket handling
│   │   ├── WebSocketManager.ts   # WebSocket connection manager
│   │   └── types.ts      # WebSocket message types
│   ├── /types            # Shared TypeScript types
│   └── /types            # Shared TypeScript types
├── /styles              
│   └── globals.css       # Global styles and shadcn theme
├── /chrome-extension     # Chrome extension (Manifest V3)
│   ├── src/             # Extension source code
│   │   ├── types.ts     # Shared type definitions
│   │   ├── background.ts # Background script with WebSocket
│   │   └── contentScript.ts # Content script for DOM operations
│   ├── dist/            # Build output directory
│   ├── manifest.json    # Extension manifest
│   ├── package.json    # Extension dependencies and scripts
│   └── tsconfig.json   # Extension TypeScript configuration
└── /__tests__          # Test files
    ├── setup.ts        # Test setup and global mocks
    ├── engine.test.ts  # Engine unit tests
    ├── websocket.test.ts # WebSocket tests
    └── workflowBuilder.test.tsx # UI component tests
```

### Testing

The project uses Jest and React Testing Library for testing. The test setup includes:

```
overseer/
├── __tests__/           # Test files directory
│   ├── setup.ts         # Test setup and global mocks
│   ├── projectSetup.test.ts    # Configuration tests
│   ├── database.test.ts        # Database integration tests
│   ├── engine.test.ts         # Workflow engine tests
│   ├── api/
│   │   └── execute.test.ts    # API endpoint tests
│   └── workflowBuilder.test.tsx # UI component tests
└── jest.config.js      # Jest configuration
```

Recent Testing Improvements:
- Added comprehensive tests for the `WorkflowEditor` component including:
  - Workflow loading and saving
  - Node validation and execution
  - Error handling and toast notifications
  - Node addition and configuration
- Implemented proper mocking for:
  - React Flow components and providers
  - Node components (API Call, Code Transform, Browser Action)
  - Toast notifications
  - Supabase client operations
- Added test coverage for workflow execution validation
- Improved test reliability with proper `act()` wrapping for state updates

To run tests:
- `npm test`: Run all tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Generate test coverage report

---

## Roadmap

Below is a multi-phase approach to implementing Overseer:

1. **Phase 1: MVP**  
   - Basic Next.js + React Flow interface for creating workflows  
   - Single node types: *API call*, *code transform* (JS/TS), *browser action*  
   - Store workflow definitions (JSON) in Supabase  
   - Manual execution of workflows (simple sequential logic)  
   - Basic scheduling (optional) with `node-cron`  
   - Minimal Chrome extension for "click this, scrape that"  

2. **Phase 2: Enhanced Workflow Features**  
   - Sub-workflows  
   - Branching logic (if-else, loops)  
   - More robust error handling & logging (e.g. partial successes)  
   - UI improvements (custom node shapes, code editor integration)  

3. **Phase 3: Container-Based Execution & Scalability**  
   - Docker-based workers for multiple programming languages or specialized tasks  
   - Option to use a queue system (BullMQ) for concurrency, retries, advanced scheduling  
   - Possibly multi-user auth (Supabase or NextAuth)  

4. **Phase 4: Polishing & Advanced Capabilities**  
   - Publish Chrome extension to the store (optional if private)  
   - Real-time collaboration or advanced versioning  
   - Security hardening (encryption, secrets management)  
   - Potential pivot to SaaS, if desired  

---

## Detailed Checklist / Milestones

Below is a more granular set of tasks for you (and your AI pair) to tackle **one step at a time**.

### Phase 1 (MVP)

1. **Create Next.js Project**  
   - [x] Initialize Next.js with TypeScript  
   - [x] Set up project structure following Pages Router pattern
   - [x] Install and configure Tailwind CSS
   - [x] Install React Flow, set up a basic canvas page
   - [x] Install and configure shadcn components:
     - [x] Button, Card, Dialog, Dropdown Menu
     - [x] Form components (Input, Label)
     - [x] Sheet for side panels
     - [x] Tabs for organization
     - [x] Toast for notifications
     - [x] Table for workflow lists
   - [x] Set up comprehensive testing infrastructure:
     - [x] Jest and React Testing Library configuration
     - [x] Component testing with proper mocking
     - [x] API endpoint testing
     - [x] Workflow engine testing
     - [x] Test coverage for critical functionality
   - [x] Create base pages:
     - [x] Home page with feature cards
     - [x] Workflows list with table view
     - [x] Workflow editor with React Flow integration
   - [x] Set up dark mode support
   - [x] Configure proper TypeScript paths and aliases
   - [x] Create unit tests for the base pages

2. **Database Setup (Supabase)**  
   - [x] Create Supabase project (local)  
   - [x] Create `workflows` table (id, name, definition JSON, timestamps)  
   - [x] Create `execution_logs` table (id, workflow_id, logs JSON, status, timestamps)
   - [x] Set up environment variables for local development
   - [x] Initialize database migrations
   - [x] Create unit tests for the database setup

3. **Workflow Builder UI**  
   - [x] Implement React Flow with minimal node types:
     - [x] API Call node with URL and method inputs
     - [x] Code Transform node with code editor
     - [x] Browser Action node with action selector and CSS selector input
   - [x] Node configuration:
     - [x] Direct input editing on nodes
     - [x] Side panel for advanced configuration
     - [x] Visual feedback for selected nodes
   - [x] Node data management:
     - [x] State management for node properties
     - [x] Type-safe data handling
     - [x] Real-time node updates
   - [x] Node interactions:
     - [x] Add nodes via toolbar buttons
     - [x] Connect nodes via handles
     - [x] Configure nodes via direct input or side panel
   - [x] Save workflow to Supabase
   - [x] Load workflow from Supabase
   - [x] Create unit tests for workflow builder components

4. **Workflow Execution Engine (In-Process)**  
   - [x] Create an `engine.ts` to handle:
     - [x] Fetching a workflow JSON  
     - [x] Traversing nodes in sequence  
     - [x] Executing steps (API calls, inline JS code)  
     - [x] Logging results in `execution_logs`  
   - [x] Implement node executors:
     - [x] API Call executor with fetch support
     - [x] Code Transform executor with safe evaluation
     - [x] Browser Action executor with WebSocket communication
   - [x] Add data passing between nodes:
     - [x] Support for single and multiple inputs
     - [x] Access to previous node results
     - [x] Type-safe execution context
   - [x] Implement minimal error/retry logic
   - [x] Create comprehensive unit tests for the engine
   - [x] Create API endpoint for workflow execution

5. **Manual Execution Endpoint**  
   - [x] `/api/execute/[id].ts` that calls `engine.runWorkflow(id)`  
   - [x] Simple UI button "Run Now"
   - [x] Create unit tests for the manual execution endpoint

6. **Browser Extension (Minimal)**  
   - [x] Manifest V3 basics (`manifest.json`)  
   - [x] `background.ts` with a WebSocket client to Overseer's server  
   - [x] `contentScript.ts` for basic DOM interaction (clicking, scraping)  
   - [x] A minimal handshake command from Overseer → extension  
   - [x] TypeScript configuration and build setup:
     - [x] Configure `tsconfig.json` for ES2020 modules
     - [x] Set up build scripts in `package.json`
     - [x] Implement proper file structure with `src` directory
   - [x] Basic browser actions implemented:
     - [x] Click elements
     - [x] Input text
     - [x] Scrape content
     - [x] Wait for elements
   - [x] WebSocket endpoint in Next.js
   - [x] Integration with workflow engine
   - [x] WebSocket Manager for handling connections:
     - [x] Server-side connection management
     - [x] Client-side connection handling
     - [x] Extension-side connection handling
     - [x] Proper reconnection logic
     - [x] Message type validation
   - [x] Bi-directional communication:
     - [x] Web UI ↔ Server
     - [x] Extension ↔ Server
     - [x] Action execution confirmation
   - [x] Testing infrastructure for extension

7. **Basic Scheduling** (Optional in MVP)  
   - [ ] If included, add `scheduler.ts` using `node-cron` (or external triggers)  
   - [ ] On server startup, schedule workflows that have a cron definition

### Phase 2 (Enhanced Features)

1. **Sub-Workflows**  
   - [ ] Add a node type `sub_workflow` referencing another workflow by ID  
   - [ ] Engine logic calls `runWorkflow(subWorkflowId)` recursively

2. **Branching & Loops**  
   - [ ] Implement a `conditional` node for if/else  
   - [ ] Implement a `loop/iterate` node (or code node that maps over array)

3. **UI/UX Enhancements**  
   - [ ] More sophisticated node shapes or custom styling in React Flow  
   - [ ] Possibly integrate a code editor component (e.g., Monaco) for code nodes

4. **Improved Error Handling**  
   - [ ] Node-level retries  
   - [ ] Detailed logs for partial successes/failures

### Phase 3 (Container-based Execution & Scaling)

1. **Container-Based Runners**  
   - [ ] Spin up Docker containers to run steps in Python, etc.  
   - [ ] Connect them via an API or message queue

2. **Queue (BullMQ + Redis)**  
   - [ ] Manage concurrency, advanced retries, scheduling  
   - [ ] Potentially run multiple worker processes

3. **Auth / Multi-User**  
   - [ ] Integrate Supabase Auth or NextAuth for user management  
   - [ ] (If pivoting to SaaS) define multi-tenant logic

### Phase 4 (Polish)

1. **Chrome Extension Store Publishing**  
   - [ ] Prepare a production build with any required permissions  
   - [ ] Submit for review if opening publicly

2. **Versioning & Collaboration**  
   - [ ] Add workflow revision history (table of versions)  
   - [ ] (Optional) Real-time collaboration

3. **Security Hardening**  
   - [ ] Secure secrets storage (e.g., using environment variables or encryption)  
   - [ ] Evaluate container sandboxing if allowing user code

---

## Installation & Setup (MVP)

1. **Clone & Install**  
   ```bash
   git clone https://github.com/ronaldeddings/overseer.git
   cd overseer
   npm install
   ```

2. **Supabase Setup**
   ```bash
   # Install Supabase CLI if you haven't already
   npm install -g supabase
   
   # Start local Supabase
   supabase init
   supabase start
   
   # Run initial migrations
   supabase migration up
   ```
   This will create the required tables:
   - `workflows` - Stores workflow definitions
   - `execution_logs` - Stores workflow execution logs

3. **Environment Setup**  
   - Copy `.env.example` to `.env`
   - Fill in the required environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL` (from your Supabase instance)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from your Supabase instance)
     - `NEXT_PUBLIC_WEBSOCKET_URL` (defaults to ws://localhost:3000 for development)

4. **Run the Dev Server**  
   ```bash
   npm run dev
   ```
   - Visit http://localhost:3000
   - You should see the landing page with feature cards and workflow management

5. **Chrome Extension (Development)**  
   - Open Chrome and navigate to `chrome://extensions`
   - Enable **Developer Mode** (top right)
   - Click **Load Unpacked**
   - Select the `overseer/chrome-extension` folder
   - The extension should appear with the title "Overseer Extension"

---

## Usage Flow

1. **Create Workflow**  
   - Go to the "Workflows" page, click "New Workflow."  
   - Drag in an *API Call* node, set URL.  
   - Add a *Browser Action* node, set desired command.  
   - Connect edges in React Flow.

2. **Save & Execute**  
   - Click "Save," which persists the workflow to Supabase.  
   - Click "Run Now," which calls the `execute/[id]` endpoint.  
   - Check logs or console output.

3. **(Optional) Schedules**  
   - If you added a cron expression (like "0 8 * * *"), ensure the server scheduling script is running.  
   - Confirm it triggers as expected.

---

## Future Enhancements

- **Refined Scheduling**: Switch from `node-cron` to a robust job queue for concurrency, advanced retries, distributed workers.  
- **Versioning**: Maintain a revision history to roll back workflow changes.  
- **Container-based Execution**: For Python, Ruby, or specialized tasks.  
- **Advanced Browser Automation**: Wait for specific DOM events, capture screenshots, handle multi-step forms.  
- **UI Collaboration**: Real-time multi-user editing with presence indicators.

## Phase 1: Core Workflow Editor

### Step 3: Workflow Management

The workflow management system allows users to create, save, load, and delete workflows. Each workflow is stored in Supabase with the following structure:

```typescript
type Workflow = {
  id: string
  name: string
  definition: {
    nodes: Node[]
    edges: Edge[]
  }
  created_at: string
  updated_at: string
}
```

#### Features

- **Workflow List** (`/workflows`)
  - View all workflows in a table format
  - Display workflow name, creation date, and last updated date
  - Actions to edit or delete workflows
  - Create new workflows

- **Workflow Editor** (`/workflows/[id]`)
  - Create new workflows at `/workflows/new`
  - Edit existing workflows
  - Name workflows
  - Save workflow changes
  - Auto-load workflow data when editing existing workflows

- **Data Management**
  - Automatic saving of workflow definition (nodes and edges)
  - Optimistic UI updates
  - Error handling with toast notifications
  - Confirmation dialogs for destructive actions

#### Implementation Details

- Uses Supabase for data persistence
- Real-time UI feedback with loading states
- Proper error handling and user notifications
- Type-safe data management
- Responsive and accessible UI components using shadcn/ui

### Chrome Extension Development

The Chrome extension is set up with the following structure:

```
chrome-extension/
├── src/
│   ├── types.ts          # Shared type definitions
│   ├── background.ts     # Background script with WebSocket
│   └── contentScript.ts  # Content script for DOM operations
├── dist/                 # Build output directory
├── manifest.json         # Extension manifest
├── package.json         # Build scripts and dependencies
└── tsconfig.json        # TypeScript configuration
```

To build the extension:
```bash
cd chrome-extension
npm install
npm run build
```

The build process:
1. Cleans the `dist` directory
2. Compiles TypeScript files
3. Copies manifest and compiled files to `dist`

To load the extension in Chrome:
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension/dist` directory

### WebSocket Communication

The WebSocket system uses Socket.IO for real-time communication between the web UI, server, and Chrome extension:

1. **Server-Side (`/api/socket`)**
   - Socket.IO server endpoint with custom configuration:
     ```typescript
     io = new IOServer(res.socket.server, {
       path: '/api/socket',
       addTrailingSlash: false,
       cors: {
         origin: (requestOrigin, callback) => {
           // Allows both localhost and Chrome extension origins
           const allowedOrigins = [
             'http://localhost:3000',
             /^chrome-extension:\/\/.+$/
           ];
           const isAllowed = allowedOrigins.some(pattern => 
             typeof pattern === 'string' 
               ? pattern === requestOrigin
               : pattern.test(requestOrigin || '')
           );
           callback(null, isAllowed);
         },
         methods: ['GET', 'POST'],
         credentials: true,
         allowedHeaders: ['Content-Type', 'Accept']
       },
       transports: ['websocket', 'polling']
     });
     ```
   - Handles both web UI and extension connections
   - Manages message routing and client tracking
   - Supports reconnection and error handling

2. **Web UI Integration**
   - Uses Socket.IO client with minimal configuration:
     ```typescript
     const socket = io({
       path: '/api/socket',
       transports: ['websocket', 'polling']
     });
     ```
   - Connects to Socket.IO server on startup
   - Manages connection lifecycle through SocketManager singleton
   - Handles connection errors and reconnection
   - Provides real-time workflow execution feedback

3. **Chrome Extension**
   - Uses Socket.IO client with extension-specific configuration:
     ```typescript
     this.socket = io(this.url, {
       path: '/api/socket',
       reconnection: true,
       reconnectionAttempts: this.maxReconnectAttempts,
       reconnectionDelay: this.reconnectDelay,
       transports: ['websocket', 'polling'],
       withCredentials: true,
       autoConnect: true,
       forceNew: true
     });
     ```
   - Background script maintains Socket.IO connection
   - Handles browser action commands
   - Executes DOM operations via content script
   - Reports execution results back to server

4. **Message Types**
   ```typescript
   type SocketMessage = {
     type: 'EXECUTE_ACTION' | 'ACTION_RESPONSE' | 'TEST';
     id: string;
     action?: BrowserAction;
     workflowId?: string;
     nodeId?: string;
     result?: any;
     error?: string;
   };

   type BrowserAction = {
     type: 'click' | 'input' | 'scrape' | 'wait';
     selector: string;
     value?: string;
     timeout?: number;
   };
   ```

5. **Connection Flow with Socket.IO**
   ```
   Web UI                 Server (Socket.IO)     Extension
     |                           |                    |
     |---(socket.connect)------->|                    |
     |<---(socket.connected)-----|                    |
     |                           |<---(socket.connect)-|
     |                           |---(socket.connected)|
     |                           |                    |
     |---(socket.emit action)-->|                    |
     |                           |---(socket.emit)---->|
     |                           |<---(socket.emit)----|
     |<---(socket.emit result)--|                    |
   ```

Both the web UI and Chrome extension use a shared `SocketManager` singleton pattern for consistent connection handling and message passing. The Socket.IO implementation provides:
- Automatic reconnection handling
- Transport fallback (WebSocket → polling)
- Cross-origin support for extension communication
- Consistent message serialization
- Connection state management
