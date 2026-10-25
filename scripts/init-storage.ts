import { storageFromEnvironment } from './storage-environment';
await storageFromEnvironment().initialize();
console.info('Private bucket is ready; no public access policy was added.');
