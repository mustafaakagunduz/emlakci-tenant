import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../components/layout/AppLayout';
import { Table, type Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../features/auth/AuthContext';
import { useOrgUsers, useUpdateOrgUser } from '../features/org-users/hooks';
import { CreateOrgUserModal } from '../features/org-users/components/CreateOrgUserModal';
import { ResetOrgUserPasswordModal } from '../features/org-users/components/ResetOrgUserPasswordModal';
import type { OrgUser } from '../features/org-users/types';

export function TeamPage() {
  const { t } = useTranslation('team');
  const { user: currentUser } = useAuth();
  const { data, isLoading } = useOrgUsers();
  const updateOrgUser = useUpdateOrgUser();

  const [createOpen, setCreateOpen] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);

  const columns: Column<OrgUser>[] = [
    { key: 'fullName', header: t('table.fullName'), render: (u) => u.fullName },
    { key: 'email', header: t('table.email'), render: (u) => u.email },
    {
      key: 'role',
      header: t('table.role'),
      render: (u) => <Badge tone="blue">{t(`roles.${u.role}`)}</Badge>,
    },
    {
      key: 'status',
      header: t('table.status'),
      render: (u) => (
        <Badge tone={u.isActive ? 'green' : 'red'}>
          {u.isActive ? t('status.active') : t('status.passive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('table.actions'),
      render: (u) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={u.id === currentUser?.id && u.isActive}
            onClick={() => updateOrgUser.mutate({ id: u.id, input: { isActive: !u.isActive } })}
          >
            {u.isActive ? t('actions.deactivate') : t('actions.activate')}
          </Button>
          <Button variant="secondary" onClick={() => setResetPasswordUserId(u.id)}>
            {t('actions.resetPassword')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{t('title')}</h1>
        <Button onClick={() => setCreateOpen(true)}>{t('addButton')}</Button>
      </div>

      {!isLoading && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <Table columns={columns} rows={data?.data ?? []} rowKey={(u) => u.id} />
        </div>
      )}

      <CreateOrgUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ResetOrgUserPasswordModal
        open={resetPasswordUserId !== null}
        onClose={() => setResetPasswordUserId(null)}
        userId={resetPasswordUserId}
      />
    </AppLayout>
  );
}
