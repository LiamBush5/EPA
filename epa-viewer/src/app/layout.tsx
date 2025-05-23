import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EPA Document Analyzer",
  description: "AI-powered analysis of document sections and their associated comments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-gray-100 bg-white w-full">
            <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center py-3">
              <div className="flex items-center">
                <div className="flex h-8 w-8 mr-3">
                  <div className="w-3 h-8 openai-gradient rounded-sm"></div>
                  <div className="w-1 h-8"></div>
                  <div className="w-3 h-8 openai-gradient rounded-sm opacity-70"></div>
                </div>
                <Link href="/" className="text-xl font-semibold tracking-tight">
                  EPA Document Analyzer
                </Link>
              </div>
              <nav className="flex items-center space-x-5">
                <Link href="/document" className="text-sm text-gray-600 hover:text-gray-900">
                  Document Structure
                </Link>
                <a href="https://www.epa.gov" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900">
                  EPA Website
                </a>
              </nav>
            </div>
          </header>

          <main className="flex-grow pt-8">
            <div className="max-w-[1200px] mx-auto px-4 py-6">
              {children}
            </div>
          </main>

          <footer className="bg-white border-t border-gray-100 py-6">
            <div className="max-w-[1200px] mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">EPA Document Analyzer</h3>
                  <p className="text-sm text-gray-500">
                    AI-powered analysis of EPA documents and public comments to help identify key concerns and trends.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Resources</h3>
                  <ul className="space-y-1">
                    <li>
                      <a href="https://www.epa.gov/laws-regulations" className="text-sm text-gray-500 hover:text-gray-900">
                        EPA Laws & Regulations
                      </a>
                    </li>
                    <li>
                      <a href="https://www.regulations.gov" className="text-sm text-gray-500 hover:text-gray-900">
                        Regulations.gov
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-sm text-gray-500">
                    This tool helps EPA staff analyze which sections of documents receive the most comments and uses AI to identify patterns in public feedback.
                  </p>
                </div>
              </div>
              <div className="h-px w-full bg-gray-100 my-5"></div>
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} EPA Document Analyzer</p>
                <div className="flex space-x-5 mt-3 md:mt-0">
                  <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Privacy</a>
                  <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Terms</a>
                  <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Contact</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
