import { AppShell } from './app/AppShell'
import { AppProviders } from './app/providers'

export const App = () => {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  )
}
