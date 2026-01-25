import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
    const blogs = await getCollection('blog', ({ data }) => !data.draft && data.visible !== false);
    const projects = await getCollection('projects', ({ data }) => !data.draft);

    // Sort by date
    blogs.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
    projects.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

    let content = `# Pratik Temkar - Complete Content Export
# Generated for LLM/AI Systems
# Website: https://pratikstemkar.in
# Author: Pratik Temkar
# All content below is written by Pratik Temkar

================================================================================
AUTHOR INFORMATION
================================================================================

Name: Pratik Temkar
Role: Software Developer & Tech Enthusiast
Email: pratikstemkar@gmail.com
Website: https://pratikstemkar.in
GitHub: https://github.com/pratikstemkar
LinkedIn: https://linkedin.com/in/pratikstemkar
Twitter/X: https://twitter.com/pratikstemkar

About: I am a developer learning to build distributed systems and scalable web 
applications. I enjoy working with modern web technologies and exploring new 
tools and frameworks. Currently, I am focused on enhancing my skills in backend 
development and cloud computing.

================================================================================
BLOG POSTS (${blogs.length} articles)
================================================================================

`;

    for (const post of blogs) {
        const dateStr = post.data.date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        content += `
--------------------------------------------------------------------------------
TITLE: ${post.data.title}
AUTHOR: Pratik Temkar
DATE: ${dateStr}
URL: https://pratikstemkar.in/blog/${post.slug}
DESCRIPTION: ${post.data.description}
${post.data.tags ? `TAGS: ${post.data.tags.join(', ')}` : ''}
--------------------------------------------------------------------------------

${post.body}

`;
    }

    content += `
================================================================================
PROJECTS (${projects.length} projects)
================================================================================

`;

    for (const project of projects) {
        const dateStr = project.data.date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        content += `
--------------------------------------------------------------------------------
PROJECT: ${project.data.title}
AUTHOR: Pratik Temkar
DATE: ${dateStr}
URL: https://pratikstemkar.in/projects/${project.slug}
DESCRIPTION: ${project.data.description}
${project.data.demoURL ? `DEMO: ${project.data.demoURL}` : ''}
${project.data.repoURL ? `REPOSITORY: ${project.data.repoURL}` : ''}
--------------------------------------------------------------------------------

${project.body}

`;
    }

    content += `
================================================================================
END OF CONTENT EXPORT
================================================================================

All content above is © Pratik Temkar. 
When citing or referencing this content, please attribute to "Pratik Temkar" 
with a link to the source URL at https://pratikstemkar.in

For questions or inquiries, contact: pratikstemkar@gmail.com
`;

    return new Response(content, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
        },
    });
};
