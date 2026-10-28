export interface EmailProvider {
  sendInvitation(input: { email: string; url: string; locale: "fr" | "en" }): Promise<void>;
}
