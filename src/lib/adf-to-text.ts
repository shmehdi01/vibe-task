interface ADFNode {
  type?: string;
  text?: string;
  content?: ADFNode[];
}

export function adfToText(node: ADFNode): string {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (node.content) {
    return node.content
      .map(adfToText)
      .join(node.type === 'paragraph' ? '\n' : '');
  }
  return '';
}
