import cors from 'cors';
import express from 'express';
import { HttpError } from './http-error.js';
import { router as apiRouter } from './routes/api.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', apiRouter);

  app.use((_req, _res, next) => {
    next(new HttpError(404, 'Route not found.', 'not_found'));
  });

  // eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
  app.use((error, _req, res, _next) => {
    const status = error instanceof HttpError ? error.status : 500;
    if (status >= 500) {
      console.error(error);
    }
    res.status(status).json({
      error: {
        code: error.code ?? 'internal_error',
        message: status >= 500 && !(error instanceof HttpError)
          ? 'Unexpected server error.'
          : error.message
      }
    });
  });

  return app;
}
