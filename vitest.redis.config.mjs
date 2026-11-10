const config = {
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/integration/redis.integration.ts"],
    testTimeout: 20000,
    fileParallelism: false,
  },
};

export default config;
