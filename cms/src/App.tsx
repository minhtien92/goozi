import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersAdmin from './pages/UsersAdmin';
import UsersLearners from './pages/UsersLearners';
import Topics from './pages/Topics';
import Vocabularies from './pages/Vocabularies';
import Languages from './pages/Languages';
import Slogan from './pages/Slogan';
import Picture from './pages/Picture';
import Testimonials from './pages/Testimonials';
import Feedback from './pages/Feedback';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const isAdmin = useAuthStore((state) => state.isAdmin());
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
}

function PermissionRoute({
  children,
  permission,
}: {
  children: React.ReactNode;
  permission: 'topics' | 'vocabularies' | 'home' | 'users';
}) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const isAdmin = useAuthStore((state) => state.isAdmin());

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" />;
  }

  // Require explicit true
  const allowed = user?.permissions?.[permission] === true;
  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route
            path="users"
            element={<Navigate to="/users/admin" replace />}
          />
          <Route
            path="users/admin"
            element={
              <PermissionRoute permission="users">
                <UsersAdmin />
              </PermissionRoute>
            }
          />
          <Route
            path="users/learners"
            element={
              <PermissionRoute permission="users">
                <UsersLearners />
              </PermissionRoute>
            }
          />
          <Route
            path="topics"
            element={
              <PermissionRoute permission="topics">
                <Topics />
              </PermissionRoute>
            }
          />
          <Route
            path="vocabularies"
            element={
              <PermissionRoute permission="vocabularies">
                <Vocabularies />
              </PermissionRoute>
            }
          />
          <Route path="languages" element={<Languages />} />
          <Route
            path="home-settings"
            element={
              <PermissionRoute permission="home">
                <Navigate to="/home-settings/slogan" replace />
              </PermissionRoute>
            }
          />
          <Route
            path="home-settings/slogan"
            element={
              <PermissionRoute permission="home">
                <Slogan />
              </PermissionRoute>
            }
          />
          <Route
            path="home-settings/picture"
            element={
              <PermissionRoute permission="home">
                <Picture />
              </PermissionRoute>
            }
          />
          <Route
            path="testimonials"
            element={
              <PermissionRoute permission="home">
                <Testimonials />
              </PermissionRoute>
            }
          />
          <Route path="feedback" element={<Feedback />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

