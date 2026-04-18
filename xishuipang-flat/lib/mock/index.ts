import type { ContentItem } from '../store';
import type { Slide } from '../ui/AnnounceCarousel';

// ===== 轮播公告 =====
export type { Slide as AnnounceSlide };

export const ANNOUNCES: Slide[] = [
  {
    tag: '溪水旁 2.0',
    title: '溪水旁音频播客',
    desc: '从 2005 年起的每一篇文章都将有音频版本，通勤路上、夜晚的书桌前，也能聆听。',
  },
  {
    tag: '教会历史',
    title: '多伦多华人福音堂',
    desc: '始建于 1965 年，见证华人基督徒在多伦多的信仰历程。',
    image: require('../../assets/images/church-old.jpg'),
    link: 'https://chinesegospelchurch.net/',
  },
  {
    tag: '多伦多堂',
    title: '444-450 Dundas St. West',
    desc: 'Toronto, ON · (416) 977-2530',
    image: require('../../assets/images/church-toronto.jpg'),
    link: 'https://maps.google.com/?q=444+Dundas+St+West,+Toronto,+ON',
  },
  {
    tag: '士嘉堡堂',
    title: '2610 Birchmount Rd.',
    desc: 'Scarborough, ON · (416) 498-0196',
    image: require('../../assets/images/church-scarborough.jpg'),
    link: 'https://maps.google.com/?q=2610+Birchmount+Rd,+Scarborough,+ON',
  },
];

// ===== 以下保持不变 =====

const TITLES = [
  '安静,是一种力量', '在破碎中看见恩典', '等候的功课', '从旷野到应许之地',
  '诗篇默想:牧者的心', '爱是永不止息', '门徒的代价', '活出光与盐',
  '谦卑顺服', '新造的人', '永恒的约', '光中同行',
];
const AUTHORS = ['李弟兄', '陈姊妹', '王弟兄', '张牧师', '刘弟兄', '赵姊妹'];
const CATEGORIES = ['见证分享', '诗歌默想', '科学论坛', '生命栽培', '主日讲道'];

const gen = (n: number, startId = 1, volume = 55): ContentItem[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(startId + i),
    title: TITLES[i % TITLES.length],
    author: AUTHORS[i % AUTHORS.length],
    mins: 4 + (i % 9),
    volume,
    category: CATEGORIES[i % CATEGORIES.length],
  }));

export const LATEST: ContentItem[] = gen(8, 1, 55);
export const VOLUME_ARTICLES: ContentItem[] = gen(12, 100, 55);

export interface VolumeMeta { id: number; subtitle: string; count: number; }

export const VOLS: VolumeMeta[] = Array.from({ length: 10 }, (_, i) => ({
  id: 54 - i,
  subtitle: ['在祂里面','破碎与更新','安静等候','光中同行','活水涌流','荣耀盼望','谦卑顺服','永恒的约','蒙福人生','新造的人'][i],
  count: 12,
}));

export const ALL_VOLUMES: VolumeMeta[] = Array.from({ length: 55 }, (_, i) => ({
  id: 55 - i,
  subtitle: ['安静的力量','在祂里面','破碎与更新','安静等候','光中同行','活水涌流','荣耀盼望','谦卑顺服','永恒的约','蒙福人生','新造的人','爱的真谛','同行天路','恩典之旅'][i % 14],
  count: 12 + (i % 5),
}));

export const SAMPLE_CONTENT: string[] = [
  '在喧嚣的时代,安静成了一种稀缺的能力。我们习惯了被信息填满每一刻空隙,却在最需要聆听内心声音的时候,发现自己早已失去了那种能力。',
  '', '大卫在诗篇中说:「我的心哪,你当默默无声,专等候神,因为我的盼望是从祂而来。」默默无声,不是消极的沉默,而是一种主动的等候——在等候中让纷乱的思绪沉淀,让真正重要的声音浮现出来。',
  '', '安静不是逃避,而是面对。面对那些被我们用忙碌掩盖的问题,面对那些被噪音淹没的呼唤。当我们愿意停下来,许多原本模糊的事情会变得清晰。',
  '', '愿我们都能在日复一日的喧嚷中,为自己保留一片安静的园地。在那里,我们与自己相遇,也与那位一直等候我们的主相遇。',
];
