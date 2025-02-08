-- Create get_all_workflows function
CREATE OR REPLACE FUNCTION get_all_workflows()
RETURNS TABLE (
  id uuid,
  name text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT workflows.id, workflows.name
  FROM workflows
  ORDER BY workflows.created_at DESC;
END;
$$;

-- Add down migration
-- Will be used when rolling back this migration
DROP FUNCTION IF EXISTS get_all_workflows(); 