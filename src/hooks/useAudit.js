
import { useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export const useAudit = () => {
    const { profile } = useAuth(); // Assuming useAuth provides `profile` with `sacco_id` and `id`

    const logAction = useCallback(async (action, tableName, recordId = null) => {
        if (!profile || !profile.sacco_id) {
            console.warn("Audit Log: Missing user profile or sacco_id");
            return;
        }

        try {
            const { error } = await supabase.from('audit_log').insert([{
                sacco_id: profile.sacco_id,
                user_id: profile.id, // Current user performing the action
                action,
                table_name: tableName,
                record_id: recordId
            }]);

            if (error) {
                console.error("Audit logging error:", error);
            }
        } catch (e) {
            console.error("Audit logging exception:", e);
        }
    }, [profile]);

    return { logAction };
};
