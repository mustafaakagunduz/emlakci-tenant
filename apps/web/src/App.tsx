import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { RailProvider } from './components/layout/RailContext';
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { PropertyFormPage } from './pages/PropertyFormPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { PublicPropertyPage } from './pages/PublicPropertyPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TeamPage } from './pages/TeamPage';
import { AdminOrganizationsPage } from './pages/AdminOrganizationsPage';
import { AdminOrganizationDetailPage } from './pages/AdminOrganizationDetailPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RailProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/share/:id" element={<PublicPropertyPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<RoleRoute allow={['SUPER_ADMIN']} />}>
                <Route path="/admin" element={<AdminOrganizationsPage />} />
                <Route
                  path="/admin/organizations/:id"
                  element={<AdminOrganizationDetailPage />}
                />
              </Route>
              <Route element={<RoleRoute allow={['ORG_ADMIN', 'AGENT']} />}>
                <Route path="/" element={<PropertiesPage />} />
                <Route path="/properties/new" element={<PropertyFormPage />} />
                <Route path="/properties/:id/edit" element={<PropertyFormPage />} />
                <Route path="/properties/:id" element={<PropertyDetailPage />} />
              </Route>
              <Route element={<RoleRoute allow={['ORG_ADMIN']} />}>
                <Route path="/team" element={<TeamPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </RailProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
