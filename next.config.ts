import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  allowedDevOrigins: ["127.0.0.1"],
  logging: {
    // Auth action arguments can contain passwords and invitation tokens.
    serverFunctions: false,
    incomingRequests: { ignore: [/\/auth\/callback(?:\?|$)/] },
  },
};

export default nextConfig;
