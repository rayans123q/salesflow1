// Monitor Keyword Alerts - Check Reddit comments for keyword matches
// Runs every 5 minutes via scheduled function

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
  console.log('🔍 Keyword alert monitoring started');
  
  try {
    // Get all active keyword alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('keyword_alerts')
      .select('*')
      .eq('is_active', true);
    
    if (alertsError) {
      console.error('❌ Error fetching alerts:', alertsError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: alertsError.message })
      };
    }
    
    if (!alerts || alerts.length === 0) {
      console.log('✅ No active keyword alerts');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No active alerts', count: 0 })
      };
    }
    
    console.log(`📊 Found ${alerts.length} active keyword alerts`);
    
    const results = [];
    
    // Process each alert
    for (const alert of alerts) {
      try {
        console.log(`🔎 Processing alert: ${alert.name}`);
        
        // Get subreddits to monitor (or use popular ones if none specified)
        const subreddits = alert.subreddits || ['sales', 'entrepreneur', 'smallbusiness', 'startups'];
        
        // Fetch recent comments from Reddit
        const comments = await fetchRecentComments(subreddits, alert.last_triggered);
        console.log(`📝 Found ${comments.length} comments to check`);
        
        // Check comments against keywords
        const matches = [];
        for (const comment of comments) {
          const matchResult = checkKeywordMatch(comment, alert.keywords, alert.negative_keywords);
          
          if (matchResult.isMatch) {
            matches.push({
              comment,
              matchedKeywords: matchResult.matchedKeywords,
              relevanceScore: matchResult.relevanceScore
            });
          }
        }
        
        console.log(`✅ Found ${matches.length} matches for alert: ${alert.name}`);
        
        // Create notifications for matches
        for (const match of matches) {
          await createNotification(alert, match);
        }
        
        // Update alert last_triggered timestamp
        await supabase
          .from('keyword_alerts')
          .update({ last_triggered: new Date().toISOString() })
          .eq('id', alert.id);
        
        results.push({
          alertId: alert.id,
          alertName: alert.name,
          commentsChecked: comments.length,
          matchesFound: matches.length,
          success: true
        });
        
      } catch (error) {
        console.error(`❌ Error processing alert ${alert.name}:`, error);
        results.push({
          alertId: alert.id,
          alertName: alert.name,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalMatches = results.reduce((sum, r) => sum + (r.matchesFound || 0), 0);
    
    console.log(`✅ Monitoring completed: ${successCount}/${results.length} alerts processed, ${totalMatches} total matches`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Keyword alert monitoring completed',
        alertsProcessed: results.length,
        successful: successCount,
        totalMatches,
        results
      })
    };
    
  } catch (error) {
    console.error('❌ Keyword alert monitoring failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Fetch recent comments from Reddit
async function fetchRecentComments(subreddits, since) {
  const comments = [];
  const timeLimit = since ? new Date(since).getTime() / 1000 : (Date.now() / 1000) - (5 * 60); // Last 5 minutes
  
  for (const subreddit of subreddits.slice(0, 5)) { // Limit to 5 subreddits per run
    try {
      const url = `https://www.reddit.com/r/${subreddit}/comments.json?limit=25`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SalesFlow/1.0'
        }
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch comments from r/${subreddit}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const recentComments = data.data.children
        .filter(child => child.data.created_utc > timeLimit)
        .map(child => ({
          id: child.data.id,
          author: child.data.author,
          body: child.data.body,
          subreddit: child.data.subreddit,
          postTitle: child.data.link_title,
          url: `https://www.reddit.com${child.data.permalink}`,
          createdAt: new Date(child.data.created_utc * 1000).toISOString(),
          score: child.data.score
        }));
      
      comments.push(...recentComments);
      
    } catch (error) {
      console.error(`❌ Error fetching comments from r/${subreddit}:`, error);
    }
  }
  
  return comments;
}

// Check if comment matches keywords
function checkKeywordMatch(comment, keywords, negativeKeywords) {
  const text = (comment.body + ' ' + comment.postTitle).toLowerCase();
  const matchedKeywords = [];
  
  // Check positive keywords
  for (const keyword of keywords) {
    if (text.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
    }
  }
  
  // If no positive matches, return false
  if (matchedKeywords.length === 0) {
    return { isMatch: false, matchedKeywords: [], relevanceScore: 0 };
  }
  
  // Check negative keywords
  if (negativeKeywords && negativeKeywords.length > 0) {
    for (const negKeyword of negativeKeywords) {
      if (text.includes(negKeyword.toLowerCase())) {
        return { isMatch: false, matchedKeywords: [], relevanceScore: 0 };
      }
    }
  }
  
  // Calculate relevance score
  const relevanceScore = Math.min(1.0, matchedKeywords.length / keywords.length);
  
  return {
    isMatch: true,
    matchedKeywords,
    relevanceScore
  };
}

// Create notification for keyword match
async function createNotification(alert, match) {
  try {
    // Create notification in queue
    const { error } = await supabase.rpc('create_notification', {
      p_user_id: alert.user_id,
      p_campaign_id: null,
      p_post_id: null,
      p_notification_type: 'keyword_alert',
      p_title: `🎯 Keyword Alert: ${alert.name}`,
      p_message: `New comment matching "${match.matchedKeywords.join('", "')}"`,
      p_data: {
        alert_id: alert.id,
        alert_name: alert.name,
        matched_keywords: match.matchedKeywords,
        relevance_score: match.relevanceScore,
        comment_url: match.comment.url,
        comment_text: match.comment.body.substring(0, 200),
        subreddit: match.comment.subreddit,
        post_title: match.comment.postTitle,
        author: match.comment.author
      }
    });
    
    if (error) {
      console.error('❌ Error creating notification:', error);
    } else {
      console.log(`✅ Notification created for alert: ${alert.name}`);
    }
    
    // Record match in keyword_alert_matches table
    // Note: This requires the comment to be in the posts table first
    // For now, we'll skip this and just send notifications
    
  } catch (error) {
    console.error('❌ Error creating notification:', error);
  }
}
