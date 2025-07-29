# Vuebie Auto Review System V2 - Architecture Solution Design

## Implementation approach

After analyzing the role permission inheritance bug and other identified issues, I propose a comprehensive architectural solution that addresses these problems while ensuring security, scalability, and maintainability. The solution uses modern design patterns and leverages the existing Supabase backend infrastructure.

### Key Technical Decisions

1. **Permission System Redesign**: Implement a robust RBAC system with proper inheritance using a combination of database design and application-level logic.

2. **Service Layer Architecture**: Create a centralized service layer for consistent permission checks and data access across the application.

3. **Caching Strategy**: Implement an effective caching mechanism with proper invalidation to balance security and performance.

4. **Row-Level Security (RLS)**: Enforce tenant isolation through Supabase RLS policies as the primary security mechanism.

5. **Audit Trail**: Implement comprehensive logging for security-sensitive operations.

6. **API Gateway Pattern**: Standardize API access through a single gateway to enforce consistent permission checks.

### Open Source Libraries

- **Supabase Auth**: For authentication and session management
- **CASL**: For attribute-based access control implementation in the frontend
- **React Query**: For data fetching, caching, and state synchronization
- **Zod**: For runtime validation of permissions and data
- **Winston**: For structured logging
- **Redis (optional)**: For distributed caching if needed

## System Components

### 1. Permission System Redesign

The core issue with the current implementation is the incorrect inheritance of permissions. The new design will:

- Implement explicit role hierarchy with parent-child relationships
- Use recursive queries to fetch all permissions, including inherited ones
- Create a centralized permission check service with proper caching
- Add database triggers to invalidate caches when permissions change

### 2. Cross-Tenant Data Access Security

To address the cross-tenant data isolation:

- Implement comprehensive Row-Level Security policies in Supabase
- Add tenant context to all data operations
- Create middleware to ensure tenant ID validation in all API requests
- Implement audit logging for cross-tenant access attempts

### 3. Performance Optimization

To handle large datasets more efficiently:

- Implement pagination in all list endpoints
- Use cursor-based pagination for large datasets
- Add caching for frequently accessed data
- Optimize database queries with proper indexing

### 4. UI/UX Improvements for Permission Management

To improve the permission management interface:

- Create a hierarchical role visualization component
- Implement permission template system for common scenarios
- Add impact analysis tool to show affected users when permissions change
- Provide clear visual feedback on effective permissions

### 5. Multi-Language Support Enhancement

To address the gaps in internationalization:

- Implement a consistent i18n pattern across all components
- Create a translation management system with fallbacks
- Add context-aware translation keys for better localization
- Implement automated translation validation in CI/CD pipeline

## Potential Impact on Other System Components

The proposed changes will have impacts on several components:

1. **Authentication Flow**: Will need updates to include permission loading and caching
2. **API Layer**: Will require standardization and middleware for permission checks
3. **UI Components**: Will need updates to respect permission-based rendering
4. **Data Access**: Will change to respect tenant isolation more strictly
5. **Deployment Process**: Will require schema migrations and data backfills

## Technical Specifications

### Permission System Database Schema

