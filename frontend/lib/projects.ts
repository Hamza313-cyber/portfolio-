export type Project = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  live_url: string | null;
  code_url: string | null;
  status: "live" | "in_progress";
  sort_order: number;
  is_published: boolean;
};

// Shown immediately and kept if the API cannot be reached.
export const FALLBACK_PROJECTS: Project[] = [
  {
    id: "sky", title: "Sky Computers & Robotics",
    description: "Website and product catalogue for a tech store, with an admin panel to add products and manage enquiries.",
    tags: ["Next.js", "Supabase", "Tailwind"], live_url: null,
    code_url: "https://github.com/Hamza313-cyber/sky-computer-and-robotics", status: "live", sort_order: 0, is_published: true,
  },
  {
    id: "bill-scanner", title: "Bill Scanner",
    description: "Snap a photo of a supplier bill and AI reads every line item: product, batch, expiry, quantity, rate and GST. Review, save and export to Excel.",
    tags: ["Python", "Gemini AI", "Supabase"], live_url: null,
    code_url: "https://github.com/Hamza313-cyber/bill-scanner", status: "live", sort_order: 1, is_published: true,
  },
  {
    id: "sana", title: "Sana Heritage Couture",
    description: "Online store website for a ladies' clothing and jewellery brand.",
    tags: ["Website", "Supabase"], live_url: null, code_url: null, status: "in_progress", sort_order: 2, is_published: true,
  },
];

// Only allow http(s) links to be rendered as hrefs.
export function safeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}
