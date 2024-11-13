// Define shared dependencies that will be available to remote modules
export const sharedDependencies = {
  react: () => import('react'),
  'react-dom': () => import('react-dom'),
  '@mui/material': () => import('@mui/material'),
  '@mui/icons-material': () => import('@mui/icons-material'),
  '@replit/object-storage': () => import('@replit/object-storage')
};

// Preload shared dependencies
export const preloadSharedDependencies = async () => {
  const loads = Object.values(sharedDependencies).map(loader => loader());
  await Promise.all(loads);
};