```sql
-- Enhanced roles table with hierarchy support
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  parent_role_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Permission definition table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL,
  actions TEXT[] NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (resource, actions)
);

-- Role-permission mapping
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (role_id, permission_id)
);

-- User-role assignment with tenant context
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role_id, tenant_id)
);

-- Audit logging table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  tenant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Permission Check Implementation

```typescript
// Core permission check function
const checkUserPermission = async (userId: string, resource: string, action: string): Promise<boolean> => {
  const cacheKey = `perm_${userId}_${resource}_${action}`;
  
  // Check cache first for performance
  const cachedResult = permissionCache.get(cacheKey);
  if (cachedResult !== null) {
    return cachedResult;
  }
  
  // Join all relevant tables to get user permissions including inherited ones
  const { data, error } = await supabase.rpc('get_user_effective_permissions', {
    p_user_id: userId
  });
  
  if (error) throw error;
  
  // Check if user has the required permission
  const hasPermission = data.some(perm => 
    perm.resource === resource && 
    perm.actions.includes(action)
  );
  
  // Cache the result with TTL
  permissionCache.set(cacheKey, hasPermission, 5 * 60); // 5 minutes TTL
  
  // Log the permission check for auditing
  await logPermissionCheck(userId, resource, action, hasPermission);
  
  return hasPermission;
};
```

### Database Function for Recursive Permission Resolution

```sql
CREATE OR REPLACE FUNCTION get_user_effective_permissions(p_user_id UUID)
RETURNS TABLE (
  resource TEXT,
  actions TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE role_hierarchy AS (
    -- Base case: Get direct roles assigned to the user
    SELECT 
      ur.role_id, 
      r.parent_role_ids
    FROM 
      user_roles ur
      JOIN roles r ON ur.role_id = r.id
    WHERE 
      ur.user_id = p_user_id
    
    UNION
    
    -- Recursive case: Get parent roles
    SELECT 
      parent_role_id, 
      r.parent_role_ids
    FROM 
      role_hierarchy rh,
      LATERAL unnest(rh.parent_role_ids) AS parent_role_id
      JOIN roles r ON parent_role_id = r.id
  )
  -- Get all permissions from the role hierarchy
  SELECT DISTINCT 
    p.resource, 
    p.actions
  FROM 
    role_hierarchy rh
    JOIN role_permissions rp ON rh.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id;
END;
$$;
```

### Cache Invalidation Trigger

```sql
CREATE OR REPLACE FUNCTION notify_permission_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  affected_role_id UUID;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    affected_role_id := NEW.role_id;
  ELSE
    affected_role_id := OLD.role_id;
  END IF;
  
  -- Log the change for audit
  INSERT INTO audit_logs (
    user_id,
    action,
    resource,
    resource_id,
    metadata
  ) VALUES (
    auth.uid(),
    'permission_change',
    'role_permissions',
    affected_role_id::text,
    jsonb_build_object(
      'operation', TG_OP,
      'role_id', affected_role_id,
      'permission_id', CASE WHEN TG_OP = 'DELETE' THEN OLD.permission_id ELSE NEW.permission_id END
    )
  );
  
  -- In production, this would call an API endpoint to invalidate cache
  -- For demonstration, we'll use pg_notify
  PERFORM pg_notify(
    'permission_changes',
    json_build_object(
      'role_id', affected_role_id,
      'operation', TG_OP
    )::text
  );
  
  RETURN NULL;
END;
$$;

-- Create trigger for permission changes
CREATE TRIGGER role_permissions_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON role_permissions
FOR EACH ROW EXECUTE FUNCTION notify_permission_change();
```

### Row-Level Security Implementation

```sql
-- Enable RLS on relevant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's tenant IDs
CREATE OR REPLACE FUNCTION get_user_tenant_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM user_roles WHERE user_id = auth.uid();
$$;

-- Create RLS policies
CREATE POLICY tenant_isolation_policy ON tenants
  USING (id IN (SELECT get_user_tenant_ids()));

CREATE POLICY tenant_isolation_policy ON campaigns
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY tenant_isolation_policy ON reviews
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY tenant_isolation_policy ON outlets
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- Super admin bypass policy
CREATE POLICY super_admin_bypass ON tenants
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
  );
```

## Service Layer Architecture

### AuthService

```typescript
export class AuthService {
  private permissionCache: PermissionCache;
  private supabase: SupabaseClient;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    this.permissionCache = new PermissionCache(5 * 60 * 1000); // 5 minute TTL
  }
  
  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data.user;
  }
  
  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    // Implementation as shown earlier
  }
  
  async getAllUserPermissions(userId: string): Promise<Permission[]> {
    // Get all permissions including inherited ones
  }
  
  invalidatePermissionCache(userId: string): void {
    this.permissionCache.invalidateByPattern(`perm_${userId}_`);
  }
}
```

### TenantService

```typescript
export class TenantService {
  private supabase: SupabaseClient;
  private auditService: AuditService;
  
  constructor(supabase: SupabaseClient, auditService: AuditService) {
    this.supabase = supabase;
    this.auditService = auditService;
  }
  
  async getTenant(id: string) {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }
  
