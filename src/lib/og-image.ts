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

export async function generateOgImage(title: string, date: string): Promise<Buffer> {
    const svg = await satori(
        {
            type: 'div',
            props: {
                style: {
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
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
                                gap: '20px',
                            },
                            children: [
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontSize: '24px',
                                            color: '#a8a29e',
                                        },
                                        children: 'pratikstemkar.github.io',
                                    },
                                },
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontSize: '56px',
                                            fontWeight: 600,
                                            color: '#fafaf9',
                                            lineHeight: 1.2,
                                            maxWidth: '90%',
                                        },
                                        children: title,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            },
                            children: [
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontSize: '24px',
                                            color: '#a8a29e',
                                        },
                                        children: date,
                                    },
                                },
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontSize: '24px',
                                            color: '#a8a29e',
                                        },
                                        children: 'Pratik Temkar',
                                    },
                                },
                            ],
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
