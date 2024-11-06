export const getTenantSchema = (tenantId: string): string => {
  return `tenant_${tenantId.replace(/-/g, '_')}`;
};
