import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as compression from 'compression';

/**
 * Compression middleware for API responses
 * Reduces bandwidth and improves response times
 */
@Injectable()
export class CompressionMiddleware implements NestMiddleware {
  private compressionHandler = compression({
    // Compression level (0-9, where 9 is max compression but slowest)
    level: 6, // Balanced between speed and compression ratio

    // Minimum response size to compress (bytes)
    threshold: 1024, // Only compress responses >= 1KB

    // Filter function to determine what to compress
    filter: (req: Request, res: Response) => {
      // Don't compress responses with 'x-no-compression' header
      if (req.headers['x-no-compression']) {
        return false;
      }

      // Don't compress server-sent events
      if (res.getHeader('Content-Type')?.toString().includes('text/event-stream')) {
        return false;
      }

      // Don't compress already compressed content
      const contentEncoding = res.getHeader('Content-Encoding');
      if (contentEncoding && contentEncoding !== 'identity') {
        return false;
      }

      // Use compression's default filter for everything else
      return compression.filter(req, res);
    },

    // Memory level (1-9, where 9 uses more memory but is faster)
    memLevel: 8,

    // Strategy: optimize for text-based content
    strategy: require('zlib').constants.Z_DEFAULT_STRATEGY,
  });

  use(req: Request, res: Response, next: NextFunction) {
    this.compressionHandler(req, res, next);
  }
}

/**
 * Brotli compression middleware (better compression than gzip)
 * Use this for static assets in production
 */
@Injectable()
export class BrotliCompressionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const acceptEncoding = req.headers['accept-encoding'] || '';

    // Check if client supports Brotli
    if (acceptEncoding.includes('br')) {
      const originalSend = res.send;

      res.send = function (data: any): Response {
        // Only compress text-based responses
        const contentType = res.getHeader('Content-Type')?.toString() || '';
        const shouldCompress =
          (contentType.includes('application/json') ||
           contentType.includes('text/') ||
           contentType.includes('application/javascript')) &&
          Buffer.byteLength(data) > 1024; // Only compress if > 1KB

        if (shouldCompress) {
          const zlib = require('zlib');
          const compressed = zlib.brotliCompressSync(data, {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 4, // Fast compression
              [zlib.constants.BROTLI_PARAM_SIZE_HINT]: Buffer.byteLength(data),
            },
          });

          res.setHeader('Content-Encoding', 'br');
          res.setHeader('Content-Length', compressed.length);
          return originalSend.call(this, compressed);
        }

        return originalSend.call(this, data);
      };
    }

    next();
  }
}
