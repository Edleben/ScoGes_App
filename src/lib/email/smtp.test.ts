import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const { transport, sendMail } = vi.hoisted(() => ({
  transport: vi.fn(),
  sendMail: vi.fn(),
}));
vi.mock("nodemailer", () => ({ default: { createTransport: transport } }));
import { createEmailProvider } from "./smtp";
describe("SMTP adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transport.mockReturnValue({ sendMail });
  });
  afterEach(() => vi.unstubAllEnvs());
  it("is unavailable with incomplete credentials", () => {
    vi.stubEnv("SMTP_HOST", "");
    expect(createEmailProvider()).toBeNull();
  });
  it("requires TLS, bounds timeouts, and only claims delivery when SMTP accepts", async () => {
    for (const [name, value] of Object.entries({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_USER: "test",
      SMTP_PASSWORD: "test-only",
      SMTP_FROM: "sender@example.com",
    }))
      vi.stubEnv(name, value);
    sendMail.mockResolvedValue({ accepted: ["a@example.com"], rejected: [] });
    await createEmailProvider()!.sendInvitation({
      email: "a@example.com",
      url: "https://app.example/invitations/accept#token=test",
      locale: "en",
    });
    expect(transport.mock.calls[0][0]).toMatchObject({
      requireTLS: true,
      secure: false,
      connectionTimeout: 10000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    sendMail.mockResolvedValue({ accepted: [], rejected: ["a@example.com"] });
    await expect(
      createEmailProvider()!.sendInvitation({
        email: "a@example.com",
        url: "https://app.example",
        locale: "fr",
      }),
    ).rejects.toThrow("Invitation delivery failed");
  });
  it("supports a named sender without allowing multiple addresses or header injection", async () => {
    for (const [name, value] of Object.entries({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "465",
      SMTP_USER: "test",
      SMTP_PASSWORD: "test-only",
      SMTP_FROM: "EDXSTORE <sender@example.com>",
    }))
      vi.stubEnv(name, value);
    sendMail.mockResolvedValue({ accepted: ["a@example.com"], rejected: [] });
    await createEmailProvider()!.sendInvitation({
      email: "a@example.com",
      url: "https://app.example",
      locale: "fr",
    });
    expect(sendMail.mock.calls[0][0].from).toEqual({
      name: "EDXSTORE",
      address: "sender@example.com",
    });
    expect(transport.mock.calls[0][0].secure).toBe(true);
    vi.stubEnv(
      "SMTP_FROM",
      "EDXSTORE <sender@example.com>\r\nBcc: other@example.com",
    );
    expect(createEmailProvider()).toBeNull();
    vi.stubEnv("SMTP_FROM", "a@example.com,b@example.com");
    expect(createEmailProvider()).toBeNull();
  });
});
