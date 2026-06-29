import { AppShell } from './app/AppShell';
import { AppProviders } from './app/providers';

export const App = () => (
  <AppProviders>
    <AppShell />
  </AppProviders>
);
