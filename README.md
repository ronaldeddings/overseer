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

Below is a simplified diagram of Overseer’s monolithic approach (MVP).  
```
┌─────────────────────────────────────┐
│             Overseer UI            │ (Next.js + React + React Flow)
│    e.g., https://overseer.app/     │
└───────────────┬────────────────────┘
                │
                ▼  HTTP (REST) / WebSockets
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
                ▼ WebSocket
┌─────────────────────────────────────┐
│    Chrome Extension (Manifest V3)  │
│   - background.js / content.js     │
│   - Receives commands, automates   │
└─────────────────────────────────────┘
```

### How it works (MVP flow)

1. **User** creates or edits a workflow in the React Flow editor. The JSON config is saved to Postgres.  
2. **User** triggers a workflow manually (or via schedule).  
3. **Engine** (TypeScript) fetches workflow JSON, executes each node.  
   - **API call nodes**: perform HTTP requests.  
   - **Code nodes**: run JavaScript/TypeScript transforms.  
   - **Browser Action nodes**: send WebSocket instructions to the Chrome Extension.  
4. **Logs** stored in Postgres for each step, including errors.  
5. (Optional) A schedule runs workflows automatically at set intervals.

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

A recommended folder layout (subject to change as you evolve):

```
overseer/
├── README.md                 # This document
├── package.json
├── next.config.js
├── .env                      # Environment variables for local dev
├── /pages
│   ├── index.tsx             # Landing page or dashboard
│   ├── workflows
│   │   └── [id].tsx          # React Flow editor for a given workflow
│   └── api
│       ├── workflows
│       │   ├── index.ts      # GET (list), POST (create)
│       │   └── [id].ts       # GET (read), PUT (update), DELETE
│       └── execute
│           └── [id].ts       # POST to trigger workflow execution
├── /components               # React components (includes React Flow wrappers)
├── /lib                      # Utility modules (DB helpers, workflow engine, etc.)
│   ├── db.ts                 # Supabase client or DB connectors
│   ├── engine.ts             # Execution logic
│   ├── scheduler.ts          # Cron scheduling scripts (if any)
├── /chrome-extension         # Manifest V3 extension
│   ├── manifest.json
│   ├── background.ts
│   ├── contentScript.ts
│   └── ...
└── ...
```

---

## Roadmap

Below is a multi-phase approach to implementing Overseer:

1. **Phase 1: MVP**  
   - Basic Next.js + React Flow interface for creating workflows  
   - Single node types: *API call*, *code transform* (JS/TS), *browser action*  
   - Store workflow definitions (JSON) in Supabase  
   - Manual execution of workflows (simple sequential logic)  
   - Basic scheduling (optional) with `node-cron`  
   - Minimal Chrome extension for “click this, scrape that”  

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
   - [ ] Initialize Next.js with TypeScript  
   - [ ] Install React Flow, set up a basic canvas page  

2. **Database Setup (Supabase)**  
   - [ ] Create Supabase project (cloud or local)  
   - [ ] Create `workflows` table (id, name, definition JSON, timestamps)  
   - [ ] Create `execution_logs` table (id, workflow_id, logs JSON, status, timestamps)

3. **Workflow Builder UI**  
   - [ ] Implement React Flow with minimal node types (API call, code transform, browser action)  
   - [ ] Node config side panel (fields: URL, headers, code snippet, etc.)  
   - [ ] Save entire graph to Supabase via API route

4. **Workflow Execution Engine (In-Process)**  
   - [ ] Create an `engine.ts` to handle:
     - Fetching a workflow JSON  
     - Traversing nodes in sequence  
     - Executing steps (API calls, inline JS code)  
     - Logging results in `execution_logs`  
   - [ ] Implement minimal error/retry logic (like a simple try-catch)

5. **Manual Execution Endpoint**  
   - [ ] `/api/execute/[id].ts` that calls `engine.runWorkflow(id)`  
   - [ ] Simple UI button “Run Now”

6. **Browser Extension (Minimal)**  
   - [ ] Manifest V3 basics (`manifest.json`)  
   - [ ] `background.ts` with a WebSocket client to Overseer’s server  
   - [ ] `contentScript.ts` for basic DOM interaction (clicking, scraping)  
   - [ ] A minimal handshake command from Overseer → extension

7. **Basic Scheduling** (Optional in MVP)  
   - [ ] If included, add `scheduler.ts` using `node-cron` (or external triggers)  
   - [ ] On server startup, schedule workflows that have a cron definition

---

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

---

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

---

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

2. **Supabase / Postgres Setup**  
   - Create a Supabase project (cloud) or run locally with `supabase init` & `supabase start`.  
   - Set environment variables in `.env` (Supabase URL, Anon key, etc.).  

3. **Run the Dev Server**  
   ```bash
   npm run dev
   ```
   - By default, it should start on http://localhost:3000

4. **Chrome Extension**  
   - Go to `chrome://extensions`  
   - Enable **Developer Mode**  
   - Click **Load Unpacked**, select the `overseer/chrome-extension` folder  
   - Confirm it shows up as “Overseer Extension (MV3)”

5. **Test**  
   - Open the UI at http://localhost:3000  
   - Create a simple workflow, run it, check logs in Supabase’s “execution_logs” table or in the UI console.

---

## Usage Flow

1. **Create Workflow**  
   - Go to the “Workflows” page, click “New Workflow.”  
   - Drag in an *API Call* node, set URL.  
   - Add a *Browser Action* node, set desired command.  
   - Connect edges in React Flow.

2. **Save & Execute**  
   - Click “Save,” which persists the workflow to Supabase.  
   - Click “Run Now,” which calls the `execute/[id]` endpoint.  
   - Check logs or console output.

3. **(Optional) Schedules**  
   - If you added a cron expression (like “0 8 * * *”), ensure the server scheduling script is running.  
   - Confirm it triggers as expected.

---

## Future Enhancements

- **Refined Scheduling**: Switch from `node-cron` to a robust job queue for concurrency, advanced retries, distributed workers.  
- **Versioning**: Maintain a revision history to roll back workflow changes.  
- **Container-based Execution**: For Python, Ruby, or specialized tasks.  
- **Advanced Browser Automation**: Wait for specific DOM events, capture screenshots, handle multi-step forms.  
- **UI Collaboration**: Real-time multi-user editing with presence indicators.
