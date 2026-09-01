<img width="959" height="442" alt="image" src="https://github.com/user-attachments/assets/dbf54c5e-3f1a-4ec2-a1bd-9e1169cd1a69" /># AI Capstone Project

A streaming AI Chatbot application built with React, Vite, TypeScript, Node.js, Express, and Google Gemini.

## Live Demo

**Production:** https://ai-capstone-five.vercel.app/

---

## Overview

This project is a **streaming AI Chatbot application**.

### Technology Stack

* **Frontend:** React + Vite + TypeScript
* **Backend:** Node.js + Express + TypeScript
* **AI Model:** Google Gemini (`gemini-3.5-flash-lite`)

---

## Features

### Streaming AI Chatbot

The application provides a streaming AI chatbot experience powered by Google Gemini.

### Website Metadata Tool

The project includes a server-side AI tool named `websiteMetadata`.

The tool automatically extracts metadata from webpages when requested.

The tool accepts a webpage URL and returns structured metadata.

---

## `websiteMetadata` Tool

### Tool Name

```text
websiteMetadata
```

### Purpose

The `websiteMetadata` tool extracts metadata from a specified webpage.

### Input Schema

The tool uses Zod for input validation:

```typescript
import { z } from 'zod';

const websiteMetadataSchema = z.object({
  url: z.string().describe('The URL of the webpage to fetch metadata for.')
});
```

### Input

The tool accepts:

```text
url
```

The URL represents the webpage from which metadata should be retrieved.

### Return Object

The tool returns:

```json
{
  "title": "string",
  "description": "string",
  "image": "string | null",
  "author": "string | null",
  "keywords": "string[]"
}
```

---

## Tool Lifecycle States

The frontend renders different UI components depending on the tool execution state.

### 1. `input-streaming`

The frontend renders the `ToolLoading` card with a spinner.

### 2. `input-available`

The frontend renders the `ToolInput` card showing:

```text
Fetching metadata for https://...
```

### 3. `output-available`

The frontend renders the `MetadataCard` component.

The metadata card displays:

* Image preview
* Title
* Author
* Description
* Tags
* Clickable link

### 4. `output-error`

The frontend renders the `ToolError` card with a retry message.

---

## Architecture

The application consists of a frontend, backend, and AI model.

```text
┌──────────────────────┐
│        User          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ React + Vite +       │
│ TypeScript Frontend  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Node.js + Express +  │
│ TypeScript Backend   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   Google Gemini      │
│ gemini-3.5-flash-lite│
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ websiteMetadata Tool │
└──────────────────────┘
```

---

## Getting Started

### Install Dependencies

The project provides a command to install dependencies for both the frontend and backend:

```bash
npm run install:all
```

### Run the Application

To run both servers concurrently in development mode:

```bash
npm run dev
```

---

## Environment Variables

The current project requires environment configuration for its AI functionality.

The exact environment-variable names should be taken from the project's configuration files.

**Do not commit API keys or other secrets to the repository.**

---

## Production Deployment

The application is deployed and available at:

**https://ai-capstone-five.vercel.app/**

The production deployment should use the required environment variables through the deployment platform rather than exposing secrets in the source code.

---

## Production Considerations

Because the application uses an external AI model, production deployments should protect the AI API credentials and validate requests before sending them to the AI provider.

For the final production version, the following should be verified:

* API credentials remain server-side.
* User input is appropriately validated.
* Excessively large requests are prevented.
* AI/API errors are handled appropriately.
* Streaming requests have a sensible execution limit.
* Public API usage is protected against excessive requests.

Only safeguards that are actually implemented should be described as completed.

---

## Technical Decisions

### React + Vite + TypeScript

React is used for the frontend application, Vite provides the frontend development/build environment, and TypeScript provides type safety.

### Node.js + Express + TypeScript

Node.js and Express provide the backend application layer, with TypeScript used for type-safe development.

### Google Gemini

Google Gemini is used as the AI model powering the chatbot.

The project currently specifies:

```text
gemini-3.5-flash-lite
```

### Zod

Zod is used to define the input schema for the `websiteMetadata` tool.

---

## AI Tool Workflow

The `websiteMetadata` tool follows this lifecycle:

```text
User / AI Request
       ↓
input-streaming
       ↓
input-available
       ↓
Website Metadata Processing
       ↓
output-available
       ↓
MetadataCard
```

If processing fails:

```text
Website Metadata Processing
       ↓
output-error
       ↓
ToolError
       ↓
Retry
```

---

## How AI Tools Were Used

AI-assisted development was used during the development of this project.

AI tools were used to assist with development activities such as:

* Exploring implementation approaches
* Understanding technical concepts
* Generating and refining code
* Debugging
* Improving implementation
* Working with AI tool integration

AI-generated suggestions were reviewed and adapted during development. The final implementation was integrated and tested as part of the development process.

---
## Future Improvements

Potential future improvements include:

* Stronger production rate limiting
* Additional AI tools
* Improved automated testing
* Additional error-handling scenarios
* More advanced conversation functionality

---


Software Engineering Student

