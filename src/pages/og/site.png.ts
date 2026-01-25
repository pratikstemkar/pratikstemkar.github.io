import type { APIRoute } from 'astro';
import { generateSiteOgImage } from '@lib/og-image-site';

export const GET: APIRoute = async () => {
    const png = await generateSiteOgImage();

    return new Response(new Uint8Array(png), {
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
};
