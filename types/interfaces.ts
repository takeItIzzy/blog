export interface SEO {
  title: string;
  description: string;
  keywords: string;
}

export type Tag = 'tutorial' | 'note' | 'experience';

export interface MD extends SEO {
  id: string;
  date: string;
  contentHtml: string;
  tag: Tag;
  referer: { name: string; href: string }[];
}
