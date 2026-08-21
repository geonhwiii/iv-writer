import { IVWriterSettings, ThemePreset, FocusMode } from './settings';

export interface DocumentStats {
  words: number;
  chars: number;
  charsNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeMin: number;
  readingTimeFormatted: string;
}

export type HostToWebviewMessage =
  | {
      type: 'INIT';
      payload: {
        documentUri: string;
        content: string;
        settings: IVWriterSettings;
        isReadonly: boolean;
      };
    }
  | {
      type: 'DOC_CHANGED';
      payload: {
        content: string;
        version: number;
      };
    }
  | {
      type: 'CONFIG_CHANGED';
      payload: {
        settings: IVWriterSettings;
      };
    }
  | {
      type: 'EXEC_COMMAND';
      payload: {
        command: 'toggleFocus' | 'cycleFocus' | 'cycleTheme' | 'toggleZen';
        theme?: ThemePreset;
        focusMode?: FocusMode;
      };
    };

export type WebviewToHostMessage =
  | {
      type: 'READY';
    }
  | {
      type: 'TEXT_EDIT';
      payload: {
        content: string;
      };
    }
  | {
      type: 'CURSOR_ACTIVITY';
      payload: {
        line: number;
        column: number;
        selectionLength: number;
      };
    }
  | {
      type: 'STATS_UPDATE';
      payload: DocumentStats;
    }
  | {
      type: 'LOG';
      payload: {
        level: 'info' | 'warn' | 'error';
        message: string;
      };
    }
  | {
      type: 'OPEN_LINK';
      payload: {
        target: string;
      };
    }
  | {
      type: 'SHOW_MENU';
    };
