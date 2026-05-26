import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-sand-100 flex items-center justify-center mb-5">
        <svg
          className="w-8 h-8 text-sand-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
          />
        </svg>
      </div>
      <h1 className="font-heading text-xl font-medium text-gray-900 mb-2">
        Page not found
      </h1>
      <p className="text-sand-600 text-sm mb-6 max-w-xs">
        This page doesn&apos;t exist. You may have followed an old link or mistyped the URL.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-teal text-white font-medium
          hover:bg-teal-600 active:scale-[0.98] transition-all shadow-sm"
      >
        Go home
      </Link>
    </div>
  );
}
