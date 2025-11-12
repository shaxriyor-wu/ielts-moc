# Quick Start Guide

Get the IELTS CD Mock Platform up and running in minutes!

## Prerequisites

- Node.js 18+ and npm
- A modern web browser

## Installation Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Initialize Mock Service Worker (MSW)**
   ```bash
   npx msw init public/ --save
   ```
   
   This creates the service worker file needed for API mocking.

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## First Login

Use these demo credentials:

- **Student:** `student@demo.com` / `password123`
- **Admin:** `admin@demo.com` / `admin123`

## What's Next?

- Take a mock test from the dashboard
- Explore the admin panel (login as admin)
- Check out the results page after completing a test
- Read the full [README.md](./README.md) for detailed documentation

## Troubleshooting

### MSW not working?
Make sure you ran `npx msw init public/ --save` after installing dependencies.

### Port already in use?
Change the port in `vite.config.js` or use:
```bash
npm run dev -- --port 3001
```

### Build errors?
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development Tips

- The app runs in **mock mode** by default (no backend needed)
- All API calls are intercepted by MSW
- Check browser console for MSW logs
- Use React DevTools for component debugging

Happy coding! 🚀

