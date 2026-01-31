import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { getAllTeams } from '@/lib/db/admin-queries';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TenantsPage() {
  const tenants = await getAllTeams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{tenant.planName || 'Free'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      tenant.subscriptionStatus === 'active'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {tenant.subscriptionStatus || 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{tenant.memberCount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
