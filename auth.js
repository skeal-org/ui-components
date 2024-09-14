// auth.js

async function signInWithEmail(email, password) {
    const { user, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return user;
  }
  
  async function signUpWithEmail(email, password) {
    const { user, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return user;
  }
  
  async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  }
  
  async function getUser() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) throw error;
    return user;
  }
  