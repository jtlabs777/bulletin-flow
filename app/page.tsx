import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 font-sans">
      <main className="flex flex-col items-center justify-center gap-8 px-8 py-16 text-center max-w-4xl">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome to <span className="text-blue-600 dark:text-blue-400">BulletinFlow</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
            The modern way to create and manage church bulletins with ease.
            Upload your PDF bulletins and keep your congregation informed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="/signup">
            <Button size="lg" className="min-w-[160px] text-lg">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="min-w-[160px] text-lg">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">📄</div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
              Easy Upload
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Simply drag and drop your PDF bulletins to get started
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
              Instant Access
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              View and manage all your bulletins from one dashboard
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🏛️</div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
              Church Management
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Organize bulletins by church and manage your congregation
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
