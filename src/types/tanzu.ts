/** Deliberately independent of React, Headlamp, and Kubernetes client libraries. */
export interface Resource {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    uid?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    ownerReferences?: {
      apiVersion?: string;
      kind?: string;
      name?: string;
      uid?: string;
    }[];
  };
}

export type ResourceInput = Resource | { jsonData: Resource };
export type Field = 'appId' | 'appName' | 'orgId' | 'orgName' | 'spaceId' | 'spaceName' | 'processType' | 'instanceIndex';
export interface MetadataKey {
  source: 'label' | 'annotation';
  key: string;
}
export interface Mappings {
  fields: Record<Field, readonly MetadataKey[]>;
}
export interface AppIdentity {
  appId?: string;
  appName?: string;
  orgId?: string;
  orgName?: string;
  spaceId?: string;
  spaceName?: string;
  processType?: string;
  namespace: string;
  instanceIndex?: string;
}
