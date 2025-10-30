import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client using SERVICE_ROLE_KEY (SECURE - stays on server)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify requesting user is admin
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    
    if (!user) {
      return new Response('Invalid token', { status: 401, headers: corsHeaders })
    }

    // Check if user is admin using user_roles table
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!userRoles) {
      return new Response('Admin access required', { status: 403, headers: corsHeaders })
    }

    // Define validation schema
    const CreateUserSchema = z.object({
      fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
      username: z.string().trim().min(3, 'Username must be at least 3 characters').max(50, 'Username too long')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscore and dash'),
      email: z.string().trim().email('Invalid email address').max(255, 'Email too long'),
      phone: z.string().trim().max(20, 'Phone number too long').optional(),
      role: z.enum(['admin', 'manager', 'pharmacist', 'cashier'], {
        errorMap: () => ({ message: 'Invalid role' })
      }),
      password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password too long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
    })

    // Get and validate request data
    const body = await req.json()
    const parsed = CreateUserSchema.safeParse(body)
    
    if (!parsed.success) {
      const errors = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      return new Response(JSON.stringify({ 
        error: 'Validation failed', 
        details: errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const { fullName, username, email, phone, role, password } = parsed.data

    // Create user with admin powers (SECURE - using service role on server)
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, username, phone }
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create profile and role
    if (newUser.user) {
      // Insert into profiles without role
      await supabaseAdmin.from('profiles').upsert({
        id: newUser.user.id,
        full_name: fullName,
        username,
        email,
        phone,
        status: 'active',
        permissions: 
          role === 'admin' ? ['All Access'] : 
          role === 'pharmacist' ? ['Sales', 'Inventory', 'Customers', 'Reports', 'Returns', 'Purchases'] :
          role === 'cashier' ? ['Sales', 'Customers'] :
          ['Sales', 'Inventory', 'Customers', 'Reports', 'Returns', 'Users'] // manager
      })

      // Insert role into user_roles table
      await supabaseAdmin.from('user_roles').insert({
        user_id: newUser.user.id,
        role: role.toLowerCase()
      })
    }

    return new Response(JSON.stringify({ 
      message: `User ${fullName} created successfully` 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})