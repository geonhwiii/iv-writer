import * as vscode from 'vscode';
import { IVWriterSettings } from '../shared/settings';

export interface PresetDefinition {
  name: string;
  description: string;
  settings: Partial<{
    'focus.enabled': boolean;
    'focus.mode': 'paragraph' | 'line';
    'focus.anchor': number;
    'focus.fadeDistance': number;
    'focus.minimumOpacity': number;
    'theme.preset': 'paper' | 'dark' | 'sepia' | 'midnight';
    'typography.maxWidth': number;
    'typography.fontSize': number;
    'typography.lineHeight': number;
    'cursor.style': 'bar' | 'block' | 'underline';
    'cursor.animation': 'fade' | 'pulse' | 'blink' | 'solid';
    'focusLine.style': 'background' | 'left-border' | 'underline' | 'none';
  }>;
}

export const WRITING_PRESETS: PresetDefinition[] = [
  {
    name: '🌟 iA-like (Classic Focus)',
    description: 'Paper theme, Paragraph focus, 720px column, Fade cursor',
    settings: {
      'theme.preset': 'paper',
      'focus.enabled': true,
      'focus.mode': 'paragraph',
      'focus.anchor': 0.45,
      'focus.fadeDistance': 6,
      'focus.minimumOpacity': 0.12,
      'typography.maxWidth': 720,
      'typography.fontSize': 19,
      'typography.lineHeight': 1.85,
      'cursor.style': 'bar',
      'cursor.animation': 'fade',
      'focusLine.style': 'background',
    },
  },
  {
    name: '🌙 Dark Writer (Night Immersion)',
    description: 'Dark theme, Line focus, 640px column, Pulse blue cursor',
    settings: {
      'theme.preset': 'dark',
      'focus.enabled': true,
      'focus.mode': 'line',
      'focus.anchor': 0.45,
      'focus.fadeDistance': 5,
      'focus.minimumOpacity': 0.08,
      'typography.maxWidth': 640,
      'typography.fontSize': 19,
      'typography.lineHeight': 1.85,
      'cursor.style': 'bar',
      'cursor.animation': 'pulse',
      'focusLine.style': 'left-border',
    },
  },
  {
    name: '📜 Sepia Manuscript (Vintage Book)',
    description: 'Warm sepia theme, Paragraph focus, 800px column',
    settings: {
      'theme.preset': 'sepia',
      'focus.enabled': true,
      'focus.mode': 'paragraph',
      'focus.anchor': 0.45,
      'focus.fadeDistance': 6,
      'focus.minimumOpacity': 0.15,
      'typography.maxWidth': 800,
      'typography.fontSize': 20,
      'typography.lineHeight': 1.9,
      'cursor.style': 'bar',
      'cursor.animation': 'fade',
      'focusLine.style': 'background',
    },
  },
  {
    name: '⌨️ Minimal Typewriter (Pure Mechanical)',
    description: '50% center fixed anchor, Line focus, Block cursor, Solid blink',
    settings: {
      'theme.preset': 'paper',
      'focus.enabled': true,
      'focus.mode': 'line',
      'focus.anchor': 0.5,
      'focus.fadeDistance': 4,
      'focus.minimumOpacity': 0.1,
      'typography.maxWidth': 680,
      'typography.fontSize': 18,
      'typography.lineHeight': 2.0,
      'cursor.style': 'block',
      'cursor.animation': 'solid',
      'focusLine.style': 'underline',
    },
  },
  {
    name: '🌌 Midnight Flow (Deep Focus)',
    description: 'Deep navy midnight theme, Paragraph focus, 720px column',
    settings: {
      'theme.preset': 'midnight',
      'focus.enabled': true,
      'focus.mode': 'paragraph',
      'focus.anchor': 0.45,
      'focus.fadeDistance': 7,
      'focus.minimumOpacity': 0.12,
      'typography.maxWidth': 720,
      'typography.fontSize': 19,
      'typography.lineHeight': 1.85,
      'cursor.style': 'bar',
      'cursor.animation': 'fade',
      'focusLine.style': 'background',
    },
  },
];

export class PresetManager {
  public static async selectAndApplyPreset(): Promise<void> {
    const items = WRITING_PRESETS.map((preset) => ({
      label: preset.name,
      description: preset.description,
      preset,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a Writing Preset to apply...',
    });

    if (!selected) {
      return;
    }

    const config = vscode.workspace.getConfiguration('ivWriter');
    for (const [key, val] of Object.entries(selected.preset.settings)) {
      await config.update(key, val, vscode.ConfigurationTarget.Global);
    }

    vscode.window.showInformationMessage(`iV Writer: Applied preset "${selected.preset.name}"`);
  }
}
