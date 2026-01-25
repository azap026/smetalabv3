import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CreditCard, Database, Orbit } from 'lucide-react';
import { Terminal } from './terminal';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
            <div className="text-center md:max-w-2xl mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Smart Engineering &
                <span className="block text-orange-500">Management Platform</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Smetalab provides advanced tools for professional project estimation,
                management, and automated reporting. Built for engineers, by engineers.
              </p>
              <div className="mt-8 max-w-lg mx-auto text-center lg:text-left lg:mx-0">
                <Link href="/pricing">
                  <Button
                    size="lg"
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full text-lg px-8"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-12 relative max-w-lg mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <Orbit className="h-6 w-6" />
                </div>
                <CardTitle className="mt-5 text-lg font-medium text-gray-900">
                  Next.js and React
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-500">
                  Leverage the power of modern web technologies for optimal
                  performance and developer experience.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <Database className="h-6 w-6" />
                </div>
                <CardTitle className="mt-5 text-lg font-medium text-gray-900">
                  Postgres and Drizzle ORM
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-500">
                  Robust database solution with an intuitive ORM for efficient
                  data management and scalability.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <CreditCard className="h-6 w-6" />
                </div>
                <CardTitle className="mt-5 text-lg font-medium text-gray-900">
                  Stripe Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-500">
                  Seamless payment processing and subscription management with
                  industry-leading Stripe integration.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Ready to launch your SaaS?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Our template provides everything you need to get your SaaS up
                and running quickly. Don't waste time on boilerplate - focus on
                what makes your product unique.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <a href="https://github.com/azap026/smetalabv3" target="_blank">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg rounded-full"
                >
                  View the code
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
