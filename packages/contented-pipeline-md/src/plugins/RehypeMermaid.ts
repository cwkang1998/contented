import { Element } from 'hast';
import { Transformer } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * Transform mermaid codeblock into div.mermaid
 */
export function rehypeMermaid(): Transformer {
  return (tree) => {
    visit(tree, 'element', visitLanguageMermaid);
  };
}

function visitLanguageMermaid(node: Element) {
  if (node.tagName !== 'pre') {
    return;
  }

  const child = (node.children as Element[])[0];
  if (child?.tagName !== 'code') {
    return;
  }

  const className = child?.properties?.className as string[] | undefined;
  if (!className?.includes('language-mermaid')) {
    return;
  }

  /* eslint-disable  no-param-reassign */
  node.properties = {
    ...node.properties,
    className: ['mermaid'],
  };
  node.tagName = 'div';
  node.children = child.children;
  /* eslint-enable  no-param-reassign */
}
