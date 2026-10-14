import { app, startServer } from './backend/server';

export { app, startServer };

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

if (process.env.NODE_ENV !== 'test') {
  startServer(PORT);
}
