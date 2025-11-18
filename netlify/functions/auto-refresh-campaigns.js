// Netlify Scheduled Function - Auto-refresh campaigns
// Runs every hour to check and refresh campaigns that are due

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for scheduled functions

const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
  console.log('🔄 Auto-refresh campaigns job started');
  
  try {
    // Get all campaigns that have auto-refresh enabled and are due for refresh
    const now = new Date().toISOString();
    
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('auto_refresh_enabled', true)
      .eq('status', 'active')
      .lte('next_auto_refresh', now);
    
    if (error) {
      console.error('❌ Error fetching campaigns:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
    
    if (!campaigns || campaigns.length === 0) {
      console.log('✅ No campaigns due for refresh');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No campaigns due for refresh', count: 0 })
      };
    }
    
    console.log(`📊 Found ${campaigns.length} campaigns to refresh`);
    
    // Process each campaign
    const results = [];
    for (const campaign of campaigns) {
      try {
        console.log(`🔄 Refreshing campaign: ${campaign.name} (ID: ${campaign.id})`);
        
        // Calculate next refresh time based on interval
        const nextRefresh = calculateNextRefresh(campaign.auto_refresh_interval);
        
        // Update campaign's next_auto_refresh time
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({
            last_refreshed: now,
            next_auto_refresh: nextRefresh
          })
          .eq('id', campaign.id);
        
        if (updateError) {
          console.error(`❌ Error updating campaign ${campaign.id}:`, updateError);
          results.push({ id: campaign.id, success: false, error: updateError.message });
        } else {
          console.log(`✅ Campaign ${campaign.id} refreshed successfully`);
          results.push({ id: campaign.id, success: true, nextRefresh });
          
          // TODO: Trigger actual lead finding here
          // You could call your lead finding service or add to a queue
          // For now, we just update the timestamp
        }
      } catch (err) {
        console.error(`❌ Error processing campaign ${campaign.id}:`, err);
        results.push({ id: campaign.id, success: false, error: err.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Auto-refresh completed: ${successCount}/${campaigns.length} successful`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Auto-refresh completed',
        total: campaigns.length,
        successful: successCount,
        results
      })
    };
    
  } catch (error) {
    console.error('❌ Auto-refresh job failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function calculateNextRefresh(interval) {
  const now = new Date();
  
  switch (interval) {
    case 'every3hours':
      now.setHours(now.getHours() + 3);
      break;
    case 'every6hours':
      now.setHours(now.getHours() + 6);
      break;
    case 'every12hours':
      now.setHours(now.getHours() + 12);
      break;
    case 'daily':
    default:
      now.setHours(now.getHours() + 24);
      break;
  }
  
  return now.toISOString();
}
