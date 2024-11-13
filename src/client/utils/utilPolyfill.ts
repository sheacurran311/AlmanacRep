// Simple polyfill for util module functions needed in browser
export const util = {
  debuglog: (section: string) => {
    return (...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${section}]`, ...args);
      }
    };
  },
  inspect: (obj: any, options?: any) => {
    try {
      return JSON.stringify(obj, null, options?.depth || 2);
    } catch (error) {
      return String(obj);
    }
  }
};

if (typeof window !== 'undefined') {
  (window as any).util = util;
}

export default util;
