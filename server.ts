import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { scheduler } from './lib/scheduler';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url!, true);
      
      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  })
  .listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    
    // Initialize the scheduler after the server starts
    scheduler.initialize().catch(err => {
      console.error('Failed to initialize scheduler:', err);
    });
  });
}); 