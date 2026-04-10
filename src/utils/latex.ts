import katex from 'katex';

export function renderLatex(formula: string): string {
  try {
    return katex.renderToString(formula, {
      throwOnError: false,
      displayMode: false,
    });
  } catch {
    return `<span style="color:red">${formula}</span>`;
  }
}
