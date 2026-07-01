import { Theme } from './settings/types';
import { OrbitLaunchLanding } from './components/generated/OrbitLaunchLanding';

let theme: Theme = 'light';

function App() {
  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme);

  return (
    <>
      <OrbitLaunchLanding />
    </>
  ); // %EXPORT_STATEMENT%
}

export default App;
