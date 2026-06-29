import { Button, Checkbox, Input, message, Modal, Space, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import Pickr from '@simonwep/pickr';
import '@simonwep/pickr/dist/themes/classic.min.css';
import { isUrl } from '@common/utils/common';
import { createThemeColors } from '../../services/themeColorUtils';
import { appService } from '../../services/appService';
import {
  basename,
  copyFile,
  joinPath,
  moveFile,
  removeFile,
} from '../../services/nodeBridgeService';
import { rootStore } from '../../stores/rootStore';

const { Text } = Typography;

const COLOR_FIELDS = [
  {
    key: '--color-primary',
    label: '主题主色',
    swatches: [
      '#f0645a',
      '#3c9eff',
      '#07c160',
      '#ff9800',
      '#9c27b0',
      '#e91e63',
      '#00bcd4',
      '#4caf50',
      '#ff5722',
      '#673ab7',
      '#795548',
      '#607d8b',
      '#ffeb3b',
      '#cddc39',
      '#009688',
    ],
  },
  { key: '--color-1000', label: '字体颜色', swatches: ['rgb(33, 33, 33)', 'rgb(255, 255, 255)'] },
  {
    key: '--color-app-background',
    label: '应用背景色',
    swatches: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 1)'],
  },
  { key: '--color-nav-font', label: '侧栏字体色', swatches: null },
  {
    key: '--color-main-background',
    label: '主区域背景色',
    swatches: [
      'rgba(255, 255, 255, 0.7)',
      'rgba(255, 255, 255, 0.5)',
      'rgba(0, 0, 0, 0.3)',
      'rgba(0, 0, 0, 0.5)',
      'rgba(0, 0, 0, 0.7)',
    ],
  },
  { key: '--color-badge-primary', label: '徽章主色（无损）', swatches: null },
  {
    key: '--color-badge-secondary',
    label: '徽章次色（高品）',
    swatches: [
      '#ff5722',
      '#ff9800',
      '#ffc107',
      '#ffeb3b',
      '#cddc39',
      '#8bc34a',
      '#4caf50',
      '#009688',
      '#00bcd4',
      '#03a9f4',
      '#2196f3',
      '#3f51b5',
      '#9c27b0',
    ],
  },
  {
    key: '--color-badge-tertiary',
    label: '徽章三级色（kw）',
    swatches: [
      '#ff5722',
      '#ff9800',
      '#ffc107',
      '#ffeb3b',
      '#cddc39',
      '#8bc34a',
      '#4caf50',
      '#009688',
      '#00bcd4',
      '#03a9f4',
      '#2196f3',
      '#3f51b5',
      '#9c27b0',
    ],
  },
  {
    key: '--color-btn-hide',
    label: '隐藏按钮色',
    swatches: [
      'rgba(0, 0, 0, 0.5)',
      'rgba(255, 255, 255, 0.5)',
      'rgba(0, 0, 0, 0.3)',
      'rgba(255, 255, 255, 0.3)',
    ],
  },
  {
    key: '--color-btn-min',
    label: '最小化按钮色',
    swatches: [
      'rgba(0, 0, 0, 0.5)',
      'rgba(255, 255, 255, 0.5)',
      'rgba(0, 0, 0, 0.3)',
      'rgba(255, 255, 255, 0.3)',
    ],
  },
  {
    key: '--color-btn-close',
    label: '关闭按钮色',
    swatches: ['#ff5f56', '#ffbd2e', '#27c93f', '#ff5f5f'],
  },
] as const;

const EXT_INFO_KEYS = new Set([
  '--color-app-background',
  '--color-main-background',
  '--color-nav-font',
  '--background-image',
  '--color-badge-primary',
  '--color-badge-secondary',
  '--color-badge-tertiary',
  '--color-btn-hide',
  '--color-btn-min',
  '--color-btn-close',
]);

interface ThemeEditModalProps {
  onClose: () => void;
  onSaved?: () => void;
  open: boolean;
  themeId?: string;
}

