const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "BR"]);

export function plainTextToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function editorPlainText(element: HTMLElement): string {
  function read(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (node instanceof HTMLBRElement) return "\n";
    return Array.from(node.childNodes).map(read).join("");
  }
  return read(element);
}

/** Keeps only the inline formatting the fake X renderer supports. */
export function sanitizeRichText(html: string): string {
  if (typeof document === "undefined") return html;
  const template = document.createElement("template");
  template.innerHTML = html;

  function clean(parent: ParentNode) {
    for (const node of Array.from(parent.childNodes)) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const element = node as HTMLElement;
      clean(element);
      if (!ALLOWED_TAGS.has(element.tagName)) {
        element.replaceWith(...Array.from(element.childNodes));
        continue;
      }
      for (const attribute of Array.from(element.attributes)) element.removeAttribute(attribute.name);
      if (element.tagName === "B") {
        const strong = document.createElement("strong");
        strong.append(...Array.from(element.childNodes));
        element.replaceWith(strong);
      } else if (element.tagName === "I") {
        const emphasis = document.createElement("em");
        emphasis.append(...Array.from(element.childNodes));
        element.replaceWith(emphasis);
      }
    }
  }

  clean(template.content);
  return template.innerHTML;
}
