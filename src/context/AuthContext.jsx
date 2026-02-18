
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [role, setRole] = useState(null); // 'admin' | 'member' | 'platform_admin'
    const [saccoId, setSaccoId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        const getSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                await ensureProfile(session.user.email);
            } else {
                setLoading(false);
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setUser(session.user);
                await ensureProfile(session.user.email);
            } else {
                setUser(null);
                setProfile(null);
                setRole(null);
                setSaccoId(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const ensureProfile = async (email) => {
        try {
            // Check if Admin
            const { data: adminData } = await supabase
                .from('admins')
                .select('*')
                .eq('email', email)
                .single();

            if (adminData) {
                setProfile(adminData);
                setRole('admin');
                setSaccoId(adminData.sacco_id);
            } else {
                // Check if Member
                const { data: memberData } = await supabase
                    .from('members')
                    .select('*')
                    .eq('email', email)
                    .single();

                if (memberData) {
                    setProfile(memberData);
                    setRole('member');
                    setSaccoId(memberData.sacco_id);
                } else {
                    // New user or not yet assigned
                    setRole('guest');
                }
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, profile, role, saccoId, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
