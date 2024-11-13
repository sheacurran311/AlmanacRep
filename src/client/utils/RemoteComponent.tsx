import React, { useEffect, useState, useCallback } from 'react';
import { moduleLoader } from './moduleLoader';

interface RemoteComponentProps {
  name: string;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  [key: string]: any;
}

interface RemoteComponentState {
  Component: React.ComponentType | null;
  error: Error | null;
  loading: boolean;
}

export const RemoteComponent: React.FC<RemoteComponentProps> = ({
  name,
  fallback = null,
  errorFallback = null,
  ...props
}) => {
  const [state, setState] = useState<RemoteComponentState>({
    Component: null,
    error: null,
    loading: true
  });

  const loadComponent = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const module = await moduleLoader.loadRemote(name);
      setState({
        Component: module.default || module,
        error: null,
        loading: false
      });
    } catch (err) {
      console.error(`Failed to load remote component "${name}":`, err);
      setState({
        Component: null,
        error: err as Error,
        loading: false
      });
    }
  }, [name]);

  useEffect(() => {
    let mounted = true;

    if (mounted) {
      loadComponent();
    }

    return () => {
      mounted = false;
    };
  }, [loadComponent]);

  if (state.loading) {
    return fallback as React.ReactElement || null;
  }

  if (state.error) {
    return errorFallback as React.ReactElement || (
      <div style={{ color: 'red', padding: '1rem' }}>
        Failed to load remote component: {state.error.message}
      </div>
    );
  }

  if (!state.Component) {
    return fallback as React.ReactElement || null;
  }

  return <state.Component {...props} />;
};
