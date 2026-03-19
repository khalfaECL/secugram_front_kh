/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

if (typeof document !== 'undefined') {
  import('react-dom/client').then(({ createRoot }) => {
    import('react').then((React) => {
      try {
        const root = createRoot(document.getElementById('app'));
        root.render(React.createElement(App));
      } catch (e) {
        document.getElementById('app').innerHTML =
          '<pre style="color:red;padding:20px;white-space:pre-wrap">' + e.message + '\n' + e.stack + '</pre>';
      }
    });
  }).catch(e => {
    document.getElementById('app').innerHTML =
      '<pre style="color:red;padding:20px">' + e.message + '</pre>';
  });
}
