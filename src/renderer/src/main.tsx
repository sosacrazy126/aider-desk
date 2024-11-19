import './main.css';

import ReactDOM from 'react-dom/client';
import { PrimeReactProvider } from 'primereact/api';
import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <PrimeReactProvider value={{}}>
    <App />
  </PrimeReactProvider>,
);
