/**
 * Auth Controller - Handles Supabase Authentication and Profile Sync
 */

const supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

const Auth = {
    async register(email, password) {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    async login(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    async logout() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        window.location.href = '/';
    },

    async getSession() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session;
    },

    async getUser() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    },

    // Guardar el perfil parseado y el texto del CV en la tabla user_profiles
    async saveProfileToCloud(cvText, profileObj) {
        const user = await this.getUser();
        if (!user) return null;

        const { data, error } = await supabaseClient
            .from('user_profiles')
            .upsert({ 
                user_id: user.id, 
                cv_text: cvText, 
                profile_data: profileObj,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
            
        if (error) {
            console.error("Error saving profile to cloud:", error);
            return null;
        }
        return data;
    },

    // Cargar el perfil desde la nube al iniciar sesión
    async loadProfileFromCloud() {
        const user = await this.getUser();
        if (!user) return null;

        const { data, error } = await supabaseClient
            .from('user_profiles')
            .select('cv_text, profile_data')
            .eq('user_id', user.id)
            .single();
            
        if (error && error.code !== 'PGRST116') { // PGRST116 = not found, which is fine for new users
            console.error("Error loading profile from cloud:", error);
            return null;
        }
        return data;
    }
};

window.Auth = Auth;
