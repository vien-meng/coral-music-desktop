import { SlidersOutlined } from '@ant-design/icons';
import { Button, Divider, Modal, Slider, Space, Switch, Tooltip, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import { rootStore } from '../../stores/rootStore';

const { Text } = Typography;

const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;

const formatFrequency = (frequency: number): string =>
  frequency < 1000 ? `${frequency}` : `${frequency / 1000}k`;

export const SoundEffectBtn = observer(() => {
  const { settings } = rootStore;
  const [open, setOpen] = useState(false);
  const appSetting = settings.appSetting;

  const hasCustomEq = useMemo(
    () =>
      eqFrequencies.some(
        (frequency) => appSetting?.[`player.soundEffect.biquadFilter.hz${frequency}`] !== 0,
      ),
    [appSetting],
  );

  const updateSetting = (setting: Partial<LX.AppSetting>): void => {
    void settings.updateAppSetting(setting);
  };

  const resetEq = (): void => {
    const nextSetting: Partial<LX.AppSetting> = {};
    for (const frequency of eqFrequencies) {
      nextSetting[`player.soundEffect.biquadFilter.hz${frequency}`] = 0;
    }
    updateSetting(nextSetting);
  };

  return (
    <>
      <Tooltip title="音效">
        <Button
          aria-label="音效"
          icon={<SlidersOutlined />}
          shape="circle"
          type={
            hasCustomEq || appSetting?.['player.soundEffect.panner.enable'] ? 'primary' : 'default'
          }
          onClick={() => {
            setOpen(true);
          }}
        />
      </Tooltip>
      <Modal
        open={open}
        title="音效"
        width={720}
        footer={null}
        onCancel={() => {
          setOpen(false);
        }}
      >
        <Space direction="vertical" size="middle" className="coral-wide">
          <section>
            <Space className="coral-wide" style={{ justifyContent: 'space-between' }}>
              <Text strong>均衡器</Text>
              <Button size="small" disabled={!hasCustomEq} onClick={resetEq}>
                重置
              </Button>
            </Space>
            <div className="coral-eq-grid">
              {eqFrequencies.map((frequency) => (
                <div key={frequency} className="coral-eq-slider">
                  <Slider
                    vertical
                    min={-20}
                    max={20}
                    value={appSetting?.[`player.soundEffect.biquadFilter.hz${frequency}`] ?? 0}
                    onChange={(value) => {
                      updateSetting({
                        [`player.soundEffect.biquadFilter.hz${frequency}`]: Math.round(value),
                      });
                    }}
                  />
                  <Text type="secondary">{formatFrequency(frequency)}</Text>
                </div>
              ))}
            </div>
          </section>

          <Divider style={{ margin: '4px 0' }} />

          <section>
            <Space className="coral-wide" style={{ justifyContent: 'space-between' }}>
              <Text strong>声像</Text>
              <Switch
                checked={appSetting?.['player.soundEffect.panner.enable'] ?? false}
                onChange={(checked) => {
                  updateSetting({ 'player.soundEffect.panner.enable': checked });
                }}
              />
            </Space>
            <Slider
              min={0}
              max={10}
              marks={{ 0: '左', 5: '中', 10: '右' }}
              value={appSetting?.['player.soundEffect.panner.soundR'] ?? 5}
              disabled={!appSetting?.['player.soundEffect.panner.enable']}
              onChange={(value) => {
                updateSetting({ 'player.soundEffect.panner.soundR': Math.round(value) });
              }}
            />
          </section>

          <Divider style={{ margin: '4px 0' }} />

          <section>
            <Text strong>音调倍率</Text>
            <Slider
              min={50}
              max={200}
              step={1}
              value={Math.round(
                (appSetting?.['player.soundEffect.pitchShifter.playbackRate'] ?? 1) * 100,
              )}
              marks={{ 50: '0.5x', 100: '1x', 200: '2x' }}
              onChange={(value) => {
                updateSetting({
                  'player.soundEffect.pitchShifter.playbackRate': Number((value / 100).toFixed(2)),
                });
              }}
            />
          </section>
        </Space>
      </Modal>
    </>
  );
});
