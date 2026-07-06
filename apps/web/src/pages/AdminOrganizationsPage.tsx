import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../features/admin/components/AdminLayout';
import { CreateOrganizationModal } from '../features/admin/components/CreateOrganizationModal';
import { Table, type Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useOrganizations } from '../features/admin/hooks';
import type { Organization } from '../features/admin/types';

export function AdminOrganizationsPage() {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const { data, isLoading } = useOrganizations();
  const [createOpen, setCreateOpen] = useState(false);

  const columns: Column<Organization>[] = [
    { key: 'name', header: t('organizations.table.name'), render: (org) => org.name },
    {
      key: 'status',
      header: t('organizations.table.status'),
      render: (org) => (
        <Badge tone={org.isActive ? 'green' : 'red'}>
          {org.isActive ? t('status.active') : t('status.passive')}
        </Badge>
      ),
    },
    {
      key: 'userCount',
      header: t('organizations.table.userCount'),
      render: (org) => org._count.users,
    },
    {
      key: 'createdAt',
      header: t('organizations.table.createdAt'),
      render: (org) => new Date(org.createdAt).toLocaleDateString('tr-TR'),
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{t('organizations.title')}</h1>
        <Button onClick={() => setCreateOpen(true)}>{t('organizations.newButton')}</Button>
      </div>

      {!isLoading && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <Table
            columns={columns}
            rows={data?.data ?? []}
            rowKey={(org) => org.id}
            onRowClick={(org) => navigate(`/admin/organizations/${org.id}`)}
            emptyMessage={t('organizations.empty')}
          />
        </div>
      )}

      <CreateOrganizationModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </AdminLayout>
  );
}
