# AR

Point a camera at a wall and place tiles on it in real time.

## What it does

1. Asks for camera access and opens the back camera when the device has one.
2. Watches the live picture for a large plain surface in the middle of the frame.
3. When that surface stays in view, offers tile materials.
4. Places the chosen tiles on the wall. They stay stuck to that surface as the outline moves.

If this browser has no camera, choose **Preview a sample wall** on the start screen. The same placement tools run on a built-in wall image.

The earlier operations dashboard is still available at `/dashboard`.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Camera access needs localhost or https.

```bash
npm test
npm run build
```

## Deploy on Vercel

```bash
npx vercel --prod
```

Or connect this GitHub repository in the [Vercel dashboard](https://vercel.com/new) and deploy from the branch.
