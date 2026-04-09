/**
 * 配置文件 v2.2
 */

const CONFIG = {
  // 封面页配置
  landing: {
    photoDir: './img/us/',
    loveStartDate: '2022-03-04 00:00:00',
    buttonText: '进入我们的世界',
    coverPhotos: ['tmp.jpg']
  },

  // 顶栏配置
  topBar: { title: '❤ 主页' },

  // 心形画框配置
  heartFrame: {
    photoCount: { desktop: 13, tablet: 11, mobile: 8 }
  },

  // 底部药丸标签栏配置
  tabs: {
    defaultTab: 'gallery'
  },

  // 动画配置
  animation: {
    staggerDelay: 260,
    heartBeatDuration: 2500,
    flipDuration: 600
  },

  // 散落装饰配置
  decorations: {
    enabled: true,
    stars: { count: 5, colors: ['#FFD700', '#F5C6A5'], sizeRange: [16, 28] },
    hearts: { count: 4, colors: ['#FFB6C1', '#F5C6A5'], sizeRange: [18, 26] }
  },

  // 照片循环刷新（秒）
  photoRotation: { intervalSeconds: 8 }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
