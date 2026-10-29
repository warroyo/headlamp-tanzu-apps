import type { Mappings, MetadataKey } from '../types/tanzu.ts';

const label = (key: string): MetadataKey => ({ source: 'label', key: `tanzu.vmware.com/${key}` });

/** Tanzu Platform 11 VKS runtime labels verified on live application Pods. */
export const defaultMappings: Mappings = {
  fields: {
    appId: [label('app_id')],
    appName: [label('app')],
    orgId: [label('organization_id')],
    orgName: [label('organization_name')],
    spaceId: [label('space_id')],
    spaceName: [label('space_name')],
    processType: [label('process_type')],
    instanceIndex: [label('instance_index')],
  },
};

export const mappings: Mappings = defaultMappings;
