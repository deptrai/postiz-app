import { NextRequest } from 'next/server';
import { createReadStream, statSync } from 'fs';
// @ts-ignore
import mime from 'mime';
import path from 'path';
async function* nodeStreamToIterator(stream: any) {
  for await (const chunk of stream) {
    yield chunk;
  }
}
function iteratorToStream(iterator: any) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(new Uint8Array(value));
      }
    },
  });
}
export const GET = (
  request: NextRequest,
  context: {
    params: {
      path: string[];
    };
  }
) => {
  const baseDir = process.env.UPLOAD_DIRECTORY;
  if (!baseDir) {
    return new Response('Upload directory is not configured', { status: 404 });
  }

  const safeParts = (context.params.path || []).filter(
    (p) => p && p !== '.' && p !== '..' && !p.includes('..')
  );

  if (!safeParts.length) {
    return new Response('Not found', { status: 404 });
  }

  const resolvedBaseDir = path.isAbsolute(baseDir)
    ? baseDir
    : path.resolve(process.cwd(), baseDir);

  const filePath = path.join(resolvedBaseDir, ...safeParts);

  try {
    const fileStats = statSync(filePath);
    const response = createReadStream(filePath);
    const contentType = mime.getType(filePath) || 'application/octet-stream';
    const iterator = nodeStreamToIterator(response);
    const webStream = iteratorToStream(iterator);
    return new Response(webStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStats.size.toString(),
        'Last-Modified': fileStats.mtime.toUTCString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new Response('Not found', { status: 404 });
  }
};