  async getCurrentUserTenants() {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select(`
        tenant_id,
        tenants:tenant_id (
          id,
          name,
          is_active
        )
      `)
      .eq('user_id', this.supabase.auth.user()?.id);
      
    if (error) throw error;
    
    // Deduplicate tenants
    const uniqueTenants = [...new Map(
      data.map(item => [item.tenants.id, item.tenants])
    ).values()];
    
    return uniqueTenants;
  }
}
```

## React Context Implementation

```tsx
// AuthContext.tsx
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authService = useRef(new AuthService()).current;
  
  useEffect(() => {
    const { data: { subscription } } = authService.supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );
    
    // Check initial session
    authService.supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const checkPermission = useCallback(async (resource: string, action: string) => {
    if (!user) return false;
    return authService.checkPermission(user.id, resource, action);
  }, [user]);
  
  const value: AuthContextValue = {
    user,
    loading,
    login: authService.login.bind(authService),
    logout: authService.logout.bind(authService),
    checkPermission
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Permission-Aware Components

```tsx
// PermissionGuard component
export const PermissionGuard: React.FC<{
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ resource, action, children, fallback = null }) => {
  const { checkPermission } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const result = await checkPermission(resource, action);
        setHasPermission(result);
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [resource, action, checkPermission]);
  
  if (loading) {
    return <div>Checking permissions...</div>;
  }
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};
```

## Recommendations for Security and Scalability

### Security Recommendations

1. **Defense in Depth**:
   - Implement permission checks at API layer, database layer, and UI layer
   - Use Supabase RLS as the final safeguard, not the only one

2. **Principle of Least Privilege**:
   - Create fine-grained permissions for different operations
   - Design role templates based on job functions, not individual needs
   - Regularly audit and review permissions assigned to roles

3. **Secure Defaults**:
   - Default to no access when permission checks fail
   - Implement comprehensive error handling for permission failures
   - Log all permission denials for security audit

4. **Regular Security Testing**:
   - Implement automated permission boundary testing
   - Perform regular penetration testing on the RBAC system
   - Add security scanning to CI/CD pipeline

### Scalability Recommendations

1. **Efficient Permission Caching**:
   - Implement tiered caching (memory, Redis, database)
   - Use appropriate cache invalidation strategies
   - Set reasonable TTL for permission caches

2. **Database Optimization**:
   - Add indexes on frequently queried permission columns
   - Partition large tables like audit_logs by tenant_id
   - Use materialized views for complex permission queries

3. **API Performance**:
   - Implement batch operations for permission changes
   - Use pagination for all list operations
   - Add compression for API responses

4. **Front-End Optimization**:
   - Implement client-side permission caching with SWR or React Query
   - Use virtualization for large permission lists
   - Adopt code splitting for permission management interfaces

## Implementation Plan

Given the 3-week timeline, I recommend the following phased approach:

### Week 1: Core Permission System Fix

1. **Days 1-2**: Implement database schema updates and migration scripts
2. **Days 3-4**: Create the core permission service with caching
3. **Day 5**: Implement database triggers and cache invalidation

### Week 2: Tenant Isolation and API Layer

1. **Days 1-2**: Implement Row-Level Security policies
2. **Days 3-4**: Create standardized API middleware for permission checks
3. **Day 5**: Add comprehensive audit logging

### Week 3: UI Updates and Testing

1. **Days 1-2**: Update permission management interfaces
2. **Day 3**: Implement permission-aware components
3. **Days 4-5**: Comprehensive testing and bug fixes

## Migration Strategy

To migrate from the current system:

1. **Data Migration**:
   - Create a script to transform existing permissions into the new schema
   - Map current roles to new role hierarchy
   - Perform migration during low-traffic period

2. **Feature Toggling**:
   - Implement a feature flag to switch between old and new permission systems
   - Gradually roll out the new system to a subset of users
   - Monitor for issues and performance impacts

3. **Fallback Mechanism**:
   - Create a temporary dual-permission check system
   - Check both old and new systems during transition
   - Log discrepancies for analysis

## Anything UNCLEAR

1. **Role Hierarchy Depth**: The documentation does not specify the maximum depth of role hierarchy needed. Implementing a truly recursive permission resolution system might have performance implications for deeply nested hierarchies.

2. **Caching Strategy**: The optimal caching strategy depends on the actual usage patterns and scale of the application. If the application has a high volume of users, a distributed caching solution like Redis might be needed.

3. **Performance Requirements**: Specific performance targets for permission checks are not defined. Additional optimization might be needed once real-world usage patterns emerge.

4. **Compliance Requirements**: There may be specific compliance requirements for audit logging that aren't fully articulated in the current documentation.

5. **Session Management**: The interaction between the permission system and session management requires clarification to ensure permissions are properly refreshed when roles change.