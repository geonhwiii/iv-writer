import { IVWriterSettings } from './settings';

export const DEFAULT_SETTINGS: IVWriterSettings = {
  focus: {
    enabled: true,
    mode: 'sentence',
    anchor: 0.45,
    fadeDistance: 6,
    minimumOpacity: 0.25,
    fadePower: 2.0,
    transitionDuration: 180,
  },
  typography: {
    fontFamily: '"iA Writer Duo", "iA Writer Mono", "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: 19,
    lineHeight: 1.75,
    letterSpacing: -0.01,
    paragraphSpacing: 1.6,
    maxWidth: 680,
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
    enabled: false,
    style: 'none',
    opacity: 0.04,
  },
  editor: {
    autoSaveDebounce: 500,
    hideHeaderHUD: true,
    enableZenModeOnOpen: false,
  },
};

export const THEME_PRESETS = ['paper', 'dark', 'sepia', 'midnight'] as const;
