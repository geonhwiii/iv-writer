/**
 * Lightweight & Fast Markdown-to-HTML Renderer for iV Writer Preview Mode
 */
export class MarkdownPreviewRenderer {
  public static render(markdown: string): string {
    if (!markdown) {
      return '<p class="iv-preview-empty">작성된 내용이 없습니다.</p>';
    }

    const lines = markdown.split('\n');
    const html: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeContent: string[] = [];
    let inList = false;
    let listType: 'ul' | 'ol' = 'ul';

    const closeListIfOpen = () => {
      if (inList) {
        html.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];

      // Code Block Toggle
      if (rawLine.trim().startsWith('```')) {
        closeListIfOpen();
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = rawLine.trim().slice(3).trim();
          codeContent = [];
        } else {
          inCodeBlock = false;
          const escaped = this.escapeHtml(codeContent.join('\n'));
          const langClass = codeLanguage ? ` class="language-${codeLanguage}"` : '';
          html.push(`<pre><code${langClass}>${escaped}</code></pre>`);
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(rawLine);
        continue;
      }

      const line = rawLine.trim();

      // Empty line
      if (!line) {
        closeListIfOpen();
        continue;
      }

      // Horizontal Rule
      if (/^(---|\*\*\*|___)$/.test(line)) {
        closeListIfOpen();
        html.push('<hr />');
        continue;
      }

      // Headings
      if (line.startsWith('# ')) {
        closeListIfOpen();
        html.push(`<h1>${this.renderInline(line.slice(2))}</h1>`);
        continue;
      }
      if (line.startsWith('## ')) {
        closeListIfOpen();
        html.push(`<h2>${this.renderInline(line.slice(3))}</h2>`);
        continue;
      }
      if (line.startsWith('### ')) {
        closeListIfOpen();
        html.push(`<h3>${this.renderInline(line.slice(4))}</h3>`);
        continue;
      }
      if (line.startsWith('#### ')) {
        closeListIfOpen();
        html.push(`<h4>${this.renderInline(line.slice(5))}</h4>`);
        continue;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        closeListIfOpen();
        html.push(`<blockquote><p>${this.renderInline(line.slice(2))}</p></blockquote>`);
        continue;
      }

      // Task Lists
      if (/^-\s+\[([ xX])\]\s+/.test(line)) {
        if (!inList || listType !== 'ul') {
          closeListIfOpen();
          html.push('<ul class="iv-task-list">');
          inList = true;
          listType = 'ul';
        }
        const isChecked = line.charAt(3).toLowerCase() === 'x';
        const taskText = line.replace(/^-\s+\[([ xX])\]\s+/, '');
        const checkAttr = isChecked ? ' checked disabled' : ' disabled';
        html.push(`<li class="iv-task-item"><input type="checkbox"${checkAttr} /> ${this.renderInline(taskText)}</li>`);
        continue;
      }

      // Unordered Lists
      if (/^[-*+]\s+/.test(line)) {
        if (!inList || listType !== 'ul') {
          closeListIfOpen();
          html.push('<ul>');
          inList = true;
          listType = 'ul';
        }
        const itemText = line.replace(/^[-*+]\s+/, '');
        html.push(`<li>${this.renderInline(itemText)}</li>`);
        continue;
      }

      // Ordered Lists
      if (/^\d+\.\s+/.test(line)) {
        if (!inList || listType !== 'ol') {
          closeListIfOpen();
          html.push('<ol>');
          inList = true;
          listType = 'ol';
        }
        const itemText = line.replace(/^\d+\.\s+/, '');
        html.push(`<li>${this.renderInline(itemText)}</li>`);
        continue;
      }

      // Paragraph
      closeListIfOpen();
      html.push(`<p>${this.renderInline(rawLine)}</p>`);
    }

    closeListIfOpen();
    if (inCodeBlock) {
      const escaped = this.escapeHtml(codeContent.join('\n'));
      html.push(`<pre><code>${escaped}</code></pre>`);
    }

    return html.join('\n');
  }

  private static renderInline(text: string): string {
    let result = this.escapeHtml(text);

    // Inline Code
    result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold + Italic
    result = result.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    result = result.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');

    // Bold
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic
    result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    result = result.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Strikethrough
    result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Links: [text](url)
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    return result;
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
