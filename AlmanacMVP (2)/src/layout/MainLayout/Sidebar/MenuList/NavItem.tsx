import React from 'react';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';

const NavItem = ({ item }) => {
  const { title, url, icon: Icon } = item;

  return (
    <ListItemButton component={Link} to={url}>
      <ListItemIcon>
        <Icon />
      </ListItemIcon>
      <ListItemText primary={title} />
    </ListItemButton>
  );
};

export default NavItem;