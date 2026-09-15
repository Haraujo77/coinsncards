import { createRoot } from 'react-dom/client';
import { Studio } from './studio/Studio';
import './studio/theme.css';

history.scrollRestoration = 'manual';

createRoot(document.getElementById('root')!).render(<Studio />);
