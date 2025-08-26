-- Audit Log Table Schema for Role Management System
-- This table tracks all changes to roles, permissions, and staff assignments

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User who performed the action
    user_id UUID NOT NULL, -- References profiles(id)
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_role VARCHAR(100) NOT NULL,
    
    -- Action details
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('role', 'staff_role_assignment', 'permission')),
    
    -- Target of the action
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('role', 'user', 'permission')),
    target_id UUID NOT NULL, -- ID of the affected entity
    target_name VARCHAR(255) NOT NULL, -- Name of the affected entity
    
    -- Change details
    description TEXT NOT NULL, -- Human-readable description of the change
    changes_before JSONB, -- Previous state (for updates)
    changes_after JSONB, -- New state (for creates and updates)
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
    error_message TEXT, -- If status is 'failed'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for better performance
    CONSTRAINT audit_log_user_id_idx FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_type ON audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_type ON audit_log(target_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_id ON audit_log(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_status ON audit_log(status);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action_date ON audit_log(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_action_date ON audit_log(target_type, target_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to read audit logs (can be restricted further based on roles)
CREATE POLICY "Allow authenticated users to read audit logs" ON audit_log
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert audit logs (for system operations)
CREATE POLICY "Allow authenticated users to insert audit logs" ON audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- Prevent updates and deletes to maintain audit integrity
CREATE POLICY "Prevent audit log modifications" ON audit_log
  FOR UPDATE TO authenticated USING (false);

CREATE POLICY "Prevent audit log deletions" ON audit_log
  FOR DELETE TO authenticated USING (false);

-- Create a function to automatically log role changes
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_user_name VARCHAR(255);
    current_user_email VARCHAR(255);
    current_user_role VARCHAR(100);
BEGIN
    -- Get current user information (this would need to be set in the application context)
    -- For now, we'll use a placeholder approach
    SELECT id, COALESCE(name, email), email, 'system' 
    INTO current_user_id, current_user_name, current_user_email, current_user_role
    FROM profiles 
    WHERE id = auth.uid()
    LIMIT 1;
    
    -- If no user found, use system defaults
    IF current_user_id IS NULL THEN
        current_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
        current_user_name := 'System';
        current_user_email := 'system@paiper.com';
        current_user_role := 'system';
    END IF;
    
    -- Log the change based on operation type
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            user_id, user_name, user_email, user_role,
            action, action_type, target_type, target_id, target_name,
            description, changes_after, status
        ) VALUES (
            current_user_id, current_user_name, current_user_email, current_user_role,
            'create', 'role', 'role', NEW.id, NEW.name,
            'Created new role: ' || NEW.name,
            jsonb_build_object(
                'name', NEW.name,
                'description', NEW.description,
                'level', NEW.level,
                'transaction_limit', NEW.transaction_limit
            ),
            'success'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            user_id, user_name, user_email, user_role,
            action, action_type, target_type, target_id, target_name,
            description, changes_before, changes_after, status
        ) VALUES (
            current_user_id, current_user_name, current_user_email, current_user_role,
            'update', 'role', 'role', NEW.id, NEW.name,
            'Updated role: ' || NEW.name,
            jsonb_build_object(
                'name', OLD.name,
                'description', OLD.description,
                'level', OLD.level,
                'transaction_limit', OLD.transaction_limit
            ),
            jsonb_build_object(
                'name', NEW.name,
                'description', NEW.description,
                'level', NEW.level,
                'transaction_limit', NEW.transaction_limit
            ),
            'success'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            user_id, user_name, user_email, user_role,
            action, action_type, target_type, target_id, target_name,
            description, changes_before, status
        ) VALUES (
            current_user_id, current_user_name, current_user_email, current_user_role,
            'delete', 'role', 'role', OLD.id, OLD.name,
            'Deleted role: ' || OLD.name,
            jsonb_build_object(
                'name', OLD.name,
                'description', OLD.description,
                'level', OLD.level,
                'transaction_limit', OLD.transaction_limit
            ),
            'success'
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic logging (optional - we'll mainly use manual logging from the API)
-- CREATE TRIGGER roles_audit_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON roles
--     FOR EACH ROW EXECUTE FUNCTION log_role_change();

-- Create a helper function to log staff role assignments
CREATE OR REPLACE FUNCTION log_staff_role_assignment(
    p_user_id UUID,
    p_user_name VARCHAR(255),
    p_user_email VARCHAR(255),
    p_user_role VARCHAR(100),
    p_action VARCHAR(50),
    p_target_user_id UUID,
    p_target_user_name VARCHAR(255),
    p_old_role_name VARCHAR(255) DEFAULT NULL,
    p_new_role_name VARCHAR(255) DEFAULT NULL,
    p_old_permissions JSONB DEFAULT NULL,
    p_new_permissions JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    audit_id UUID;
    description_text TEXT;
    changes_before_data JSONB;
    changes_after_data JSONB;
BEGIN
    -- Build description based on action
    IF p_action = 'create' THEN
        description_text := 'Assigned role "' || p_new_role_name || '" to user: ' || p_target_user_name;
        changes_after_data := jsonb_build_object(
            'role_name', p_new_role_name,
            'permissions', p_new_permissions
        );
    ELSIF p_action = 'update' THEN
        description_text := 'Changed role for user "' || p_target_user_name || '" from "' || p_old_role_name || '" to "' || p_new_role_name || '"';
        changes_before_data := jsonb_build_object(
            'role_name', p_old_role_name,
            'permissions', p_old_permissions
        );
        changes_after_data := jsonb_build_object(
            'role_name', p_new_role_name,
            'permissions', p_new_permissions
        );
    ELSIF p_action = 'delete' THEN
        description_text := 'Removed role "' || p_old_role_name || '" from user: ' || p_target_user_name;
        changes_before_data := jsonb_build_object(
            'role_name', p_old_role_name,
            'permissions', p_old_permissions
        );
    END IF;
    
    -- Insert audit log entry
    INSERT INTO audit_log (
        user_id, user_name, user_email, user_role,
        action, action_type, target_type, target_id, target_name,
        description, changes_before, changes_after, status
    ) VALUES (
        p_user_id, p_user_name, p_user_email, p_user_role,
        p_action, 'staff_role_assignment', 'user', p_target_user_id, p_target_user_name,
        description_text, changes_before_data, changes_after_data, 'success'
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing (optional)
-- INSERT INTO audit_log (
--     user_id, user_name, user_email, user_role,
--     action, action_type, target_type, target_id, target_name,
--     description, changes_before, changes_after, status
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     'Carlos Mendoza', 'carlos@paiper.com', 'Administrator',
--     'update', 'role', 'role', '00000000-0000-0000-0000-000000000002'::UUID, 'Bar Manager',
--     'Modified permissions: added "payments_refund", removed "inventory_suppliers"',
--     '{"permissions": ["dashboard_view", "inventory_view", "inventory_edit", "inventory_orders", "inventory_suppliers", "pos_sales", "pos_discounts", "pos_reports", "payments_view", "payments_process"]}'::jsonb,
--     '{"permissions": ["dashboard_view", "inventory_view", "inventory_edit", "inventory_orders", "pos_sales", "pos_discounts", "pos_reports", "payments_view", "payments_process", "payments_refund"]}'::jsonb,
--     'success'
-- );
