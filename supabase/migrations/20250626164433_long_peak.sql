/*
  # Add set_config function for RLS

  1. New Functions
    - `set_config` - PostgreSQL function to set session variables for Row Level Security
      - `setting_name` (text) - The name of the setting to configure
      - `setting_value` (text) - The value to set
      - `is_local` (boolean) - Whether to set locally (default: true)

  2. Security
    - Function is accessible to public for RLS functionality
    - Uses SECURITY DEFINER to ensure proper permissions

  This function is essential for Row Level Security policies to work correctly
  by allowing the application to set the current user context.
*/

CREATE OR REPLACE FUNCTION public.set_config(
  setting_name text, 
  setting_value text, 
  is_local boolean DEFAULT true
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF is_local THEN
    EXECUTE format('SET LOCAL %I = %L', setting_name, setting_value);
  ELSE
    EXECUTE format('SET %I = %L', setting_name, setting_value);
  END IF;
  RETURN setting_value;
END;
$function$;

-- Grant execute permission to public (needed for RLS)
GRANT EXECUTE ON FUNCTION public.set_config(text, text, boolean) TO public;