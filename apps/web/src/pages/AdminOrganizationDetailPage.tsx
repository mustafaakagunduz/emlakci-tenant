import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../features/admin/components/AdminLayout';
import { CreateUserModal } from '../features/admin/components/CreateUserModal';
import { ResetPasswordModal } from '../features/admin/components/ResetPasswordModal';
import { Table, type Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useOrganization, useUpdateOrganization, useUpdateUser } from '../features/admin/hooks';
import type { AdminUser } from '../features/admin/types';

export function AdminOrganizationDetailPage() {
  const { t } = useTranslation('admin');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const organizationId = id ?? '';

  const { data: organization, isLoading } = useOrganization(organizationId);
  const updateOrganization = useUpdateOrganization(organizationId);
  const updateUser = useUpdateUser(organizationId);

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [orgToggleConfirmOpen, setOrgToggleConfirmOpen] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);

  if (isLoading || !organization) {
    return (
      <AdminLayout>
        <p className="text-sm text-gray-500">…</p>
      </AdminLayout>
    );
  }

  const columns: Column<AdminUser>[] = [
    { key: 'fullName', header: t('usersTable.fullName'), render: (u) => u.fullName },
    { key: 'email', header: t('usersTable.email'), render: (u) => u.email },
    {
      key: 'role',
      header: t('usersTable.role'),
      render: (u) => <Badge tone="blue">{t(`roles.${u.role}`)}</Badge>,
    },
    {
      key: 'status',
      header: t('usersTable.status'),
      render: (u) => (
        <Badge tone={u.isActive ? 'green' : 'red'}>
          {u.isActive ? t('status.active') : t('status.passive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('usersTable.actions'),
      render: (u) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => updateUser.mutate({ id: u.id, input: { isActive: !u.isActive } })}
          >
            {u.isActive ? t('userActions.deactivate') : t('userActions.activate')}
          </Button>
          <Button variant="secondary" onClick={() => setResetPasswordUserId(u.id)}>
            {t('userActions.resetPassword')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <button
        type="button"
        onClick={() => navigate('/admin')}
        className="mb-4 text-sm text-gray-500 hover:text-gray-700"
      >
        ← {t('backToList')}
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">{organization.name}</h1>
          <Badge tone={organization.isActive ? 'green' : 'red'}>
            {organization.isActive ? t('status.active') : t('status.passive')}
          </Badge>
        </div>
        <Button
          variant={organization.isActive ? 'danger' : 'primary'}
          onClick={() => setOrgToggleConfirmOpen(true)}
        >
          {organization.isActive
            ? t('organizationDetail.deactivate')
            : t('organizationDetail.activate')}
        </Button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">{t('organizationDetail.usersTitle')}</h2>
        <Button onClick={() => setCreateUserOpen(true)}>
          {t('organizationDetail.addUserButton')}
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table columns={columns} rows={organization.users} rowKey={(u) => u.id} />
      </div>

      <CreateUserModal
        open={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        organizationId={organizationId}
      />
      <ResetPasswordModal
        open={resetPasswordUserId !== null}
        onClose={() => setResetPasswordUserId(null)}
        organizationId={organizationId}
        userId={resetPasswordUserId}
      />
      <ConfirmDialog
        open={orgToggleConfirmOpen}
        title={
          organization.isActive
            ? t('organizationDetail.confirmDeactivateTitle')
            : t('organizationDetail.confirmActivateTitle')
        }
        message={
          organization.isActive
            ? t('organizationDetail.confirmDeactivateMessage')
            : t('organizationDetail.confirmActivateMessage')
        }
        confirmLabel={t('organizationDetail.confirm')}
        cancelLabel={t('organizationDetail.cancel')}
        variant={organization.isActive ? 'danger' : 'primary'}
        onCancel={() => setOrgToggleConfirmOpen(false)}
        onConfirm={() => {
          updateOrganization.mutate({ isActive: !organization.isActive });
          setOrgToggleConfirmOpen(false);
        }}
      />
    </AdminLayout>
  );
}
