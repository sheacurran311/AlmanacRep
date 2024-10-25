import { IconGift } from '@tabler/icons-react';

const rewards = {
  id: 'rewards',
  title: 'Rewards',
  type: 'group',
  children: [
    {
      id: 'reward-list',
      title: 'Reward List',
      type: 'item',
      url: '/rewards',
      icon: IconGift,
      breadcrumbs: false
    }
  ]
};

export default rewards;