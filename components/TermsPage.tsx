function formatTermsHtml(html: string): string {
  return html
    .replace(
      "<p><strong>RentRadar.co</strong></p>",
      '<p class="terms-brand">RentRadar.co</p>'
    )
    .replace(
      "<p>Terms and Conditions</p>",
      '<h1 class="terms-h1">Terms and Conditions</h1>'
    )
    .replace(
      "<p>Last Updated: 30 April 2026</p>",
      '<p class="terms-updated">Last updated: 30 April 2026</p>'
    )
    .replace(
      /<p><strong>([A-Z][A-Z0-9 ,/&()'-]+)<\/strong><\/p>/g,
      '<h2 class="terms-h2">$1</h2>'
    )
    .replace(
      /<p><strong>([^<]+)<\/strong><\/p>/g,
      '<h3 class="terms-h3">$1</h3>'
    )
    .replace(/<p>/g, '<p class="terms-p">');
}

interface Props {
  html: string;
}

export default function TermsPage({ html }: Props) {
  const formatted = formatTermsHtml(html);

  return (
    <div style={{ background: "#F5F0E8" }} className="pt-28 pb-20 px-5 sm:px-8">
      <article className="max-w-[760px] mx-auto">
        <div
          className="terms-content bg-white rounded-[16px] p-8 sm:p-12"
          style={{ border: "1px solid #E2D9CE", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      </article>
    </div>
  );
}
