import * as vscode from 'vscode';
import { IVWriterSettings, FocusMode, CursorStyle, CursorAnimation, FocusLineStyle, ThemePreset } from '../shared/settings';
import { DEFAULT_SETTINGS } from '../shared/constants';

export class ConfigManager {
  public static getSettings(): IVWriterSettings {
    const config = vscode.workspace.getConfiguration('ivWriter');

    return {
      focus: {
        enabled: config.get<boolean>('focus.enabled', DEFAULT_SETTINGS.focus.enabled),
        mode: config.get<FocusMode>('focus.mode', DEFAULT_SETTINGS.focus.mode),
        anchor: config.get<number>('focus.anchor', DEFAULT_SETTINGS.focus.anchor),
        fadeDistance: config.get<number>('focus.fadeDistance', DEFAULT_SETTINGS.focus.fadeDistance),
        minimumOpacity: config.get<number>('focus.minimumOpacity', DEFAULT_SETTINGS.focus.minimumOpacity),
        fadePower: config.get<number>('focus.fadePower', DEFAULT_SETTINGS.focus.fadePower),
        transitionDuration: DEFAULT_SETTINGS.focus.transitionDuration,
      },
      typography: {
        fontFamily: config.get<string>('typography.fontFamily', DEFAULT_SETTINGS.typography.fontFamily),
        fontSize: config.get<number>('typography.fontSize', DEFAULT_SETTINGS.typography.fontSize),
        lineHeight: config.get<number>('typography.lineHeight', DEFAULT_SETTINGS.typography.lineHeight),
        letterSpacing: DEFAULT_SETTINGS.typography.letterSpacing,
        paragraphSpacing: DEFAULT_SETTINGS.typography.paragraphSpacing,
        maxWidth: config.get<number>('typography.maxWidth', DEFAULT_SETTINGS.typography.maxWidth),
      },
      theme: {
        preset: config.get<ThemePreset>('theme.preset', DEFAULT_SETTINGS.theme.preset),
      },
      cursor: {
        style: config.get<CursorStyle>('cursor.style', DEFAULT_SETTINGS.cursor.style),
        width: config.get<number>('cursor.width', DEFAULT_SETTINGS.cursor.width),
        animation: config.get<CursorAnimation>('cursor.animation', DEFAULT_SETTINGS.cursor.animation),
        speed: DEFAULT_SETTINGS.cursor.speed,
      },
      focusLine: {
        enabled: config.get<boolean>('focusLine.enabled', DEFAULT_SETTINGS.focusLine.enabled),
        style: config.get<FocusLineStyle>('focusLine.style', DEFAULT_SETTINGS.focusLine.style),
        opacity: DEFAULT_SETTINGS.focusLine.opacity,
      },
      editor: {
        autoSaveDebounce: config.get<number>('editor.autoSaveDebounce', DEFAULT_SETTINGS.editor.autoSaveDebounce),
        hideHeaderHUD: DEFAULT_SETTINGS.editor.hideHeaderHUD,
        enableZenModeOnOpen: DEFAULT_SETTINGS.editor.enableZenModeOnOpen,
      },
    };
  }

  public static async updateSetting<T>(section: string, value: T): Promise<void> {
    const config = vscode.workspace.getConfiguration('ivWriter');
    await config.update(section, value, vscode.ConfigurationTarget.Global);
  }
}
