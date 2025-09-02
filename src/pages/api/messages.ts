import type { APIRoute } from 'astro';

type Env = {
  MESSAGES_DB?: D1Database;
  ADMIN_USER?: string;
  ADMIN_PASS?: string;
};

function sanitize(input: string) {
  return input.replace(/\u0000/g, '').trim();
}

export const POST: APIRoute = async ({ request, url, locals }) => {
  try {
    const form = await request.formData();
    const name = sanitize(String(form.get('name') || ''));
    const email = sanitize(String(form.get('email') || ''));
    const message = sanitize(String(form.get('message') || ''));
    const honeypot = String(form.get('website') || '');

    if (honeypot) {
      return new Response('OK', { status: 200 });
    }

    if (!message || message.length < 2) {
      return new Response('Message is required.', { status: 400 });
    }

    const env = (locals as any).runtime?.env as Env | undefined;
    const db = env?.MESSAGES_DB;

    if (!db) {
      console.error('D1 binding MESSAGES_DB not configured.');
      return new Response('Storage not configured', { status: 500 });
    }

    await db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        name TEXT,
        email TEXT,
        message TEXT NOT NULL,
        ip TEXT
      );
    `);

    const ip = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-forwarded-for')
      || request.headers.get('x-real-ip')
      || '';

    const stmt = await db.prepare(
      'INSERT INTO messages (name, email, message, ip) VALUES (?1, ?2, ?3, ?4)'
    ).bind(name || null, email || null, message, ip);
    await stmt.run();

    const redirectTo = new URL(url);
    redirectTo.pathname = '/';
    redirectTo.searchParams.set('sent', '1');
    return Response.redirect(redirectTo.toString(), 303);
  } catch (err) {
    console.error('Failed to save message', err);
    return new Response('Internal error', { status: 500 });
  }
};

