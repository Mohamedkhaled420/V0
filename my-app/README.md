# My.AI Chatbot

A minimalist AI chatbot powered by Google Gemini 1.5 Flash.

## Setup

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

\`\`\`env
GEMINI_API_KEY=your_gemini_api_key_here
\`\`\`

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your `.env.local` file

### Installation

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

### Development

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Deployment

#### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the `GEMINI_API_KEY` environment variable in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `GEMINI_API_KEY` with your API key value
   - Deploy

#### Other Platforms

Make sure to set the `GEMINI_API_KEY` environment variable in your deployment platform.

### Health Check

Visit `/api/health` to check if the application is properly configured.

## Security Notes

- Never commit `.env.local` or `.env` files to version control
- Use different API keys for development and production
- Regularly rotate your API keys
- Monitor API usage and set up billing alerts

## Features

- Real-time AI conversations
- Voice input support
- Message persistence
- Conversation management
- Minimalist 3D design
- Mobile responsive
