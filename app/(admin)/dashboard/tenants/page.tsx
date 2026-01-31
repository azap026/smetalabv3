import { getAllTeams } from '@/lib/db/admin-queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function TenantsPage() {
    const teams = await getAllTeams();

    return (
        <section className="flex-1 p-4 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Управление тенантами</h1>
                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    Total: {teams.length}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                    <Card key={team.id} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="pb-2 space-y-0">
                            <div className="flex items-start justify-between">
                                <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <Badge
                                    variant={team.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                                    className={`text-[10px] px-2 py-0 h-5 font-bold uppercase ${team.subscriptionStatus === 'active' ? 'bg-green-500 hover:bg-green-600' : ''
                                        }`}
                                >
                                    {team.subscriptionStatus || 'free'}
                                </Badge>
                            </div>
                            <CardTitle className="text-base font-bold pt-4 line-clamp-1">{team.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                                <div className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{team.memberCount} участников</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-gray-900">{team.planName || 'No Plan'}</span>
                                </div>
                            </div>

                            <Link href={`/dashboard/tenants/${team.id}`}>
                                <Button variant="outline" className="w-full text-xs h-9 rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900 group">
                                    Подробнее
                                    <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}
