-- Check if get_my_role function exists and is correct
SELECT proname, prosrc, prosecdef
FROM pg_proc
WHERE proname = 'get_my_role';

-- Also check if there are ANY other policies still lurking
-- that reference profiles table (causing recursion)
SELECT tablename, policyname, qual
FROM pg_policies
WHERE qual LIKE '%profiles%' OR qual LIKE '%get_my_role%'
ORDER BY tablename;