export const ThemeEditModal = observer(
  ({ onClose, onSaved, open, themeId }: ThemeEditModalProps) => {
    const { theme } = rootStore;
    const [themeName, setThemeName] = useState('');
    const [isDark, setIsDark] = useState(false);
    const [isDarkFont, setIsDarkFont] = useState(false);
    const [preview, setPreview] = useState(false);
    const [bgPath, setBgPath] = useState('');
    const [colors, setColors] = useState<Record<string, string>>({});
    const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const originalThemeRef = useRef<LX.Theme | null>(null);
    const tempBgRef = useRef<string | null>(null);
    const isDarkRef = useRef(false);
    const isDarkFontRef = useRef(false);
    const previewSnapshotRef = useRef<Record<string, string> | null>(null);

    useEffect(() => {
      isDarkRef.current = isDark;
    }, [isDark]);

    useEffect(() => {
      isDarkFontRef.current = isDarkFont;
    }, [isDarkFont]);

    useEffect(() => {
      if (!open) return;

      const themeInfo = theme.themeInfo;
      if (!themeInfo) return;

      let editingTheme: LX.Theme | undefined;
      if (themeId) {
        editingTheme = [...themeInfo.themes, ...themeInfo.userThemes].find((t) => t.id === themeId);
      }

      if (editingTheme) {
        originalThemeRef.current = editingTheme;
        setThemeName(editingTheme.name);
        setIsDark(editingTheme.isDark ?? false);
        setIsDarkFont(editingTheme.isDarkFont ?? false);
        const mergedColors: Record<string, string> = { ...editingTheme.config.themeColors };
        if (editingTheme.config.extInfo) {
          Object.assign(mergedColors, editingTheme.config.extInfo);
        }
        setBgPath(editingTheme.config.extInfo?.['--background-image'] ?? '');
        setColors(mergedColors);
      } else {
        originalThemeRef.current = null;
        setThemeName('');
        setIsDark(false);
        setIsDarkFont(false);
        setBgPath('');
        setColors({});
      }
      tempBgRef.current = null;
    }, [open, theme.themeInfo, themeId]);

    useEffect(() => {
      if (!open) return;

      const pickrs: Pickr[] = [];

      for (const field of COLOR_FIELDS) {
        const container = containerRefs.current[field.key];
        if (!container) continue;
        container.innerHTML = '';

        const currentColor = colors[field.key] ?? 'rgba(255, 255, 255, 1)';
        const pickr = Pickr.create({
          el: container,
          default: currentColor,
          theme: 'classic',
          defaultRepresentation: 'RGBA',
          autoReposition: false,
          closeWithKey: '',
          appClass: 'color-picker',
          comparison: false,
          useAsButton: true,
          swatches: field.swatches as string[] | undefined,
          components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: {
              hex: true,
              rgba: true,
              input: true,
              cancel: true,
            },
          },
          i18n: {
            'ui:dialog': ' ',
            'btn:toggle': '选择颜色',
            'btn:swatch': ' ',
            'btn:last-color': '上一个颜色',
            'btn:save': '保存',
            'btn:cancel': '取消',
            'aria:btn:save': ' ',
            'aria:btn:cancel': ' ',
            'aria:input': ' ',
            'aria:palette': ' ',
            'aria:hue': '',
            'aria:opacity': ' ',
          },
        });

        pickr.on('change', (color: Pickr.HSVaColor) => {
          const rgba = color.toRGBA().toString();
          setColors((prev) => {
            const next = { ...prev, [field.key]: rgba };
            if (field.key === '--color-primary') {
              const fontColor = prev['--color-1000'] ?? 'rgb(33, 33, 33)';
              const themeColors = createThemeColors(
                rgba,
                fontColor,
                isDarkRef.current,
                isDarkFontRef.current,
              );
              return { ...next, ...themeColors };
            }
            return next;
          });
        });

        pickr.on('cancel', () => {
          pickr.setColor(currentColor);
        });

        pickrs.push(pickr);
      }

      return () => {
        for (const p of pickrs) {
          p.destroyAndRemove();
        }
      };
    }, [open]);

    useEffect(() => {
      if (!open || !preview) return;
      if (!previewSnapshotRef.current) {
        const root = document.documentElement;
        const snapshot: Record<string, string> = {};
        for (const field of COLOR_FIELDS) {
          const value = root.style.getPropertyValue(field.key);
          if (value) snapshot[field.key] = value;
        }
        previewSnapshotRef.current = snapshot;
      }
      applyPreviewTheme();
    }, [colors, preview, isDark, isDarkFont, open]);

    useEffect(() => {
      if (open) return;
      if (previewSnapshotRef.current) {
        const root = document.documentElement;
        for (const field of COLOR_FIELDS) {
          const original = previewSnapshotRef.current[field.key];
          if (original !== undefined) {
            root.style.setProperty(field.key, original);
          } else {
            root.style.removeProperty(field.key);
          }
        }
        previewSnapshotRef.current = null;
      }
      if (tempBgRef.current) {
        removeFile(tempBgRef.current).catch(() => {});
        tempBgRef.current = null;
      }
      setPreview(false);
    }, [open]);

    const applyPreviewTheme = (): void => {
      const themeColors = { ...colors };
      if (!themeColors['--color-primary']) return;
      const root = document.documentElement;
      for (const [key, value] of Object.entries(themeColors)) {
        root.style.setProperty(key, value);
      }
    };

    const handleSelectBgImg = async (): Promise<void> => {
      const themeInfo = theme.themeInfo;
      if (!themeInfo) return;

      try {
        const result = await appService.showSelectDialog({
          title: '选择背景图片',
          properties: ['openFile'],
          filters: [
            {
              name: 'Images',
              extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'avif'],
            },
          ],
        });
        if (result.canceled || !result.filePaths.length) return;

        const srcPath = result.filePaths[0];
        const tempDir = joinPath(themeInfo.dataPath, 'temp');
        const destPath = joinPath(tempDir, basename(srcPath));
        await copyFile(srcPath, destPath);
        tempBgRef.current = destPath;
        setBgPath(destPath);
      } catch (err) {
        message.error(`选择图片失败：${err instanceof Error ? err.message : String(err)}`);
      }
    };

    const handleRemoveBgImg = (): void => {
      setBgPath('');
      tempBgRef.current = null;
    };

    const buildTheme = (): LX.Theme => {
      const themeColors: Record<string, string> = {};
      const extInfo: Record<string, string> = {};

      for (const [key, value] of Object.entries(colors)) {
        if (EXT_INFO_KEYS.has(key)) {
          extInfo[key] = value;
        } else {
          themeColors[key] = value;
        }
      }

      if (themeColors['--color-primary']) {
        const fontColor = themeColors['--color-1000'] ?? 'rgb(33, 33, 33)';
        const generated = createThemeColors(
          themeColors['--color-primary'],
          fontColor,
          isDark,
          isDarkFont,
        );
        Object.assign(themeColors, generated);
      }

      let bgImage = bgPath;
      if (bgPath && !isUrl(bgPath)) {
        bgImage = basename(bgPath);
      }
      extInfo['--background-image'] = bgImage || 'none';

      return {
        id: themeId ?? `user_theme_${Date.now()}`,
        name: themeName,
        isDark,
        isDarkFont,
        isCustom: true,
        config: {
          themeColors: themeColors as LX.ThemeColors,
          extInfo: {
            '--color-app-background': extInfo['--color-app-background'] ?? 'rgba(255, 255, 255, 1)',
            '--color-main-background':
              extInfo['--color-main-background'] ?? 'rgba(255, 255, 255, 0.7)',
            '--color-nav-font': extInfo['--color-nav-font'] ?? 'rgba(0, 0, 0, 0.5)',
            '--background-image': extInfo['--background-image'],
            '--background-image-position': 'center',
            '--background-image-size': 'cover',
            '--color-btn-hide': extInfo['--color-btn-hide'] ?? 'rgba(0, 0, 0, 0.5)',
            '--color-btn-min': extInfo['--color-btn-min'] ?? 'rgba(0, 0, 0, 0.5)',
            '--color-btn-close': extInfo['--color-btn-close'] ?? '#ff5f56',
            '--color-badge-primary': extInfo['--color-badge-primary'] ?? '#3c9eff',
            '--color-badge-secondary': extInfo['--color-badge-secondary'] ?? '#ff9800',
            '--color-badge-tertiary': extInfo['--color-badge-tertiary'] ?? '#07c160',
          },
        },
      };
    };

    const handleSave = async (): Promise<void> => {
      if (!themeName.trim()) {
        message.warning('请输入主题名称');
        return;
      }

      const themeInfo = theme.themeInfo;
      if (!themeInfo) return;

      try {
        const newTheme = buildTheme();

        if (tempBgRef.current && !isUrl(bgPath)) {
          const destPath = joinPath(themeInfo.dataPath, basename(tempBgRef.current));
          await moveFile(tempBgRef.current, destPath);
          tempBgRef.current = null;
        }

        const oldTheme = originalThemeRef.current;
        if (
          oldTheme?.config.extInfo?.['--background-image'] &&
          oldTheme.config.extInfo['--background-image'] !== 'none' &&
          oldTheme.config.extInfo['--background-image'] !== basename(bgPath)
        ) {
          try {
            await removeFile(
              joinPath(themeInfo.dataPath, oldTheme.config.extInfo['--background-image']),
            );
          } catch {
            // ignore
          }
        }

        await theme.saveUserTheme(newTheme);
        onSaved?.();
        onClose();
      } catch (err) {
        message.error(`保存失败：${err instanceof Error ? err.message : String(err)}`);
      }
    };

    const handleSaveNew = async (): Promise<void> => {
      if (!themeName.trim()) {
        message.warning('请输入主题名称');
        return;
      }

      const themeInfo = theme.themeInfo;
      if (!themeInfo) return;

      try {
        const newTheme = buildTheme();
        newTheme.id = `user_theme_${Date.now()}`;

        if (tempBgRef.current && !isUrl(bgPath)) {
          const destPath = joinPath(themeInfo.dataPath, basename(tempBgRef.current));
          await copyFile(tempBgRef.current, destPath);
        }

        await theme.saveUserTheme(newTheme);
        onSaved?.();
        onClose();
      } catch (err) {
        message.error(`另存失败：${err instanceof Error ? err.message : String(err)}`);
      }
    };

    const handleRemove = async (): Promise<void> => {
      if (!themeId) return;

      Modal.confirm({
        title: '删除主题',
        content: `确定删除「${themeName}」吗？`,
        okText: '删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await theme.removeUserTheme(themeId);
            onClose();
          } catch (err) {
            message.error(`删除失败：${err instanceof Error ? err.message : String(err)}`);
          }
        },
      });
    };

    return (
      <Modal
        open={open}
        title={themeId ? '编辑主题' : '新增主题'}
        onCancel={onClose}
        width={600}
        footer={[
          themeId ? (
            <Button key="remove" danger onClick={handleRemove}>
              删除
            </Button>
          ) : null,
          themeId ? (
            <Button key="saveNew" onClick={handleSaveNew}>
              另存为
            </Button>
          ) : null,
          <Button key="cancel" onClick={onClose}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            保存
          </Button>,
        ]}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: '8px 0',
            maxHeight: '60vh',
            overflow: 'auto',
          }}
        >
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              基础颜色
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {COLOR_FIELDS.slice(0, 5).map((field) => (
                <div
                  key={field.key}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                >
                  <div
                    ref={(el) => {
                      containerRefs.current[field.key] = el;
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {field.label}
                  </Text>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              背景图片
            </Text>
            <Space>
              <Button size="small" onClick={handleSelectBgImg}>
                选择图片
              </Button>
              {bgPath ? (
                <Button size="small" danger onClick={handleRemoveBgImg}>
                  移除
                </Button>
              ) : null}
              {bgPath ? (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {isUrl(bgPath) ? bgPath : basename(bgPath)}
                </Text>
              ) : null}
            </Space>
          </div>

          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              徽章颜色
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {COLOR_FIELDS.slice(5, 8).map((field) => (
                <div
                  key={field.key}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                >
                  <div
                    ref={(el) => {
                      containerRefs.current[field.key] = el;
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {field.label}
                  </Text>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              控制按钮颜色
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {COLOR_FIELDS.slice(8, 11).map((field) => (
                <div
                  key={field.key}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                >
                  <div
                    ref={(el) => {
                      containerRefs.current[field.key] = el;
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {field.label}
                  </Text>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              主题信息
            </Text>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="主题名称（最长 20 字符）"
                maxLength={20}
                value={themeName}
                onChange={(event) => {
                  setThemeName(event.target.value);
                }}
              />
              <Space wrap>
                <Checkbox
                  checked={isDark}
                  onChange={(event) => {
                    setIsDark(event.target.checked);
                  }}
                >
                  深色主题
                </Checkbox>
                <Checkbox
                  checked={isDarkFont}
                  onChange={(event) => {
                    setIsDarkFont(event.target.checked);
                  }}
                >
                  深色字体
                </Checkbox>
                <Checkbox
                  checked={preview}
                  onChange={(event) => {
                    setPreview(event.target.checked);
                  }}
                >
                  实时预览
                </Checkbox>
              </Space>
            </Space>
          </div>
        </div>
      </Modal>
    );
  },
);
