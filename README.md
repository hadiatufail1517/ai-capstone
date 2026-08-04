# AI Capstone Project

This project is a streaming AI Chatbot application.
- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **AI Model**: Google Gemini (`gemini-3.5-flash-lite`)

## Getting Started

To install dependencies for both the frontend and backend:
```bash
npm run install:all
```

To run both servers concurrently in development mode:
```bash
npm run dev
```

---

## Server-Side AI Tool: `websiteMetadata`

We have integrated a server-side AI tool named `websiteMetadata` that automatically extracts metadata from webpages upon request.

### Tool Name
`websiteMetadata`

### Input Schema (Zod)
```typescript
import { z } from 'zod';

const websiteMetadataSchema = z.object({
  url: z.string().describe('The URL of the webpage to fetch metadata for.')
});
```

### Return Object Structure
```json
{
  "title": "string",
  "description": "string",
  "image": "string | null",
  "author": "string | null",
  "keywords": "string[]"
}
```

### Tool Lifecycle States & Frontend Rendering
1. **input-streaming**: Renders the `ToolLoading` card with a spinner.
2. **input-available**: Renders the `ToolInput` card showing `"Fetching metadata for https://..."`.
3. **output-available**: Renders the beautiful `MetadataCard` component with the image preview, title, author, description, tags, and clickable link.
4. **output-error**: Renders the `ToolError` card with a retry message.
