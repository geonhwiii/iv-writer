import { IVWriterSettings } from './settings';

export const DEFAULT_SETTINGS: IVWriterSettings = {
  focus: {
    enabled: true,
    mode: 'paragraph',
    anchor: 0.45,
    fadeDistance: 6,
    minimumOpacity: 0.12,
    fadePower: 2.0,
    transitionDuration: 200,
  },
  typography: {
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif",
    fontSize: 19,
    lineHeight: 1.85,
    letterSpacing: -0.01,
    paragraphSpacing: 1.6,
    maxWidth: 720,
  },
  theme: {
    preset: 'paper',
  },
  cursor: {
    style: 'bar',
    width: 2,
    animation: 'fade',
    speed: 'normal',
  },
  focusLine: {
    enabled: true,
    style: 'background',
    opacity: 0.04,
  },
  editor: {
    autoSaveDebounce: 500,
    hideHeaderHUD: true,
    enableZenModeOnOpen: false,
  },
};

export const THEME_PRESETS = ['paper', 'dark', 'sepia', 'midnight'] as const;
