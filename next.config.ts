import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "no-referrer" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    ];
    if (
      process.env.NODE_ENV === "production" &&
      process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")
    )
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000",
      });
    return [{ source: "/:path*", headers }];
  },
  logging: {
    // Auth action arguments can contain passwords and invitation tokens.
    serverFunctions: false,
    incomingRequests: { ignore: [/\/auth\/callback(?:\?|$)/] },
  },
};

export default nextConfig;
