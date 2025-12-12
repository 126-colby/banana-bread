# Banana Bread Recipe App

An interactive banana bread recipe application built with Astro and React, featuring AI-powered assistance through Google's Gemini API.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/astro-blog-starter-template)

## Features

- 🍌 Interactive recipe with checkable ingredients and steps
- 🤖 AI-powered tips and suggestions using Google Gemini
- 📷 Banana ripeness checker using image analysis
- ✨ Creative recipe variation generator
- 💾 Progress persistence (24-hour expiry)
- 📱 Responsive design with print-friendly styles

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Gemini API Key

This application requires a Google Gemini API key to power the AI features.

#### Option 1: Using wrangler.json (for development)

Update the `GEMINI_API_KEY` value in `wrangler.json`:

```json
{
  "vars": {
    "GEMINI_API_KEY": "your-api-key-here"
  }
}
```

**⚠️ SECURITY WARNING**: Never commit real API keys to version control. The placeholder value `YOUR_API_KEY_HERE` in the repository should be replaced with your actual key only in your local environment.

#### Option 2: Using Cloudflare Secrets (for production - RECOMMENDED)

Set the secret using wrangler CLI:

```bash
npx wrangler secret put GEMINI_API_KEY
```

Then enter your API key when prompted. This is the recommended approach for production deployments as it keeps your API key secure.

#### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

## 🚀 Development

All commands are run from the root of the project:

| Command                           | Action                                           |
| :-------------------------------- | :----------------------------------------------- |
| `npm install`                     | Installs dependencies                            |
| `npm run dev`                     | Starts local dev server at `localhost:4321`      |
| `npm run build`                   | Build your production site to `./dist/`          |
| `npm run preview`                 | Preview your build locally, before deploying     |
| `npm run check`                   | Run build, TypeScript check, and dry-run deploy  |
| `npm run deploy`                  | Deploy your production site to Cloudflare        |

## 🧞 Project Structure

```
/
├── src/
│   ├── pages/
│   │   ├── index.astro          # Main banana bread recipe page
│   │   └── api/
│   │       └── gemini.ts        # Server-side Gemini API endpoint
│   └── content/                 # Blog content (from original template)
├── public/                      # Static assets
└── wrangler.json               # Cloudflare Workers configuration
```

## 🔒 Security

- The Gemini API key is stored as an environment variable/secret
- API calls are made server-side to protect the API key
- The key is never exposed to the client

## 📝 License

MIT
