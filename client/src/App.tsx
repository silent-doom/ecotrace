import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { store } from './app/store';
import { useAppSelector } from './app/hooks';
import { OnboardingWizard } from './features/onboarding/OnboardingWizard';
import { Dashboard } from './features/dashboard/Dashboard';
import { Calculator } from './features/calculator/Calculator';
import { ActionHub } from './features/actions/ActionHub';
import { Profile } from './features/profile/Profile';
import { Sidebar, MobileNav } from './components/layout/Sidebar';
import './index.css';

function AppContent() {
  const onboardingStep = useAppSelector((s) => s.user.onboardingStep);
  const isOnboarding = onboardingStep < 4;

  if (isOnboarding) {
    return <OnboardingWizard />;
  }

  return (
    <>
      <div className="bg-animated" />
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: 80 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="/calculator" element={<PageWrapper><Calculator /></PageWrapper>} />
          <Route path="/actions" element={<PageWrapper><ActionHub /></PageWrapper>} />
          <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <MobileNav />
    </>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
