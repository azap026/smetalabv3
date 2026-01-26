import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, FileText, Users, Database } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                            S
                        </div>
                        <span>Smetalab</span>
                    </div>
                    <nav className="hidden md:flex gap-6 text-sm font-medium">
                        <Link href="#features" className="hover:text-primary transition-colors">
                            Возможности
                        </Link>
                        <Link href="#pricing" className="hover:text-primary transition-colors">
                            Тарифы
                        </Link>
                        <Link href="#contact" className="hover:text-primary transition-colors">
                            Контакты
                        </Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link href="/sign-in">
                            <Button variant="ghost" size="sm">
                                Войти
                            </Button>
                        </Link>
                        <Link href="/sign-up">
                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                                Регистрация
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="py-24 md:py-32 lg:py-40 bg-gradient-to-b from-orange-50 to-white dark:from-zinc-950 dark:to-zinc-900">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                Новая версия 2.0 уже доступна
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl max-w-3xl">
                                Умное управление <br className="hidden sm:inline" />
                                <span className="text-orange-600">строительными сметами</span>
                            </h1>
                            <p className="max-w-[700px] text-zinc-500 md:text-xl dark:text-zinc-400">
                                Создавайте точные сметы, управляйте закупками и работайте с командой в едином пространстве.
                                Автоматизация, которая экономит ваше время.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                <Link href="/sign-up">
                                    <Button size="lg" className="h-12 px-8 text-base bg-orange-600 hover:bg-orange-700">
                                        Начать бесплатно
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link href="#demo">
                                    <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                                        Как это работает?
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        {/* Dashboard Preview Image Placeholder */}
                        {/* <div className="mt-16 rounded-lg border bg-zinc-100 dark:bg-zinc-800 aspect-video w-full max-w-5xl mx-auto shadow-2xl overflow-hidden relative">
                 <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                    Smetalab Dashboard Preview
                 </div>
            </div> */}
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                                Всё для эффективной работы
                            </h2>
                            <p className="max-w-[700px] text-zinc-500 md:text-lg dark:text-zinc-400">
                                Мы объединили лучшие инструменты для сметчиков и руководителей проектов.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {/* Feature 1 */}
                            <div className="flex flex-col items-start p-6 bg-background rounded-2xl shadow-sm border">
                                <div className="p-3 rounded-lg bg-orange-100 text-orange-600 mb-5 dark:bg-orange-900/30 dark:text-orange-400">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Быстрые сметы</h3>
                                <p className="text-zinc-500 dark:text-zinc-400">
                                    Создавайте сметы за считанные минуты, используя готовые шаблоны и базу расценок.
                                </p>
                            </div>
                            {/* Feature 2 */}
                            <div className="flex flex-col items-start p-6 bg-background rounded-2xl shadow-sm border">
                                <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mb-5 dark:bg-blue-900/30 dark:text-blue-400">
                                    <Database className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">База материалов</h3>
                                <p className="text-zinc-500 dark:text-zinc-400">
                                    Актуальные справочники материалов и работ. Возможность импорта и экспорта.
                                </p>
                            </div>
                            {/* Feature 3 */}
                            <div className="flex flex-col items-start p-6 bg-background rounded-2xl shadow-sm border">
                                <div className="p-3 rounded-lg bg-green-100 text-green-600 mb-5 dark:bg-green-900/30 dark:text-green-400">
                                    <Users className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Командная работа</h3>
                                <p className="text-zinc-500 dark:text-zinc-400">
                                    Приглашайте коллег, распределяйте права доступа (RBAC) и работайте над проектами вместе.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="py-24">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                                Простые тарифы
                            </h2>
                            <p className="max-w-[700px] text-zinc-500 md:text-lg dark:text-zinc-400">
                                Начните бесплатно и масштабируйтесь по мере роста вашего бизнеса.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <div className="flex flex-col p-8 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border">
                                <h3 className="text-2xl font-bold">Базовый</h3>
                                <div className="mt-4 text-4xl font-extrabold">0 ₽ <span className="text-base font-normal text-zinc-500">/ мес</span></div>
                                <ul className="mt-8 space-y-3 flex-1">
                                    <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> <span>До 3 проектов</span></li>
                                    <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> <span>Базовые шаблоны</span></li>
                                    <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> <span>1 пользователь</span></li>
                                </ul>
                                <Button variant="outline" className="mt-8 w-full">Выбрать</Button>
                            </div>
                            <div className="flex flex-col p-8 bg-white dark:bg-black rounded-2xl border-2 border-orange-500 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">Популярный</div>
                                <h3 className="text-2xl font-bold">PRO</h3>
                                <div className="mt-4 text-4xl font-extrabold">990 ₽ <span className="text-base font-normal text-zinc-500">/ мес</span></div>
                                <ul className="mt-8 space-y-3 flex-1">
                                    <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-orange-500" /> <span>Безлимитные проекты</span></li>
                                    <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-orange-500" /> <span>Командный доступ</span></li>
                                    <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-orange-500" /> <span>Экспорт в Excel/PDF</span></li>
                                </ul>
                                <Button className="mt-8 w-full bg-orange-600 hover:bg-orange-700 text-white">Попробовать 14 дней</Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-10 border-t bg-zinc-50 dark:bg-zinc-950">
                <div className="container px-4 md:px-6 md:flex md:items-center md:justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl mb-4 md:mb-0">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-500 text-white text-xs">
                            S
                        </div>
                        <span>Smetalab</span>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        © {new Date().getFullYear()} Smetalab. Все права защищены.
                    </p>
                </div>
            </footer>
        </div>
    );
}
