// Not supported by Firefox v122. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#browser_compatibility.
// import stylesheet from "./bit.css" assert { type: "css" };
// import stylesheet from "./bit.css";

/*
 *
 * Takes a value of an elements and prints it as a code, with highlighting.
 *
 * Features:
 *  - Highlight.js, with fallback to simple text. Default is highlighting is for `html`.
 *  - Catppuccin Latte as default style.
 *  - Removes leading white-spaces.
 *  - Boolean attributes (required) without empty value, for example `<input required="" />` to `<input required />`
 *
 * @example
 * // returns <pre><code class="html"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>...</code></pre>
 * <code-block>
 *   <p style="font-size: 2rem;">Hello, World!</p>
 * </code-bloc>
 */
export class CodeBlock extends HTMLElement {
  static define(tag = "code-block") {
    customElements.define(tag, this);
  }

  constructor() {
    // Attach a shadow root to the element.
    super();

    // Works with import assert.
    // this.attachShadow({ mode: "open" }).adoptedStyleSheets = [stylesheet];
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    // const linkElem = document.createElement("link");
    // linkElem.setAttribute("rel", "stylesheet");
    // linkElem.setAttribute("href", new URL("./bit.css", import.meta.url));
    //
    // document.head.appendChild(linkElem);

    // Add HTML
    this.shadowRoot.innerHTML = `
			<!-- Until Firefox supports import asserts. Does not work in Pracel, try import assert. -->
			<!-- <link rel="stylesheet" href="./bit.css" /> -->

      <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/@catppuccin/highlightjs@0.1.4/css/catppuccin-latte.css">
			<script src="//cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>

			<style>
			  div {
			    position: relative;
			    padding: 2rem;
			  }

			  button {
			    position: absolute;
			    top: .4rem;
			    right: 0;

					padding: .2rem .4rem
			  }

			  pre {
					white-space: pre-wrap
			  }
			</style>

			<div>
				<slot></slot>
			  <pre><code class="html"></code></pre>
			  <button type="button">Copy</button>
			</div>
		`;

    this.shadowRoot
      .querySelector("slot")
      .addEventListener("slotchange", this.handleSlotChange.bind(this));

    this.shadowRoot
      .querySelector("button")
      .addEventListener("click", this.copyCode.bind(this));

    this.lang = this.getAttribute("lang") ?? "html";
    this.loadHighlightJs();
  }

  handleSlotChange(event) {
    const slotContent = this.getFormattedSlotContent(event.target);
    if (!slotContent) {
      return;
    }

    this.slotContent = slotContent;

    console.log(slotContent);
    this.addTextToCode(slotContent);
    event.target.remove();
  }

  copyCode() {
    const code = this.shadowRoot.querySelector("code").innerText;
    navigator.clipboard.writeText(code).catch((err) => {
      console.error("Error while copying text: ", err);
    });
  }

  loadHighlightJs() {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js";
    script.onload = () => this.initializeHighlight();
    document.head.appendChild(script);
  }

  initializeHighlight() {
    if (window.hljs) {
      this.highlightedCode = window.hljs.highlight(this.slotContent, {
        language: this.lang,
      });
      this.addHighlightedCode(this.highlightedCode.value);
    } else {
      console.error("Highlight.js failed to load");
    }
  }

  /** Returns slot content, removes extra whitespaces. */
  getFormattedSlotContent(slot) {
    const assignedNodes = slot.assignedNodes();

    if (assignedNodes.length < 1) {
      return undefined;
    }

    const firstLevelIndentation =
      assignedNodes[0].textContent.match(/(?<=^\n)[ \t]+/);

    // If node doesn't have `outerHTML`, it means it consists of only `\n`, `\t` or spaces.
    const nodes = assignedNodes
      .map((node) => node.outerHTML)
      .filter(Boolean)
      .map((outerHTML) => outerHTML.replaceAll(firstLevelIndentation, ""))
      .map((outerHTML) => outerHTML.replaceAll('=""', ""));
    if (nodes.length < 1) {
      return undefined;
    }

    return nodes.join("\n");
  }

  addTextToCode(text) {
    const codeEl = this.shadowRoot.querySelector("code");
    const textNode = document.createTextNode(text);
    codeEl.appendChild(textNode);
  }

  addHighlightedCode(html) {
    const codeEl = this.shadowRoot.querySelector("code");
    codeEl.innerHTML = html;
  }
}
