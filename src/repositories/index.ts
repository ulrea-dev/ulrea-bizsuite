// Repository Pattern Exports
// 
// This module provides a clean abstraction layer for data persistence.
// Following SOLID principles (especially Dependency Inversion),
// the application depends on abstractions (IDataRepository) rather
// than concrete implementations (LocalStorageRepository).

export { type IDataRepository, type ExportedData, type BackupMetadata, APP_DATA_KEYS, validateBackupCompleteness } from './IDataRepository';
export { LocalStorageRepository, localStorageRepository } from './LocalStorageRepository';
export { RepositoryProvider, useRepository } from './RepositoryProvider';
