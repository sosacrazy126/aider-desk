import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from 'pages/Home';
import Settings from 'pages/Settings';
import { ROUTES } from 'utils/routes';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path={ROUTES.Home} element={<Home />} />
        <Route path={ROUTES.Settings} element={<Settings />} />
        <Route path="/" element={<Navigate to={ROUTES.Home} replace />} />
      </Routes>
    </Router>
  );
};

export default App;
