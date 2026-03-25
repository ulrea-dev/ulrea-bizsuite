import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'invite') {
      // Send invitation email — user must click link and set password
      const { email, workspaceId, workspaceName } = body;
      if (!email) {
        return new Response(JSON.stringify({ error: 'Email is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://nsimfqhzuwubutfnhrxs'}.supabase.co`,
        data: {
          workspace_invite: true,
          workspace_id: workspaceId,
          workspace_name: workspaceName,
        },
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ userId: data.user?.id, email: data.user?.email }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create') {
      // Create user with temporary password — they must change on first login
      const { email, password, displayName, workspaceId } = body;
      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Email and password are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email verification for admin-created accounts
        user_metadata: {
          force_password_change: true,
          display_name: displayName || '',
          workspace_invite: true,
          workspace_id: workspaceId,
        },
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ userId: data.user?.id, email: data.user?.email }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'remove') {
      const { userId, deleteFromAuth } = body;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (deleteFromAuth) {
        const { error } = await adminClient.auth.admin.deleteUser(userId);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'lookup_by_email') {
      const { email } = body;
      if (!email) {
        return new Response(JSON.stringify({ error: 'email is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: { users }, error } = await adminClient.auth.admin.listUsers();
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const found = users.find((u) => u.email?.toLowerCase() === (email as string).toLowerCase());
      if (!found) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ userId: found.id, email: found.email }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check_status') {
      const { userId } = body;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await adminClient.auth.admin.getUserById(userId);
      if (error || !data.user) {
        return new Response(JSON.stringify({ status: 'unknown' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const isActive = !!data.user.email_confirmed_at || !!data.user.last_sign_in_at;
      return new Response(
        JSON.stringify({
          status: isActive ? 'active' : 'pending',
          email: data.user.email,
          lastSignIn: data.user.last_sign_in_at,
          emailConfirmedAt: data.user.email_confirmed_at,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
