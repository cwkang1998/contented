import { readFile } from 'node:fs/promises';
import { join, ParsedPath } from 'node:path';

import { parse } from '@babel/parser';
import { File } from '@babel/types';
import { MarkdownPipeline } from '@birthdayresearch/contented-pipeline-md';
import stripIndent from 'strip-indent';
import { VFile } from 'vfile';

export class JestMarkdownPipeline extends MarkdownPipeline {
  protected override computePath(sections: string[], parsedPath: ParsedPath): string {
    const path = super.computePath(sections, parsedPath);
    return path.replaceAll(/-(unit|i9n|e2e|integration|test|tests|spec)$/g, '');
  }

  protected override async readVFile(rootPath: string, file: string): Promise<VFile | undefined> {
    const path = join(rootPath, file);
    const contents = await readFile(path, { encoding: 'utf-8' });
    const ast = await this.parseAST(contents);
    const lines = contents.split('\n');

    const comments = this.collectComments(ast) ?? [];
    const value = this.mergeCodeblock(lines, comments).join('\n\n');

    return new VFile({
      path,
      value,
    });
  }

  protected collectComments(ast: File): IndexedComment[] | undefined {
    return ast.comments
      ?.map((comment) => ({
        content: this.normalizeText(comment.value),
        index: comment.loc?.start.line,
      }))
      .filter((value) => value.index !== undefined) as IndexedComment[];
  }

  /**
   * Remove first `*\n` that is part of /**
   * Remove each  ` * ` that is part of  *
   */
  protected normalizeText(text: string) {
    const cleaned = text.replaceAll(/^ *\* *\n/g, '');
    const content = cleaned
      .split('\n')
      .map((value) => value.replaceAll(/^ *\* */g, ''))
      .join('\n');
    return stripIndent(content);
  }

  protected mergeCodeblock(lines: string[], comments: IndexedComment[]): string[] {
    const collected: string[] = [];
    const starts: number[] = [];

    for (const comment of comments) {
      if (comment.content === '@contented codeblock:start') {
        starts.push(comment.index);
      } else if (comment.content === '@contented codeblock:end') {
        if (starts.length > 0) {
          const codeblock = lines.slice(starts.pop(), comment.index - 1).join('\n');
          collected.push(`\`\`\`ts\n${stripIndent(codeblock)}\n\`\`\``);
        }
      } else {
        collected.push(comment.content);
      }
    }

    return collected;
  }

  protected parseAST(contents: string) {
    return parse(contents, { sourceType: 'unambiguous', errorRecovery: true, plugins: ['typescript'] });
  }
}

interface IndexedComment {
  content: string;
  index: number;
}
