import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
            <p className="text-gray-600 mb-6">The page you are looking for does not exist.</p>
            <Link href="/" className="openai-button">
                Back to Dashboard
            </Link>
        </div>
    );
}