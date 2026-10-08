import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = "https://tabishkhan313.vercel.app";
  return [{ url, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
