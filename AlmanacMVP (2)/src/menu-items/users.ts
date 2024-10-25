import { IconUsers } from '@tabler/icons-react';

const users = {
  id: 'users',
  title: 'Users',
  type: 'group',
  children: [
    {
      id: 'user-list',
      title: 'User List',
      type: 'item',
      url: '/users',
      icon: IconUsers,
      breadcrumbs: false
    }
  ]
};

export default users;