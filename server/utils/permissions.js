/**
 * Permission helpers for collaborative access control
 * Future: Extend these to support multiple collaborators per entity/asset
 */

/**
 * Check if user can modify an entity
 * Current: Only owner can modify
 * Future: Check collaborators array/permissions
 */
export function canModifyEntity(entity, userId) {
    // Current implementation: owner only
    return entity.user.toString() === userId.toString();
    
    // Future implementation example:
    // return entity.user.toString() === userId.toString() || 
    //        entity.collaborators?.some(c => c.user.toString() === userId.toString() && c.permissions.includes('modify'));
}

/**
 * Check if user can modify an asset
 * Current: Only owner can modify
 * Future: Check collaborators array/permissions
 */
export function canModifyAsset(asset, userId) {
    // Current implementation: owner only
    return asset.user.toString() === userId.toString();
    
    // Future implementation example:
    // return asset.user.toString() === userId.toString() || 
    //        asset.collaborators?.some(c => c.user.toString() === userId.toString() && c.permissions.includes('modify'));
}

/**
 * Check if user can modify an instance
 * Current: Only instance creator can modify
 * Future: Check entity collaborators or instance-specific permissions
 */
export function canModifyInstance(instance, entity, userId) {
    // Current implementation: instance creator only
    return instance.user.toString() === userId.toString();
    
    // Future implementation example:
    // return instance.user.toString() === userId.toString() || 
    //        canModifyEntity(entity, userId); // Entity collaborators can modify instances
}