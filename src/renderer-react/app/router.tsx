import { Suspense, type ReactElement } from 'react';
import { Spin } from 'antd';
import { observer } from 'mobx-react-lite';
import { getRouteByKey } from './routeConfig';
import { rootStore } from '../stores/rootStore';

const RouterOutletView = (): ReactElement => (
  <Suspense
    fallback={
      <div className="coral-route-loading">
        <Spin />
      </div>
    }
  >
    {getRouteByKey(rootStore.ui.activeRoute).element}
  </Suspense>
);

export const RouterOutlet = observer(RouterOutletView);
