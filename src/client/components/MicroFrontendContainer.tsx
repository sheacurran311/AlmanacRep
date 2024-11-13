import React, { Suspense, useEffect } from 'react';
import { RemoteComponent } from '../utils/RemoteComponent';
import { preloadSharedDependencies } from '../utils/sharedDependencies';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
    <CircularProgress />
  </Box>
);

export const MicroFrontendContainer: React.FC = () => {
  useEffect(() => {
    preloadSharedDependencies();
  }, []);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <RemoteComponent 
        name="tenant-ui" 
        fallback={<div>Tenant UI module loading failed</div>}
      />
      <RemoteComponent
        name="analytics-dashboard"
        fallback={<div>Analytics Dashboard module loading failed</div>}
      />
    </Suspense>
  );
};
