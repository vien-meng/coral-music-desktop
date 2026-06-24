import {
  CustomerServiceOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons'
import { Button, Flex, Layout, Menu, Space, Tag, Typography } from 'antd'
import { observer } from 'mobx-react-lite'
import { coralBrand } from '@shared/brand'
import { SearchInput, WindowControlBtns } from '../components/layout'
import { PlayBar } from '../components/player'
import { rootStore } from '../stores/rootStore'
import { RouterOutlet } from './router'
import { rendererRoutes } from './routeConfig'

const { Header, Sider, Content, Footer } = Layout
const { Text } = Typography

export const AppShell = observer(() => {
  const { settings, theme, ui } = rootStore
  const controlBtnPosition = settings.appSetting?.['common.controlBtnPosition'] ?? 'right'
  const isFullscreen = false

  return (
    <Layout className="coral-shell">
      <Sider width={224} className="coral-sider">
        <div className="coral-brand">
          {controlBtnPosition === 'left' ? (
            <WindowControlBtns variant="mac" isFullscreen={isFullscreen} />
          ) : (
            <CustomerServiceOutlined className="coral-brand-icon" />
          )}
          <div>
            <Text strong>{coralBrand.productName}</Text>
            <Text type="secondary" className="coral-brand-subtitle">{coralBrand.englishName}</Text>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[ui.activeRoute]}
          items={rendererRoutes.map(route => ({
            key: route.key,
            icon: route.icon,
            label: route.label,
          }))}
          onClick={({ key }) => {
            ui.setActiveRoute(key)
          }}
        />
      </Sider>
      <Layout>
        <Header className="coral-header">
          <Flex align="center" justify="space-between" gap={16}>
            <div className="coral-drag-region" style={{ flex: 1, minWidth: 0 }}>
              <SearchInput onSearch={(text) => {
                ui.setActiveRoute('search')
                rootStore.search.setSearchText(text)
              }} />
            </div>
            <Space>
              <Tag color="cyan">Electron</Tag>
              <Tag color="volcano">React</Tag>
              <Button
                icon={theme.themeMode === 'light' ? <MoonOutlined /> : <SunOutlined />}
                onClick={() => {
                  void theme.setThemeMode(theme.themeMode === 'light' ? 'dark' : 'light')
                }}
              >
                {theme.themeMode === 'light' ? '深色' : '浅色'}
              </Button>
              {controlBtnPosition === 'right' ? (
                <WindowControlBtns variant="windows" isFullscreen={isFullscreen} />
              ) : null}
            </Space>
          </Flex>
        </Header>
        <Content className="coral-content">
          <RouterOutlet />
        </Content>
        <Footer className="coral-player-slot">
          <PlayBar />
        </Footer>
      </Layout>
    </Layout>
  )
})
