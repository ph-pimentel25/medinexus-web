import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Vercel file traces relative to the repository containing this app.
  outputFileTracingRoot: path.resolve(__dirname, ".."),
  poweredByHeader: false,
  async headers() {
    const production=process.env.NODE_ENV==="production";
    const supabaseOrigins:string[]=[];
    try {
      const url=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL||"");
      if(["https:","http:"].includes(url.protocol)) {
        supabaseOrigins.push(url.origin,`${url.protocol==="https:"?"wss":"ws"}://${url.host}`);
      }
    } catch { /* CI supplies a placeholder; absent config grants no extra origin. */ }
    const csp=[
      "default-src 'self'",
      // Next static hydration and the existing print windows use inline code.
      // Per-request nonces would require changing the current rendering strategy.
      `script-src 'self' 'unsafe-inline'${production?"":" 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self' ${supabaseOrigins.join(" ")} https://viacep.com.br https://nominatim.openstreetmap.org${production?"":" ws://localhost:* ws://127.0.0.1:*"}`,
      "object-src 'none'", "base-uri 'self'", "form-action 'self'",
      "frame-ancestors 'none'", "frame-src 'self' blob:", "worker-src 'self' blob:",
    ].join("; ");
    return [{source:"/:path*",headers:[
      {key:"X-Content-Type-Options",value:"nosniff"},
      {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
      // Location and camera/photo capture remain available to this application.
      {key:"Permissions-Policy",value:"geolocation=(self), camera=(self), microphone=(), payment=(), usb=()"},
      {key:"X-Frame-Options",value:"DENY"},
      {key:"Content-Security-Policy",value:csp},
      ...(process.env.VERCEL==="1"?[{key:"Strict-Transport-Security",value:"max-age=31536000"}]:[]),
    ]}];
  },
};

export default nextConfig;
