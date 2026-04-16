import type { ContentItem } from '../store';

export interface AnnounceSlide {
  tag: string;
  title: string;
  desc: string;
}

export const ANNOUNCES: AnnounceSlide[] = [
  {
    tag: '最新发布',
    title: '第 55 期 · 安静的力量',
    desc: '12 篇精选文章与音频,陪你度过宁静的十一月。',
  },
  {
    tag: '播客上线',
    title: '溪水旁音频播客',
    desc: '从 2025 年起,每一篇文章都有音频版本,通勤路上也能聆听。',
  },
  {
    tag: '读者征稿',
    title: '见证你的故事',
    desc: '第 56 期主题「在旷野中」,欢迎弟兄姊妹投稿分享个人经历。',
  },
];

const TITLES = [
  '安静,是一种力量',
  '在破碎中看见恩典',
  '等候的功课',
  '从旷野到应许之地',
  '诗篇默想:牧者的心',
  '爱是永不止息',
  '门徒的代价',
  '活出光与盐',
  '谦卑顺服',
  '新造的人',
  '永恒的约',
  '光中同行',
];
const AUTHORS = ['李弟兄', '陈姊妹', '王弟兄', '张牧师', '刘弟兄', '赵姊妹'];
const CATEGORIES = ['见证分享', '诗歌默想', '科学论坛', '生命栽培', '主日讲道'];

const gen = (n: number, startId = 1, volume = 55): ContentItem[] =>
  Array.from({ length: n }, (_, i) => ({
    id: startId + i,
    title: TITLES[i % TITLES.length],
    author: AUTHORS[i % AUTHORS.length],
    mins: 4 + (i % 9),
    volume,
    category: CATEGORIES[i % CATEGORIES.length],
  }));

// 第 55 期最新文章(首页用)
export const LATEST: ContentItem[] = gen(8, 1, 55);

// 期刊详情用 - 默认拿一期12篇
export const VOLUME_ARTICLES: ContentItem[] = gen(12, 100, 55);

// 往期期刊
export interface VolumeMeta {
  id: number;
  subtitle: string;
  count: number;
}

export const VOLS: VolumeMeta[] = Array.from({ length: 10 }, (_, i) => ({
  id: 54 - i,
  subtitle: [
    '在祂里面',
    '破碎与更新',
    '安静等候',
    '光中同行',
    '活水涌流',
    '荣耀盼望',
    '谦卑顺服',
    '永恒的约',
    '蒙福人生',
    '新造的人',
  ][i],
  count: 12,
}));

// 全部期刊(全部期刊页用,懒加载)
export const ALL_VOLUMES: VolumeMeta[] = Array.from({ length: 55 }, (_, i) => ({
  id: 55 - i,
  subtitle: [
    '安静的力量',
    '在祂里面',
    '破碎与更新',
    '安静等候',
    '光中同行',
    '活水涌流',
    '荣耀盼望',
    '谦卑顺服',
    '永恒的约',
    '蒙福人生',
    '新造的人',
    '爱的真谛',
    '同行天路',
    '恩典之旅',
  ][i % 14],
  count: 12 + (i % 5),
}));

// 文章正文(暂时只有一篇示例)
// 注意:真实数据库里 content 是 string[] 数组,空字符串是段落分隔
// 图片标记格式: "<filename.jpg>"  — 当前阶段先忽略图片,只渲染文字
export const SAMPLE_CONTENT: string[] = [
  '在喧嚣的时代,安静成了一种稀缺的能力。我们习惯了被信息填满每一刻空隙,却在最需要聆听内心声音的时候,发现自己早已失去了那种能力。',
  '',
  '大卫在诗篇中说:「我的心哪,你当默默无声,专等候神,因为我的盼望是从祂而来。」默默无声,不是消极的沉默,而是一种主动的等候——在等候中让纷乱的思绪沉淀,让真正重要的声音浮现出来。',
  '',
  '安静不是逃避,而是面对。面对那些被我们用忙碌掩盖的问题,面对那些被噪音淹没的呼唤。当我们愿意停下来,许多原本模糊的事情会变得清晰。',
  '',
  '愿我们都能在日复一日的喧嚷中,为自己保留一片安静的园地。在那里,我们与自己相遇,也与那位一直等候我们的主相遇。',
];
