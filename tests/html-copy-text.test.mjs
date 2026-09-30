import assert from "node:assert/strict";
import test from "node:test";
import { htmlCopyText } from "../scripts/html-copy-text.mjs";

test("browser-valid script end tags cannot hide the following copy", () => {
  for (const end of ["</script >", "</script\t>", "</script data-test>", "</SCRIPT/>"]) {
    const html = `<script>const internalOnly=1;${end}<p>safe to send</p><script></script>`;
    assert.equal(htmlCopyText(html), "safe to send", end);
  }
});

test("copy checks omit raw text, comments and template contents", () => {
  assert.equal(htmlCopyText('<style>.hidden { display:none }</style><!-- internal --><template>draft</template><p>Review <b>the file</b>.</p><script>"safe to send"</script>'), "Review the file .");
});

test("entities decode once and whitespace is normalized", () => {
  assert.equal(htmlCopyText("<p>safe&nbsp;to&#32;send</p>"), "safe to send");
  assert.equal(htmlCopyText("<p>&lt;script&gt;example&lt;/script&gt; &amp;lt;</p>"), "<script>example</script> &lt;");
});

test("unclosed raw-text elements do not leak their contents into copy checks", () => {
  assert.equal(htmlCopyText("<p>Visible</p><script>const value = '<p>internal</p>';"), "Visible");
});
