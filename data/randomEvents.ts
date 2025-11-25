import { RandomEvent } from '../types';

export const randomEvents: RandomEvent[] = [
  { description: '你在一個廢棄的貨櫃中找到了一個未開封的能量棒，稍微恢復了體力。', powerEffect: 2 },
  { description: '路過一條小巷時，你被一個隱藏的電漿陷阱輕微電擊了一下。', powerEffect: -2 },
  { description: '你發現了一張破損的數據晶片，其中記載的古老戰鬥技巧讓你有所領悟。', powerEffect: 3 },
  { description: '一場突如其來的酸雨淋濕了你的裝備，導致部分機能短暫失靈。', powerEffect: -3 },
  { description: '一個友善的商人機器人送了你一塊備用電池。', powerEffect: 1 },
  { description: '你不小心吸入了一種不明氣體，感到一陣暈眩。', powerEffect: -1 },
];
