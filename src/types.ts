export type Role = "user" | "assistant" | "system";

export interface ImageAttachment {
  id: string;
  /** base64 data URL, e.g. "data:image/png;base64,..." */
  dataUrl: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  images?: ImageAttachment[];
  createdAt: number;
  /** true while tokens are still arriving from the model */
  streaming?: boolean;
  /** set if the request failed */
  error?: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export type ThemeMode = "light" | "dark" | "system";

export interface AccentColor {
  name: string;
  /** hue 0-360 and saturation 0-100; lightness is fixed per light/dark theme in CSS */
  h: number;
  s: number;
}

export interface ConnectionSettings {
  apiKey: string;
  model: string;
}

export interface AppSettings {
  connection: ConnectionSettings;
  theme: ThemeMode;
  accent: AccentColor;
}
