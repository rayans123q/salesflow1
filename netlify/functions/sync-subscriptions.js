// Subscription Sync Function (Polling Alternative to Webhooks)
// This function checks all active subscriptions with Whop API
// and updates the database accordingly
// Run this via Netlify scheduled function every hour

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    console.log('🔄 Starting subscription sync...');

    const whopApiKey = process.env.VITE_WHOP_API_KEY;

    if (!whopApiKey) {
      console.error('❌ Whop API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Whop not configured' })
      };
    }

    // Initialize Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // Get all active subscriptions from our database
    const { data: activeSubscriptions, error: dbError } = await supabase
      .from('subscribed_users')
      .select('*')
      .eq('status', 'active');

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw dbError;
    }

    console.log(`📊 Found ${activeSubscriptions?.length || 0} active subscriptions to check`);

    let updated = 0;
    let expired = 0;
    let errors = 0;

    // Check each subscription with Whop API
    for (const subscription of activeSubscriptions || []) {
      try {
        // Skip if no Whop membership ID
        if (!subscription.whop_membership_id) {
          console.log(`⏭️ Skipping ${subscription.email} - no Whop membership ID`);
          continue;
        }

        // Check membership status with Whop
        const response = await fetch(
          `https://api.whop.com/api/v5/memberships/${subscription.whop_membership_id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${whopApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            // Membership not found - deactivate
            console.log(`❌ Membership not found for ${subscription.email} - deactivating`);
            await supabase
              .from('subscribed_users')
              .update({
                status: 'expired',
                cancelled_at: new Date().toISOString()
              })
              .eq('id', subscription.id);
            expired++;
            continue;
          }
          throw new Error(`Whop API error: ${response.status}`);
        }

        const membership = await response.json();

        // Check if membership is still valid
        const isValid = membership.valid === true;
        const isActive = membership.status === 'active' || membership.status === 'trialing';
        const notCancelled = !membership.cancel_at_period_end;

        // Check if expired
        if (membership.expires_at && membership.expires_at * 1000 < Date.now()) {
          console.log(`⏰ Subscription expired for ${subscription.email}`);
          await supabase
            .from('subscribed_users')
            .update({
              status: 'expired',
              cancelled_at: new Date().toISOString()
            })
            .eq('id', subscription.id);
          expired++;
          continue;
        }

        // If status changed, update database
        if (!isValid || !isActive || !notCancelled) {
          console.log(`❌ Subscription no longer valid for ${subscription.email}`);
          await supabase
            .from('subscribed_users')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString()
            })
            .eq('id', subscription.id);
          expired++;
        } else {
          // Update expiration date if changed
          const newExpiresAt = membership.expires_at 
            ? new Date(membership.expires_at * 1000).toISOString() 
            : null;
          
          if (newExpiresAt !== subscription.expires_at) {
            console.log(`🔄 Updating expiration for ${subscription.email}`);
            await supabase
              .from('subscribed_users')
              .update({ expires_at: newExpiresAt })
              .eq('id', subscription.id);
            updated++;
          }
        }

      } catch (error) {
        console.error(`❌ Error checking ${subscription.email}:`, error.message);
        errors++;
      }
    }

    // Also check for new subscriptions from Whop that aren't in our database
    try {
      console.log('🔍 Checking for new subscriptions from Whop...');
      
      const whopResponse = await fetch(
        'https://api.whop.com/api/v5/memberships?per=100',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${whopApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (whopResponse.ok) {
        const whopData = await whopResponse.json();
        const whopMemberships = whopData.data || [];

        for (const membership of whopMemberships) {
          const email = membership.email || membership.user?.email;
          if (!email) continue;

          const isValid = membership.valid === true;
          const isActive = membership.status === 'active' || membership.status === 'trialing';
          const notCancelled = !membership.cancel_at_period_end;

          if (isValid && isActive && notCancelled) {
            // Check if exists in our database
            const { data: existing } = await supabase
              .from('subscribed_users')
              .select('id')
              .eq('email', email.toLowerCase())
              .single();

            if (!existing) {
              // New subscription found - add to database
              console.log(`➕ New subscription found: ${email}`);
              await supabase
                .from('subscribed_users')
                .insert({
                  email: email.toLowerCase(),
                  status: 'active',
                  subscribed_at: new Date().toISOString(),
                  whop_membership_id: membership.id,
                  expires_at: membership.expires_at 
                    ? new Date(membership.expires_at * 1000).toISOString() 
                    : null,
                  payment_verified: true
                });
              updated++;
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking for new subscriptions:', error);
    }

    const summary = {
      checked: activeSubscriptions?.length || 0,
      updated,
      expired,
      errors,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Sync complete:', summary);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Subscription sync completed',
        summary
      })
    };

  } catch (error) {
    console.error('❌ Sync error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Sync failed',
        details: error.message
      })
    };
  }
};
