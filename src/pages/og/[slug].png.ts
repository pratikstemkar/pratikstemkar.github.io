import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generateOgImage } from '@lib/og-image';

export const getStaticPaths: GetStaticPaths = async () => {
    const posts = await getCollection('blog');
    return posts
        .filter(post => !post.data.draft)
        .map(post => ({
            params: { slug: post.slug },
            props: { post },
        }));
};

export const GET: APIRoute = async ({ props }) => {
    const { post } = props;

    const dateStr = post.data.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const png = await generateOgImage(post.data.title, dateStr);

    return new Response(new Uint8Array(png), {
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
};
