import './globals.css'

export const metadata = {
    title: 'EPA Comments Viewer',
    description: 'Explore EPA comments on Aerosol Cans in Universal Waste Regulations',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <header className="bg-epa-blue text-white p-4 shadow-md">
                    <div className="container mx-auto flex justify-between items-center">
                        <h1 className="text-2xl font-bold">EPA Comments Viewer</h1>
                        <nav>
                            <ul className="flex space-x-6">
                                <li><a href="/" className="hover:underline">Dashboard</a></li>
                                <li><a href="/sections" className="hover:underline">Sections</a></li>
                                <li><a href="/search" className="hover:underline">Search</a></li>
                                <li><a href="/about" className="hover:underline">About</a></li>
                            </ul>
                        </nav>
                    </div>
                </header>

                <main className="container mx-auto py-8 px-4">
                    {children}
                </main>

                <footer className="bg-gray-100 p-4 border-t">
                    <div className="container mx-auto text-center text-gray-600">
                        <p>EPA Comments Analysis Tool - Aerosol Cans Universal Waste Regulation</p>
                    </div>
                </footer>
            </body>
        </html>
    )
}