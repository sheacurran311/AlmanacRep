import React from 'react';
import { List, Typography } from '@mui/material';
import NavItem from './NavItem';

const NavGroup = ({ item }) => {
  const { id, title, children } = item;

  return (
    <List
      subheader={
        <Typography variant="caption" display="block" gutterBottom>
          {title}
        </Typography>
      }
    >
      {children &&
        children.map((menuItem) => (
          <NavItem key={menuItem.id} item={menuItem} />
        ))}
    </List>
  );
};

export default NavGroup;