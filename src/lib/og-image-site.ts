import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load fonts for the OG image
const fontRegular = readFileSync(
    join(process.cwd(), 'public/fonts/atkinson-regular.woff')
);
const fontBold = readFileSync(
    join(process.cwd(), 'public/fonts/atkinson-bold.woff')
);

export async function generateSiteOgImage(): Promise<Buffer> {
    const svg = await satori(
        {
            type: 'div',
            props: {
                style: {
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#1c1917',
                    padding: '60px',
                },
                children: [
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '24px',
                            },
                            children: [
                                // Emerald accent line
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            width: '80px',
                                            height: '4px',
                                            borderRadius: '4px',
                                            background: 'linear-gradient(to right, #10b981, #34d399)',
                                        },
                                    },
                                },
                                // Name
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontSize: '72px',
                                            fontWeight: 600,
                                            color: '#fafaf9',
                                            lineHeight: 1.1,
                                        },
                                        children: 'Pratik Temkar',
                                    },
                                },
                                // Tagline
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontSize: '28px',
                                            color: '#a8a29e',
                                            textAlign: 'center',
                                            maxWidth: '800px',
                                        },
                                        children: 'Software Engineer | Distributed Systems',
                                    },
                                },
                                // Another emerald accent line
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            width: '80px',
                                            height: '4px',
                                            borderRadius: '4px',
                                            background: 'linear-gradient(to right, #10b981, #34d399)',
                                            marginTop: '16px',
                                        },
                                    },
                                },
                            ],
                        },
                    },
                    // Website URL at bottom
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute',
                                bottom: '60px',
                                fontSize: '24px',
                                color: '#737373',
                            },
                            children: 'pratikstemkar.github.io',
                        },
                    },
                ],
            },
        },
        {
            width: 1200,
            height: 630,
            fonts: [
                {
                    name: 'Atkinson',
                    data: fontRegular,
                    weight: 400,
                    style: 'normal',
                },
                {
                    name: 'Atkinson',
                    data: fontBold,
                    weight: 600,
                    style: 'normal',
                },
            ],
        }
    );

    const resvg = new Resvg(svg, {
        fitTo: {
            mode: 'width',
            value: 1200,
        },
    });

    const pngData = resvg.render();
    return pngData.asPng();
}
