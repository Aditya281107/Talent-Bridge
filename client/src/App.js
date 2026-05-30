import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import useAuth from './hooks/useAuth';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import PostJob from './pages/PostJob';
import Profile from './pages/Profile';
import MyApplications from './pages/MyApplications';
import Candidates from './pages/Candidates';
import Companies from './pages/Companies';
import Messages from './pages/Messages';
import Assessment from './pages/Assessment';
import LiveMonitor from './pages/LiveMonitor';
import Scoreboard from './pages/Scoreboard';
import NotFound from './pages/NotFound';
import './App.css';

// Protected Route wrapper
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Guest Route wrapper (redirect if already logged in)
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/post-job"
          element={
            <ProtectedRoute roles={['employer']}>
              <PostJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-applications"
          element={
            <ProtectedRoute roles={['seeker']}>
              <MyApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidates"
          element={
            <ProtectedRoute roles={['employer']}>
              <Candidates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <Companies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment/:id"
          element={
            <ProtectedRoute roles={['seeker']}>
              <Assessment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live-monitor/:id"
          element={
            <ProtectedRoute roles={['employer']}>
              <LiveMonitor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scoreboard/:jobId"
          element={
            <ProtectedRoute roles={['employer']}>
              <Scoreboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
