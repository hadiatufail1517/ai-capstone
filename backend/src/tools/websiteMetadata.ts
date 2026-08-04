import { z } from 'zod';
import * as cheerio from 'cheerio';

// Define the websiteMetadata tool
export const websiteMetadata = {
  name: 'websiteMetadata',
  description: 'Fetches a webpage and extracts metadata: title, description, Open Graph image (if available), author (if available), and keywords (if available).',
  schema: z.object({
    url: z.string().describe('The URL of the webpage to fetch metadata for.')
  }),
  geminiDeclaration: {
    name: 'websiteMetadata',
    description: 'Fetches a webpage and extracts metadata: title, description, Open Graph image (if available), author (if available), and keywords (if available).',
    parameters: {
      type: 'OBJECT',
      properties: {
        url: {
          type: 'STRING',
          description: 'The URL of the webpage to fetch metadata for.'
        }
      },
      required: ['url']
    }
  },
  async execute(args: { url: string }) {
    let url = args.url.trim();
    // Ensure URL starts with http:// or https://
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch webpage: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract title
      const title = $('title').text().trim() || 
                    $('meta[property="og:title"]').attr('content')?.trim() || 
                    $('meta[name="twitter:title"]').attr('content')?.trim() || 
                    '';

      // Extract description
      const description = $('meta[name="description"]').attr('content')?.trim() || 
                          $('meta[property="og:description"]').attr('content')?.trim() || 
                          $('meta[name="twitter:description"]').attr('content')?.trim() || 
                          '';

      // Extract image
      const image = $('meta[property="og:image"]').attr('content')?.trim() || 
                    $('meta[name="twitter:image"]').attr('content')?.trim() || 
                    null;

      // Extract author
      const author = $('meta[name="author"]').attr('content')?.trim() || 
                     $('meta[property="article:author"]').attr('content')?.trim() || 
                     null;

      // Extract keywords
      const keywordsString = $('meta[name="keywords"]').attr('content') || '';
      const keywords = keywordsString
        ? keywordsString.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0)
        : [];

      return {
        title,
        description,
        image,
        author,
        keywords
      };
    } catch (error: any) {
      throw new Error(`Failed to extract metadata: ${error.message}`);
    }
  }
};
