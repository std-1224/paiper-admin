-- Create roles table first (referenced by other tables)
CREATE TABLE roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  level VARCHAR(20) NOT NULL CHECK (level IN ('full', 'departmental', 'limited')),
  description TEXT,
  transaction_limit DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module VARCHAR(100) NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combination of module, and role_id
  UNIQUE(module, role_id)
);

-- Create role_permissions table (assuming you have a users table)
CREATE TABLE role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- Add REFERENCES users(id) ON DELETE CASCADE if users table exists
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combination of user, role, and permission
  UNIQUE(user_id, role_id, permission_id)
);

-- Create indexes for better performance
CREATE INDEX idx_permissions_role_id ON permissions(role_id);
CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_role_permissions_user_id ON role_permissions(user_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON role_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - recommended for Supabase
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (adjust based on your authentication needs)
-- Allow authenticated users to read roles
CREATE POLICY "Allow authenticated users to read roles" ON roles
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read permissions
CREATE POLICY "Allow authenticated users to read permissions" ON permissions
  FOR SELECT TO authenticated USING (true);

-- Allow users to read their own role permissions
CREATE POLICY "Users can read their own role permissions" ON role_permissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);






  📖 Roles & Permissions – Payper

Date: 2025-08-20
Version: v1.0 (Draft)

⸻

1. Roles Overview

1.1 Client
	•	Types
	•	App only
	•	App + NFC (with offline balance)
	•	NFC only (no registration, basic usage)
	•	Permissions
	•	View dynamic menu (depends on table assignment).
	•	Place and pay for orders.
	•	Transfer balance to other clients.
	•	Receive gifts/freebies (configurable).
	•	Access special prices (VIP table).
	•	Config flags
	•	Requires registration ✅/❌
	•	Can receive gifts ✅/❌
	•	Special pricing ✅/❌

⸻

1.2 PR (Public Relations)
	•	Permissions
	•	Send gifts to clients.
	•	Use PR tokens to charge client accounts.
	•	Sell or assign VIP tables.
	•	Track QR usage and campaign results.
	•	Events & Tickets
	•	Create and send invitations.
	•	Issue and transfer tickets.
	•	Assign tickets to users.
	•	Generate digital QR for access.
	•	Manage guest lists (slots, check-in, no-shows).

⸻

1.3 Ticket Seller
	•	Add guests to lists.
	•	Issue tickets.
	•	Validate access via QR.
	•	Configure basic access (general, VIP, bar).
	•	Report attendance / no-show.

⸻

1.4 Barman
	•	View incoming orders.
	•	Edit orders if stock is missing.
	•	Report missing stock.
	•	Confirm delivery by scanning client QR.

⸻

1.5 Bar Staff
	•	Create and deliver orders.
	•	Register new users on site.
	•	Recharge client balance.
	•	Access a medium-level admin panel.

⸻

1.6 Cashier
	•	Encode and recharge NFC cards.
	•	Register manual payments (cash, POS).
	•	Monitor cashbox by shift.
	•	View reports of income by payment method.

⸻

1.7 Finance
	•	Real-time cashflow (per terminal, shift, bar).
	•	Track incoming/outgoing balances.
	•	Audit internal transfers.
	•	Validate and reconcile cashbox closures.
	•	Export reports.
	•	View balances by type (user, PR tokens, NFC).

⸻

1.8 Administrator
	•	Full access.
	•	Manage inventory and stock per bar.
	•	Create/edit recipes (cocktails).
	•	Manage users and roles.
	•	Control cashflow and shifts.
	•	View global analytics (orders, sales, users, stock).
	•	Send gifts.
	•	Encode NFC cards.
	•	Detailed QR and revenue tracking.

⸻

1.9 Owner (Super Admin)
	•	Consolidated view of the entire venue.
	•	Key business metrics: sales, margins, costs, PR performance, freebies redemption, consumption vs sales.
	•	Configure global rules (e.g. clients with/without registration, freebies enabled/disabled).
	•	Create or remove Administrators.
