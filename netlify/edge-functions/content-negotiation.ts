import type { Context, Config } from "@netlify/edge-functions";

/**
 * Content negotiation edge function that serves Markdown versions of pages
 * when the Accept header prefers text/plain or text/markdown over text/html
 */
export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const pathname = url.pathname;
  
  // Skip if this is already a request for source content
  if (pathname.endsWith('index.md')) {
    return await context.next();
  }

  // Skip static assets and API endpoints
  const skipPaths = ['/_', '/api/', '/public/', '/images/', '/assets/'];
  if (
    skipPaths.some(prefix => pathname.startsWith(prefix)) ||
    pathname.includes('.') && !pathname.endsWith('/')
  ) {
    return await context.next();
  }

  const acceptHeader = req.headers.get('accept') || '';
  
  // Parse Accept header to check for preference
  const acceptTypes = acceptHeader
    .split(',')
    .map(type => {
      const [mediaType, ...params] = type.trim().split(';');
      const qValue = params
        .find(p => p.trim().startsWith('q='))
        ?.split('=')[1] || '1.0';
      return {
        type: mediaType.trim(),
        quality: parseFloat(qValue)
      };
    })
    .sort((a, b) => b.quality - a.quality);

  // Check if text/plain or text/markdown is preferred over text/html
  const plainTextTypes = ['text/plain', 'text/markdown'];
  const htmlTypes = ['text/html', 'application/xhtml+xml'];
  
  const bestPlainText = acceptTypes.find(t => plainTextTypes.includes(t.type));
  const bestHtml = acceptTypes.find(t => htmlTypes.includes(t.type));
  
  const prefersPlainText = bestPlainText && 
    (!bestHtml || bestPlainText.quality > bestHtml.quality);

  if (prefersPlainText) {
    console.log('prefersPlainText true');
    // Convert URL path to source content path
    // Remove trailing slash and convert to .md path
    const cleanPath = pathname.replace(/\/$/, '') || '/index';
    const sourcePath = `/${cleanPath}/index.md`;
    console.log('sourcePath', sourcePath);
    try {
      // Create a new request for the markdown version
      //const sourceUrl = new URL(sourcePath, url.origin);
      // url.origin seems to confuse it. 
      const sourceUrl = 'https://www.raymondcamden.com' + sourcePath;
      const sourceRequest = new Request(sourceUrl, {
        method: req.method,
        headers: req.headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : null,
      });
      
      // Try to fetch the markdown version
      const sourceResponse = await fetch(sourceRequest);
      
      if (sourceResponse.ok) {
        // Create a new response with proper headers
        const response = new Response(sourceResponse.body, {
          status: sourceResponse.status,
          statusText: sourceResponse.statusText,
          headers: sourceResponse.headers,
        });
        
        // Ensure correct Content-Type for markdown
        response.headers.set('Content-Type', 'text/plain; charset=utf-8');
        response.headers.set('Vary', 'Accept');
        
        return response;
      }
    } catch (error) {
      // If fetching markdown fails, fall through to serve original
      console.log(`Failed to fetch markdown for ${pathname}:`, error);
    }
  }

  // Continue with normal processing, but add Vary header
  const response = await context.next();
  
  // Add Vary header to ensure proper caching
  response.headers.set('Vary', 'Accept');
  
  return response;
};

export const config: Config = {
  path: "/*",
  cache: "manual"
};
