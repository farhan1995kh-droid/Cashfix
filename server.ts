import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Temporary fallback route so it never shows "Not Found"
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cashfix POS Live</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding-top: 50px; background: #f4f4f9; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            h1 { color: #2563eb; }
            p { font-size: 18px; }
            .status { display: inline-block; padding: 10px 20px; background: #22c55e; color: white; border-radius: 5px; font-weight: bold; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Cashfix POS System</h1>
            <p>Apnar server successful bhabe Render-e live hoye geche!</p>
            <div class="status">Server is Running Live 🚀</div>
        </div>
    </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cashfix POS Server listening on http://0.0.0.0:${PORT}`);
});
