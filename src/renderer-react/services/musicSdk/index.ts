import { dateFormat } from '@common/utils/common';
import { coralBrand } from '@shared/brand';
import { toMD5 } from './sdk/utils';

export * from '@common/utils/renderer';
export * from '@common/utils/common';
export * from '@common/utils/tools';
export { toMD5 };

/**
 * 格式化播放数量
 * @param {*} num 数字
 */
export const formatPlayCount = (num: number): string => {
  if (num > 100000000) return `${Math.trunc(num / 10000000) / 10}亿`;
  if (num > 10000) return `${Math.trunc(num / 1000) / 10}万`;
  return String(num);
};

/**
 * 时间格式化
 */
export const dateFormat2 = (time: number): string => {
  const i18n = (
    window as Window & { i18n?: { t: (key: string, params: { num: number }) => string } }
  ).i18n;
  const differ = Math.trunc((Date.now() - time) / 1000);
  if (differ < 60) {
    return i18n?.t('date_format_second', { num: differ }) ?? `${differ}s`;
  }
  if (differ < 3600) {
    const num = Math.trunc(differ / 60);
    return i18n?.t('date_format_minute', { num }) ?? `${num}m`;
  }
  if (differ < 86400) {
    const num = Math.trunc(differ / 3600);
    return i18n?.t('date_format_hour', { num }) ?? `${num}h`;
  }
  return dateFormat(time);
};

/**
 * 设置标题
 */
const dom_title = document.getElementsByTagName('title')[0];
export const setTitle = (title: string | null) => {
  title ||= coralBrand.englishName;
  dom_title.innerText = title;
};

// export const getProxyInfo = () => {
//   return proxy.enable && proxy.host
//     ? `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
//     : proxy.envProxy
//       ? `http://${proxy.envProxy.host}:${proxy.envProxy.port}`
//       : undefined
// }

export const getFontSizeWithScreen = (screenWidth: number = window.innerWidth): number =>
  screenWidth <= 1440
    ? 16
    : screenWidth <= 1920
      ? 18
      : screenWidth <= 2560
        ? 20
        : screenWidth <= 2560
          ? 20
          : 22;

export const deduplicationList = <T extends Coral.Music.MusicInfo>(list: T[]): T[] => {
  const ids = new Set<string>();
  return list.filter((s) => {
    if (ids.has(s.id)) return false;
    ids.add(s.id);
    return true;
  });
};

export const langS2T = async (str: string) => str;

export const decodeName = (str: string | null = '') => {
  if (!str) return '';
  return new window.DOMParser().parseFromString(str, 'text/html').body.textContent;
};
