import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfjs-dist', 'pdf2json', 'pdf-parse'],
};

export default nextConfig;
