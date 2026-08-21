export type FocusMode = 'sentence' | 'paragraph' | 'line';
export type CursorStyle = 'bar' | 'block' | 'underline';
export type CursorAnimation = 'fade' | 'pulse' | 'blink' | 'solid';
export type FocusLineStyle = 'background' | 'left-border' | 'underline' | 'none';
export type ThemePreset = 'paper' | 'dark' | 'sepia' | 'midnight';

export interface CustomThemeColors {
  background?: string;
  foreground?: string;
  fadedForeground?: string;
  cursor?: string;
  focusLine?: string;
}

export interface FocusSettings {
  enabled: boolean;
  mode: FocusMode;
  anchor: number;           // 0.2 ~ 0.8 (default 0.45)
  fadeDistance: number;     // default 6
  minimumOpacity: number;   // default 0.12
  fadePower: number;        // default 2.0
  transitionDuration?: number; // ms, default 200
}

export interface TypographySettings {
  fontFamily: string;
  fontSize: number;         // px, default 19
  lineHeight: number;       // default 1.85
  letterSpacing?: number;   // em, default -0.01
  paragraphSpacing?: number;// em, default 1.6
  maxWidth: number;         // px, default 720
}

export interface ThemeSettings {
  preset: ThemePreset;
  custom?: CustomThemeColors;
}

export interface CursorSettings {
  style: CursorStyle;
  width: number;            // px, default 2
  animation: CursorAnimation;
  speed?: 'slow' | 'normal' | 'fast' | 'off';
}

export interface FocusLineSettings {
  enabled: boolean;
  style: FocusLineStyle;
  opacity?: number;
}

export interface EditorSettings {
  autoSaveDebounce: number; // ms, default 500
  hideHeaderHUD?: boolean;
  enableZenModeOnOpen?: boolean;
}

export interface IVWriterSettings {
  focus: FocusSettings;
  typography: TypographySettings;
  theme: ThemeSettings;
  cursor: CursorSettings;
  focusLine: FocusLineSettings;
  editor: EditorSettings;
}
