import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

export function readingTime(html: string) {
  const textOnly = html.replace(/<[^>]+>/g, "");
  const wordCount = textOnly.split(/\s+/).length;
  const readingTimeMinutes = ((wordCount / 200) + 1).toFixed();
  return `${readingTimeMinutes} min read`;
}

export function dateRange(startDate: Date, endDate?: Date | string): string {
  const startMonth = startDate.toLocaleString("default", { month: "short" });
  const startYear = startDate.getFullYear().toString();
  let endMonth;
  let endYear;

  if (endDate) {
    if (typeof endDate === "string") {
      endMonth = "";
      endYear = endDate;
    } else {
      endMonth = endDate.toLocaleString("default", { month: "short" });
      endYear = endDate.getFullYear().toString();
    }
  }

  return `${startMonth}${startYear} - ${endMonth}${endYear}`;
}

/**
 * Extracts the cover image URL from markdown content.
 * Looks for an image with alt text "Cover Image" in the format: ![Cover Image](/path/to/image.png)
 * @param markdown - The raw markdown content
 * @returns The image URL if found, undefined otherwise
 */
export function getCoverImage(markdown: string): string | undefined {
  // Match markdown image syntax with "Cover Image" as alt text
  // Supports both exact match and case-insensitive match
  const coverImageRegex = /!\[Cover Image\]\(([^)]+)\)/i;
  const match = markdown.match(coverImageRegex);

  if (match && match[1]) {
    return match[1];
  }

  return undefined;
}