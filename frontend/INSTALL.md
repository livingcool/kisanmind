# KisanMind Frontend - Installation Guide

## Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

Or if you prefer yarn or pnpm:
```bash
yarn install
# or
pnpm install
```

### Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local and set:
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Verification Checklist

After installation, verify these work:

1. **Home Page** (`/`)
   - [ ] Page loads without errors
   - [ ] Language selector works
   - [ ] "Get Your Farming Plan" button navigates to input page

2. **Input Page** (`/input`)
   - [ ] Form displays all fields
   - [ ] Location picker button works
   - [ ] Voice input button shows (if browser supports it)
   - [ ] Can select multiple previous crops
   - [ ] Submit button redirects to results

3. **Results Page** (`/results/demo-session`)
   - [ ] Loading progress displays
   - [ ] Complete farming report shows after loading
   - [ ] Map displays mandis correctly
   - [ ] All sections are visible and formatted

4. **About Page** (`/about`)
   - [ ] Content displays correctly
   - [ ] All factor cards show

5. **Multi-Language**
   - [ ] Can switch between EN, HI, MR, TA, TE
   - [ ] UI updates immediately
   - [ ] Selection persists on page reload

## Troubleshooting

### Issue: "Cannot find module" errors

**Solution**: Make sure you're in the frontend directory and dependencies are installed:
```bash
cd frontend
npm install
```

### Issue: Map not displaying

**Solution**: Leaflet requires client-side rendering. Check browser console for errors. The component should automatically handle SSR.

### Issue: Voice input not working

**Solution**: Voice input requires HTTPS or localhost. Not all browsers support it. Check `isSpeechRecognitionSupported()` in utils.

### Issue: Translations not loading

**Solution**: Ensure translation files exist in `public/locales/{lang}/translation.json` and i18next is properly initialized.

### Issue: API errors on submit

**Solution**: The app has a built-in fallback to mock data. If you see this message, it means the backend orchestrator isn't running yet. The demo still works!

## Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm start
```

The build output will be in `.next/` directory.

## Docker (Optional)

```dockerfile
# Example Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## Integration with Backend

When the orchestrator backend is ready:

1. Update `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

2. Ensure these endpoints exist:
   - `POST /api/farming-plan` - Submit farmer input
   - `GET /api/farming-plan/:sessionId` - Get plan status
   - `GET /api/mandis` - Get nearby mandis
   - `GET /api/farming-plan/:sessionId/pdf` - Download PDF

3. The frontend will automatically use the real backend instead of mock data.

## Next Steps

- Customize the agricultural theme colors in `tailwind.config.js`
- Add more translation languages in `public/locales/`
- Integrate with actual backend API when ready
- Deploy to Vercel/Netlify for production

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Node.js version (18+ required)
3. Clear browser cache and localStorage
4. Try in incognito mode

For questions: support@kisanmind.in
