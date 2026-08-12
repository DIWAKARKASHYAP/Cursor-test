# Tideway

A Next.js operations dashboard ready to deploy on Vercel.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

```bash
npm run build
npm start
```

## Deploy on Vercel

```bash
npx vercel --prod
```

Or connect this GitHub repository in the [Vercel dashboard](https://vercel.com/new) and deploy from the branch.

## Instagram login

Users can connect an Instagram professional account from the dashboard and open Instagram directly from the portal.

1. Create a Meta app and enable **Instagram API with Instagram Login**
2. Add this OAuth redirect URI in the Meta dashboard:
   `https://<your-domain>/api/auth/instagram/callback`
3. Set these environment variables in Vercel (see `.env.example`):
   - `INSTAGRAM_CLIENT_ID`
   - `INSTAGRAM_CLIENT_SECRET`
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_APP_URL`

Instagram login requires a **Business or Creator** account. Personal Instagram accounts are not supported by Meta's current API.
