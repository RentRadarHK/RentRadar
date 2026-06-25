import fs from "fs";
import path from "path";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TermsPage from "@/components/TermsPage";

export const metadata = {
  title: "Terms of Service — RentRadar",
  description: "Terms and Conditions for using RentRadar.co, operated by RentRadar Limited.",
};

function loadTermsHtml(): string {
  const filePath = path.join(process.cwd(), "content", "terms.html");
  return fs.readFileSync(filePath, "utf8");
}

export default function Page() {
  const html = loadTermsHtml();
  return (
    <main>
      <Navbar />
      <TermsPage html={html} />
      <Footer />
    </main>
  );
}
