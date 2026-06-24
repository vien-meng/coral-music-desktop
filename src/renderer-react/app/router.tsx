import type { ReactElement } from 'react'
import { observer } from 'mobx-react-lite'
import { getRouteByKey } from './routeConfig'
import { rootStore } from '../stores/rootStore'

const RouterOutletView = (): ReactElement => {
  return <>{getRouteByKey(rootStore.ui.activeRoute).element}</>
}

export const RouterOutlet = observer(RouterOutletView)
