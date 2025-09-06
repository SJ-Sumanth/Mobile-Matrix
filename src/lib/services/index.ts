// Export all service classes
export { BaseService, DatabaseError, NotFoundError, ValidationError, ConflictError } from './base.service.js'
export { BrandService } from './brand.service.js'
export { PhoneService } from './phone.service.js'
export { ChatService } from './chat.service.js'
export { ComparisonService } from './comparison.service.js'

// Export service types
export type { CreateBrandData, UpdateBrandData } from './brand.service.js'
export type { 
  CreatePhoneData, 
  UpdatePhoneData, 
  PhoneWithDetails, 
  PhoneSearchFilters 
} from './phone.service.js'
export type { 
  CreateChatSessionData, 
  UpdateChatSessionData, 
  CreateChatMessageData, 
  ChatSessionWithMessages 
} from './chat.service.js'
export type { 
  CreateComparisonData, 
  UpdateComparisonData, 
  ComparisonWithPhones 
} from './comparison.service.js'