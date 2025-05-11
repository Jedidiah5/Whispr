# Whispr

This is a Next.js application for Whispr, a personal voice-powered journaling app.

## Features

- **Voice Recording & Live Transcription**: Record your thoughts using your microphone, with live transcription displayed on screen.
- **Save & Manage Entries**: Save your transcribed journal entries locally. View, edit, and delete past entries.
- **AI-Powered Summaries & Titles**: Automatically generate titles and summaries for your journal entries.
- **Themeable UI**: Light and dark mode support for comfortable viewing.

## Getting Started

The application is built with Next.js, TypeScript, Tailwind CSS, and ShadCN UI components. Speech recognition uses the browser's Web Speech API. Journal entries are stored in `localStorage`.

To get started:

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Run the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002` (or the port specified in your setup).

3. (Optional) Run Genkit AI flows locally:
    ```bash
    npm run genkit:dev
    ```

## Project Structure

- `src/app`: Main application pages and layout (using Next.js App Router).
- `src/components`: Reusable React components, including UI elements from ShadCN.
- `src/hooks`: Custom React hooks for functionalities like speech recognition and local storage.
- `src/lib`: Utility functions and type definitions.
- `src/ai`: Genkit AI flow definitions for features like title generation and summarization.

Take a look at `src/app/page.tsx` for the main application logic.

