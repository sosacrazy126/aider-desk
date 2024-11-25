import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home } from 'pages/Home';
import Settings from 'pages/Settings';
import { ROUTES } from 'utils/routes';
import { useEffect, useState } from 'react';

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <AnimatePresence initial={true}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, position: 'absolute', width: '100%', height: '100%' }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Routes location={location}>
            <Route path={ROUTES.Home} element={<Home />} />
            <Route path={ROUTES.Settings} element={<Settings />} />
            <Route path="/" element={<Navigate to={ROUTES.Home} replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const App = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: isVisible ? 1 : 0 }} transition={{ duration: 0.5, ease: 'easeIn' }}>
      <Router>
        <AnimatedRoutes />
      </Router>
    </motion.div>
  );
};

export default App;
