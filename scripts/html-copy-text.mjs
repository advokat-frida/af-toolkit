import { parse } from "parse5";

// Text for offline copy checks, never HTML sanitization or rendered output.
// Parse HTML so browser-valid closing tags cannot hide the following copy.
export function htmlCopyText(html) {
  const text = [];
  const pending = [parse(html)];
  while (pending.length) {
    const node = pending.pop();
    if (["script", "style", "template"].includes(node.nodeName)) continue;
    if (node.nodeName === "#text") text.push(node.value);
    const children = node.childNodes || [];
    for (let i = children.length - 1; i >= 0; i--) pending.push(children[i]);
  }
  return text.join(" ").replace(/\s+/g, " ").trim();
}
