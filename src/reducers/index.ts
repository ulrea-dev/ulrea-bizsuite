// Reducer Exports
// 
// This module provides domain-specific reducers following SOLID principles.
// Each reducer handles a specific domain (Single Responsibility),
// and new reducers can be added without modifying existing ones (Open/Closed).

export { rootReducer, type BusinessAction } from './rootReducer';
export { businessReducer } from './businessReducer';
export { projectReducer } from './projectReducer';
export { teamReducer } from './teamReducer';
export { clientReducer } from './clientReducer';
export { paymentReducer } from './paymentReducer';
export { salaryReducer } from './salaryReducer';
export { settingsReducer } from './settingsReducer';
export { taskReducer } from './taskReducer';
export { productReducer } from './productReducer';
export { customerReducer } from './customerReducer';
