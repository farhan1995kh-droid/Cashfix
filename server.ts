import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory store for orders and SSE clients for real-time synchronization
let ordersStore: any[] = [];
let sseClients: express.Response[] = [];

// SSE endpoint for real-time POS tablet order notifications
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((client) => client !== res);
  });
});

function broadcastEvent(type: string, data: any) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      // client disconnected
    }
  });
}

// REST endpoints for orders
app.get('/api/orders', (req, res) => {
  res.json({ orders: ordersStore });
});

app.post('/api/orders', (req, res) => {
  const newOrder = req.body;
  if (!newOrder.id) {
    newOrder.id = `ORD-${Date.now().toString().slice(-6)}`;
  }
  ordersStore.unshift(newOrder);

  // Broadcast to all connected cashier tablets
  broadcastEvent('NEW_QR_ORDER', newOrder);

  res.status(201).json({ success: true, order: newOrder });
});

// Bulk background sync endpoint for offline IndexedDB orders and inventory
app.post('/api/sync', (req, res) => {
  const { orders, inventoryUpdates } = req.body;
  let addedCount = 0;

  if (Array.isArray(orders)) {
    for (const ord of orders) {
      const existingIdx = ordersStore.findIndex((o) => o.id === ord.id);
      if (existingIdx > -1) {
        ordersStore[existingIdx] = {
          ...ordersStore[existingIdx],
          ...ord,
          syncStatus: 'synced',
          syncedAt: new Date().toISOString(),
        };
      } else {
        ordersStore.unshift({
          ...ord,
          syncStatus: 'synced',
          syncedAt: new Date().toISOString(),
        });
        addedCount++;
      }
    }
  }

  res.json({
    success: true,
    syncedOrdersCount: Array.isArray(orders) ? orders.length : 0,
    newOrdersRecorded: addedCount,
    inventoryUpdatesRecorded: Array.isArray(inventoryUpdates) ? inventoryUpdates.length : 0,
    serverTimestamp: new Date().toISOString(),
  });
});

// Wi-Fi Printer discovery endpoint (port 9100)
app.get('/api/printers/scan', (req, res) => {
  res.json({
    success: true,
    printers: [
      {
        ip: '192.168.1.185',
        port: 9100,
        name: 'Epson TM-T88VI (Kitchen/Counter)',
        model: 'TM-T88VI-021 Thermal',
        mac: '00:26:AB:44:19:B1',
        status: 'online',
        isDefault: true,
        latencyMs: 14,
      },
      {
        ip: '192.168.1.142',
        port: 9100,
        name: 'Xprinter XP-Q800 (80mm Wi-Fi)',
        model: 'XP-Q800 Thermal Receipt',
        mac: '18:D6:C7:99:8A:2F',
        status: 'online',
        isDefault: false,
        latencyMs: 22,
      },
      {
        ip: '192.168.1.110',
        port: 9100,
        name: 'Sunmi Cloud 80mm Kitchen Display',
        model: 'Sunmi NT311 Cloud',
        mac: '44:6D:E2:03:77:EC',
        status: 'online',
        isDefault: false,
        latencyMs: 18,
      },
      {
        ip: '192.168.1.95',
        port: 9100,
        name: 'Bixolon SRP-350III (Bar POS)',
        model: 'SRP-350III Ethernet/WLAN',
        mac: '00:15:99:A2:4B:01',
        status: 'online',
        isDefault: false,
        latencyMs: 31,
      },
    ],
  });
});

// Printer Raw Byte Send / Cash Drawer Kick gateway
app.post(['/api/printers/send', '/api/printers/print'], (req, res) => {
  const { ip, printerIp, port, printerPort, command, bytes, memoType, orderId } = req.body;
  const targetIp = ip || printerIp || '192.168.1.185';
  const targetPort = port || printerPort || 9100;
  // Simulates socket transmission of ESC/POS bytes [27, 112, 0, 25, 250] (1B 70 00 19 FA)
  res.json({
    success: true,
    transmittedTo: `${targetIp}:${targetPort}`,
    command: command || 'PRINT_MEMO',
    orderId,
    memoType,
    bytesCount: bytes ? bytes.length : 128,
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CashFix POS Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
