import { IconUserCheck } from '@tabler/icons-react';

const roleManagement = {
  id: 'role-management',
  title: 'Role Management',
  type: 'group',
  children: [
    {
      id: 'role-management',
      title: 'Role Management',
      type: 'item',
      url: '/role-management',
      icon: IconUserCheck,
      breadcrumbs: false
    }
  ]
};

export default roleManagement;